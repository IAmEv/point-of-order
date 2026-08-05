/* ==========================================================
   POINT OF ORDER — Game Logic
   v29: Speaker-selection soft-lock fix (single-round mod +
        proposer chooses "last").
        - Root cause: round1Target/round2Target were separately
          mutated counters that had to be kept in perfect sync
          with how many null slots remained in speakerOrder.
          Reported bug: a demboy/slacker proposer choosing "last"
          on a single-round mod (e.g. a 3:45 -> 4-speaker mod)
          could leave the player prompted for one fewer speaker
          than actually needed, leaving one speakerOrder slot
          permanently null and soft-locking the speech loop once
          all picked speakers had spoken.
        - Fix: round1Target/round2Target are now fixed round
          sizes, set once in enterSpeakerSelection and never
          mutated again by proposer placement or anything else.
          New round1FilledCount()/round2FilledCount() derive "how
          many are still needed" fresh from speakerOrder itself
          every time it's checked (raise-pool sizing, the "am I
          done" checks in enterRound1/enterRound2/
          onDelegateClickForSpeaker, and both round tallies), so
          the count can never drift out of sync with the array
          again, regardless of how a slot got filled.
   v28: Motions-close button restyled as chair dialogue; dropped
        the on-time 10-sec speech-warning flash.
        - "ready_to_vote" stage's button (shared by Phase 2 and
          Phase 3, will carry into Phases 4-5 via the same
          motions screen) changed from the blue "Move to vote on
          the motions →" (proceed-styled) to the gold/italic
          "That is all the motions we will be accepting at this
          time." (default chair-prompt-btn styling, i.e. no
          "proceed" class) — matches the existing convention
          where non-proceed dais buttons read as spoken chair
          dialogue. Handler and voting flow unchanged.
        - onGavelClick: the on-time warn-phase flash "The chair
          recognizes 10 seconds remaining." no longer fires for
          speeches. The late-warning flash ("Warning given
          late.") and the caucus's on-time flash ("The chair
          recognizes one minute remaining.") are unchanged.
   v27: Glow/bubble fix + caucus real-time ramp shortened
        (style.css v21).
        - Speech bubbles no longer inherit a delegate's glow.
          renderCommitteeRoom now wraps figure+placard in a
          .seat-figure div; the .speech-bubble appended later by
          showSpeechBubble is a sibling of .seat-figure, not a
          descendant, so it sits outside any filter applied to
          .seat-figure. (CSS filter always composites an
          element's whole rendered subtree; a child can't opt
          out via its own filter:none.) .leader-guess and
          .caucus-clickable:hover glows retargeted to
          ".seat-figure" accordingly. Scoped to Phase 3's glow
          states only; Roll Call's .active and Phase 2's
          .awaiting-recognition have the same underlying quirk
          but were left untouched (not reported broken, out of
          scope for this pass).
        - CAUCUS_PRE_REAL_SEC 75 -> 55 (first (N-1) displayed
          minutes now take 55 real sec instead of 75).
          CAUCUS_WARN_REAL_SEC unchanged at 15. Total caucus
          real-time window: 90 sec -> 70 sec.
   v26: Bloc focus indicator replaced (style.css v20).
        - The Carolina Blue .bloc-focused glow read as too strong
          and distracting in playtest. Removed setBlocFocusGlow.
        - New setOtherBlocDim(activeIdx, on): dims the UNFOCUSED
          bloc (.bloc-dimmed: opacity 0.55, grayscale(0.4))
          instead of glowing the focused one. Since there are
          only two blocs, activateBloc(i) dims bloc 1-i and
          deactivateBloc(i) undims it; switching directly from
          one bloc to the other is a synchronous dim/undim pair
          with no visible flicker.
   v25: Caucus dialogue tuning pass (style.css v19).
        - CAUCUS_BUBBLE_VISIBLE_MS 3500 -> 2800, CAUCUS_BUBBLE_GAP_MS
          500 -> 400 (normal turns cycle faster).
        - CAUCUS_CUTOFF_OVERLAP_MS 3000 -> 1900 (the interrupting
          line appears sooner into the cut-off line's display).
        - Removed the shift-left/shift-right positional offset on
          overlap bubbles per playtest feedback; instead the
          interrupting bubble's seat gets a z-index boost
          (.overlap-front, cleared once the overlap resolves) so
          it reliably renders on top of the bubble it interrupts,
          regardless of DOM order between the two delegates' seats.
        - New setBlocFocusGlow(idx, on): applies/removes
          .bloc-focused on every seat in a bloc when it becomes
          active/inactive, giving the whole hovered bloc a
          Carolina Blue glow distinct from the individual gold
          .leader-guess glow (both layer via a combined CSS rule
          when the guessed delegate is in the focused bloc).
        - Total caucus real-time window (90 sec) left unchanged;
          at the new cadence both scripts fit comfortably inside
          it with room to spare (previously it was borderline
          tight at the old, slower cadence).
   v24: Scripted caucus dialogue replaces weighted-random engine.
        - CAUCUS_LINES removed. New CAUCUS_CONVOS holds 8
          authored ~12-turn scripts (4 topic buckets x 2 leader
          variants), each an ordered [{role, line}, ...] array
          transcribed from unmod_dialogue.md. TOPIC_BUCKETS
          unchanged.
        - Each bloc picks its one script at caucus start:
          CAUCUS_CONVOS[bucket][leader === "power" ? "powerLed"
          : "carolinaLed"]. Removed bloc.openerUsed/usedLines;
          removed pickCaucusLine/drawCaucusLineForRole.
        - Per-bloc playback state: bloc.turnIdx (next/most-
          recently-shown line), bloc.turnTimer, bloc.currentBubble,
          bloc.overlappingBubble. turnIdx always reflects whichever
          line most recently appeared (including one that only
          appeared as a cutoff overlap), so pausing mid-overlap and
          resuming replays that interrupting line fresh, full-length.
        - Cutoff detection: a line ending in "," or "..." (and not
          the script's last line) triggers an overlap turn instead
          of a normal one. Normal turn: visible 3500ms, 500ms gap,
          advance. Cutoff turn: next line appears alongside the
          current one at the 3000ms mark (both visible, pushed
          apart so it reads as two people talking over each other),
          current one clears 500ms later, the new line continues
          its own lifecycle from that moment (chains correctly if
          it is itself a cutoff).
        - Script end: once turnIdx reaches script.length, the bloc
          holds silent for the rest of the caucus. No looping.
        - Removed the "Lock focus" button entirely (createFocusLockButtons,
          removeFocusLockButtons, updateLockButtons, toggleFocusLock,
          all lockedIdx state/CSS). Focus is now purely hover-based:
          activeIdx = hoveredIdx.
        - Hover changes are debounced 150ms before activeIdx updates
          (prevents thrash at the 50% room boundary). On top of that,
          activating a bloc (first hover or resume) waits an extra
          200ms "soft hover-in" before its first bubble appears, so
          brief mouse-flickers do not jump-scare a line into view.
        - New CSS: .speech-bubble.overlap-bubble (150ms fade-in,
          replaces bubble-pop) plus .shift-left/.shift-right to push
          the two overlapping bubbles apart. Removed .focus-lock-btn
          rules entirely.
        - Leader-guess clicks, bloc assignment/animation, the caucus
          timer/gavel, and debrief scoring are all unchanged.
   v23: Phase 3 Unmod Caucus — full loop built.
        - generateCommittee(): each Power-Del is now paired
          with exactly one Dem-Boy (no overlap). Invisible
          to Phase 1/2; consumed by Phase 3 bloc assignment.
        - startPhase3(): stashes the Phase 2 passed motion's
          topic on state.p2.priorTopic (via priorMotionTopic
          local before initPhase2State wipes it) so the
          caucus dialogue can flavor by topic bucket.
        - handlePassProceed (unmodMode): now routes to
          startUnmodCaucus(motion) instead of the v22
          stub finishPhase3().
        - New: assignBlocs() splits the room into two blocs.
          Coin-flip decides Power-led vs. Carolina-led FIRST,
          then slacker slots are assigned so the absent
          slacker (if any) always lands in the Power-led
          bloc. Dem-Boys always ride with their paired
          Power-Del. Carolinas split one per bloc.
        - New: animateIntoBlocs() writes new seat.style.left /
          top per-delegate and hides the absent slacker's
          seat. CSS transitions do the slide (v17 adds
          left/top to .delegate-seat transition).
        - New: setupCaucusTimer(motion) reuses state.p2.speeches
          with caucusMode=true. Compression rule:
              first (N-1) displayed minutes → 75 real sec
              last 1 displayed minute        → 15 real sec
          Total real duration always 90 sec, regardless of
          motion length (5 / 7 / 10 min). warnThreshold=60
          (versus 10 for speeches).
        - renderMotionsDais: new "unmod_caucus" stage renders
          a caucus dais (label reads "UNMODERATED CAUCUS",
          shows motion minutes) with the same speech-timer
          and gavel button as speeches.
        - buildGavelInner: caucusMode swaps the warn label
          from "10-Second Warning" to "One-Minute Warning".
        - onGavelClick:
            * pre-phase early click flash: "Not yet, the
              caucus has time."
            * warn-phase late threshold = displayedSec <= 48
              (matches the 20% on-time window of speeches,
              scaled to the 60 sec warn window).
            * warn-phase on-time flash: "The chair recognizes
              one minute remaining."
            * warn-phase late flash: "Warning given late."
            * routes end-of-speech logic to endUnmodCaucus()
              when caucusMode.
        - tickSpeech: routes zero-grace timeout to
          endUnmodCaucus({gavelDown:"missed"}) in caucusMode.
          Also fires a "The one-minute warning was never
          given." dais flash the instant the warning becomes
          "missed" at 0:00.
        - New: endUnmodCaucus({gavelDown}) stops dialogue,
          stops timer, fires the missed-gavel-down flash if
          applicable, and after a brief pause calls
          finishPhase3Debrief().
        - New: finishPhase3Debrief() computes stars:
              stars = max(0, 3 - blocMistakes - timingMistake)
              blocMistakes: -1 per bloc where guessIdx is
                            wrong or null (0/1/2).
              timingMistake: 1 if warning is missed OR late
                            OR gavelDown is missed; 0 else
                            (capped at 1 regardless of count).
          Renders stars into #phase2-stars (reused) with a
          multi-line clause summary. Sets post-motions title
          to "Caucus Concluded" and flavor to
          "The {N} minute unmoderated caucus concludes."
        - New: renderPostMotionsScreen(phase) replaces the
          v22 configurePostMotionsButton. In "phase2" mode
          it sets the title to "Motion Adopted", button text
          to "Proceed to Unmods →", handler to startPhase3().
          In "phase3" mode it sets title "Caucus Concluded",
          button "Adjourn & Restart", handler location.reload.
          Uses cloneNode swap to purge any prior click handler.
        - New: dialogue engine.
            * CAUCUS_LINES: authored line pools per bloc-type
              (power-led / carolina-led) per role (power /
              demboy / carolina). Each role has 1 opener
              (leader only), 3-4 topic-agnostic lines, and
              2 lines per topic bucket (substance, process,
              people, opening). 4 buckets × 3 roles × 2 =
              24 flavored lines per bloc-type; ~66 lines total.
            * TOPIC_BUCKETS maps each of the 13 TOPICS to
              one of the 4 buckets.
            * activateBloc/deactivateBloc drive the 4-second
              bubble cadence: show line → 3500ms visible →
              clear → 500ms gap → repeat. Session-scoped
              no-reuse per bloc via bloc.usedLines Set.
            * pickCaucusLine: leader opens if not yet used;
              otherwise weighted role pick. Power-led:
              power 55 / demboy 30 / carolina 15 / slacker 0.
              Carolina-led: carolina 40 / power 30 /
              demboy 25 / slacker 0.
            * substituteLine handles {country}, {boss},
              {demboyCountry} placeholders.
        - New: focus & leader-guess UI.
            * Mousemove over the committee room picks up which
              half the cursor is on (< 50% x = bloc A / left,
              >= 50% = bloc B / right). No zone elements
              needed; delegate clicks bubble through.
            * Focus-lock button per bloc, absolutely positioned
              inside the room, fades in on hover of that
              bloc's side (or when locked). Clicking a bloc's
              lock button locks that bloc; clicking again
              unlocks; clicking the other bloc's lock button
              transfers the lock.
            * Active bloc = lockedIdx ?? hoveredIdx. Dialogue
              runs only for the active bloc. Nothing runs in
              the background.
            * Delegate clicks (in caucus mode) apply
              .leader-guess glow to that delegate and clear
              any prior guess in the same bloc. Clicking a
              delegate never locks focus.
        - Dev-panel Phase 3 button already active from v22.
   v22: Phase 3 (Unmoderated Caucus) motion collection & voting.
   v21: Mistake summary now renders one clause per line.
   v20: Late warning is now a scored mistake.
   v19: Three-star scoring system for Phase 1 and Phase 2.
   v18: Round Robin auto-order + gavel spam window fix.
   v17: Audio timing fixes.
   v16: Audio polish + speech line edits.
   v15: Remove compactSpeakerOrder() backstop.
   v14: Speeches polish + robustness pass.
   v13: Speeches sub-stage built out.
   v12: Fix single-round proposer-last target.
   v11: Small mods (<= 4) collapse to single round.
   v10: Round-target off-by-one fix + DEV_MODE panel.
   v9:  Proposer preferences locked; R2 raise pool simplified.
   v8:  Speakers List sidebar; single proposer button.
   v7:  Post-vote Speaker Selection scaffold.
   ========================================================== */

/* ---------- ILLUSTRATION SWAP CONFIG --------------------- */
const DELEGATE_ART = {
    power:    null,
    demboy:   null,
    carolina: null,
    slacker:  null,
    empty:    null,
};

/* ---------- GAVEL ART SWAP ------------------------------- */
const GAVEL_ART = {
    idle:  null,
    warn:  null,
    down:  null,
};

/* ---------- GAVEL SOUND SWAP ----------------------------- */
const GAVEL_SOUND = {
    thud: "assets/thud.mp3",
};

/* ==========================================================
   DEV MODE
========================================================== */
const DEV_MODE = true;

/* ==========================================================
   SPEECH TUNING
========================================================== */
const SPEECH_PRE_REAL_SEC     = 5;
const SPEECH_WARN_REAL_SEC    = 5;
const GAVEL_DOWN_MIN_CLICKS   = 2;
const GAVEL_DOWN_MAX_CLICKS   = 20;
const THUD_BUBBLE_MAX_ONSCREEN = 5;
const THUD_BUBBLE_LIFETIME_MS = 900;
const ZERO_GRACE_MS           = 3000;
const GAVEL_DOWN_SPAM_WINDOW  = 800;

/* ==========================================================
   CAUCUS TUNING (v23)
========================================================== */
const CAUCUS_PRE_REAL_SEC   = 55;    // first (N-1) displayed minutes
const CAUCUS_WARN_REAL_SEC  = 15;    // last displayed minute
const CAUCUS_WARN_THRESHOLD = 60;    // displayedSec at pre → warn switch
const CAUCUS_LATE_THRESHOLD = 48;    // displayedSec at on-time → late
const CAUCUS_BUBBLE_VISIBLE_MS  = 2800;  // normal turn: how long a line stays up
const CAUCUS_BUBBLE_GAP_MS      = 400;   // normal turn: silence before the next line
const CAUCUS_CUTOFF_OVERLAP_MS  = 1900;  // cutoff turn: when the interrupting line appears
const CAUCUS_HOVER_DEBOUNCE_MS  = 150;   // hover must persist this long before activeIdx changes
const CAUCUS_HOVER_IN_DELAY_MS  = 200;   // soft delay before a newly-active bloc's first bubble appears

// ---------- DATA POOLS ----------
const COMMITTEES = [
    { name: "UNSC",   full: "United Nations Security Council" },
    { name: "DISEC",  full: "Disarmament and International Security Committee" },
    { name: "WHO",    full: "World Health Organization" },
    { name: "ECOSOC", full: "Economic and Social Council" },
    { name: "UNHRC",  full: "UN Human Rights Council" },
    { name: "UNEP",   full: "UN Environment Programme" },
    { name: "SOCHUM", full: "Social, Humanitarian & Cultural Committee" },
    { name: "LEGAL",  full: "Legal Committee" },
];

const COUNTRIES = [
    "France", "Brazil", "Kenya", "Japan", "Germany", "Argentina",
    "India", "Egypt", "Sweden", "Nigeria", "Vietnam", "Mexico",
    "Norway", "Indonesia", "Peru", "South Africa", "Portugal",
    "Canada", "Australia", "Chile", "Turkey", "Thailand", "Ghana",
    "Poland", "Colombia", "Morocco", "Philippines", "Belgium",
];

const TOPICS = [
    { long: "opening statements",       short: "Opening" },
    { long: "bloc positions",           short: "Blocs" },
    { long: "funding mechanisms",       short: "Funding" },
    { long: "enforcement measures",     short: "Enforce" },
    { long: "implementation timeline",  short: "Timeline" },
    { long: "regional cooperation",     short: "Regional" },
    { long: "humanitarian concerns",    short: "Humanitarian" },
    { long: "monitoring frameworks",    short: "Monitoring" },
    { long: "sanctions",                short: "Sanctions" },
    { long: "definitions",              short: "Defs" },
    { long: "root causes",              short: "Roots" },
    { long: "the working paper",        short: "Working Paper" },
    { long: "next steps",               short: "Next Steps" },
];

const TOPIC_BUCKETS = {
    "opening statements":      "opening",
    "bloc positions":          "opening",
    "funding mechanisms":      "substance",
    "enforcement measures":    "substance",
    "sanctions":               "substance",
    "monitoring frameworks":   "substance",
    "implementation timeline": "process",
    "definitions":             "process",
    "next steps":              "process",
    "the working paper":       "process",
    "humanitarian concerns":   "people",
    "regional cooperation":    "people",
    "root causes":             "people",
};

const SPEECH_LINES = {
    power: [
        "The delegation of {country} has long championed a decisive response to this crisis.",
        "It is inconceivable that this body would move forward without recognizing {country}'s leadership on this issue.",
        "The framework {country} proposes is the only viable path. Anything less is frankly asinine.",
        "{country} will not be lectured on procedure by delegations who have not read the background guide.",
    ],
    demboy: [
        "As {boss} rightly noted, the working paper's structure deserves our full support.",
        "The delegation of {country} stands in complete alignment with {boss} on this matter.",
        "The delegate of {boss} has articulated our position more eloquently than we ever could.",
        "Building on {boss}'s excellent point, {country} would add only one small clarification.",
    ],
    carolina: [
        "The delegation of {country} believes there is genuine common ground here worth exploring together.",
        "Perhaps a merged bloc paper could accommodate the concerns we've heard from every side.",
        "The past is history, the future is a mystery, but today is a gift. That's why it's called the present.",
        "Call me Abraham Lincoln the way I'm linkin' these blocs together.",
    ],
    slacker: [
        "Uh, yeah, {country} basically agrees with whoever spoke last.",
        "{country} thinks... we should probably do something. About, um, the thing.",
        "Yeah so, the working paper is... good? {country} will get back to you.",
        "Honestly, {country}'s position is still developing. Pass.",
    ],
    generic: [
        "The delegate of {country} yields the remainder of their time.",
        "{country} reserves the right to expand on this in future speeches.",
        "The delegation defers to the wisdom of the committee on this point.",
        "{country} has nothing further to add at this time.",
    ],
};

/* ==========================================================
   CAUCUS CONVOS (v24)
   Authored, scripted conversations transcribed from
   unmod_dialogue.md. One script per {bucket, leader} pair,
   played back turn by turn. No em-dashes.
========================================================== */
const CAUCUS_CONVOS = {
    substance: {
        powerLed: [
            { role: "power",    line: "So {country} already wrote up what we should do. Every country pays two percent of their GDP, no exceptions." },
            { role: "demboy",   line: "Yeah, {boss} showed me the paper right before this. It is really solid." },
            { role: "carolina", line: "Wait, {country} was thinking maybe smaller countries could pay less," },
            { role: "power",    line: "No. Two percent for everyone. If we start giving exceptions the whole thing falls apart." },
            { role: "demboy",   line: "{boss} is right, exceptions kill the whole point." },
            { role: "carolina", line: "But if some countries literally cannot afford it they will just say no," },
            { role: "power",    line: "Then they say no. We are not going to weaken this because some people cannot keep up." },
            { role: "demboy",   line: "Exactly. If we lower the number, {boss}'s whole plan gets watered down." },
            { role: "carolina", line: "Could we at least add something about helping countries that struggle to pay," },
            { role: "power",    line: "That is a separate conversation. Right now we are locking in the two percent." },
            { role: "demboy",   line: "{boss} already has the wording done. We just need everyone to sign on." },
            { role: "power",    line: "Send it around. We are done debating this." },
        ],
        carolinaLed: [
            { role: "carolina", line: "Okay, before we write anything down, {country} wants to hear what everyone thinks the GDP contribution should be." },
            { role: "power",    line: "Easy. Two percent across the board. That is fair." },
            { role: "carolina", line: "That is one idea. {demboyCountry}, you were saying something earlier?" },
            { role: "demboy",   line: "Uh, yeah. {country} was thinking maybe it should depend on how much money a country actually has..." },
            { role: "power",    line: "That is way too complicated. Just pick a number and move on." },
            { role: "carolina", line: "Hold on, let {demboyCountry} finish. That could actually work." },
            { role: "demboy",   line: "So like, richer countries pay more, poorer countries pay less. Same total in the end." },
            { role: "power",    line: "That is going to take forever to figure out. Two percent is simple." },
            { role: "carolina", line: "It is a little more work but it is way more fair. {demboyCountry} is right." },
            { role: "power",    line: "Fine, but there has to be a floor. No one pays less than half a percent." },
            { role: "carolina", line: "Deal. {demboyCountry}, can you write up the sliding scale while {boss} sets the floor?" },
            { role: "demboy",   line: "Yeah, {country} can do that. Give me a minute." },
        ],
    },
    process: {
        powerLed: [
            { role: "power",    line: "Alright, here's how it goes. Implementation starts in six months, everyone has to be on board within a year." },
            { role: "demboy",   line: "{boss}'s timeline makes sense. Fast but doable." },
            { role: "carolina", line: "Six months feels really fast, {country} was thinking maybe a year to start," },
            { role: "power",    line: "A year is too slow. Half the countries will lose interest by then." },
            { role: "demboy",   line: "Yeah, if we wait too long people just move on." },
            { role: "carolina", line: "But some smaller countries need time to actually set things up on their end..." },
            { role: "power",    line: "That is their problem. We set the deadline, they figure it out." },
            { role: "demboy",   line: "Exactly what {boss} said. If we let people stall nothing happens." },
            { role: "carolina", line: "What about a check-in halfway through, just to see where everyone is..." },
            { role: "power",    line: "No check-ins. Check-ins are how people push back the real deadline." },
            { role: "demboy",   line: "{boss} is right, check-ins turn into extensions." },
            { role: "power",    line: "Six months to start, one year to be done. Everyone gets the same clock." },
        ],
        carolinaLed: [
            { role: "carolina", line: "So we need to figure out when this idea actually happens. What are people thinking?" },
            { role: "power",    line: "Six months to start. One year to finish. Simple." },
            { role: "carolina", line: "That is fast. {demboyCountry}, you had a different idea, right?" },
            { role: "demboy",   line: "Um, yeah. {country} was thinking we should do it in steps, like the easy stuff first..." },
            { role: "power",    line: "Steps just means it drags on forever." },
            { role: "carolina", line: "Not really. If we do the simple parts first we can actually get something done early. Keep going, {demboyCountry}." },
            { role: "demboy",   line: "So like, the first few months is the basics, and then the harder stuff comes later once people trust it." },
            { role: "power",    line: "That is a nice idea but it is not realistic." },
            { role: "carolina", line: "It is realistic if we plan it out. {demboyCountry}'s way lets people see it working before they commit to the hard parts." },
            { role: "power",    line: "Okay, fine, but the whole thing still has to be done in a year." },
            { role: "carolina", line: "That works. {demboyCountry} maps out the phases, {boss} keeps the one year deadline." },
            { role: "demboy",   line: "Cool. {country} will sketch something out." },
        ],
    },
    people: {
        powerLed: [
            { role: "power",    line: "So {country} already put together the whole plan for who this helps and how. It is all on this paper." },
            { role: "demboy",   line: "Yeah, {boss} already showed me. It covers everyone who actually needs help." },
            { role: "carolina", line: "Wait, {country} was wondering if we could talk to some of the people who are actually affected..." },
            { role: "power",    line: "No need. {country} already looked into what they need. It is in the plan." },
            { role: "demboy",   line: "Right, {boss} and I did the research. We do not need to redo it." },
            { role: "carolina", line: "But if we heard from them directly it might change what we..." },
            { role: "power",    line: "It will not. The plan is done. We are not opening it back up." },
            { role: "demboy",   line: "Exactly. {boss} already thought through every angle on this." },
            { role: "carolina", line: "Could we at least add a line saying we listened to local groups..." },
            { role: "power",    line: "No, because we did not. {country} is not putting fake stuff in the plan." },
            { role: "demboy",   line: "{boss} is right, we can't say we did something we did not do." },
            { role: "power",    line: "The plan stands as {country} wrote it. Send it around." },
        ],
        carolinaLed: [
            { role: "carolina", line: "Okay, this whole thing is about helping real people, so {country} wants to talk about who this is for." },
            { role: "power",    line: "It is for everyone affected. {country} has that covered." },
            { role: "carolina", line: "That is broad. {demboyCountry}, you previously mentioned something more specific?" },
            { role: "demboy",   line: "Yeah, so {country} was thinking we should also try to fix why this is happening in the first place..." },
            { role: "power",    line: "That is way outside what we are supposed to be doing." },
            { role: "carolina", line: "No, that is actually the most important part. Keep going, {demboyCountry}." },
            { role: "demboy",   line: "Like, if we just help people now but do not fix the actual cause, we are back here in five years." },
            { role: "power",    line: "That is not our job. Our job is to respond, not to solve everything." },
            { role: "carolina", line: "Responding without fixing the cause is why nothing ever changes. {demboyCountry} nailed it." },
            { role: "power",    line: "Fine, but keep it short. Two sentences max on the cause part." },
            { role: "carolina", line: "Two sentences is enough. {demboyCountry} writes the cause part, {boss} handles the response." },
            { role: "demboy",   line: "Thanks. {country} will keep it tight." },
        ],
    },
    opening: {
        powerLed: [
            { role: "power",    line: "When we present this, we lead with {country}'s main point. That is the strongest thing we have." },
            { role: "demboy",   line: "Yeah, {boss}'s point is definitely the strongest." },
            { role: "carolina", line: "Could we open with something that mentions everyone's ideas..." },
            { role: "power",    line: "No, we need one clear message. Not a list of everyone's names." },
            { role: "demboy",   line: "Right, one message hits harder than five." },
            { role: "carolina", line: "But if we include everyone more people will actually back us up," },
            { role: "power",    line: "People will back us up because we are right, not because we listed them." },
            { role: "demboy",   line: "{boss} is right, the message matters more than the names." },
            { role: "carolina", line: "Even just mentioning that we worked together on this..." },
            { role: "power",    line: "We are wasting time. {country}'s point goes first, everything else comes after." },
            { role: "demboy",   line: "That is how it should go. Strong opener, then the details." },
            { role: "power",    line: "Done. Let's move on." },
        ],
        carolinaLed: [
            { role: "carolina", line: "So when we get up there, what do we want everyone else to hear first?" },
            { role: "power",    line: "{country}'s main point. It is the clearest thing we have." },
            { role: "carolina", line: "That is a strong point. {demboyCountry}, what did you want to lead with?" },
            { role: "demboy",   line: "Uh, {country} was thinking we should open with the root cause of the problem, before jumping to what we want to do," },
            { role: "power",    line: "Everyone already knows the problem. We should skip to the solution." },
            { role: "carolina", line: "Not everyone gets why it matters though. {demboyCountry}'s way makes people actually care first." },
            { role: "demboy",   line: "Yeah, like a story or an example, so it feels real before we ask for anything." },
            { role: "power",    line: "Stories are a waste of time. Just say what we want." },
            { role: "carolina", line: "The story is what makes people want to help. {demboyCountry} is thinking about this the right way." },
            { role: "power",    line: "Fine, but keep the story short so everyone can hear my idea faster." },
            { role: "carolina", line: "Close enough. {demboyCountry} writes the opening story, {boss} follows up with the ask." },
            { role: "demboy",   line: "Cool. {country} has an idea already." },
        ],
    },
};

const VALID_MODS = [
    { min: 2, sec: 30 },
    { min: 3, sec: 30 },
    { min: 3, sec: 45 },
    { min: 6, sec: 45 },
];
const CORRECTION_MODS = [
    { min: 4, sec: 45 },
    { min: 5, sec: 45 },
    { min: 7, sec: 45 },
    { min: 8, sec: 45 },
];
const UNMOD_TIMES = [5, 7, 10];
const RR_SECONDS = [15, 30];

function speakerCount(min, sec) { return Math.floor((min * 60) / sec); }
function roundDownMult3(n) { return Math.floor(n / 3) * 3; }
function getPresentCount() { return state.delegates.filter(d => d.present).length; }

function pickValidMod() {
    const present = getPresentCount();
    const pool = VALID_MODS.filter(m => speakerCount(m.min, m.sec) <= present);
    return pick(pool);
}
function pickCorrectionMod() {
    const present = getPresentCount();
    const pool = CORRECTION_MODS.filter(m => {
        const r = roundDownMult3(m.min);
        return r > 0 && speakerCount(r, m.sec) <= present;
    });
    return pool.length ? pick(pool) : null;
}

// ---------- PERSONALITIES ----------
const PERSONALITIES = {
    power: {
        key: "power",
        label: "Power-Del",
        expected: "voting",
        getResponse: (c) => ({ text: `The delegation of ${c} is present and voting.`, isHere: false }),
    },
    demboy: {
        key: "demboy",
        label: "Dem-Boy",
        expected: "voting",
        getResponse: () => ({ text: pick(["Present and voting.", "Present and voting, chair."]), isHere: false }),
    },
    carolina: {
        key: "carolina",
        label: "CarolinaMUN-Style",
        expected: "present",
        getResponse: () => ({ text: pick(["Present!", "Present, chair.", "Present."]), isHere: false }),
    },
    slacker: {
        key: "slacker",
        label: "Slacker",
        expected: "present",
        getResponse: (_country, delegate) => {
            if (delegate && delegate.guaranteedHere && !state.correctionUsed) {
                return { text: pick(["Here.", "here."]), isHere: true };
            }
            return { text: pick(["Present.", "Uh, present."]), isHere: false };
        },
        getCorrectedResponse: () => ({ text: pick(["Present.", "Uh, present."]), isHere: false }),
    },
};

// ---------- SEAT POSITIONS ----------
const SEAT_POSITIONS = [
    { left: 8,  top: 62 },
    { left: 20, top: 42 },
    { left: 33, top: 28 },
    { left: 44, top: 20 },
    { left: 56, top: 20 },
    { left: 67, top: 28 },
    { left: 80, top: 42 },
    { left: 92, top: 62 },
];
const EDGE_SEATS = [0, 7];

// ---------- BLOC POSITIONS (v23) ----------
// Left side of the room = bloc A; right side = bloc B.
// Full = 4 delegates (2x2). Short = 3 (missing slacker).
const BLOC_LAYOUT = {
    A_full: {
        power:    { left: 15, top: 32 },
        demboy:   { left: 32, top: 32 },
        carolina: { left: 15, top: 60 },
        slacker:  { left: 32, top: 60 },
    },
    A_short: {
        power:    { left: 15, top: 32 },
        demboy:   { left: 32, top: 32 },
        carolina: { left: 23, top: 60 },
    },
    B_full: {
        power:    { left: 68, top: 32 },
        demboy:   { left: 85, top: 32 },
        carolina: { left: 68, top: 60 },
        slacker:  { left: 85, top: 60 },
    },
    B_short: {
        power:    { left: 68, top: 32 },
        demboy:   { left: 85, top: 32 },
        carolina: { left: 77, top: 60 },
    },
};

// ---------- STATE ----------
const state = {
    committee: null,
    delegates: [],
    rollOrder: [],
    rollIndex: 0,
    rollResults: [],
    rollStartTime: 0,
    currentDelegate: null,
    awaitingInput: false,
    correctionAvailable: false,
    correctionUsed: false,
    p2: null,
    usedSpeechLines: new Set(),
};

// ---------- UTILITIES ----------
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function shortName(country) {
    if (country.length <= 7) return country;
    const map = { "South Africa": "S.Af", "Indonesia": "Idn", "Philippines": "Phil" };
    if (map[country]) return map[country];
    return country.slice(0, 3);
}

// ---------- SEAT ASSIGNMENT ----------
function assignSeats(personalityPool) {
    const seats = new Array(8).fill(null);
    const remaining = [...personalityPool];

    const interiorSeats = shuffle([1, 2, 3, 4, 5, 6]);
    const powerIndices = [];
    remaining.forEach((p, i) => { if (p === "power") powerIndices.push(i); });
    const powersToPlace = powerIndices.length;
    for (let i = powerIndices.length - 1; i >= 0; i--) remaining.splice(powerIndices[i], 1);
    for (let i = 0; i < powersToPlace; i++) {
        seats[interiorSeats[i]] = "power";
    }

    const openSeats = shuffle(seats.map((v, i) => v === null ? i : -1).filter(i => i !== -1));
    const restShuffled = shuffle(remaining);
    openSeats.forEach((seatIdx, i) => { seats[seatIdx] = restShuffled[i]; });

    return seats;
}

// ---------- SETUP ----------
function generateCommittee() {
    state.committee = pick(COMMITTEES);
    const countries = shuffle(COUNTRIES).slice(0, 8);

    const personalityPool = shuffle([
        "power", "power",
        "demboy", "demboy",
        "carolina", "carolina",
        "slacker", "slacker",
    ]);

    const seatAssignment = assignSeats(personalityPool);

    state.delegates = seatAssignment.map((personality, seatIdx) => ({
        country: countries[seatIdx],
        personality,
        seat: seatIdx,
        present: true,
        boss: null,
        markedAs: null,
    }));

    // v23 — Dem-Boy ↔ Power-Del pairing is 1:1, no overlap.
    // Guarantees Phase 3 blocs can be split cleanly with each
    // Dem-Boy riding with their paired Power-Del.
    const powerDels = state.delegates.filter(d => d.personality === "power");
    const demboys   = state.delegates.filter(d => d.personality === "demboy");
    const shuffledPowers = shuffle(powerDels);
    demboys.forEach((d, i) => {
        if (shuffledPowers[i]) d.boss = shuffledPowers[i].country;
    });

    if (Math.random() < 0.5) {
        const slackers = state.delegates.filter(d => d.personality === "slacker");
        if (slackers.length > 0) pick(slackers).present = false;
    }

    const presentSlackers = state.delegates.filter(
        d => d.personality === "slacker" && d.present
    );
    if (presentSlackers.length > 0) {
        pick(presentSlackers).guaranteedHere = true;
    }

    state.rollOrder = [...state.delegates].sort((a, b) =>
        a.country.localeCompare(b.country)
    );

    state.usedSpeechLines = new Set();

    document.getElementById("committee-name").textContent =
        `${state.committee.name} — ${state.committee.full}`;
    document.getElementById("delegate-count").textContent =
        `${state.delegates.length} delegations`;

    const now = new Date();
    document.getElementById("memo-date").textContent = now
        .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        .toUpperCase();
}

// ---------- FIGURE RENDERING ----------
function buildDelegateArt(personality) {
    const artPath = DELEGATE_ART[personality];
    if (artPath) {
        return `<div class="delegate-art"><img src="${artPath}" alt="${personality}"></div>`;
    }
    return `
        <div class="delegate-art">
            <div class="delegate-figure">
                <div class="delegate-head"></div>
                <div class="delegate-body"></div>
            </div>
        </div>`;
}
function buildEmptyChair() {
    const artPath = DELEGATE_ART.empty;
    if (artPath) {
        return `<div class="delegate-art"><img src="${artPath}" alt="empty chair"></div>`;
    }
    return `<div class="empty-chair-icon"></div>`;
}

// ---------- ROOM RENDER ----------
function renderCommitteeRoom(containerId = "committee-room") {
    const room = document.getElementById(containerId);
    const daisChild = room.querySelector(".room-dais");
    room.innerHTML = "";
    if (daisChild) room.appendChild(daisChild);

    state.delegates.forEach((del, idx) => {
        const pos = SEAT_POSITIONS[del.seat];
        const seat = document.createElement("div");
        seat.className = "delegate-seat";
        seat.dataset.index = idx;
        seat.dataset.personality = del.personality;
        seat.style.left = `${pos.left}%`;
        seat.style.top = `${pos.top}%`;

        const figureHTML = del.present ? buildDelegateArt(del.personality) : buildEmptyChair();
        const dimmed = del.present ? "" : " style='opacity:0.55'";
        // v27 — figure + placard live in .seat-figure so glow filters can
        // target it specifically; a later-appended .speech-bubble is a
        // sibling of .seat-figure, not a descendant, so it never inherits
        // the glow (CSS filter always composites an element's full
        // subtree, so there is no way to exclude a nested child from it).
        seat.innerHTML = `
            <div class="seat-figure">
                ${figureHTML}
                <div class="placard"${dimmed}>${del.country}</div>
            </div>
        `;

        if (!del.present) seat.classList.add("empty-chair");
        room.appendChild(seat);
    });
}

function getSeatElement(delegateIndex, containerId = "committee-room") {
    return document.querySelector(`#${containerId} .delegate-seat[data-index="${delegateIndex}"]`);
}
function delegateIndexOf(delegate) {
    return state.delegates.indexOf(delegate);
}

function showSpeechBubble(delegate, text, containerId = "committee-room") {
    const seat = getSeatElement(delegateIndexOf(delegate), containerId);
    if (!seat) return;
    seat.querySelectorAll(".speech-bubble").forEach(b => b.remove());
    const bubble = document.createElement("div");
    bubble.className = "speech-bubble";
    bubble.textContent = text;
    seat.appendChild(bubble);
}
function clearSpeechBubble(delegate, containerId = "committee-room") {
    const seat = getSeatElement(delegateIndexOf(delegate), containerId);
    if (!seat) return;
    seat.querySelectorAll(".speech-bubble").forEach(b => b.remove());
}

function raisePlacard(delegate, containerId = "committee-room", variant = "raised") {
    const seat = getSeatElement(delegateIndexOf(delegate), containerId);
    if (!seat) return;
    seat.classList.remove("raised", "raised-voting");
    seat.classList.add(variant);
}
function lowerPlacard(delegate, containerId = "committee-room") {
    const seat = getSeatElement(delegateIndexOf(delegate), containerId);
    if (!seat) return;
    seat.classList.remove("raised", "raised-voting");
}

// ==========================================================
//  PHASE 1 — ROLL CALL
// ==========================================================
async function startRollCall() {
    showScreen("roll-call-screen");
    state.rollIndex = 0;
    state.rollResults = [];
    state.correctionUsed = false;
    document.getElementById("roll-total").textContent = state.rollOrder.length;

    renderCommitteeRoom("committee-room");
    await sleep(500);
    nextRollCall();
}

async function nextRollCall() {
    if (state.rollIndex >= state.rollOrder.length) {
        finishRollCall();
        return;
    }
    const del = state.rollOrder[state.rollIndex];
    state.currentDelegate = del;
    state.correctionAvailable = false;

    document.querySelectorAll("#committee-room .delegate-seat").forEach(s => s.classList.remove("active"));

    document.getElementById("calling-country").textContent = del.country;
    document.getElementById("roll-index").textContent = state.rollIndex + 1;
    document.getElementById("roll-progress-fill").style.width =
        `${(state.rollIndex / state.rollOrder.length) * 100}%`;

    document.getElementById("correction-row").classList.add("hidden");
    document.getElementById("action-row").classList.remove("hidden");

    const seat = getSeatElement(delegateIndexOf(del));
    if (seat) seat.classList.add("active");

    await sleep(600);

    if (del.present) {
        const response = PERSONALITIES[del.personality].getResponse(del.country, del);
        showSpeechBubble(del, response.text);
        const variant = PERSONALITIES[del.personality].expected === "voting" ? "raised-voting" : "raised";
        raisePlacard(del, "committee-room", variant);
        del._lastResponse = response;
        if (response.isHere) {
            state.correctionAvailable = true;
            document.getElementById("action-row").classList.add("hidden");
            document.getElementById("correction-row").classList.remove("hidden");
            playThud();
        }
    }

    state.rollStartTime = performance.now();
    state.awaitingInput = true;
}

async function handleRollAction(action) {
    if (!state.awaitingInput) return;
    const del = state.currentDelegate;
    const elapsed = (performance.now() - state.rollStartTime) / 1000;

    let missedCorrection = false;
    if (state.correctionAvailable && action !== "__correction__") {
        missedCorrection = true;
    }

    if (action === "__correction__") {
        state.correctionUsed = true;
        state.correctionAvailable = false;
        clearSpeechBubble(del);
        lowerPlacard(del);
        document.getElementById("correction-row").classList.add("hidden");
        await sleep(500);
        const corrected = PERSONALITIES.slacker.getCorrectedResponse();
        showSpeechBubble(del, corrected.text);
        raisePlacard(del, "committee-room", "raised");
        del._lastResponse = corrected;
        document.getElementById("action-row").classList.remove("hidden");
        state.rollStartTime = performance.now();
        return;
    }

    state.awaitingInput = false;

    let expected;
    if (!del.present) expected = "absent";
    else expected = PERSONALITIES[del.personality].expected;

    const correct = (action === expected) && !missedCorrection;
    state.rollResults.push({
        delegate: del,
        action, expected, correct, elapsed, missedCorrection,
    });

    const seat = getSeatElement(delegateIndexOf(del));
    if (seat) {
        seat.classList.remove("active");
        if (action === "absent") seat.classList.add("marked-absent");
        del.markedAs = action;
    }

    await sleep(600);
    clearSpeechBubble(del);
    lowerPlacard(del);

    state.rollIndex++;
    nextRollCall();
}

function finishRollCall() {
    document.getElementById("roll-progress-fill").style.width = "100%";
    document.getElementById("calling-country").textContent = "—";
    computeAndShowScore();
    setTimeout(() => showScreen("transition-screen"), 800);
}

// ==========================================================
//  STAR SCORING HELPER (v19)
// ==========================================================
function renderStarBlock(containerId, stars, summary) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 3; i++) {
        const earned = i < stars;
        const wrap = document.createElement("div");
        wrap.className = `star ${earned ? "earned" : "missed"} ${i === 1 ? "star--center" : ""}`;
        wrap.style.animationDelay = `${i * 0.14}s`;
        wrap.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2.2l2.95 6.36 6.9.72-5.2 4.72 1.5 6.86L12 17.3l-6.15 3.56 1.5-6.86-5.2-4.72 6.9-.72z"/>
            </svg>`;
        container.appendChild(wrap);
    }
    const summaryId = containerId.replace("-stars", "-summary");
    const summaryEl = document.getElementById(summaryId);
    if (summaryEl) summaryEl.innerHTML = summary;
}

function buildMultilineSummary(clauses, fallback) {
    const filtered = clauses.filter(Boolean);
    if (filtered.length === 0) return `<div>${fallback}</div>`;
    return filtered.map(c => `<div>${c}</div>`).join("");
}

function computeAndShowScore() {
    const results = state.rollResults;
    const wrongActions = results.filter(r => !r.correct && !r.missedCorrection).length;
    const missedCorrections = results.filter(r => r.missedCorrection).length;
    const mistakes = wrongActions + missedCorrections;
    const stars = Math.max(0, 3 - mistakes);

    const clauses = [];
    if (wrongActions > 0)      clauses.push(`${wrongActions} incorrect ruling${wrongActions > 1 ? "s" : ""}.`);
    if (missedCorrections > 0) clauses.push(`${missedCorrections} missed correction${missedCorrections > 1 ? "s" : ""}.`);
    const summary = buildMultilineSummary(clauses, "Flawless roll call.");

    renderStarBlock("phase1-stars", stars, summary);
}

// ==========================================================
//  PHASE 2 — POINTS & MOTIONS
// ==========================================================

function initPhase2State() {
    state.p2 = {
        stage: "awaiting_call",
        raisedDelegates: [],
        motionsCollected: [],
        currentSpeaker: null,
        currentMotionIdx: null,
        voteAttempt: 0,
        voteVerdict: null,
        orderPicks: [],
        speakersMotion: null,
        totalSpeakers: 0,
        round1Target: 0,
        round2Target: 0,
        round1Picked: [],
        round2Picked: [],
        spokenSet: new Set(),
        raisedForRound: [],
        designatedSlackerIdx: null,
        proposerChoice: null,
        currentRound: 0,
        speeches: null,
        repeatPickCount: 0,
        unmodMode: false,
        priorTopic: null,
        caucus: null,
    };
}

function disruptivenessRank(motion) {
    if (motion.type === "unmod") {
        // v22 — longer unmods rank more disruptive.
        const m = motion.min || 0;
        return [3, m];
    }
    if (motion.type === "rr") {
        const m = motion.spoken.match(/^(\d+)\s+second/);
        const secs = m ? parseInt(m[1], 10) : 0;
        return [2, secs];
    }
    return [1, speakerCount(motion.min, motion.sec)];
}
function compareDisruptiveness(a, b) {
    const ra = disruptivenessRank(a);
    const rb = disruptivenessRank(b);
    if (ra[0] !== rb[0]) return ra[0] - rb[0];
    if (ra[1] !== rb[1]) return ra[1] - rb[1];
    return b.proposalOrder - a.proposalOrder;
}
function mostDisruptiveUnresolvedIdx() {
    const p2 = state.p2;
    let bestIdx = -1;
    p2.motionsCollected.forEach((m, i) => {
        if (m.status) return;
        if (bestIdx === -1) { bestIdx = i; return; }
        if (compareDisruptiveness(m, p2.motionsCollected[bestIdx]) > 0) bestIdx = i;
    });
    return bestIdx;
}

function startPhase2() {
    showScreen("motions-screen");
    initPhase2State();

    // Reset the phase label & agenda visibility to Phase 2 defaults.
    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 2 of 5 · Points & Motions";
    const body = document.querySelector(".phase2-body");
    if (body) body.classList.remove("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.remove("hidden-in-caucus");

    renderCommitteeRoom("committee-room-p2");

    state.delegates.forEach((del, idx) => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (!seat) return;
        if (del.markedAs === "absent" || !del.present) seat.classList.add("marked-absent");
    });

    renderAgenda();
    renderMotionsDais();
    updateMotionsInstructions("Ask the floor for motions.");
}

function updateMotionsInstructions(text) {
    document.getElementById("motions-instructions").innerHTML = text;
}

function renderAgenda() {
    const list = document.getElementById("agenda-list");
    const p2 = state.p2;
    if (!p2 || p2.motionsCollected.length === 0) {
        list.innerHTML = `<li class="agenda-placeholder">No motions yet.</li>`;
        return;
    }
    list.innerHTML = "";
    p2.motionsCollected.forEach((m, i) => {
        const li = document.createElement("li");
        li.textContent = m.written;
        li.dataset.motionIdx = i;
        if (p2.stage === "selecting_vote" && !m.status) {
            li.classList.add("selectable");
            li.addEventListener("click", () => selectMotionForVote(i));
        }
        if (p2.currentMotionIdx === i && p2.stage !== "selecting_vote") li.classList.add("selected");
        if (m.status === "failed") li.classList.add("failed");
        if (m.status === "passed") li.classList.add("passed");
        list.appendChild(li);
    });
}

function renderMotionsDais() {
    const bar = document.getElementById("motions-dais-bar");
    const p2 = state.p2;
    bar.innerHTML = "";

    switch (p2.stage) {
        case "awaiting_call": {
            const btn = daisButton(`Are there any points or motions on the floor?`);
            btn.addEventListener("click", handleCallForMotions);
            bar.appendChild(btn);
            break;
        }
        case "requesting": {
            const status = daisStatus(
                `<strong>${p2.motionsCollected.length} / 3</strong> motions noted. ` +
                `Recognize a raised placard to hear their motion.`
            );
            bar.appendChild(status);
            break;
        }
        case "speaking": {
            const del = p2.currentSpeaker;
            const motion = del._pendingMotion;
            // v22 — suppress dilatory branch in unmodMode. In Phase 3 all
            // three unmods are valid; no correction ever needed.
            if (motion.type === "unmod" && !p2.unmodMode) {
                const btn = daisButton(
                    `The chair rules that <b>dilatory</b> and would look favorably upon a moderated caucus at this time.`,
                    "dilatory"
                );
                btn.addEventListener("click", handleDilatory);
                bar.appendChild(btn);
            } else if (motion.type === "mod" && motion.needsCorrection) {
                const btn = daisButton(
                    `Mods with 45 second speaking times must have multiples of 3 for the minutes.`,
                    "dilatory"
                );
                btn.addEventListener("click", handleModCorrection);
                bar.appendChild(btn);
            } else {
                const btn = daisButton(`Note motion & recognize next delegate →`, "proceed");
                btn.addEventListener("click", handleAcceptMotion);
                bar.appendChild(btn);
            }
            break;
        }
        case "speaking2": {
            const btn = daisButton(`Note motion & recognize next delegate →`, "proceed");
            btn.addEventListener("click", handleAcceptMotion);
            bar.appendChild(btn);
            break;
        }
        case "ready_to_vote": {
            // v28 — chair-dialogue phrasing, styled gold like the other
            // spoken-line prompts (no "proceed" class). Same stage/handler
            // in both Phase 2 and Phase 3; will carry into Phases 4-5 too
            // since they reuse this same motions screen.
            const btn = daisButton(`That is all the motions we will be accepting at this time.`);
            btn.addEventListener("click", () => {
                p2.stage = "selecting_vote";
                clearAllBubbles();
                document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
                    s.classList.remove("raised", "raised-voting", "requesting");
                });
                updateMotionsInstructions(
                    "Select the most disruptive motion from your notes and put it to a vote."
                );
                renderAgenda();
                renderMotionsDais();
            });
            bar.appendChild(btn);
            break;
        }
        case "selecting_vote": {
            const status = daisStatus(
                `Click a motion in your notes. Vote on the <strong>most disruptive</strong> first.`
            );
            bar.appendChild(status);
            break;
        }
        case "calling_favor": {
            const motion = p2.motionsCollected[p2.currentMotionIdx];
            const btn = daisButton(
                `All those in favor of ${motion.delegate.country}'s motion for ${motion.spoken} please raise your placards high.`,
                "vote-favor-btn"
            );
            btn.addEventListener("click", handleCallFavor);
            bar.appendChild(btn);
            break;
        }
        case "showing_favor": {
            const t = p2.tally;
            const status = daisStatus(
                `<span class="tally">${t.favor} in favor</span> of ${t.needed} needed. ` +
                (p2.voteVerdict === "pass"
                    ? `<span class="verdict-pass">Motion passes.</span>`
                    : `Not enough. Calling the opposition…`)
            );
            bar.appendChild(status);
            if (p2.voteVerdict === "pass") {
                const btn = daisButton(`Proceed →`, "proceed");
                btn.addEventListener("click", handlePassProceed);
                bar.appendChild(btn);
            } else {
                setTimeout(() => {
                    p2.stage = "calling_oppose";
                    renderMotionsDais();
                }, 1400);
            }
            break;
        }
        case "calling_oppose": {
            const motion = p2.motionsCollected[p2.currentMotionIdx];
            clearVoteVisuals();
            const btn = daisButton(
                `All those opposed to ${motion.delegate.country}'s motion for ${motion.spoken} please raise your placards high.`,
                "vote-oppose-btn"
            );
            btn.addEventListener("click", handleCallOppose);
            bar.appendChild(btn);
            break;
        }
        case "showing_oppose": {
            const t = p2.tally;
            const status = daisStatus(
                `<span class="tally">${t.oppose} opposed</span>. ` +
                `<span class="verdict-fail">Motion fails.</span>`
            );
            bar.appendChild(status);
            setTimeout(() => {
                clearVoteVisuals();
                p2.motionsCollected[p2.currentMotionIdx].status = "failed";
                p2.currentMotionIdx = null;
                p2.voteAttempt++;
                p2.stage = "selecting_vote";
                updateMotionsInstructions("Select the next most disruptive motion.");
                renderAgenda();
                renderMotionsDais();
            }, 1600);
            break;
        }

        case "asking_order": {
            const m = p2.speakersMotion;
            const country = m.delegate.country;
            const btn = daisButton(
                `Would ${country} like to speak <span class="prompt-emph">first</span> or <span class="prompt-emph">last</span>?`
            );
            btn.addEventListener("click", () => handleProposerChoice());
            bar.appendChild(btn);
            break;
        }

        case "round1_select": {
            const single = isSingleRoundMod(p2.totalSpeakers);
            const label = single
                ? `Select speakers`
                : `Round 1 &middot; select the <span class="prompt-emph">first</span> speakers`;
            const status = daisStatus(
                `${label} &nbsp; ` +
                `<span class="tally">${round1FilledCount()} / ${p2.round1Target}</span> &nbsp; ` +
                `<span class="hint">Click a raised placard.</span>`
            );
            status.id = "selection-status";
            bar.appendChild(status);
            break;
        }

        case "round2_select": {
            const status = daisStatus(
                `Round 2 &middot; select the <span class="prompt-emph">remaining</span> speakers &nbsp; ` +
                `<span class="tally">${round2FilledCount()} / ${p2.round2Target}</span> &nbsp; ` +
                `<span class="hint">Click a raised placard.</span>`
            );
            status.id = "selection-status";
            bar.appendChild(status);
            break;
        }

        case "round1_speeches":
        case "round2_speeches": {
            renderSpeechDais(bar);
            break;
        }

        case "unmod_caucus": {
            renderCaucusDais(bar);
            break;
        }
    }
}

function renderSpeechDais(bar) {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp) return;

    if (sp.mode === "recognizing") {
        const delIdx = p2.speakerOrder[sp.currentSlot];
        const del = state.delegates[delIdx];
        const status = daisStatus(
            `Recognize the next speaker &mdash; <strong>${del.country}</strong> is up. ` +
            `<span class="hint">Click their delegate in the committee room.</span>`
        );
        bar.appendChild(status);
    } else if (sp.mode === "speaking") {
        const delIdx = p2.speakerOrder[sp.currentSlot];
        const del = state.delegates[delIdx];
        const wrap = document.createElement("div");
        wrap.className = "speech-dais";
        wrap.innerHTML = `
            <div class="speech-who">
                <div class="speech-who-label">HAS THE FLOOR</div>
                <div class="speech-who-name">${del.country}</div>
            </div>
            <div class="speech-timer-wrap">
                <div class="speech-timer-label">TIME</div>
                <div class="speech-timer" id="speech-timer" data-phase="${sp.phase}">${formatSpeechTime(sp.displayedSec)}</div>
            </div>
            <div class="gavel-wrap">
                <div class="thud-layer" id="thud-layer"></div>
                <button class="gavel-btn" id="gavel-btn" data-phase="${sp.phase}" data-warned="${sp.warningClicked ? "true" : "false"}">
                    ${buildGavelInner(sp)}
                </button>
            </div>
        `;
        bar.appendChild(wrap);
        const gbtn = wrap.querySelector("#gavel-btn");
        if (gbtn) gbtn.addEventListener("click", onGavelClick);
    } else if (sp.mode === "done") {
        const p2Ref = state.p2;
        const isRound1 = p2Ref.stage === "round1_speeches";
        const single = isSingleRoundMod(p2Ref.totalSpeakers);
        const isRR = p2Ref.speakersMotion && p2Ref.speakersMotion.type === "rr";
        const nextIsRound2 = isRound1 && !single && !isRR;
        const label = nextIsRound2 ? "Proceed to Round 2 &rarr;" : "Conclude speeches &rarr;";
        const btn = daisButton(label, "proceed");
        btn.addEventListener("click", nextIsRound2 ? enterRound2 : finishPhase2);
        bar.appendChild(btn);
    }
}

function buildGavelInner(sp) {
    const phase = sp.phase;
    let label = "Gavel";
    if (phase === "warn") {
        if (sp.warningClicked) label = "Warning given";
        else label = sp.caucusMode ? "One-Minute Warning" : "10-Second Warning";
    } else if (phase === "zero") {
        label = "Gavel Down!";
    }

    let iconHTML;
    const artPath = phase === "warn" ? GAVEL_ART.warn
                  : phase === "zero" ? GAVEL_ART.down
                  : GAVEL_ART.idle;
    if (artPath) {
        iconHTML = `<img class="gavel-icon-img" src="${artPath}" alt="">`;
    } else {
        iconHTML = `<span class="gavel-icon">&#128296;</span>`;
    }
    return `${iconHTML}<span class="gavel-label" id="gavel-label">${label}</span>`;
}

function daisButton(labelHTML, extraClass = "") {
    const btn = document.createElement("button");
    btn.className = "chair-prompt-btn" + (extraClass ? " " + extraClass : "");
    btn.innerHTML = labelHTML;
    return btn;
}
function daisStatus(html) {
    const div = document.createElement("div");
    div.className = "dais-status";
    div.innerHTML = html;
    return div;
}

// ---- Phase 2 motion handlers ----
function handleCallForMotions() {
    const p2 = state.p2;
    const presentIdxs = state.delegates
        .map((d, i) => d.present ? i : -1)
        .filter(i => i !== -1);

    let chosen;
    if (p2.unmodMode) {
        // v22 — Phase 3: pick 3 random present delegates (any personality)
        // and pre-assign each one a forced unmod duration.
        chosen = shuffle(presentIdxs).slice(0, 3);
        const shuffledTimes = shuffle(UNMOD_TIMES);
        chosen.forEach((idx, i) => {
            state.delegates[idx]._forcedUnmodMinutes = shuffledTimes[i];
        });
    } else {
        const demboyIdxs = presentIdxs.filter(
            i => state.delegates[i].personality === "demboy"
        );
        if (demboyIdxs.length > 0) {
            const guaranteedDemboy = pick(demboyIdxs);
            const others = shuffle(presentIdxs.filter(i => i !== guaranteedDemboy)).slice(0, 4);
            chosen = shuffle([guaranteedDemboy, ...others]);
            state.delegates[guaranteedDemboy].guaranteedBadMod = true;
        } else {
            chosen = shuffle(presentIdxs).slice(0, 5);
        }
    }
    p2.raisedDelegates = chosen;
    chosen.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (seat) {
            seat.classList.add("requesting");
            seat.classList.add("raised");
            seat.addEventListener("click", onDelegateClickForMotion);
        }
    });
    p2.stage = "requesting";
    updateMotionsInstructions(
        `Recognize a raised placard. <span class="hint">Click a delegate with a gold “!”</span>`
    );
    renderMotionsDais();
}

function onDelegateClickForMotion(e) {
    const p2 = state.p2;
    if (p2.stage !== "requesting") return;
    const seat = e.currentTarget;
    const idx = parseInt(seat.dataset.index, 10);
    if (!p2.raisedDelegates.includes(idx)) return;

    seat.classList.remove("requesting");
    seat.removeEventListener("click", onDelegateClickForMotion);
    p2.raisedDelegates = p2.raisedDelegates.filter(i => i !== idx);

    const del = state.delegates[idx];
    p2.currentSpeaker = del;
    const motion = generateMotion(del);
    del._pendingMotion = motion;

    showSpeechBubble(del, motion.spoken, "committee-room-p2");
    p2.stage = "speaking";
    updateMotionsInstructions(
        motion.type === "unmod"
            ? `${del.country} has motioned for an <em>unmoderated caucus</em>. Note it and continue.`
            : `${del.country} has motioned. Note it and continue.`
    );
    renderMotionsDais();

    // v22 — appearance-time thud for correction buttons, but not in unmodMode
    // (no such buttons appear during Phase 3).
    if (!p2.unmodMode) {
        if (motion.type === "unmod" || (motion.type === "mod" && motion.needsCorrection)) {
            playThud();
        }
    }
}

function handleDilatory() {
    const p2 = state.p2;
    const del = p2.currentSpeaker;
    clearSpeechBubble(del, "committee-room-p2");
    const secondMotion = generateSecondChanceMotion(del);
    del._pendingMotion = secondMotion;
    setTimeout(() => {
        showSpeechBubble(del, secondMotion.spoken, "committee-room-p2");
        p2.stage = "speaking2";
        updateMotionsInstructions(`${del.country} tries again with a different motion.`);
        renderMotionsDais();
    }, 500);
}

function handleModCorrection() {
    const p2 = state.p2;
    const del = p2.currentSpeaker;
    const original = del._pendingMotion;
    clearSpeechBubble(del, "committee-room-p2");
    const corrected = generateCorrectedMotion(del, original);
    del._pendingMotion = corrected;
    setTimeout(() => {
        showSpeechBubble(del, corrected.spoken, "committee-room-p2");
        p2.stage = "speaking2";
        updateMotionsInstructions(`${del.country} re-proposes with the corrected minutes.`);
        renderMotionsDais();
    }, 500);
}

function handleAcceptMotion() {
    const p2 = state.p2;
    const del = p2.currentSpeaker;
    const motion = del._pendingMotion;

    clearSpeechBubble(del, "committee-room-p2");
    lowerPlacard(del, "committee-room-p2");

    p2.motionsCollected.push({
        delegate: del,
        delegateIdx: delegateIndexOf(del),
        type: motion.type,
        spoken: motion.spoken,
        written: motion.written,
        topic: motion.topic,
        min: motion.min,
        sec: motion.sec,
        status: null,
        proposalOrder: p2.motionsCollected.length,
    });
    p2.currentSpeaker = null;
    renderAgenda();

    if (p2.motionsCollected.length >= 3) {
        p2.raisedDelegates.forEach(idx => {
            const seat = getSeatElement(idx, "committee-room-p2");
            if (seat) {
                seat.classList.remove("requesting");
                seat.removeEventListener("click", onDelegateClickForMotion);
            }
        });
        p2.raisedDelegates = [];
        p2.stage = "ready_to_vote";
        updateMotionsInstructions("Three motions on the floor. Move to vote.");
    } else {
        p2.stage = "requesting";
        updateMotionsInstructions(
            `<strong>${p2.motionsCollected.length} / 3</strong> motions noted. Recognize another raised placard.`
        );
    }
    renderMotionsDais();
}

function selectMotionForVote(motionIdx) {
    const p2 = state.p2;
    if (p2.stage !== "selecting_vote") return;
    const motion = p2.motionsCollected[motionIdx];
    if (motion.status) return;
    const correctIdx = mostDisruptiveUnresolvedIdx();
    p2.orderPicks.push({
        pickedIdx: motionIdx,
        correctIdx,
        correct: motionIdx === correctIdx,
    });
    p2.currentMotionIdx = motionIdx;
    p2.stage = "calling_favor";
    updateMotionsInstructions(`Voting on: <strong>${motion.spoken}</strong>`);
    renderAgenda();
    renderMotionsDais();
}

function handleCallFavor() {
    const p2 = state.p2;
    const presentDels = state.delegates.filter(d => d.present);
    const totalPresent = presentDels.length;
    const needed = Math.floor(totalPresent / 2) + 1;

    let willPass;
    if (p2.voteAttempt >= 2) willPass = true;
    else willPass = Math.random() < 0.4;

    let favorCount;
    if (willPass) favorCount = needed + Math.floor(Math.random() * (totalPresent - needed + 1));
    else favorCount = Math.floor(Math.random() * needed);

    const motion = p2.motionsCollected[p2.currentMotionIdx];
    const proposerIdx = motion.delegateIdx;

    const otherIdxs = shuffle(presentDels
        .map(d => delegateIndexOf(d))
        .filter(i => i !== proposerIdx));

    const favorSet = new Set([proposerIdx]);
    let need = Math.max(0, favorCount - 1);
    for (const i of otherIdxs) {
        if (need <= 0) break;
        favorSet.add(i);
        need--;
    }
    const finalFavor = favorSet.size;

    favorSet.forEach(i => {
        const seat = getSeatElement(i, "committee-room-p2");
        if (seat) seat.classList.add("vote-favor");
    });

    p2.favorIdxs = Array.from(favorSet);
    p2.tally = { favor: finalFavor, needed, totalPresent };
    p2.voteVerdict = finalFavor >= needed ? "pass" : "fail";

    if (p2.voteVerdict === "pass") {
        p2.motionsCollected[p2.currentMotionIdx].status = "passed";
        renderAgenda();
    }

    p2.stage = "showing_favor";
    renderMotionsDais();
}

function handleCallOppose() {
    const p2 = state.p2;
    const presentDels = state.delegates.filter(d => d.present);
    const totalPresent = presentDels.length;
    const favorCount = p2.tally.favor;
    const opposeCount = totalPresent - favorCount;

    document.querySelectorAll("#committee-room-p2 .delegate-seat.vote-favor").forEach(s => {
        s.classList.remove("vote-favor");
    });

    const favorSet = new Set(p2.favorIdxs || []);
    const opposeIdxs = [];
    presentDels.forEach(d => {
        const idx = delegateIndexOf(d);
        if (!favorSet.has(idx)) opposeIdxs.push(idx);
    });
    opposeIdxs.forEach(i => {
        const seat = getSeatElement(i, "committee-room-p2");
        if (seat) seat.classList.add("vote-oppose");
    });

    p2.tally.oppose = opposeCount;
    p2.stage = "showing_oppose";
    renderMotionsDais();
}

function clearVoteVisuals() {
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("vote-favor", "vote-oppose");
    });
}
function clearAllBubbles() {
    document.querySelectorAll("#committee-room-p2 .speech-bubble").forEach(b => b.remove());
}

function handlePassProceed() {
    playThud();
    const p2 = state.p2;
    if (p2.unmodMode) {
        // v23 — route into the actual unmod caucus (not the v22 stub).
        const motion = p2.motionsCollected[p2.currentMotionIdx];
        startUnmodCaucus(motion);
    } else {
        enterSpeakerSelection();
    }
}

function finishPhase2() {
    const p2 = state.p2;
    if (p2 && p2.speeches && p2.speeches.timerId) {
        clearInterval(p2.speeches.timerId);
        p2.speeches.timerId = null;
    }
    if (p2 && p2.speeches && p2.speeches._spamTimer) {
        clearTimeout(p2.speeches._spamTimer);
        p2.speeches._spamTimer = null;
    }
    const _sp = document.getElementById("speakers-panel");
    if (_sp) _sp.hidden = true;
    const passed = p2.speakersMotion || p2.motionsCollected[p2.currentMotionIdx];
    clearVoteVisuals();

    const orderMistakes    = p2.orderPicks.filter(p => !p.correct).length;
    const repeatMistakes   = p2.repeatPickCount || 0;
    const speechLog        = (p2.speeches && p2.speeches.log) || [];
    const recogMistakes    = speechLog.reduce((s, e) => s + (e.recognitionMisclicks || 0), 0);
    const missedWarns      = speechLog.filter(e => e.warning === "missed").length;
    const lateWarns        = speechLog.filter(e => e.warning === "late").length;
    const gavelMistakes    = speechLog.filter(e => e.gavelDown === "missed").length;

    const totalMistakes = orderMistakes + repeatMistakes + recogMistakes
                        + missedWarns + lateWarns + gavelMistakes;
    const stars = Math.max(0, 3 - totalMistakes);

    const clauses = [];
    if (orderMistakes > 0)  clauses.push(`${orderMistakes} wrong order pick${orderMistakes > 1 ? "s" : ""}.`);
    if (repeatMistakes > 0) clauses.push(`${repeatMistakes} repeat speaker${repeatMistakes > 1 ? "s" : ""} called on.`);
    if (recogMistakes > 0)  clauses.push(`${recogMistakes} wrong recognition${recogMistakes > 1 ? "s" : ""}.`);
    if (missedWarns > 0)    clauses.push(`${missedWarns} missed 10-second warning${missedWarns > 1 ? "s" : ""}.`);
    if (lateWarns > 0)      clauses.push(`${lateWarns} late 10-second warning${lateWarns > 1 ? "s" : ""}.`);
    if (gavelMistakes > 0)  clauses.push(`${gavelMistakes} missed gavel-down${gavelMistakes > 1 ? "s" : ""}.`);
    const summary = buildMultilineSummary(clauses, "Textbook committee.");

    // Restore star-result visibility (Phase 3 may have hidden it).
    const starResult = document.querySelector("#post-motions-screen .star-result");
    if (starResult) starResult.style.display = "";

    const flavorEl = document.getElementById("post-motions-flavor");
    if (flavorEl) {
        flavorEl.innerHTML =
            `The committee has adopted <strong>${passed.delegate.country}'s motion</strong> for ` +
            `<em>${passed.spoken}</em>.`;
    }
    renderStarBlock("phase2-stars", stars, summary);

    // v23 — configure the post-motions button for the Phase 2 → Phase 3 handoff.
    renderPostMotionsScreen("phase2");

    setTimeout(() => showScreen("post-motions-screen"), 400);
}

// ---- Motion generation ----
function generateMotion(delegate) {
    // v22 — forced unmod takes precedence (Phase 3).
    if (delegate._forcedUnmodMinutes != null) {
        const mins = delegate._forcedUnmodMinutes;
        delegate._forcedUnmodMinutes = null;
        return {
            type: "unmod",
            min: mins,
            spoken: `${mins} minute unmod`,
            written: `${shortName(delegate.country)} ${mins} min unmod`,
            topic: null,
        };
    }
    const p = delegate.personality;
    const topic = pick(TOPICS);
    if (p === "slacker") {
        const time = pick(UNMOD_TIMES);
        return {
            type: "unmod",
            min: time,
            spoken: `${time} minute unmod`,
            written: `${shortName(delegate.country)} ${time} min unmod`,
            topic: null,
        };
    }
    if (p === "carolina") {
        const sec = pick(RR_SECONDS);
        return {
            type: "rr",
            spoken: `${sec} second round robin on ${topic.long}`,
            written: `${shortName(delegate.country)} ${sec} sec rr ${topic.short}`,
            topic,
        };
    }
    const forceCorrection = delegate.guaranteedBadMod === true;
    if (forceCorrection) {
        const bad = pickCorrectionMod();
        if (bad) {
            delegate.guaranteedBadMod = false;
            const rMin = roundDownMult3(bad.min);
            return {
                type: "mod",
                needsCorrection: true,
                min: bad.min,
                sec: bad.sec,
                correctedMin: rMin,
                spoken: `${bad.min} ${bad.sec} on ${topic.long}`,
                written: `${shortName(delegate.country)} ${bad.min} ${bad.sec} ${topic.short}`,
                topic,
            };
        }
    }
    const m = pickValidMod();
    return {
        type: "mod",
        needsCorrection: false,
        min: m.min,
        sec: m.sec,
        spoken: `${m.min} ${m.sec} on ${topic.long}`,
        written: `${shortName(delegate.country)} ${m.min} ${m.sec} ${topic.short}`,
        topic,
    };
}

function generateSecondChanceMotion(delegate) {
    const topic = pick(TOPICS);
    if (Math.random() < 0.5) {
        const m = pickValidMod();
        return {
            type: "mod",
            needsCorrection: false,
            min: m.min,
            sec: m.sec,
            spoken: `${m.min} ${m.sec} on ${topic.long}`,
            written: `${shortName(delegate.country)} ${m.min} ${m.sec} ${topic.short}`,
            topic,
        };
    }
    const sec = pick(RR_SECONDS);
    return {
        type: "rr",
        spoken: `${sec} second round robin on ${topic.long}`,
        written: `${shortName(delegate.country)} ${sec} sec rr ${topic.short}`,
        topic,
    };
}
function generateCorrectedMotion(delegate, originalMotion) {
    const rMin = originalMotion.correctedMin;
    const sec = originalMotion.sec;
    const topic = originalMotion.topic;
    return {
        type: "mod",
        needsCorrection: false,
        min: rMin,
        sec: sec,
        spoken: `${rMin} ${sec} on ${topic.long}`,
        written: `${shortName(delegate.country)} ${rMin} ${sec} ${topic.short}`,
        topic,
    };
}

// ==========================================================
//  PHASE 2 — SPEAKER SELECTION SUB-PHASE
// ==========================================================

function computeTotalSpeakers(motion) {
    if (motion.type === "mod") return speakerCount(motion.min, motion.sec);
    if (motion.type === "rr")  return getPresentCount();
    return 0;
}

function isSingleRoundMod(total) {
    return total <= 4;
}

// v29 — round1Target/round2Target are fixed slot counts for each round,
// set once in enterSpeakerSelection and never mutated afterward (including
// by proposer placement). "How many are still needed" is always derived
// fresh from speakerOrder itself, so it can never drift out of sync no
// matter how a slot got filled or how many times a code path runs.
function round1FilledCount() {
    const p2 = state.p2;
    let n = 0;
    for (let i = 0; i < p2.round1Target; i++) {
        if (p2.speakerOrder[i] != null) n++;
    }
    return n;
}
function round2FilledCount() {
    const p2 = state.p2;
    let n = 0;
    for (let i = p2.round1Target; i < p2.totalSpeakers; i++) {
        if (p2.speakerOrder[i] != null) n++;
    }
    return n;
}

function enterSpeakerSelection() {
    const p2 = state.p2;
    const motion = p2.motionsCollected[p2.currentMotionIdx];
    p2.speakersMotion = motion;
    p2.totalSpeakers = computeTotalSpeakers(motion);
    if (isSingleRoundMod(p2.totalSpeakers)) {
        p2.round1Target = p2.totalSpeakers;
        p2.round2Target = 0;
    } else {
        p2.round1Target = Math.ceil(p2.totalSpeakers / 2);
        p2.round2Target = p2.totalSpeakers - p2.round1Target;
    }
    p2.round1Picked = [];
    p2.round2Picked = [];
    p2.spokenSet = new Set();
    p2.raisedForRound = [];
    p2.proposerChoice = null;
    p2.currentRound = 0;
    p2.speakerOrder = new Array(p2.totalSpeakers).fill(null);
    p2._renderedOrder = [];

    const slackerIdxs = state.delegates
        .map((d, i) => (d.present && d.personality === "slacker") ? i : -1)
        .filter(i => i !== -1);
    p2.designatedSlackerIdx = slackerIdxs.length ? pick(slackerIdxs) : null;

    clearRoomForSpeakerSelection();

    renderSpeakersList(false);
    p2.stage = "asking_order";
    updateMotionsInstructions(
        `Motion passed &mdash; ${motion.delegate.country}'s <em>${motion.spoken}</em>. ` +
        `Ask the proposer their speaking preference.`
    );
    renderMotionsDais();
}

function proposerPreferenceFor(personality) {
    if (personality === "power" || personality === "carolina") return "first";
    return "last";
}

function buildRoundRobinOrder(proposerIdx, choice) {
    const proposer = state.delegates[proposerIdx];
    const startSeat = proposer.seat;
    const seatToDel = {};
    state.delegates.forEach((d, i) => { if (d.present) seatToDel[d.seat] = i; });

    const clockwise = [];
    for (let step = 0; step < 8; step++) {
        const seat = (startSeat + step) % 8;
        if (seatToDel[seat] != null) clockwise.push(seatToDel[seat]);
    }

    if (choice === "first") return clockwise;
    return [...clockwise.slice(1), clockwise[0]];
}

function handleProposerChoice() {
    const p2 = state.p2;
    const motion = p2.speakersMotion;
    const proposer = motion.delegate;
    const proposerIdx = delegateIndexOf(proposer);
    const choice = proposerPreferenceFor(proposer.personality);
    p2.proposerChoice = choice;

    const line = choice === "first"
        ? `${proposer.country} would like to speak first.`
        : `${proposer.country} will speak last, chair.`;
    showSpeakerBubble(proposerIdx, line);

    if (motion.type === "rr") {
        const order = buildRoundRobinOrder(proposerIdx, choice);
        p2.totalSpeakers = order.length;
        p2.speakerOrder = order.slice();
        p2.round1Target = 0;
        p2.round2Target = 0;
        order.forEach(i => p2.spokenSet.add(i));
        renderSpeakersList(true);

        setTimeout(() => {
            clearSpeakerBubbles();
            p2.spokenSet = new Set();
            enterRound1Speeches();
        }, 1400);
        return;
    }

    p2.speakerOrder[choice === "first" ? 0 : p2.totalSpeakers - 1] = proposerIdx;
    p2.spokenSet.add(proposerIdx);
    renderSpeakersList(true);

    setTimeout(() => {
        clearSpeakerBubbles();
        enterRound1();
    }, 1400);
}

function showSpeakerBubble(idx, text) {
    const seat = getSeatElement(idx, "committee-room-p2");
    if (!seat) return;
    const old = seat.querySelector(".speech-bubble");
    if (old) old.remove();
    const b = document.createElement("div");
    b.className = "speech-bubble";
    b.textContent = text;
    seat.appendChild(b);
}
function clearSpeakerBubbles() {
    document.querySelectorAll("#committee-room-p2 .speech-bubble").forEach(b => b.remove());
}

function renderSpeakersList(flashChanged = false) {
    const p2 = state.p2;
    const panel = document.getElementById("speakers-panel");
    const list = document.getElementById("speakers-list");
    const label = document.getElementById("speakers-motion-label");
    if (!panel || !list) return;

    if (!p2 || !p2.speakerOrder || p2.speakerOrder.length === 0) {
        panel.hidden = true;
        list.innerHTML = "";
        return;
    }
    panel.hidden = false;
    if (label && p2.speakersMotion) {
        label.textContent = p2.speakersMotion.written || "";
    }

    const sp = p2.speeches;
    const isSpeechStage = p2.stage === "round1_speeches" || p2.stage === "round2_speeches";

    const prev = p2._renderedOrder || [];
    list.innerHTML = "";
    p2.speakerOrder.forEach((idx, i) => {
        const li = document.createElement("li");
        li.dataset.slotIdx = i;
        if (idx == null) {
            li.classList.add("empty-slot");
        } else {
            const del = state.delegates[idx];
            li.textContent = del.country;
            if (flashChanged && prev[i] !== idx) li.classList.add("just-filled");
        }

        if (isSpeechStage && sp) {
            if (sp.spokenSlots && sp.spokenSlots.has(i)) {
                li.classList.add("spoken");
            }
            if (sp.mode === "recognizing" && i === sp.currentSlot) {
                li.classList.add("current-speaker");
            } else if (sp.mode === "speaking" && i === sp.currentSlot) {
                li.classList.add("active-speaker");
            }
        }

        list.appendChild(li);
    });
    p2._renderedOrder = p2.speakerOrder.slice();
}


function enterRound1() {
    const p2 = state.p2;
    p2.currentRound = 1;
    p2.stage = "round1_select";

    const pool = buildRound1RaisePool();
    applyRaisePool(pool);

    if (round1FilledCount() >= p2.round1Target) {
        enterRound1Speeches();
        return;
    }
    renderMotionsDais();
}

function buildRound1RaisePool() {
    const p2 = state.p2;
    const proposerIdx = delegateIndexOf(p2.speakersMotion.delegate);
    const slotsRemaining = p2.round1Target - round1FilledCount();

    const pool = [];
    state.delegates.forEach((d, i) => {
        if (!d.present) return;
        if (i === proposerIdx) return;
        if (p2.round1Picked.includes(i)) return;
        if (i === p2.designatedSlackerIdx) return;
        const p = d.personality;
        if (p === "power" || p === "demboy") pool.push(i);
        else if (p === "slacker") pool.push(i);
    });

    if (pool.length < slotsRemaining) {
        const carolinas = state.delegates
            .map((d, i) => (d.present && d.personality === "carolina"
                            && i !== proposerIdx
                            && !p2.round1Picked.includes(i)) ? i : -1)
            .filter(i => i !== -1);
        for (const i of shuffle(carolinas)) {
            if (pool.length >= slotsRemaining) break;
            pool.push(i);
        }
    }
    return pool;
}

function enterRound1Speeches() {
    const p2 = state.p2;
    clearRaisePool();
    const total = p2.totalSpeakers;
    const single = isSingleRoundMod(total);
    const isRR = p2.speakersMotion && p2.speakersMotion.type === "rr";
    const end = (single || isRR) ? total - 1 : Math.ceil(total / 2) - 1;
    startSpeechesRound({ start: 0, end, roundKey: "round1" });
    p2.stage = "round1_speeches";
    updateMotionsInstructions(
        `${(single || isRR) ? "Speeches begin" : "Round 1 speeches begin"}. Click the highlighted delegate to recognize them.`
    );
    renderMotionsDais();
    renderSpeakersList(false);
    applyRecognitionHighlight();
}

function enterRound2() {
    const p2 = state.p2;
    p2.currentRound = 2;
    p2.stage = "round2_select";

    if (round2FilledCount() >= p2.round2Target) {
        enterRound2Speeches();
        return;
    }

    const pool = buildRound2RaisePool();
    applyRaisePool(pool);

    updateMotionsInstructions(
        `Select the <span class="prompt-emph">remaining</span> speakers.`
    );
    renderMotionsDais();
}

function buildRound2RaisePool() {
    const p2 = state.p2;
    const proposerIdx = delegateIndexOf(p2.speakersMotion.delegate);
    const proposerLast = p2.proposerChoice === "last";
    const pool = [];
    state.delegates.forEach((d, i) => {
        if (!d.present) return;
        if (p2.round2Picked.includes(i)) return;
        if (proposerLast && i === proposerIdx) return;
        if (d.personality === "power" || !p2.spokenSet.has(i)) {
            pool.push(i);
        }
    });
    return pool;
}

function enterRound2Speeches() {
    const p2 = state.p2;
    clearRaisePool();
    const total = p2.totalSpeakers;
    const start = Math.ceil(total / 2);
    const end = total - 1;
    startSpeechesRound({ start, end, roundKey: "round2" });
    p2.stage = "round2_speeches";
    updateMotionsInstructions(
        `Round 2 speeches begin. Click the highlighted delegate to recognize them.`
    );
    renderMotionsDais();
    renderSpeakersList(false);
    applyRecognitionHighlight();
}

function applyRaisePool(pool) {
    const p2 = state.p2;
    p2.raisedForRound = [...pool];
    pool.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (!seat) return;
        const del = state.delegates[idx];
        const variant = (del.personality === "power" || del.personality === "demboy")
            ? "raised-voting" : "raised";
        seat.classList.add(variant, "requesting");
        seat.addEventListener("click", onDelegateClickForSpeaker);
    });
}

function clearRaisePool() {
    const p2 = state.p2;
    p2.raisedForRound.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (!seat) return;
        seat.classList.remove("raised", "raised-voting", "requesting");
        seat.removeEventListener("click", onDelegateClickForSpeaker);
    });
    p2.raisedForRound = [];
}

function onDelegateClickForSpeaker(e) {
    const p2 = state.p2;
    if (p2.stage !== "round1_select" && p2.stage !== "round2_select") return;
    const seat = e.currentTarget;
    const idx = parseInt(seat.dataset.index, 10);
    if (!p2.raisedForRound.includes(idx)) return;

    const isRepeat = p2.spokenSet.has(idx);
    const country = state.delegates[idx].country;

    seat.classList.remove("raised", "raised-voting", "requesting");
    seat.removeEventListener("click", onDelegateClickForSpeaker);
    p2.raisedForRound = p2.raisedForRound.filter(i => i !== idx);

    if (p2.stage === "round1_select") {
        p2.round1Picked.push(idx);
    } else {
        p2.round2Picked.push(idx);
    }
    p2.spokenSet.add(idx);
    markSpeakerPicked(idx);

    if (isRepeat) {
        p2.repeatPickCount = (p2.repeatPickCount || 0) + 1;
        showRepeatFlash(country);
    }

    updateSelectionCounter();

    const target = p2.stage === "round1_select" ? p2.round1Target : p2.round2Target;
    const filled = p2.stage === "round1_select" ? round1FilledCount() : round2FilledCount();
    if (filled >= target) {
        setTimeout(() => {
            if (p2.stage === "round1_select") enterRound1Speeches();
            else enterRound2Speeches();
        }, 350);
    }
}

function updateSelectionCounter() {
    const p2 = state.p2;
    const status = document.getElementById("selection-status");
    if (!status) return;
    const tally = status.querySelector(".tally");
    if (!tally) return;
    if (p2.stage === "round1_select") {
        tally.textContent = `${round1FilledCount()} / ${p2.round1Target}`;
    } else if (p2.stage === "round2_select") {
        tally.textContent = `${round2FilledCount()} / ${p2.round2Target}`;
    }
}

function markSpeakerPicked(idx) {
    const p2 = state.p2;
    if (!p2 || !p2.speakerOrder) return;
    let filled = false;
    for (let i = 0; i < p2.speakerOrder.length; i++) {
        if (p2.speakerOrder[i] == null) {
            p2.speakerOrder[i] = idx;
            filled = true;
            break;
        }
    }
    if (filled) renderSpeakersList(true);
}

function showRepeatFlash(country) {
    const bar = document.getElementById("motions-dais-bar");
    if (!bar) return;
    const existing = bar.querySelector(".repeat-flash");
    if (existing) existing.remove();
    const flash = document.createElement("div");
    flash.className = "repeat-flash";
    flash.innerHTML = `&#9888; <strong>${country}</strong> has already spoken this session &mdash; proceeding.`;
    bar.appendChild(flash);
    setTimeout(() => { if (flash.parentNode) flash.remove(); }, 2500);
}

function clearRoomForSpeakerSelection() {
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("raised", "raised-voting", "requesting",
                           "vote-favor", "vote-oppose", "active",
                           "awaiting-recognition", "misclick-seat");
        s.removeEventListener("click", onDelegateClickForMotion);
        s.removeEventListener("click", onDelegateClickForSpeaker);
        s.removeEventListener("click", onSeatClickForRecognition);
    });
    document.querySelectorAll("#committee-room-p2 .speech-bubble").forEach(b => b.remove());
}

// ==========================================================
//  SPEECHES SUB-STAGE
// ==========================================================

function startSpeechesRound({ start, end, roundKey }) {
    const p2 = state.p2;
    if (!p2.speeches) {
        p2.speeches = {
            log: [],
            spokenSlots: new Set(),
        };
    }
    const sp = p2.speeches;
    sp.rangeStart = start;
    sp.rangeEnd = end;
    sp.currentSlot = start;
    sp.roundKey = roundKey;
    sp.mode = "recognizing";
    sp.phase = "pre";
    sp.warning = null;
    sp.warningClicked = false;
    sp.gavelDownClicks = 0;
    sp.endingScheduled = false;
    sp.thudBubbles = [];
    sp.caucusMode = false;
    sp.warnThreshold = 10;
    sp.lateThreshold = 8;
    if (sp.timerId) { clearInterval(sp.timerId); sp.timerId = null; }
    if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }
    sp.displayedSec = 0;
    sp.startSec = 0;
    sp.lastTick = 0;
    sp.zeroStartTime = 0;
    sp.recognitionMisclicks = 0;
    sp.preRate = 1;
    sp.warnRate = 1;
}

function extractRRSeconds(motion) {
    const m = motion.spoken.match(/^(\d+)\s+second/);
    return m ? parseInt(m[1], 10) : 30;
}

function speechSecondsForMotion(motion) {
    if (motion.type === "rr") return extractRRSeconds(motion);
    return motion.sec;
}

function drawSpeechLine(delegate) {
    const pool = SPEECH_LINES[delegate.personality] || [];
    const used = state.usedSpeechLines;
    let candidates = pool.filter(l => !used.has(l));
    if (candidates.length === 0) {
        candidates = SPEECH_LINES.generic.filter(l => !used.has(l));
    }
    if (candidates.length === 0) {
        candidates = SPEECH_LINES.generic;
    }
    const template = pick(candidates);
    used.add(template);
    return template
        .replace(/\{country\}/g, delegate.country)
        .replace(/\{boss\}/g, delegate.boss || "the bloc leader");
}

function applyRecognitionHighlight() {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp || sp.mode !== "recognizing") return;

    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("active", "awaiting-recognition");
        s.removeEventListener("click", onSeatClickForRecognition);
    });

    const delIdx = p2.speakerOrder[sp.currentSlot];
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.addEventListener("click", onSeatClickForRecognition);
    });
    const target = getSeatElement(delIdx, "committee-room-p2");
    if (target) target.classList.add("active", "awaiting-recognition");
}

function clearRecognitionHighlight() {
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("active", "awaiting-recognition");
        s.removeEventListener("click", onSeatClickForRecognition);
    });
}

function onSeatClickForRecognition(e) {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp || sp.mode !== "recognizing") return;
    const seat = e.currentTarget;
    const idx = parseInt(seat.dataset.index, 10);
    const correctIdx = p2.speakerOrder[sp.currentSlot];

    if (idx !== correctIdx) {
        sp.recognitionMisclicks++;
        flashMisclickWarning(idx);
        seat.classList.remove("misclick-seat");
        void seat.offsetWidth;
        seat.classList.add("misclick-seat");
        setTimeout(() => seat && seat.classList.remove("misclick-seat"), 450);
        return;
    }
    beginSpeech(sp.currentSlot);
}

function beginSpeech(slotIdx) {
    const p2 = state.p2;
    const sp = p2.speeches;
    const delIdx = p2.speakerOrder[slotIdx];
    const del = state.delegates[delIdx];
    const motion = p2.speakersMotion;
    const startSec = speechSecondsForMotion(motion);

    clearRecognitionHighlight();

    sp.mode = "speaking";
    sp.phase = startSec <= 10 ? "warn" : "pre";
    sp.warning = null;
    sp.warningClicked = false;
    sp.gavelDownClicks = 0;
    sp.endingScheduled = false;
    sp.thudBubbles = [];
    sp.displayedSec = startSec;
    sp.startSec = startSec;
    sp.lastTick = performance.now();
    sp.zeroStartTime = 0;
    if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }

    sp.preRate = startSec > 10
        ? (startSec - 10) / SPEECH_PRE_REAL_SEC
        : 1;
    sp.warnRate = 10 / SPEECH_WARN_REAL_SEC;

    const line = drawSpeechLine(del);
    showSpeechBubble(del, line, "committee-room-p2");

    renderMotionsDais();
    renderSpeakersList(false);

    sp.timerId = setInterval(tickSpeech, 50);
}

function tickSpeech() {
    const sp = state.p2 && state.p2.speeches;
    if (!sp || sp.mode !== "speaking") return;

    const now = performance.now();
    const dt = (now - sp.lastTick) / 1000;
    sp.lastTick = now;

    if (sp.phase === "pre" || sp.phase === "warn") {
        const rate = sp.phase === "pre" ? sp.preRate : sp.warnRate;
        sp.displayedSec -= rate * dt;

        if (sp.displayedSec <= (sp.warnThreshold || 10) && sp.phase === "pre") {
            sp.phase = "warn";
            renderMotionsDais();
            return;
        }
        if (sp.displayedSec <= 0) {
            sp.displayedSec = 0;
            sp.phase = "zero";
            if (sp.warning == null) {
                sp.warning = "missed";
                // v23 — splash for missed warning (fires at 0:00).
                flashDaisMessage(sp.caucusMode
                    ? "The one-minute warning was never given."
                    : "The 10-second warning was never given.");
            }
            sp.zeroStartTime = now;
            renderMotionsDais();
            return;
        }
        updateTimerDisplay();
    } else if (sp.phase === "zero") {
        if (sp.gavelDownClicks < GAVEL_DOWN_MIN_CLICKS) {
            const zeroElapsed = now - sp.zeroStartTime;
            if (zeroElapsed >= ZERO_GRACE_MS) {
                if (sp.caucusMode) endUnmodCaucus({ gavelDown: "missed" });
                else endCurrentSpeech({ gavelDown: "missed" });
            }
        }
    }
}

function updateTimerDisplay() {
    const sp = state.p2 && state.p2.speeches;
    if (!sp) return;
    const el = document.getElementById("speech-timer");
    if (!el) return;
    el.textContent = formatSpeechTime(sp.displayedSec);
    el.dataset.phase = sp.phase;
}

function formatSpeechTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
}

function onGavelClick() {
    const sp = state.p2 && state.p2.speeches;
    if (!sp || sp.mode !== "speaking") return;

    if (sp.phase === "pre") {
        if (sp.warning == null) sp.warning = "early";
        flashDaisMessage(sp.caucusMode
            ? "Not yet, the caucus has time."
            : "Not yet, the delegate has time.");
        return;
    }
    if (sp.phase === "warn") {
        if (sp.warningClicked) return;
        const lateThreshold = sp.lateThreshold != null ? sp.lateThreshold : 8;
        const isLate = sp.displayedSec <= lateThreshold;
        if (sp.warning == null) sp.warning = isLate ? "late" : "on-time";
        sp.warningClicked = true;
        // v28 — the on-time "chair recognizes 10 seconds remaining" flash
        // was removed for speeches (redundant with the gavel/timer UI
        // itself); the caucus's one-minute counterpart stays.
        if (isLate) {
            flashDaisMessage("Warning given late.");
        } else if (sp.caucusMode) {
            flashDaisMessage("The chair recognizes one minute remaining.");
        }
        spawnThud(1);
        playThud();
        const btn = document.getElementById("gavel-btn");
        if (btn) btn.dataset.warned = "true";
        const label = document.getElementById("gavel-label");
        if (label) label.textContent = "Warning given";
        return;
    }
    if (sp.phase === "zero") {
        if (sp.gavelDownClicks >= GAVEL_DOWN_MAX_CLICKS) return;
        sp.gavelDownClicks++;
        spawnThud(sp.gavelDownClicks);
        playThud();

        if (sp.gavelDownClicks >= GAVEL_DOWN_MAX_CLICKS) {
            if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }
            if (sp.mode === "speaking") {
                if (sp.caucusMode) endUnmodCaucus({ gavelDown: "on-time" });
                else endCurrentSpeech({ gavelDown: "on-time" });
            }
            return;
        }

        if (sp.gavelDownClicks >= GAVEL_DOWN_MIN_CLICKS) {
            if (sp._spamTimer) clearTimeout(sp._spamTimer);
            sp._spamTimer = setTimeout(() => {
                sp._spamTimer = null;
                if (sp.mode === "speaking") {
                    if (sp.caucusMode) endUnmodCaucus({ gavelDown: "on-time" });
                    else endCurrentSpeech({ gavelDown: "on-time" });
                }
            }, GAVEL_DOWN_SPAM_WINDOW);
        }
    }
}

function spawnThud(clickIdx) {
    const layer = document.getElementById("thud-layer");
    const sp = state.p2 && state.p2.speeches;
    if (!layer || !sp) return;

    const bubble = document.createElement("div");
    bubble.className = "thud-bubble";
    bubble.textContent = "THUD";

    const dir = clickIdx % 2 === 0 ? 1 : -1;
    const tx = dir * (10 + (clickIdx % 3) * 7) + Math.floor(Math.random() * 8) - 4;
    const ty = -8 - (clickIdx % 4) * 5 - Math.floor(Math.random() * 6);
    const rot = dir * (5 + (clickIdx % 4) * 2) + (Math.random() * 4 - 2);

    bubble.style.setProperty("--tx", `${tx}px`);
    bubble.style.setProperty("--ty", `${ty}px`);
    bubble.style.setProperty("--rot", `${rot}deg`);
    bubble.style.zIndex = 100 + clickIdx;

    layer.appendChild(bubble);
    sp.thudBubbles.push(bubble);

    while (sp.thudBubbles.length > THUD_BUBBLE_MAX_ONSCREEN) {
        const old = sp.thudBubbles.shift();
        if (old && old.parentNode) old.remove();
    }

    setTimeout(() => {
        if (bubble.parentNode) bubble.remove();
        const i = sp.thudBubbles.indexOf(bubble);
        if (i !== -1) sp.thudBubbles.splice(i, 1);
    }, THUD_BUBBLE_LIFETIME_MS);
}

function flashDaisMessage(msg) {
    const bar = document.getElementById("motions-dais-bar");
    if (!bar) return;
    const existing = bar.querySelector(".dais-flash");
    if (existing) existing.remove();
    const f = document.createElement("div");
    f.className = "dais-flash";
    f.textContent = msg;
    bar.appendChild(f);
    setTimeout(() => { if (f.parentNode) f.remove(); }, 1800);
}

function flashMisclickWarning(clickedIdx) {
    const p2 = state.p2;
    const sp = p2.speeches;
    const correctIdx = p2.speakerOrder[sp.currentSlot];
    const correctDel = state.delegates[correctIdx];
    const bar = document.getElementById("motions-dais-bar");
    if (!bar) return;
    const existing = bar.querySelector(".repeat-flash");
    if (existing) existing.remove();
    const flash = document.createElement("div");
    flash.className = "repeat-flash";
    flash.innerHTML = `&#9888; Out of order &mdash; recognize <strong>${correctDel.country}</strong>.`;
    bar.appendChild(flash);
    setTimeout(() => { if (flash.parentNode) flash.remove(); }, 2200);
}

function endCurrentSpeech({ gavelDown }) {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp) return;

    if (sp.timerId) { clearInterval(sp.timerId); sp.timerId = null; }
    if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }

    const slotIdx = sp.currentSlot;
    const delIdx = p2.speakerOrder[slotIdx];
    const del = state.delegates[delIdx];

    sp.log.push({
        slotIdx,
        delegateIdx: delIdx,
        warning: sp.warning || "missed",
        gavelDown,
        gavelClicks: sp.gavelDownClicks,
        recognitionMisclicks: sp.recognitionMisclicks,
    });
    sp.recognitionMisclicks = 0;

    sp.spokenSlots.add(slotIdx);
    clearSpeechBubble(del, "committee-room-p2");

    if (slotIdx >= sp.rangeEnd) {
        sp.mode = "done";
        renderMotionsDais();
        renderSpeakersList(false);
    } else {
        sp.currentSlot = slotIdx + 1;
        sp.mode = "recognizing";
        sp.phase = "pre";
        sp.warning = null;
        sp.warningClicked = false;
        sp.gavelDownClicks = 0;
        sp.endingScheduled = false;
        renderMotionsDais();
        renderSpeakersList(false);
        applyRecognitionHighlight();
    }
}

// ==========================================================
//  PHASE 3 — STAGE A/B: MOTIONS & VOTE
// ==========================================================

function startPhase3() {
    // v23 — preserve Phase 2 topic before init wipes state.p2.
    const prior = state.p2 && state.p2.speakersMotion;
    const priorTopic = prior && prior.topic;

    showScreen("motions-screen");
    initPhase2State();
    state.p2.unmodMode = true;
    state.p2.priorTopic = priorTopic;

    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 3 of 5 · Unmoderated Caucus";

    const body = document.querySelector(".phase2-body");
    if (body) body.classList.remove("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.remove("hidden-in-caucus");

    // Clear leftover per-delegate flags from Phase 2.
    state.delegates.forEach(d => {
        d.guaranteedBadMod = false;
        d._pendingMotion = null;
        d._forcedUnmodMinutes = null;
    });

    renderCommitteeRoom("committee-room-p2");
    state.delegates.forEach((del, idx) => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (!seat) return;
        if (del.markedAs === "absent" || !del.present) seat.classList.add("marked-absent");
    });

    renderAgenda();
    renderMotionsDais();
    updateMotionsInstructions("Ask the floor for motions.");
}

// ==========================================================
//  PHASE 3 — STAGE C: UNMOD CAUCUS (v23)
// ==========================================================

function startUnmodCaucus(motion) {
    const p2 = state.p2;
    p2.stage = "unmod_caucus";

    // Hide agenda; expand room to full width.
    const body = document.querySelector(".phase2-body");
    if (body) body.classList.add("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.add("hidden-in-caucus");

    // Clear any stale seat classes from the vote stage.
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("raised", "raised-voting", "requesting",
                           "vote-favor", "vote-oppose", "active",
                           "awaiting-recognition", "misclick-seat");
    });
    clearAllBubbles();

    // Build blocs.
    const blocs = assignBlocs();
    const topicLong = (p2.priorTopic && p2.priorTopic.long) || "";
    const bucket = TOPIC_BUCKETS[topicLong] || "substance";
    blocs.forEach(bloc => {
        const key = bloc.leader === "power" ? "powerLed" : "carolinaLed";
        bloc.script = CAUCUS_CONVOS[bucket][key];
        bloc.turnIdx = 0;
        bloc.turnTimer = null;
        bloc.currentBubble = null;
        bloc.overlappingBubble = null;
    });
    p2.caucus = {
        blocs,
        motion,
        topicBucket: bucket,
        hoveredIdx: null,
        activeIdx: null,
        _mouseHandlers: null,
        _pendingHoverRaw: null,
        _hoverDebounceTimer: null,
    };

    animateIntoBlocs(blocs);
    attachCaucusHoverListeners();
    attachCaucusDelegateClickHandlers();

    setupCaucusTimer(motion);

    updateMotionsInstructions(
        `Hover a bloc to eavesdrop. Click a delegate to guess that bloc's leader.`
    );
    renderMotionsDais();
}

function assignBlocs() {
    const powers   = state.delegates.filter(d => d.personality === "power");
    const carolinas = state.delegates.filter(d => d.personality === "carolina");
    const slackers = state.delegates.filter(d => d.personality === "slacker");

    // Randomly split the two Power-Dels between blocs.
    const [pA, pB] = shuffle(powers);
    const dA = state.delegates.find(d => d.personality === "demboy" && d.boss === pA.country);
    const dB = state.delegates.find(d => d.personality === "demboy" && d.boss === pB.country);

    // One Carolina to each bloc, randomly.
    const [cA, cB] = shuffle(carolinas);

    // Coin-flip which bloc is Power-led vs. Carolina-led — done BEFORE
    // slacker assignment so we know which side to leave short if a
    // slacker is absent.
    const powerLedSide = Math.random() < 0.5 ? "A" : "B";

    const absent = slackers.find(s => !s.present);
    const present = slackers.find(s => s.present);
    let sA, sB;
    if (absent) {
        // Absent slacker → Power-led bloc.
        if (powerLedSide === "A") { sA = absent; sB = present; }
        else { sA = present; sB = absent; }
    } else {
        const [sX, sY] = shuffle(slackers);
        sA = sX; sB = sY;
    }

    const blocA = {
        side: "A",
        leader: powerLedSide === "A" ? "power" : "carolina",
        power: pA,
        demboy: dA,
        carolina: cA,
        slacker: sA,
        delegates: [pA, dA, cA, sA].filter(d => d && d.present),
        guessIdx: null,
    };
    const blocB = {
        side: "B",
        leader: powerLedSide === "B" ? "power" : "carolina",
        power: pB,
        demboy: dB,
        carolina: cB,
        slacker: sB,
        delegates: [pB, dB, cB, sB].filter(d => d && d.present),
        guessIdx: null,
    };
    return [blocA, blocB];
}

function animateIntoBlocs(blocs) {
    blocs.forEach(bloc => {
        const present = bloc.delegates;
        const short = present.length < 4;
        const key = `${bloc.side}_${short ? "short" : "full"}`;
        const layout = BLOC_LAYOUT[key];
        // Place present delegates by role.
        present.forEach(del => {
            const pos = layout[del.personality];
            if (!pos) return;
            const seat = getSeatElement(delegateIndexOf(del), "committee-room-p2");
            if (!seat) return;
            seat.style.left = `${pos.left}%`;
            seat.style.top  = `${pos.top}%`;
            seat.style.display = "";
            seat.classList.add("caucus-clickable");
            seat.dataset.blocSide = bloc.side;
        });
        // Hide absent slacker seat entirely for caucus.
        if (short && bloc.slacker && !bloc.slacker.present) {
            const seat = getSeatElement(delegateIndexOf(bloc.slacker), "committee-room-p2");
            if (seat) seat.style.display = "none";
        }
    });
}

// ----- Focus & hover -----
function attachCaucusHoverListeners() {
    const p2 = state.p2;
    const room = document.getElementById("committee-room-p2");
    if (!room) return;
    const c = p2.caucus;

    const applyHover = (idx) => {
        if (idx === c._pendingHoverRaw) return;
        c._pendingHoverRaw = idx;
        if (c._hoverDebounceTimer) clearTimeout(c._hoverDebounceTimer);
        c._hoverDebounceTimer = setTimeout(() => {
            c._hoverDebounceTimer = null;
            setHoveredBloc(idx);
        }, CAUCUS_HOVER_DEBOUNCE_MS);
    };

    const onMove = (e) => {
        const rect = room.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        // Only count as "over a bloc" if in the upper portion of the room.
        // (Below 80% is the dais label area.)
        let idx = null;
        if (y < 0.8) idx = x < 0.5 ? 0 : 1;
        applyHover(idx);
    };
    const onLeave = () => applyHover(null);

    room.addEventListener("mousemove", onMove);
    room.addEventListener("mouseleave", onLeave);
    p2.caucus._mouseHandlers = { onMove, onLeave, room };
}

function detachCaucusHoverListeners() {
    const p2 = state.p2;
    if (!p2 || !p2.caucus || !p2.caucus._mouseHandlers) return;
    const { onMove, onLeave, room } = p2.caucus._mouseHandlers;
    room.removeEventListener("mousemove", onMove);
    room.removeEventListener("mouseleave", onLeave);
    if (p2.caucus._hoverDebounceTimer) {
        clearTimeout(p2.caucus._hoverDebounceTimer);
        p2.caucus._hoverDebounceTimer = null;
    }
    p2.caucus._mouseHandlers = null;
}

function setHoveredBloc(idx) {
    const p2 = state.p2;
    const c = p2.caucus;
    if (c.hoveredIdx === idx) return;
    c.hoveredIdx = idx;
    recomputeActiveBloc();
}

function recomputeActiveBloc() {
    const c = state.p2.caucus;
    const next = c.hoveredIdx;
    if (next === c.activeIdx) return;
    if (c.activeIdx != null) deactivateBloc(c.activeIdx);
    c.activeIdx = next;
    if (next != null) activateBloc(next);
}

// ----- Delegate click: leader guess -----
function attachCaucusDelegateClickHandlers() {
    document.querySelectorAll("#committee-room-p2 .delegate-seat.caucus-clickable").forEach(seat => {
        seat.addEventListener("click", onCaucusDelegateClick);
    });
}

function onCaucusDelegateClick(e) {
    e.stopPropagation();
    const p2 = state.p2;
    if (!p2 || !p2.caucus) return;
    const seat = e.currentTarget;
    const side = seat.dataset.blocSide;
    if (!side) return;
    const blocIdx = side === "A" ? 0 : 1;
    const bloc = p2.caucus.blocs[blocIdx];
    const delIdx = parseInt(seat.dataset.index, 10);

    // Clear any prior guess in this bloc.
    document.querySelectorAll(`#committee-room-p2 .delegate-seat[data-bloc-side="${side}"]`)
        .forEach(s => s.classList.remove("leader-guess"));
    seat.classList.add("leader-guess");
    bloc.guessIdx = delIdx;
}

// ----- Dialogue engine (v24 — scripted playback) -----
function isCutoffLine(line) {
    const t = line.trim();
    return t.endsWith(",") || t.endsWith("...");
}

// Shows delegate/text as a bubble at their seat. When overlap is true, marks it
// as the interrupting bubble: it fades in and its seat is bumped above the
// bubble it's cutting off, so it reads as on top rather than winning stacking
// by DOM-order coincidence.
function renderCaucusBubble(delegate, text, overlap = false) {
    showSpeechBubble(delegate, text, "committee-room-p2");
    const seat = getSeatElement(delegateIndexOf(delegate), "committee-room-p2");
    const bubble = seat ? seat.querySelector(".speech-bubble") : null;
    if (overlap) {
        if (bubble) bubble.classList.add("overlap-bubble");
        if (seat) seat.classList.add("overlap-front");
    }
    return { delegate, seat };
}

function clearCaucusBubbleRef(ref) {
    if (!ref) return;
    clearSpeechBubble(ref.delegate, "committee-room-p2");
    if (ref.seat) ref.seat.classList.remove("overlap-front");
}

function displayTurn(blocIdx, idx, { asOverlap = false } = {}) {
    const bloc = state.p2.caucus.blocs[blocIdx];
    const entry = bloc.script[idx];
    if (!entry) return;
    const delegate = bloc.delegates.find(d => d.personality === entry.role);
    bloc.turnIdx = idx;
    if (!delegate) return; // role not present in this bloc (should not happen; slacker never scripted)
    const text = substituteLine(entry.line, delegate, bloc);
    if (asOverlap) {
        bloc.overlappingBubble = renderCaucusBubble(delegate, text, true);
    } else {
        bloc.currentBubble = renderCaucusBubble(delegate, text);
    }
}

function scheduleLifecycle(blocIdx, idx, elapsedMs = 0) {
    const bloc = state.p2.caucus.blocs[blocIdx];
    const entry = bloc.script[idx];
    const hasNext = idx + 1 < bloc.script.length;
    const cutoff = hasNext && isCutoffLine(entry.line);

    if (cutoff) {
        const toOverlap = Math.max(0, CAUCUS_CUTOFF_OVERLAP_MS - elapsedMs);
        bloc.turnTimer = setTimeout(() => {
            displayTurn(blocIdx, idx + 1, { asOverlap: true });
            const toHide = CAUCUS_BUBBLE_VISIBLE_MS - CAUCUS_CUTOFF_OVERLAP_MS;
            bloc.turnTimer = setTimeout(() => {
                clearCaucusBubbleRef(bloc.currentBubble);
                // Overlap resolved: this bubble is no longer cutting anyone
                // off, so drop its z-index boost before it might one day
                // become the "old" bubble in a later overlap.
                if (bloc.overlappingBubble && bloc.overlappingBubble.seat) {
                    bloc.overlappingBubble.seat.classList.remove("overlap-front");
                }
                bloc.currentBubble = bloc.overlappingBubble;
                bloc.overlappingBubble = null;
                scheduleLifecycle(blocIdx, idx + 1, toHide);
            }, toHide);
        }, toOverlap);
    } else {
        const toHide = Math.max(0, CAUCUS_BUBBLE_VISIBLE_MS - elapsedMs);
        bloc.turnTimer = setTimeout(() => {
            clearCaucusBubbleRef(bloc.currentBubble);
            bloc.currentBubble = null;
            bloc.turnTimer = setTimeout(() => {
                bloc.turnTimer = null;
                bloc.turnIdx = idx + 1;
                if (!hasNext) return; // script done; hold silent
                displayTurn(blocIdx, idx + 1);
                scheduleLifecycle(blocIdx, idx + 1, 0);
            }, CAUCUS_BUBBLE_GAP_MS);
        }, toHide);
    }
}

function setOtherBlocDim(blocIdx, on) {
    const otherSide = state.p2.caucus.blocs[1 - blocIdx].side;
    document.querySelectorAll(`#committee-room-p2 .delegate-seat[data-bloc-side="${otherSide}"]`)
        .forEach(seat => seat.classList.toggle("bloc-dimmed", on));
}

function activateBloc(blocIdx) {
    const bloc = state.p2.caucus.blocs[blocIdx];
    setOtherBlocDim(blocIdx, true);
    if (bloc.turnIdx >= bloc.script.length) return; // script already finished; hold silent
    bloc.turnTimer = setTimeout(() => {
        bloc.turnTimer = null;
        displayTurn(blocIdx, bloc.turnIdx);
        scheduleLifecycle(blocIdx, bloc.turnIdx, 0);
    }, CAUCUS_HOVER_IN_DELAY_MS);
}

function deactivateBloc(blocIdx) {
    const bloc = state.p2.caucus.blocs[blocIdx];
    setOtherBlocDim(blocIdx, false);
    if (bloc.turnTimer) { clearTimeout(bloc.turnTimer); bloc.turnTimer = null; }
    clearCaucusBubbleRef(bloc.currentBubble);
    bloc.currentBubble = null;
    clearCaucusBubbleRef(bloc.overlappingBubble);
    bloc.overlappingBubble = null;
}

function substituteLine(template, delegate, bloc) {
    // Find the Power-Del in this delegate's bloc (for {boss}).
    const powerInBloc = bloc.delegates.find(d => d.personality === "power");
    const demInBloc   = bloc.delegates.find(d => d.personality === "demboy");
    const boss = delegate.boss
        || (powerInBloc && powerInBloc.country)
        || "the bloc leader";
    const demboyCountry = demInBloc ? demInBloc.country : "";
    return template
        .replace(/\{country\}/g, delegate.country)
        .replace(/\{boss\}/g, boss)
        .replace(/\{demboyCountry\}/g, demboyCountry);
}

// ----- Caucus timer -----
function setupCaucusTimer(motion) {
    const p2 = state.p2;
    p2.speeches = { log: [], spokenSlots: new Set() };
    const sp = p2.speeches;
    const totalMin = motion.min;
    const startSec = totalMin * 60;

    sp.mode = "speaking";
    sp.phase = "pre";
    sp.caucusMode = true;
    sp.warning = null;
    sp.warningClicked = false;
    sp.gavelDownClicks = 0;
    sp.endingScheduled = false;
    sp.thudBubbles = [];
    sp.displayedSec = startSec;
    sp.startSec = startSec;
    sp.lastTick = performance.now();
    sp.zeroStartTime = 0;
    sp.warnThreshold = CAUCUS_WARN_THRESHOLD;
    sp.lateThreshold = CAUCUS_LATE_THRESHOLD;
    // Rate: (N-1) displayed minutes across 75 real sec.
    sp.preRate  = ((totalMin - 1) * 60) / CAUCUS_PRE_REAL_SEC;
    sp.warnRate = 60 / CAUCUS_WARN_REAL_SEC;
    if (sp.timerId) { clearInterval(sp.timerId); sp.timerId = null; }
    if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }
    sp.timerId = setInterval(tickSpeech, 50);
}

function renderCaucusDais(bar) {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp) return;
    const motion = p2.caucus && p2.caucus.motion;
    const minLabel = motion ? `${motion.min} min` : "";
    const wrap = document.createElement("div");
    wrap.className = "speech-dais";
    wrap.innerHTML = `
        <div class="speech-who">
            <div class="speech-who-label">UNMODERATED CAUCUS</div>
            <div class="speech-who-name">${minLabel}</div>
        </div>
        <div class="speech-timer-wrap">
            <div class="speech-timer-label">TIME</div>
            <div class="speech-timer" id="speech-timer" data-phase="${sp.phase}">${formatSpeechTime(sp.displayedSec)}</div>
        </div>
        <div class="gavel-wrap">
            <div class="thud-layer" id="thud-layer"></div>
            <button class="gavel-btn" id="gavel-btn" data-phase="${sp.phase}" data-warned="${sp.warningClicked ? "true" : "false"}">
                ${buildGavelInner(sp)}
            </button>
        </div>
    `;
    bar.appendChild(wrap);
    const gbtn = wrap.querySelector("#gavel-btn");
    if (gbtn) gbtn.addEventListener("click", onGavelClick);
}

// ----- End of caucus -----
function endUnmodCaucus({ gavelDown }) {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp) return;

    if (sp.timerId) { clearInterval(sp.timerId); sp.timerId = null; }
    if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }

    // Stop dialogue for both blocs.
    if (p2.caucus) {
        p2.caucus.blocs.forEach((_, i) => deactivateBloc(i));
        detachCaucusHoverListeners();
    }

    // Fire missed-gavel-down splash if applicable.
    if (gavelDown === "missed") {
        flashDaisMessage("Caucus ran over, no gavel-down.");
    }

    sp.finalGavelDown = gavelDown;

    // Brief pause before showing debrief so any active splash is legible.
    setTimeout(() => finishPhase3Debrief(), gavelDown === "missed" ? 1200 : 600);
}

function finishPhase3Debrief() {
    const p2 = state.p2;
    const sp = p2.speeches;
    const caucus = p2.caucus;

    // Bloc mistakes: -1 per bloc where guessIdx is null or wrong.
    let blocMistakes = 0;
    caucus.blocs.forEach(bloc => {
        const leaderDel = bloc.delegates.find(d => d.personality === bloc.leader);
        const leaderIdx = leaderDel ? delegateIndexOf(leaderDel) : -1;
        if (bloc.guessIdx == null || bloc.guessIdx !== leaderIdx) {
            blocMistakes++;
        }
    });

    // Timing mistake: any of missed warning / late warning / missed gavel-down.
    const warnMissed = sp.warning === "missed";
    const warnLate   = sp.warning === "late";
    const gavelMissed = sp.finalGavelDown === "missed";
    const timingMistake = (warnMissed || warnLate || gavelMissed) ? 1 : 0;

    const stars = Math.max(0, 3 - blocMistakes - timingMistake);

    const clauses = [];
    if (blocMistakes === 1) clauses.push("1 bloc leader missed or misread.");
    if (blocMistakes === 2) clauses.push("Both bloc leaders missed or misread.");
    if (warnMissed) clauses.push("Never gave the one-minute warning.");
    if (warnLate)   clauses.push("Gave the one-minute warning late.");
    if (gavelMissed) clauses.push("Caucus ran over, no gavel-down.");
    const summary = buildMultilineSummary(clauses, "A masterclass in caucus management.");

    // Update post-motions screen for Phase 3.
    const titleEl = document.querySelector("#post-motions-screen .phase-title");
    if (titleEl) titleEl.textContent = "Caucus Concluded";
    const flavorEl = document.getElementById("post-motions-flavor");
    if (flavorEl) {
        const mins = caucus.motion.min;
        flavorEl.innerHTML = `The <strong>${mins} minute unmoderated caucus</strong> concludes.`;
    }
    const starResult = document.querySelector("#post-motions-screen .star-result");
    if (starResult) starResult.style.display = "";
    renderStarBlock("phase2-stars", stars, summary);

    renderPostMotionsScreen("phase3");

    // Clean up caucus UI.
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("caucus-clickable", "leader-guess");
        s.removeEventListener("click", onCaucusDelegateClick);
    });

    showScreen("post-motions-screen");
}

// ==========================================================
//  POST-MOTIONS SCREEN CONFIG (v23 replaces v22 stub)
// ==========================================================
function renderPostMotionsScreen(phase) {
    const btn = document.getElementById("restart-btn");
    if (!btn) return;
    // Replace to purge any prior click handler.
    const fresh = btn.cloneNode(false);
    // preserve child text later; set inline text
    btn.parentNode.replaceChild(fresh, btn);
    fresh.id = "restart-btn";
    fresh.className = "big-button";

    if (phase === "phase2") {
        fresh.textContent = "Proceed to Unmods →";
        fresh.addEventListener("click", startPhase3);
    } else {
        // phase3 → adjourn & restart
        fresh.textContent = "Adjourn & Restart";
        fresh.addEventListener("click", () => location.reload());
    }
}

// ==========================================================
//  THUD AUDIO POOL
// ==========================================================
let _thudPool = null;
let _thudPoolIdx = 0;
let _thudPoolWarmed = false;
function initThudAudioPool() {
    if (!GAVEL_SOUND.thud) { _thudPool = null; return; }
    _thudPool = [];
    for (let i = 0; i < 6; i++) {
        try {
            const a = new Audio(GAVEL_SOUND.thud);
            a.preload = "auto";
            a.volume = 0.75;
            try { a.load(); } catch (e) { /* ignore */ }
            _thudPool.push(a);
        } catch (e) { /* ignore */ }
    }
    if (_thudPool.length === 0) _thudPool = null;
}

function warmUpThudAudioPool() {
    if (_thudPoolWarmed || !_thudPool) return;
    _thudPoolWarmed = true;
    _thudPool.forEach(a => {
        try {
            if (!a.paused) return;
            a.muted = true;
            const p = a.play();
            const finish = () => {
                try { a.pause(); a.currentTime = 0; a.muted = false; } catch (e) {}
            };
            if (p && typeof p.then === "function") {
                p.then(finish).catch(() => { a.muted = false; });
            } else {
                finish();
            }
        } catch (e) { /* ignore */ }
    });
}

function playThud() {
    if (!_thudPool || _thudPool.length === 0) return;
    const a = _thudPool[_thudPoolIdx];
    _thudPoolIdx = (_thudPoolIdx + 1) % _thudPool.length;
    try {
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) { /* ignore */ }
}

// ==========================================================
//  INPUT / EVENT WIRING
// ==========================================================
document.addEventListener("keydown", (e) => {
    if (document.getElementById("roll-call-screen").classList.contains("active")) {
        if (!state.awaitingInput) return;
        const k = e.key.toLowerCase();
        if (state.correctionAvailable && (k === "c" || k === " ")) {
            e.preventDefault();
            handleRollAction("__correction__");
            return;
        }
        if (k === "1" || k === "p") handleRollAction("present");
        else if (k === "2" || k === "v") handleRollAction("voting");
        else if (k === "3" || k === "a") handleRollAction("absent");
    }
});

document.getElementById("begin-btn").addEventListener("click", () => {
    playThud();
    warmUpThudAudioPool();
    generateCommittee();
    showScreen("briefing-screen");
});
document.getElementById("start-roll-call-btn").addEventListener("click", () => {
    playThud();
    startRollCall();
});
document.querySelectorAll("#action-row .action-btn").forEach(btn => {
    btn.addEventListener("click", () => handleRollAction(btn.dataset.action));
});
document.getElementById("correct-btn").addEventListener("click", () => handleRollAction("__correction__"));
document.getElementById("proceed-motions-btn").addEventListener("click", startPhase2);
// v22/v23 — #restart-btn handler is wired dynamically via
// renderPostMotionsScreen(phase). No static listener.

/* ============================================================
   DEV MODE — phase-skip panel
   ============================================================ */
function devAutoCompletePhase1() {
    state.delegates.forEach(d => {
        if (!d.present) {
            d.markedAs = "absent";
        } else {
            d.markedAs = PERSONALITIES[d.personality].expected;
        }
    });
    state.devSkippedPhase1 = true;
}

function devSkipTo(phase) {
    warmUpThudAudioPool();
    if (phase === 1) {
        startRollCall();
        return;
    }
    if (phase === 2) {
        devAutoCompletePhase1();
        startPhase2();
        return;
    }
    if (phase === 3) {
        devAutoCompletePhase1();
        // Fake a Phase 2 topic so caucus dialogue has a bucket.
        // (No prior Phase 2 speakersMotion exists on dev-skip.)
        // We set it up by calling startPhase3 with a stashed topic
        // via a transient state.p2 shell.
        state.p2 = { speakersMotion: { topic: pick(TOPICS) } };
        startPhase3();
        return;
    }
}

(function initDevPanel() {
    const panel = document.getElementById("dev-panel");
    if (!panel) return;
    if (!DEV_MODE) {
        panel.remove();
        return;
    }
    panel.classList.remove("hidden");
    panel.querySelectorAll("[data-dev-phase]").forEach(btn => {
        btn.addEventListener("click", () => {
            const phase = parseInt(btn.dataset.devPhase, 10);
            devSkipTo(phase);
        });
    });
})();

/* ============================================================
   DISRUPTIVENESS KEY — toggle behavior
   ============================================================ */
(function initDisruptivenessKey() {
    const btn = document.getElementById("key-toggle-btn");
    const popup = document.getElementById("key-popup");
    if (!btn || !popup) return;

    function openKey() {
        popup.classList.remove("hidden");
        btn.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
        btn.innerHTML = "Disruptiveness Key \u25B4";
    }
    function closeKey() {
        popup.classList.add("hidden");
        btn.classList.remove("active");
        btn.setAttribute("aria-expanded", "false");
        btn.innerHTML = "Disruptiveness Key \u25BE";
    }
    function toggleKey(e) {
        e.stopPropagation();
        if (popup.classList.contains("hidden")) openKey();
        else closeKey();
    }

    btn.addEventListener("click", toggleKey);

    document.addEventListener("click", (e) => {
        if (popup.classList.contains("hidden")) return;
        if (popup.contains(e.target) || btn.contains(e.target)) return;
        closeKey();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !popup.classList.contains("hidden")) {
            closeKey();
        }
    });
})();

// ---------- BOOT ----------
initThudAudioPool();
