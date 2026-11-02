/* ==========================================================
   POINT OF ORDER — Game Logic
   v49: Disruptiveness Key auto-opens/closes with the "check the Key"
        tutorial steps (index.html/style.css unchanged).
        - initDisruptivenessKey()'s openKey()/closeKey() pulled out to
          top-level openDisruptivenessKey()/closeDisruptivenessKey() so
          they're callable from outside that IIFE's closure; the toggle
          button, outside-click, and Escape handlers inside it now just
          call these same two functions, unchanged behavior.
        - showTutorial() now returns true if the step actually fired
          (shown or queued) and false on every no-op, so a call site can
          pair a one-time side effect with a step without re-deriving
          its own tutorialMode/tutorialSeen/phase5 guard.
        - The "ready_to_vote" button's click handler (Phase 2's "That is
          all the motions...", shared with Phase 4) now calls
          openDisruptivenessKey() whenever showTutorial() actually fires
          p2_disruptiveness or p4_intro — both tell the player to open
          the Key, so now it's already open when they read that.
        - selectMotionForVote() calls closeDisruptivenessKey() the
          instant a motion is actually put to a vote (Phase 2/3/4, same
          function all three share) — the other half, regardless of
          whether it was opened automatically or by hand.
        - Bugfix found while wiring the above: openDisruptivenessKey()
          called from a button OTHER than the Key's own toggle (the
          "ready_to_vote" button) had the exact same same-tick self-
          dismiss problem v46 fixed for tutorial popups — that same
          click bubbles to the Key's own outside-click-closes-it
          listener, which closed it the instant it opened. New
          state._keyJustOpened, same suppress-the-opening-click pattern
          as _tutorialJustShown, fixes it.
   v48: p1_intro repositioned (index.html/style.css unchanged).
        Was centered; now anchored to the dais bar ("— THE DAIS · YOU
        ARE HERE —", bottom of the room) with placement: "top" and a
        new gap: 0 on the step, so the popup's bottom edge sits flush
        against the dais bar's top edge instead of floating free.
        - positionTutorialPopup() gained an optional 4th param, gap
          (default 14, the same value every other step already used),
          read from job.step.gap — purely additive; every other step
          omits it and renders exactly as before. Viewport-edge
          clamping (now named edgeMargin) is unchanged and separate
          from this per-step gap.
   v47: Several small, surgical fixes (style.css v30→v31, index.html
        v18→v19). No redesign of the tutorial engine, the Gavel-
        selection flow, or the global debrief beyond what's listed here.
        1. New clearTutorial(): unlike dismissTutorial() (player-driven,
           promotes whatever's queued next), this forcibly hides the
           popup AND drops the queue — for phase boundaries, so nothing
           from the phase that just ended can bleed into the next one.
           Called at the top of startPhase2()/startPhase3()/
           startUnmodCaucus()/startPhase4()/startPhase5Stage1()/
           showGlobalDebrief(). The prior pass's same-tick-queue fix for
           p3_intro/p3_timer (startUnmodCaucus()) is untouched and still
           holds.
        2. p1_intro no longer overrides its target to the first roll-
           call seat (was overlapping the chair's dialogue line); now
           always centered, matching its null targetSelector.
        3. Five trigger points moved to fire after the button click that
           actually produces what they describe, not on screen/stage
           entry (targets re-verified at each new site, selectors
           adjusted where the old one no longer existed there):
           - p2_intro: startPhase2() -> end of handleCallForMotions()
             (target ".chair-prompt-btn" -> ".delegate-seat.raised").
           - p2_disruptiveness / p4_intro: handleAcceptMotion()'s first-
             motion-on-the-agenda moment -> the "ready_to_vote" stage's
             "That is all the motions..." button's click handler.
           - p4_papers: enterStage2Paper() -> the stage2_reading
             button's click handler.
           - p4_amendment moved EARLIER instead: handleAmendmentDeclaration()
             (after the verdict was already announced) -> the
             stage4_declaring case's render (the instant its button
             appears), so the player is informed before making the call.
        4. New step "p5_intro", fired once at startPhase5Stage1() entry.
        5. The Gavel stage's always-visible dais prompt (renderMotionsDais()'s
           "phase5_best_delegate" case) is now minimal ("Select a
           delegate for the Gavel."); the full ceremonial sentence moved
           into new step "p5_gavel", fired at startPhase5BestDelegate(),
           shown only when tutorial mode is on. Neither duplicates the
           other. Both new steps carry allowInPhase5: true — showTutorial()'s
           blanket Phase-5-gets-no-tutorials guard now checks that flag
           per step instead of blocking Phase 5 outright, since these
           two are the only Phase 5-specific content that should ever
           show there.
        6. Bloc-leader memory badges on the Gavel-selection screen: new
           state.phase3BlocGuesses/phase5BlocGuesses (raw guessIdx
           values, right or wrong), stashed by finishPhase3Debrief() in
           both its real-Phase-3 and Phase-5-Stage-2 branches at the
           exact point it already reads bloc.guessIdx for scoring, before
           anything later could touch it again. startPhase5BestDelegate()
           applies new .bloc-guess-p3/.bloc-guess-p5 classes (small
           corner tags, same gold family as .leader-guess, style.css) to
           any matching seat. Reference only; never restricts the actual
           pick.
        7. Gavel-selection seats also get the "raised" class purely for
           its existing hover glow (.delegate-seat.raised:not(.active):hover
           in style.css) — reuses that rule verbatim, no new CSS, no
           change to onBestDelegateSeatClick()'s click/selection logic.
        8. Chair Award button (#chair-award-btn) is now a real <button>,
           always visible, enabled only when every entry in
           state.phaseStars reads exactly 3 (same perfect check as
           before). Disabled (not hidden) otherwise, with
           .chair-award-btn:disabled's greyed-out look (style.css) and an
           updated non-perfect message. On a perfect session, a new
           screenshot reminder (#global-debrief-screenshot-hint) appears
           beside it. Its own static click listener calls
           window.open(CHAIR_AWARD_FORM_URL, "_blank") — entirely
           separate from #global-restart-btn's reload listener, so
           clicking it can never reload or reset the game. URL updated
           to https://forms.gle/opNfNUkK4ceyA7nJ8.
   v46: Tutorial popup bugfix pass (style.css v29→v30, index.html v17→v18).
        No change to game logic, scoring, or the asset-swap architecture.
        - Root cause (not what the original bug report guessed): every
          "broken" step fires showTutorial() synchronously from inside a
          click handler (the exact click that raises a placard, accepts a
          motion, etc.). That same click then bubbles up to document,
          where the existing "click outside closes it" listener was
          dismissing the popup that same tick, before it was ever
          painted. The 3 steps that already "worked" (p1_correction,
          p2_speaker_select) only did because their showTutorial() call
          sits behind an await/setTimeout, outside the triggering click's
          own dispatch — not because their call sites were better placed.
          A full audit of all 13 call sites found every targetSelector
          already correctly placed after the DOM render that creates it;
          none needed moving.
        - Fix: new state._tutorialJustShown, set by renderTutorialStep()
          the instant it shows a popup and cleared on the very next tick
          (setTimeout(fn, 0)). The outside-click listener
          (initTutorialOverlay()) now skips dismissal while it's true —
          suppressing exactly the one triggering click, never a genuine
          later one. This also fixes Phase 3's p3_intro/p3_timer
          sequencing (bug report's Bug 3): once the self-dismiss bug no
          longer fires on the triggering click, the existing same-tick
          queue in showTutorial() (unchanged) already defers p3_timer
          until the player's next real click dismisses p3_intro — no new
          engine mechanism needed, and p3_timer still fires immediately
          on its own trigger if p3_intro was already seen.
        - renderTutorialStep() also now console.warn()s and falls back to
          a centered popup if a configured targetSelector ever matches
          nothing at trigger time (previously silent; this path wasn't
          actually the cause of any of the 10 broken steps, since all of
          them checked out as reachable with valid, already-rendered
          targets — see Bug 2 below — but it's cheap insurance against a
          future one).
        - Bug 2 findings: p4_intro/p4_papers/p4_amendment's showTutorial()
          calls do exist in code reachable during Phase 4 (handleAcceptMotion()'s
          p2.votingMode branch, enterStage2Paper(), handleAmendmentDeclaration()
          — all three run for Phase 4 same as Phase 2/3), and "p4_intro"/
          "p2_disruptiveness" are distinct ids in TUTORIAL_STEPS, each with
          its own independent tutorialSeen entry. Neither hypothesis in
          Bug 2 held; both suffered from the same self-dismiss bug as
          everything else, fixed above.
        - Copy: "Associate Chair" -> "Assistant Chair" (TUTORIAL_STEPS'
          p2_intro text; index.html's agenda-panel heading).
   v45: Phase 5 Stage 4 reframed as "the Gavel" (copy only — no change to
        confirmBestDelegate()/bestDelegateCorrectIdx()/the data model);
        new state.phaseStars tracking each phase's own real star result;
        a new global, whole-session debrief shown after Phase 5's own
        (style.css v28→v29, index.html v16→v17).
        - renderMotionsDais()'s "phase5_best_delegate" case: the
          bestDelegateIdx-null prompt now reads "Before you adjourn, the
          committee awards the Gavel, its highest honor, to the Best
          Delegate. Who do you recognize?" and the confirm button now
          reads "Award the Gavel" (was "Confirm"). The other branch's
          "[country] selected for Best Delegate." status, the debrief's
          "Misidentified Best Delegate." clause, and the "Overall"
          heading are all unchanged.
        - New state.phaseStars = { p1..p5: null }, set at the exact
          point each phase's own real debrief computes its stars —
          computeAndShowScore() (Phase 1), and the normal (non-Phase-5)
          branch only of finishPhase2()/finishPhase3Debrief()/
          finishPhase4()/showPhase5CombinedDebrief(). A phase reached
          only via a dev-panel skip leaves its entry null forever, by
          design — see showGlobalDebrief() below.
        - New #global-debrief-screen (index.html) + showGlobalDebrief()/
          buildGlobalDebriefRow()/GLOBAL_DEBRIEF_PHASES: five rows
          reading straight from state.phaseStars (a null entry shows
          "Not Played"), a perfect-session check (`every(s => s === 3)`,
          so a null entry fails it same as any other non-3 value), and
          either the Chair Award link+banner or a "replay until perfect"
          message. renderPostMotionsScreen("phase5")'s button now reads
          "Next →" and calls showGlobalDebrief() instead of reloading
          the page directly; the new screen's own "Adjourn & Restart"
          button is the actual terminal action now.
        - Title screen flavor text swapped (index.html only, no JS
          change): "Get 3 stars in every phase of committee to win!"
   v44: Interactive, skippable tutorial overlay for Phases 1-4 (style.css
        v27→v28, index.html v15→v16). Additive only: no game logic,
        scoring, or the DELEGATE_ART/GAVEL_ART/GAVEL_SOUND asset-swap
        architecture changed. Phase 5 ("Timed Crisis") gets no tutorial
        content at all, since it's a dev-only speed-run of mechanics
        the tutorial already covered in Phases 1-4.
        - New TUTORIAL_STEPS config array (13 steps, text authored in
          DESIGN.md's spec): { id, text, targetSelector, placement }.
          targetSelector is resolved fresh at trigger time via
          querySelectorAll, since most targets (a raised placard, a
          specific seat, whichever button the dais currently shows)
          don't exist when this file loads; a few steps pass a
          call-time selector override instead (the first roll-call
          seat, a paper's two sponsor seats) since those depend on that
          session's committee.
        - New state.tutorialMode (bool, default true) and
          state.tutorialSeen (session-scoped Set, default empty — reset
          to defaults on page load/restart, same as every other piece
          of session state).
        - New showTutorial(id, targetSelector?): no-ops unless
          tutorialMode is on, the step hasn't been seen this session,
          and state.phase5 isn't active. That Phase 5 check lives here,
          once, instead of at each of the 13 call sites below — every
          one of those sites is a function Phase 5 also reuses
          verbatim, so checking there would mean repeating the same
          guard 13 times. Highlights the resolved target(s) with
          .tutorial-highlight, positions #tutorial-popup near them (or
          centered if there's no target, or placement is "center"),
          and queues same-tick duplicate triggers (e.g. Phase 3's caucus
          huddles finishing and its timer starting both fire from
          startUnmodCaucus() in one call) instead of letting a later
          one silently overwrite an earlier one nobody's seen yet.
          dismissTutorial() (wired to the new "Got it" button and to
          any click outside the popup — non-blocking, the real UI
          underneath is always clickable without dismissing first)
          clears the highlight and shows the next queued step, if any.
        - One showTutorial(...) line added at each of the 13 trigger
          points from DESIGN.md's spec, inside startRollCall()/
          nextRollCall() (Phase 1), startPhase2()/handleAcceptMotion()/
          renderMotionsDais()'s dilatory branch/enterRound1()/
          beginSpeech()/enterRound2() (Phase 2), startUnmodCaucus()
          (Phase 3), and handleAcceptMotion()/enterStage2Paper()/
          handleAmendmentDeclaration() (Phase 4). No other line in any
          of those functions changed.
        - New briefing-screen checkbox, "Show tutorial tips" (checked
          by default), wired directly to state.tutorialMode with no
          persistence, matching DESIGN.md §11's existing "Persistence:
          None." No dev-panel changes.
   v43: Phase 5, "Timed Crisis," is now reachable in regular play (style.css
        unchanged from v27, index.html unchanged from v15). Phase 4's
        debrief button ("phase4" case in renderPostMotionsScreen()) used
        to read "Adjourn & Restart" and end the game; it now reads
        "Proceed to Timed Crisis →" and calls startPhase5Stage1()
        directly, the same way "phase2"/"phase3"'s own debrief buttons
        already hand off into the next phase. Phase 5's own machinery
        (state.phase2WinningType, state.phase3Blocs, the priorCaucus
        bucket exclusion) already supported being entered after a real
        Phase 2→3→4 run — only the post-Phase-4 button was ever wired to
        end the game instead. The dev panel's "5 · Timed Crisis" entry is
        unchanged and still skips straight there for testing.
   v42: Phase 5 gains a Best Delegate stage, inserted right after Stage
        3 (voting procedure) resolves and right before the combined
        debrief (style.css unchanged from v27, index.html unchanged
        from v15). See DESIGN.md's Phase 5 section for the full spec.
        - Bugfix folded in: Phase 5's Stage 2 (unmod caucus) used to
          call assignBlocs() fresh, exactly like a real Phase 3 —
          re-rolling the bloc split AND the leader coin-flip every
          time, so Phase 5's bloc leadership could silently differ
          from the real Phase 3 earlier in the same session. New
          top-level state.phase3Blocs is now set once by the real
          Phase 3's own startUnmodCaucus() call; Phase 5's Stage 2
          reuses those exact bloc objects (same delegates, same
          leader) instead, so "the CarolinaMUN-style delegate who led
          a bloc" means the same individual delegate everywhere in the
          session. Falls back to a fresh assignBlocs() call (and
          stashes THAT as the reference) only if Phase 3 never
          actually ran — the dev-skip-to-5 case. The reused bloc
          objects' per-instance scratch fields (script/turnIdx/
          currentBubble/etc., already reset every startUnmodCaucus()
          call) now also reset guessIdx, which the old code left
          alone — reusing a bloc object without that would have opened
          Phase 5's leader-guess UI already showing Phase 3's old
          guess.
        - New startPhase5BestDelegate(): reuses #motions-screen/
          #motions-dais-bar, skipping initPhase2State() entirely (no
          need for a fresh state.p2, just p2.stage +
          p2.bestDelegateIdx). Room stays in normal seating — Stage 3
          never re-enters bloc-huddle mode, so no extra render is
          needed. New onBestDelegateSeatClick() wires every present
          delegate's seat; clicking moves a single .leader-guess glow
          (Phase 3's exact visual treatment, reused verbatim, no new
          CSS) rather than adding to a set. New case
          "phase5_best_delegate" in renderMotionsDais() shows the
          prompt, then a "Confirm" button (new daisButton, "proceed"
          class) only once a delegate is selected.
        - New bestDelegateCorrectIdx(): the CarolinaMUN-style delegate
          from whichever of state.phase3Blocs has leader === "carolina".
          New confirmBestDelegate() compares the pick against it,
          setting state.phase5.bestDelegateMistake, then hands off to
          showPhase5CombinedDebrief() (now called from here instead of
          directly from finishPhase4()'s Phase 5 branch).
        - showPhase5CombinedDebrief() gained a 4th "Overall" heading,
          folded into the same totalMistakes sum, showing only
          "Misidentified Best Delegate." when bestDelegateMistake is
          true — the only clause that heading ever shows.
   v41: Phase 5, "Timed Crisis" (style.css v26→v27, index.html v14→v15).
        Phases 2, 3, and 4's mechanics run back to back to back — no
        debrief or transition screens in between, one combined 3-star
        debrief at the very end. Reuses the same committee (no re-roll).
        See DESIGN.md's Phase 5 section for the full spec.
        - New state.phase5 (null outside Phase 5) and
          state.phase2WinningType (set once, only by the real Phase 2's
          own debrief resolving — Phase 5's own Stage 1 reuses
          finishPhase2() but always takes its early-return branch first,
          so it never sets this).
        - Topic: one forced bucket for the whole phase
          (state.phase5.topicBucket), picked once in
          startPhase5Stage1() excluding whichever bucket Phases 2/3/4
          used. New pickMotionTopic() constrains every Stage 1 mod/RR
          motion's topic to that bucket; startUnmodCaucus()'s bucket
          derivation uses it directly for Stage 2 (bypassing the usual
          winning-motion-topic derivation); Stage 3 inherits it
          automatically through the existing priorCaucus stash, no
          separate override needed.
        - Stage 1 (mod caucus, reused Phase 2 machinery): new
          generateMotion() branches suppress slacker's unmod default
          (mod/RR 50/50 instead) and Dem-Boy's guaranteed correction
          (never set in Phase 5); Power-Del's Round 2 repeat-trap is
          untouched, since speaker selection is fully generic and
          needed no changes. New handleCallForMotions() branch raises
          exactly 3 (not Phase 2's 5, all required — Phase 3/4's more
          reliable coverage pattern), pre-assigning one a
          _forcedMotionType via new state.phase5.stage1TargetType (the
          type OPPOSITE state.phase2WinningType, coin-flipped if unset).
          New handleCallFavor() branch rigs the vote directly off
          motion.type against that target — same trust-the-rig pattern
          as Phase 4 Stage 1's amendment rig.
        - Stage 2 (unmod caucus, reused Phase 3 machinery): unchanged
          mechanically, only the forced topic bucket above.
        - Stage 3 (voting procedure, reused Phase 4 machinery):
          unchanged mechanically except beginStage4() now forces
          friendly: true for both papers, skipping the unfriendly path
          entirely (same as Phase 4's normal friendly path).
        - No screens between stages: finishPhase2()/finishPhase3Debrief()/
          finishPhase4() each gained an early-return branch (checked
          state.phase5.active) that stashes that stage's mistake tally
          into state.phase5.mistakes and calls the next stage's start
          function directly, instead of ever touching
          #post-motions-screen. New startPhase5Stage1()/2/3() mirror
          startPhase2()/startPhase3()/startPhase4()'s entry boilerplate
          closely, just updating the phase label text and never wiping
          state.phase5 (which lives outside state.p2 specifically so
          initPhase2State()'s wipe between stages can't touch it).
        - New showPhase5CombinedDebrief(), called once after Stage 3
          resolves: sums all three stages' already-computed mistake
          totals (each stage's own unchanged internal formula — Stage
          1/3 uncapped per-category, Stage 2 its bloc-guess +
          single-capped-timing-category rule) into one
          stars = max(0, 3 - totalMistakes) scale, reusing
          renderStarBlock("phase2-stars", ...) with a new grouped
          summary (three headings — Moderated Caucus / Unmoderated
          Caucus / Voting Procedure — each only its own nonzero
          clauses, new .mistake-heading style in style.css v27).
        - Dev panel: "5 · Timed Crisis" enabled (index.html v15,
          replaces the old disabled "5 · Debrief" placeholder).
          devSkipTo(5) auto-completes Phase 1 then calls
          startPhase5Stage1() directly — Stage 1 needs no faked bloc/
          caucus data at all (Stage 2's own startUnmodCaucus() builds
          fresh blocs when IT runs), unlike Phases 3/4's dev-skips.
   v40: Phase 4 full scoring implemented (disruptiveness pick, repeat
        speaker, recognition misclick, speech timing), new Phase 4-
        specific Disruptiveness Key, Phase 4 now ends with a real
        debrief instead of a placeholder (style.css v25→v26,
        index.html v13→v14). See DESIGN.md §8.11 for the full spec.
        - New votingDisruptivenessRank(motion) — [amendVal, seconds,
          orderVal] tuple, amendment status first. disruptivenessRank()'s
          "voting" branch now just calls it; Phase 2/3 motions never
          reach that branch, so their ranking (unmod/rr/mod) is
          byte-for-byte unchanged. Used automatically by the existing
          compareDisruptiveness()/mostDisruptiveUnresolvedIdx()/
          p2.orderPicks machinery Stage 1 already shared with Phase 2/3
          — no new plumbing needed for the "wrong disruptiveness pick"
          mistake category.
        - New Phase 4 Disruptiveness Key: #key-popup now holds two
          static .key-rows blocks (index.html), #key-rows-p23 (Phase
          2/3's, untouched) and #key-rows-p4 (new — Voting Procedure
          tier on top with its 3 sub-rules in a new .voting-explain/
          .voting-rule format mirroring .mod-explain/.mod-example
          exactly, then Unmod/RR/Mod/Speaker's List in their existing
          order, no Adjourn/Suspend row). initDisruptivenessKey()'s
          openKey() picks which to show, fresh each open, from
          state.p2.votingMode.
        - New checkAvoidableRepeatSpeaker(paper, kind, arr), called
          from onDelegateClickForStage2()'s completion branch: a no-op
          unless processingIdx === 1 (paper 2). Each bloc's pool is
          shared between paper 1's role and paper 2's opposite role
          (forGroup/againstGroup swap which bloc they draw from between
          the two papers), so the sibling paper's matching array is
          always kind === "for" ? sibling.againstSpeakers :
          sibling.forSpeakers. Flags a mistake when an unused pool
          member existed and the player picked 2 already-used
          delegates instead — p2.stage2.repeatSpeakerMistakes, capped
          at 2 by construction (one per bloc).
        - Recognition misclick + speech timing needed zero new
          tracking: Stage 3 already writes into the shared
          p2.speeches.log exactly like Phase 2's speeches do, and (v39)
          that log was never cleared between papers, so it already
          held all 8 speeches' entries by the time paper 2 concluded.
        - finishPhase4() rewritten from the v38 placeholder into a real
          debrief: Phase-2-style formula (uncapped, floor 0) summing
          the 4 categories above, renderStarBlock("phase2-stars", ...)
          + buildMultilineSummary() (same shared star-block Phase 2/3
          already retitle/repopulate), new
          renderPostMotionsScreen("phase4") case wiring #restart-btn to
          "Adjourn & Restart" (replaces the v38 "phase4done" disabled
          case) — the true end of the built game for this pass.
   v39: Bugfix — paper 2's speakers panel opened with every name already
        struck through (style.css/index.html unchanged from v24/v13).
        - Root cause: startSpeechesRound() only builds a fresh
          p2.speeches object (with an empty spokenSlots Set) the FIRST
          time it's ever called; on every later call it just resets the
          per-speech transient fields (currentSlot, mode, timer state,
          etc.) and leaves log/spokenSlots alone, since Phase 2's
          round1 -> round2 transition needs both to keep accumulating
          across one continuous speakerOrder. beginStage3Speeches()
          calls it once per paper, though, and slot indices 0-3 mean a
          different set of 4 people each time — so paper 2's session
          inherited paper 1's spokenSlots {0,1,2,3} and every name
          rendered .spoken (crossed out) via
          buildStage2SpeakerSlot()/renderStage2SpeakersPanel() before
          anyone had spoken. Purely a visual bug; recognition/timer/
          gavel/scoring were unaffected (spokenSlots is display-only —
          endCurrentSpeech()'s sp.log entries, which are what any
          future debrief would read, were already keyed and pushed
          correctly regardless).
        - Fix: beginStage3Speeches() now explicitly resets
          p2.speeches.spokenSlots to a fresh Set right after calling
          startSpeechesRound(), every time it runs. log is left alone
          (still accumulates across both papers), since only
          spokenSlots drives the strikethrough rendering.
   v38: Phase 4 Stage 4 — amendment period + paper vote, for both
        papers, then a genuine Phase 4 dead end (style.css/index.html
        unchanged from v24/v13). Phase 4 now runs start to finish
        procedurally, with no scoring yet. See DESIGN.md §8.10.
        - Runs after a paper's 4 speeches conclude: new beginStage4()
          replaces the old dead-end finishStage3Paper1() (removed) as
          the "Conclude speeches" button's handler. Skips the whole
          amendment section straight to the paper vote when
          state.p2.stage2.motion.amendment is false; otherwise starts
          with the announcement.
        - Announcement (stage4_announcing_timer): narrative-only
          button, "I will now start the {AMENDMENT_PERIOD_SECONDS}
          second timer...". No real countdown. On click,
          beginAmendmentAnnouncementAnimation() slides the OPPOSING
          bloc's leader (new otherBlocForPaper()) to
          STAGE4_CENTER_POS and back via plain seat.style.left/top
          writes — reuses .delegate-seat's existing 0.6s left/top CSS
          transition verbatim, the same mechanism Phase 3's
          animateIntoBlocs() uses, no new CSS.
        - Submission + declaration (stage4_reading_amendment,
          stage4_declaring): "amendment submitted by {submitter}",
          then "friendly or unfriendly?". Friendliness is fixed by
          processing order, not randomized: handleAmendmentDeclaration()
          sets it from p2.stage4.friendly = (processingIdx === 0),
          matching the same "paper 1"/"paper 2" convention Stage 2/3
          use. Both of the paper's sponsors (new shared paperSponsors()
          helper, factored out of Stage 2's reading-button logic) get a
          matching "Friendly"/"Unfriendly" speech bubble.
        - Amendment vote (unfriendly path only): new
          handleAmendmentCallFavor()/handleAmendmentCallOppose(), a
          self-contained favor/oppose vote loop (2/3 majority,
          Math.ceil) — NOT the existing motionsCollected-shaped
          calling_favor/calling_oppose/handleCallFavor/handleCallOppose
          machinery, since that path reverse-engineers a target pass/
          fail first and doesn't support forcing specific delegates to
          specific sides. Every present delegate votes randomly except
          the submitter (always favor) and the paper's two sponsors,
          the ones who declared it unfriendly (always oppose). No
          abstentions. Purely procedural — the verdict has no effect
          on the paper vote that follows.
        - Paper vote (always runs): same self-contained shape,
          handlePaperCallFavor()/handlePaperCallOppose(), simple
          majority. Every present delegate votes randomly except the
          paper's two sponsors (always favor). No abstentions. Verdict
          announced narratively, doesn't branch the flow either way.
        - advanceAfterPaperVote(): after paper 1's (first-processed)
          vote, re-enters the exact same Stage 2 entry point
          (enterStage2Paper(1)) to run the whole Stage 2 -> 3 -> 4
          cycle again for paper 2 — beginStage4() is fully generic
          over processingIdx, so no paper-2-specific code path was
          needed anywhere in this stage. After paper 2's vote, new
          finishPhase4() is a genuine dead end: reuses
          #post-motions-screen (title, flavor line, .star-result
          hidden — same pattern every prior Phase 4 stub used), new
          renderPostMotionsScreen("phase4done") case (disabled
          "Phase 4 scoring is the next build step." button, replaces
          the v34 "phase4stage3" case since there's no next stub left
          to name).
   v37: Bugfix — rapid double-click on the mod-correction/dilatory
        button during Phase 2 motion proposition could corrupt a
        motion's `min` field to `undefined`, soft-locking speaker
        selection once it passed (style.css/index.html unchanged from
        v24/v13).
        - Root cause: handleDilatory()/handleModCorrection() defer
          their actual p2.stage change 500ms behind a setTimeout, but
          leave the triggering .chair-prompt-btn live/clickable in the
          DOM the whole time (renderMotionsDais(), which would remove
          it, doesn't run until the timeout fires). A second click
          inside that window re-ran handleModCorrection() while
          del._pendingMotion had already been overwritten by the first
          click's corrected motion (which has no .correctedMin field),
          so generateCorrectedMotion()'s rMin read back undefined —
          producing a written motion like "Belgium undefined 45
          Regional" and, once voted through, an undefined
          speakerCount() (NaN) that stalled speaker selection.
        - Fix: new p2.motionTransitioning flag (reset in
          initPhase2State()), set the instant either handler is
          entered and cleared only inside its own setTimeout callback.
          A second click during the 500ms window is now a no-op in
          both handlers; the original single-click timing/behavior is
          unchanged.
   v36: Stage 3 speakers-panel highlighting + Phase 2 Round Robin skip
        button (style.css/index.html unchanged from v24/v13).
        - Stage 3's #speakers-list For:/Against: slots now get the
          exact same current-speaker/active-speaker/spoken highlighting
          Phase 2's renderSpeakersList() already applies, instead of
          just showing static names. renderStage2SpeakersPanel() maps
          each name's LOCAL for/against index to its GLOBAL
          p2.speakerOrder slot (forSpeakers[i] -> i*2,
          againstSpeakers[i] -> i*2+1, matching beginStage3Speeches()'s
          fixed order) and passes it into buildStage2SpeakerSlot(),
          which adds .current-speaker/.active-speaker while that slot
          is being recognized/spoken and .spoken once it's done —
          reusing the existing .speakers-list li.* CSS verbatim, no
          new styles needed. Only active when p2.stage ===
          "stage3_speeches"; Stage 2's selection-time rendering is
          unaffected.
        - New Round Robin skip: from the 4th speaker onward
          (sp.currentSlot >= 3) in an RR speech loop, the "speaking"
          dais gains a button in the exact spot Phase 3's caucus
          fast-forward button occupies (first child of the
          .speech-dais flex row, reusing its .caucus-ff-btn styling
          verbatim). Clicking it (new autocompleteRRSpeeches()) marks
          every remaining slot spoken with no sp.log entry — so
          debrief scoring just has fewer graded speeches, never a
          fabricated "perfect" pass and never a penalty for skipping —
          then jumps straight to sp.mode = "done", landing on the same
          "Conclude speeches" button a manually-completed RR reaches.
          Not pressing it changes nothing: the player can still click
          through every remaining speaker exactly as before. Gated on
          p2.speakersMotion.type === "rr", which also keeps it from
          ever appearing during Stage 3 speeches (motion.type
          "voting").
   v35: Every paper-name mention in Stage 2/3 chair buttons and Stage 3
        speeches is now bolded (style.css/index.html unchanged from
        v24/v13).
        - The stage2_reading dais button now wraps ${paper.name} in
          <strong>, matching the sponsor-country bolding it already
          had.
        - showSpeechBubble() gained an isHTML param (default false);
          beginSpeech() passes true only for stage3 speeches
          (sp.roundKey === "stage3"), so SPEECH_CONTENT's <strong>
          tags actually render instead of showing as literal text —
          every other caller (roll call responses, motions, generic
          Phase 2 speech lines, caucus dialogue) keeps using
          .textContent, unaffected.
        - substituteStage3Line()'s {paperName} replacement now wraps
          its substitution in <strong> too, for forward-compat with
          any future line that uses it (unused by current content).
        - SPEECH_CONTENT: wrapped every literal in-line mention of a
          paper's own title in <strong> (only the Carolina-role joke
          lines name a paper by its literal title; other roles refer
          to "this paper"/"my paper" generically and were left alone).
   v34: Phase 4 Stage 3 — for/against speeches for paper 1, wired to
        authored content (style.css/index.html unchanged from v24/v13).
        Amendments, the vote, and paper 2 are still not part of this
        pass — see DESIGN.md §8.9.
        - Speaking order is fixed from the paper's already-picked
          arrays, no new selection UI: forSpeakers[0] ->
          againstSpeakers[0] -> forSpeakers[1] -> againstSpeakers[1].
          onDelegateClickForStage2's completion branch now calls
          beginStage3Speeches() once against-speakers fill, instead
          of the old dead-end finishStage2FirstPaper() (removed).
        - beginStage3Speeches() sets p2.speakerOrder to that 4-long
          order, p2.speakersMotion to state.p2.stage2.motion (so the
          existing speechSecondsForMotion() picks up its `seconds`
          field), then reuses startSpeechesRound({start:0,end:3}) and
          applyRecognitionHighlight() verbatim — same seat-click
          recognition, timer, and gavel-discipline loop Phase 2's mod/
          RR speeches already use. New "stage3_speeches" p2.stage
          value routes renderMotionsDais() to the existing
          renderSpeechDais(bar); a small `sp.roundKey === "stage3"`
          check inside beginSpeech() swaps in drawStage3SpeechLine()
          instead of the generic drawSpeechLine() pool, and
          renderSpeakersList() now defers to renderStage2SpeakersPanel()
          for this stage so the For:/Against: sidebar built in Stage 2
          isn't clobbered by the generic speakers-list renderer.
        - New SPEECH_CONTENT table (phase4_speech_content.md,
          transcribed verbatim): keyed by topic bucket, then paper
          leader ("power"/"carolina" — which paper is on the floor),
          then side ("for"/"against"), then speaker role (their
          personality: "power"/"demboy"/"carolina"). Because each
          paper's own leader is baked into the key, the right Power-
          Del variant (leading/dominant vs. non-leading/sloppy-
          pivoting) and Dem-Boy variant (glazes-boss vs. empowered)
          falls out automatically from paper.leader + the speaker's
          own personality — no extra role-branching logic needed.
          drawStage3SpeechLine() derives for/against from the slot's
          parity (even = for, odd = against), matching the fixed
          speaking order.
        - New substituteStage3Line(): extends the existing
          {country}/{boss} placeholder convention (substituteLine())
          with {carolinaLeadCountry} and {paperName}, per the content
          file's placeholder list. {boss} always resolves to the
          power-led bloc's Power-Del's country (looked up fresh from
          state.p2.stage2.papers, not the speaker's own .boss field),
          since it must resolve correctly even for a Dem-Boy reading a
          non-glazing (empowered) line.
        - finishStage3Paper1(): reuses the exact placeholder pattern
          the old finishStage2FirstPaper() used (title, flavor line,
          .star-result hidden, disabled restart-button dead end) —
          just one step later now that Stage 2's completion flows
          straight into these speeches instead of stopping. New
          renderPostMotionsScreen("phase4stage3") case replaces the
          old "phase4stage2" case; button copy bumped to "Stage 4
          (amendments + vote) not yet built." since these speeches now
          occupy the "Stage 3" slot in the stage numbering.
        - No debrief scoring for this pass: sp.log keeps recording
          each speech's warning/gavel/misclick outcomes exactly as
          Phase 2's speeches do (untouched code path), so a future
          debrief stage can read it, but nothing here computes stars.
   v33: Phase 4 Stage 2 — directive reading + for/against speaker
        selection for paper 1 only (style.css v24, index.html
        unchanged from v13). Amendments, voting, and paper 2 are NOT
        part of this pass — see DESIGN.md §8.8.
        - Replaces the old Stage 1 dead end (showVotingStage1Placeholder,
          removed): handlePassProceed's votingMode branch now calls
          startPhase4Stage2(motion) once an amendment-bearing motion
          passes, instead of stopping at a placeholder immediately.
        - New PAPER_NAMES table, keyed by the same 4 topic buckets
          Phase 3's caucus dialogue uses.
        - buildStage2Papers(motion): builds two paper objects from
          Phase 3's blocs. Submission order is fixed (Bloc A = paper
          index 0, Bloc B = paper index 1); the motion's order/reverse
          field only determines PROCESSING order (which one is read
          first), stored separately as processingOrder.
        - state.p2.priorCaucus: startPhase4() now stashes
          state.p2.caucus (blocs + topicBucket) before
          initPhase2State() wipes it, mirroring startPhase3()'s
          priorTopic stash. devSkipTo(4) fakes a minimal caucus shell
          via assignBlocs() directly, since a fresh dev-skip has no
          real Phase 3 state to pull from (mirrors Phase 3's dev-skip
          faking a topic bucket).
        - Per-paper flow (new p2.stage values: stage2_reading,
          stage2_announcing_for, stage2_selecting_for,
          stage2_announcing_against, stage2_selecting_against):
          golden "read the paper" button -> gold dilatory-style "2
          for" button -> click-2-of-3 selection (slacker excluded)
          -> gold dilatory-style "2 against" button -> click-2-of-3
          selection from the OTHER bloc. New
          applyStage2RaisePool()/clearStage2RaisePool()/
          onDelegateClickForStage2() mirror the existing mod
          speaker-selection click pattern (buildRound1RaisePool/
          applyRaisePool/onDelegateClickForSpeaker) but write into
          paper.forSpeakers/againstSpeakers by first-empty-slot, which
          preserves click order (forward-compat requirement: speech
          order is derived from array position later, never
          re-derived).
        - The motions agenda (#agenda-list) is left alone through Stage
          2 — it keeps showing the 3 motions with pass/fail styling
          exactly like Phase 2's does, never cleared or replaced.
          For/against selection instead reuses the existing
          #speakers-panel/#speakers-list sidebar (the same one Phase
          2's mod speeches populate): new renderStage2SpeakersPanel()
          puts the paper name in the existing #speakers-motion-label
          slot, then a "For:" subsection once selection for it has
          started (paper._forStarted), then "Against:" once that's
          started, each independently numbered 1./2. — written
          explicitly per slot rather than via the shared CSS counter,
          since a counter-reset on the subheader row didn't actually
          restart the count for later siblings in testing. Slots fill
          progressively as each pick is made,
          reusing the panel's existing .just-filled flash animation.
        - finishStage2FirstPaper(): stops after the first paper in
          PROCESSING order (not necessarily Bloc A's paper — "paper
          1" in the forward-compat notes means "whichever paper
          processes first") has both for/against speakers picked.
          Reuses #post-motions-screen with .star-result hidden (no
          scoring yet) and a new renderPostMotionsScreen("phase4stage2")
          case: disabled dead-end button, "Stage 3 (amendments +
          vote) not yet built." (replaces the old "phase4stage1"
          case's "Stage 2 (Q&A) not yet built." button, since Stage 2
          is now built).
        - Forward-compat: paper objects never mutate delegate.
          personality/boss, bloc.leader, or their own .bloc reference;
          a future stage computes each speaker's rhetorical role from
          those fields on the fly, so nothing here may let them decay.
        - clearRoomForSpeakerSelection() also strips the new
          onDelegateClickForStage2 listener now, so it's a safe
          catch-all between any two sub-phases that reuse the room.
   v32: Phase 3 caucus fast-forward toggle (style.css v23,
        index.html unchanged from v13).
        - New sp.ffActive flag on the caucus's speeches object. A new
          icon-only button (⏩, no "3x"/text label), positioned to the
          left of the "UNMODERATED CAUCUS" / minutes label, appears
          in the caucus dais the instant the timer enters "pre" phase
          (same moment setupCaucusTimer() runs); toggles sp.ffActive
          on click; disappears entirely (renderCaucusDais omits its
          markup) once the timer hits 0:00 — no FF state persists
          past that point (ffActive is also explicitly reset to
          false at the zero transition).
        - tickSpeech: the rate used to decrement displayedSec is
          multiplied by CAUCUS_FF_MULTIPLIER (3) whenever
          caucusMode && ffActive, for whichever phase (pre or warn)
          is currently active. Auto-revert: the instant the existing
          pre -> warn threshold check fires (still a <= comparison,
          so a 3x-sped tick can't jump past the exact threshold and
          skip the revert), if ffActive was on it's forced off via
          setCaucusFF(false). The button can be clicked again to
          re-enable FF during warn phase; that's handled by the same
          rate-multiply logic, no special-casing needed.
        - Dialogue turn timing was refactored from raw nested
          setTimeout calls (fixed durations baked in at schedule
          time, so a mid-flight rate change couldn't affect them,
          which would have caused a stutter/desync between timer and
          dialogue speed on toggle) to scheduleFFAwareStep(), which
          records each step's nominal (1x) duration, start timestamp,
          and the FF rate active when it was scheduled.
          rescaleActiveCaucusStep() — called from setCaucusFF() on
          every toggle (manual click or auto-revert) — cancels the
          active bloc's in-flight step and reschedules the remaining
          nominal time at the new rate, so an in-progress bubble
          (including mid-overlap) visibly speeds up or slows down
          immediately rather than waiting for its next scheduled
          turn. FF is caucus-wide, not per-bloc: switching hover
          focus to the other bloc activates it fresh via the
          existing activateBloc()/scheduleLifecycle() path, which
          already reads the current ffActive state, so the newly
          active bloc picks up the same FF speed with no extra
          wiring. deactivateBloc() now also clears the paused bloc's
          step-tracking fields, so a stale record from before a
          pause can't be misread if that bloc reactivates and FF
          toggles again during its (FF-unaffected) hover-in delay.
        - Existing hover pause/resume behavior (cancel timers, hide
          bubbles, preserve turnIdx on pause; replay the current line
          fresh on resume) is unchanged; resuming plays at whatever
          FF state is active at that moment, never a forced reset.
        - Gavel-down logic, warning on-time/late/missed thresholds,
          and debrief scoring are untouched — all of that keys off
          displayedSec, not real elapsed time, so FF (a real-time-to-
          displayed-time rate change) doesn't affect any of it.
        - style.css v23: new .caucus-ff-btn styles (off/hover/active
          states), same technique as the gavel button's state-driven
          background/border/box-shadow, active state using the
          existing gold accent (consistent with leader-guess/
          raised-voting elsewhere in the app).
   v31: Two fixes (style.css/index.html unchanged from v22/v13).
        - Phase 4 Stage 1 motion spoken text no longer ends in a
          trailing period ("...and straight into voting" /
          "...and a 30 second amendment period"), matching every
          other motion type's spoken field (none of them end in
          punctuation — confirmed against unmod/rr/mod's templates).
        - Bugfix: a Phase 1 misclick that rules an actually-present
          (or P&V) delegate "absent" set del.markedAs = "absent" in
          handleRollAction and nothing ever reverted it. Phase 2/3/4's
          room renders gray a seat out via
          `del.markedAs === "absent" || !del.present`, so that stray
          markedAs value kept the delegate visually (and, since
          nothing else consulted del.present downstream of that
          check, functionally) marked absent for the rest of
          committee even though del.present — their true, never-
          mutated attendance flag — was still true. New
          reconcileMarkedAsAfterRollCall(), called from
          finishRollCall() right before computeAndShowScore(), resets
          markedAs back to the delegate's real expected ruling
          (PERSONALITIES[personality].expected) for any delegate
          where present === true but markedAs === "absent". Truly
          absent delegates are untouched: the `!del.present` half of
          that same OR check already grays them out correctly
          regardless of markedAs, so they're unaffected either way.
          Scoring is untouched — computeAndShowScore() reads only
          state.rollResults (logged at click-time in handleRollAction),
          never del.markedAs, so the misclick still costs a star in
          the Phase 1 debrief exactly as before; this fix only
          reconciles the seat's persistent visual state.
   v30: Phase 4 Stage 1 (motion proposition + vote) built, ending in
        a temporary dead-end placeholder (style.css v22, index.html
        v13). Stage 2 (2-for/2-against speeches), amendment mechanics,
        and the final vote are explicitly NOT part of this pass — see
        DESIGN.md §8.75. (Revised before ship: Q&A framing replaced
        with 2-for/2-against, motion count corrected from 4 to 3.)
        - New motion type "voting": { order: "submitted"|"reverse",
          seconds: 30|60, amendment: true|false, spoken, written }.
        - startPhase4(): mirrors startPhase3()'s reuse pattern.
          Re-initializes state.p2 with votingMode=true (unmodMode
          explicitly cleared; startPhase3 now explicitly clears
          votingMode too, so the two flags can never both be true at
          once), retitles the phase label to "Phase 4 of 5 · Voting
          Procedure", re-renders the committee room at original seat
          positions. Opening chair prompt unchanged.
        - renderPostMotionsScreen: the "phase3" case now reads
          "Proceed to Voting Procedure →" and calls startPhase4()
          (previously "Adjourn & Restart" / page reload). New
          "phase4stage1" case renders a disabled dead-end button
          ("Stage 2 (Q&A) not yet built.").
        - handleCallForMotions (votingMode branch): 3 random present
          delegates raise (personality irrelevant, same as Phase 3's
          unmod solicitation), each pre-assigned a distinct {order,
          seconds, amendment} combo via the new
          buildForcedVotingCombos(), mirroring the
          _forcedUnmodMinutes pattern. Coverage-guaranteed in just 2
          of the 3 slots: Slot A is "submitted" with a coinflip
          amendment value, Slot B is "reverse" with the OPPOSITE
          amendment value, so both orders and both amendment values
          are always represented; Slot C is any remaining combo. This
          matches the standing rule (now applied to all phases, not
          just Phase 4) that the player always selects exactly 3
          motions regardless of how many placards raise — Phase 2
          already worked this way (5 raise, 3 required); Phase 4 was
          previously (incorrectly) specced at 4 and is now aligned.
        - generateMotion(): new forced-voting-combo branch (checked
          before the forced-unmod branch) builds the motion object
          from the delegate's pre-assigned combo, ignoring
          personality, same short-circuit pattern as Phase 3.
        - No dilatory branch and no appearance-time thud fires for
          "voting"-type motions — falls through the existing
          type === "unmod" / type === "mod" checks unchanged (a
          voting motion matches neither), so this needed no new
          suppression logic.
        - disruptivenessRank: new "voting" branch returns
          [orderVal, seconds, amendVal] (reverse=1 always outranks
          submitted=0 regardless of the rest; within the same order,
          60 sec outranks 30 sec; amendment only breaks a tie where
          order AND seconds both already match). compareDisruptiveness
          extended to compare a 3rd tuple slot when both ranks have
          one; existing 2-element ranks (unmod/rr/mod) are unaffected.
        - handleCallFavor: votingMode rigs the pass/fail outcome
          directly by motion content instead of the normal
          fail-fail-pass retry pattern — amendment:true always passes
          on the first attempt, amendment:false always fails no
          matter how many times it's called. Order-pick grading
          (whether the player called the most disruptive unresolved
          motion) is untouched; only the pass/fail roll is rigged.
        - handlePassProceed: votingMode branch calls the new
          showVotingStage1Placeholder(motion) instead of
          enterSpeakerSelection()/startUnmodCaucus(). Genuine dead
          end: no speaker selection, no Q&A, no debrief scoring.
          Reuses #post-motions-screen; hides its .star-result block
          entirely (the first real use of the display:none hook the
          v23-era comment in finishPhase2 was written to anticipate).
        - Dev panel: "4 · Voting" button enabled (index.html v13),
          skips straight to startPhase4() the same way "3 · Unmod"
          skips to startPhase3().
        - style.css v22: .chair-prompt-btn gets explicit
          white-space:normal / word-wrap:break-word so the voting
          motion's spoken sentence (the longest string in the game)
          wraps to 2+ lines in the dais readout instead of
          overflowing. The delegate speech bubble already wrapped
          with a safe max-width; confirmed, not changed.
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
const CAUCUS_FF_MULTIPLIER      = 3;     // v32 — fast-forward speed for both timer rate and dialogue playback

/* ==========================================================
   PHASE 4 STAGE 1 — VOTING PROCEDURE MOTION TUNING (v30)
========================================================== */
const VOTING_ORDERS = ["submitted", "reverse"];
const VOTING_SECONDS = [30, 60];
const VOTING_AMENDMENTS = [true, false];

/* ==========================================================
   PHASE 4 STAGE 2 — DIRECTIVE PAPER NAMES (v33)
   Keyed by the same 4 topic buckets Phase 3's caucus dialogue uses
   (see TOPIC_BUCKETS), one name per bloc-leader type.
========================================================== */
const PAPER_NAMES = {
    substance: { power: "Sanctions Enforcement Framework", carolina: "Fund Me Maybe" },
    process:   { power: "Next Steps Protocol", carolina: "Define and Conquer" },
    people:    { power: "Humanitarian Relief Framework", carolina: "Heart of the Matter" },
    opening:   { power: "Joint Position Statement", carolina: "Position Yourself" },
};

/* ==========================================================
   PHASE 4 STAGE 3 — FOR/AGAINST SPEECH CONTENT (v34)
   Transcribed verbatim from phase4_speech_content.md. Keyed by topic
   bucket -> which paper is on the floor (its leader, "power" or
   "carolina") -> side ("for"/"against") -> speaker role (their
   personality: "power"/"demboy"/"carolina"). Placeholders {country},
   {boss}, {carolinaLeadCountry}, {paperName} are substituted by
   substituteStage3Line(). Keying content per-paper (rather than
   per-role-only) is what makes a Power-Del's leading/dominant vs.
   non-leading/sloppy-pivot variant fall out automatically from
   paper.leader at lookup time — see drawStage3SpeechLine().
========================================================== */
const SPEECH_CONTENT = {
    substance: {
        power: {
            for: {
                power: "This framework exists because {country} built it, start to finish. Two percent of GDP, every country, no exceptions. I heard the idea of carve-outs for smaller economies floated in our own caucus and I killed it there for a reason. This room does not need a debate. It needs a number, and I already gave you the right one.",
                demboy: "{boss} had this figured out from the start. Everyone pays the same two percent, no loopholes, no excuses. That is what real leadership on this issue looks like. This paper deserves your support.",
                carolina: "Look, I'll be honest, when I heard '<strong>Sanctions Enforcement Framework</strong>' I thought we were naming a law firm. I actually pitched softer rates for smaller economies in our own room and got shut down flat. But under the boring name is a real idea, and better a strict paper than no paper.",
            },
            against: {
                power: "Let's be direct. A flat two percent is lazy math dressed up as fairness. It does not account for a single real economy in this room, and it collapses the moment one country simply cannot pay it and walks. My bloc's floor system solves the exact problem this paper pretends does not exist. Vote it down.",
                demboy: "We looked at this closely, and a flat two percent does not account for the fact that not every country can absorb that cost the same way. Our bloc's sliding scale gets to the same funding goal without breaking smaller delegations. This paper isn't there yet.",
                carolina: "'<strong>Sanctions Enforcement Framework</strong>,' very official, very scary. But a scary name doesn't fix the fact that flat rates hit small countries the hardest. We came up with a sliding scale for a reason. Vote this one down.",
            },
        },
        carolina: {
            for: {
                carolina: "Yes, it's called <strong>Fund Me Maybe</strong>, and no, I'm not sorry. But behind the name is the actual fix: a sliding scale, so rich countries pay more, poor countries pay less, and nobody gets crushed by a flat number. Funny name, serious paper.",
                demboy: "This is the paper {country} actually helped build from scratch. A sliding scale by GDP, with a real floor so no country pays less than half a percent. It gets to the same funding total, fairly. That is worth backing.",
                power: "I'll point out that the floor in this paper, half a percent minimum, that piece came directly out of my own mouth in caucus. As for the sliding math itself, the exact brackets, I'll leave that to the room to review. What I'll say is it simply feels like the fairer paper, and fair is what gets votes in here. Support it.",
            },
            against: {
                power: "A sliding scale sounds compassionate right up until someone has to calculate it. My paper already solved this. Two percent, flat, for everyone, no argument, no bracket to dispute, no country pretending their economy is smaller than it is. This paper is a spreadsheet problem wearing a fairness costume. Reject it.",
                demboy: "{boss} said it best, exceptions and brackets are exactly how enforcement falls apart. A sliding scale is just exceptions with extra steps. We should stick with the flat rate.",
                carolina: "I like a good sliding scale as much as the next delegate, but '<strong>Fund Me Maybe</strong>' might be a little too honest about how uncertain this funding actually ends up being. A flat number, at least, is a number.",
            },
        },
    },
    process: {
        power: {
            for: {
                power: "I set this timeline myself. Six months to start, one year to finish, the same clock for every country in this room. Someone in my own caucus wanted a check-in built in halfway through. I refused, because a check-in is just a scheduled excuse to fall behind. This paper works because I did not let it get soft.",
                demboy: "{boss} was right that check-ins just turn into extensions. One clear timeline keeps everyone moving instead of stalling. This paper gets it done.",
                carolina: "'<strong>Next Steps Protocol</strong>,' very serious, very committee-brochure. I pushed for a full year to start in our own room and got told no on the spot. Still, I'll give it this, at least nobody can pretend they didn't know the deadline.",
            },
            against: {
                power: "One deadline for every country in this room is not discipline, it is indifference. It assumes every delegation starts from the same place, and none of them do. My bloc built a version with actual phases, because a timeline that ignores capacity is not a plan, it is a countdown clock nobody can survive. Vote no.",
                demboy: "A single deadline for every country ignores that some delegations need to build things up in stages. Our version does the easy parts first so people can see progress before the hard part even starts. That is a stronger plan.",
                carolina: "Six months to start, one year to finish, no check-ins in between, that's less a protocol and more a countdown clock with no pit stops. We built in phases for a reason. Vote no.",
            },
        },
        carolina: {
            for: {
                carolina: "<strong>Define and Conquer</strong>, because we're doing this in order instead of all at once. Simple stuff first, so people can actually see this working before we ask them to commit to the hard parts. That's not slow, that's smart.",
                demboy: "{country} helped build the actual phase structure here. Basics first, trust built early, harder pieces once people believe in it. That gets more countries to actually finish, not just start.",
                power: "The one-year cap on the whole process, keeping a hard end date even with the phases built in, that part came from me. I won't walk through every phase boundary line by line, that's not necessary tonight. What matters is this paper actually respects how people work, and that's the kind of paper that earns support in this room.",
            },
            against: {
                power: "Phases sound thoughtful and function as delay. Every phase boundary in this paper is another place for a country to quietly fall behind and blame the schedule. My timeline gives you one deadline and nowhere to hide. That is not harsh, that is honest. Reject this.",
                demboy: "{boss} called it, phases and check-ins are just extensions with a different name. A single clock keeps everybody honest.",
                carolina: "I like the idea of <strong>Define and Conquer</strong>, but 'define' can take a very long time in this room. Sometimes a flat deadline is what actually gets a paper conquered.",
            },
        },
    },
    people: {
        power: {
            for: {
                power: "I wrote this plan myself, and I stand behind every line of it. Someone in my own caucus wanted us to go out and consult the people it affects before we finalized anything. We do not need to. I already accounted for what they need. This plan is complete, and it is ready to vote on tonight.",
                demboy: "Right, {boss} and I did the research. We do not need to redo it.",
                carolina: "'<strong>Humanitarian Relief Framework</strong>,' about as warm a title as a tax form. I wanted a line in here saying we actually talked to the people affected, and got told no because we hadn't. At least it's an honest paper, even if it's a cold one.",
            },
            against: {
                power: "A relief plan written entirely in a room, by people who never once spoke to anyone it claims to help, is not a plan, it is a guess with a cover page. My bloc actually went and asked what people needed instead of assuming it. Reject a paper built on assumptions.",
                demboy: "If we just respond without ever fixing what caused this, we are back here in five years dealing with the exact same crisis. Our paper actually goes after the cause. This one refuses to even mention it.",
                carolina: "This paper is called <strong>Humanitarian Relief Framework</strong> and doesn't ask a single affected person what they think. Our paper actually goes to the heart of the matter. Vote for the one that listens.",
            },
        },
        carolina: {
            for: {
                carolina: "<strong>Heart of the Matter</strong>, because we actually went looking for one, unlike some papers on this floor. We talked to the people this affects and we're not afraid to name why this keeps happening. That's not soft, that's the whole point.",
                demboy: "If we just help people now but never fix the actual cause, we're back here in five years having this same debate. This paper finally goes after why this keeps happening, not just what to do about it today.",
                power: "I negotiated the root-cause section down to two sentences in our own caucus, so I can tell you it's there and it's tight, I won't pretend I can walk you through every line of the reasoning behind it right now. What I'll say is this paper simply feels more honest than a plan someone wrote alone at a desk, and honesty is worth a vote.",
            },
            against: {
                power: "Root causes make for a nice speech and a useless deadline. My plan is already written, already complete, and already accounts for what is needed without turning this into an open-ended listening tour. This paper trades results for feelings. Reject it.",
                demboy: "{boss} already thought through every angle on this. We don't need to reopen a plan that's already finished.",
                carolina: "I appreciate a paper with heart, truly, but sometimes a room needs a plan more than it needs a feeling. The other paper is already written and ready to go.",
            },
        },
    },
    opening: {
        power: {
            for: {
                power: "When we speak, we lead with my point, because it is the strongest thing in this room and I am not interested in diluting it. Someone in my own caucus wanted to open by naming every country's contribution instead. I said no. One message, delivered clearly, wins more than a list of names ever will.",
                demboy: "Right, one message hits harder than five. {boss}'s point goes first, and everything else follows.",
                carolina: "'<strong>Joint Position Statement</strong>,' about as exciting as it sounds. I wanted us to open by naming everyone who worked on this and got told that wastes time. It's blunt, but at least the room knows exactly what we're saying and who's saying it.",
            },
            against: {
                power: "One person's point, delivered first and loudest, is not a strategy, it is an ego with a microphone. My bloc opens with why this actually matters to the people in this room, and that earns real support instead of just attention. Reject the paper that leads with a name instead of a reason.",
                demboy: "Everyone already knows what the problem is on paper. What they don't know is why it matters to them. Our opening actually makes people care before we ask for anything. This paper skips straight to the ask.",
                carolina: "Nothing says 'trust us' like an opening statement that's really just one delegate's highlight reel. We open with the actual story. Vote for the paper that starts with a reason to care.",
            },
        },
        carolina: {
            for: {
                carolina: "<strong>Position Yourself</strong>, because before you ask a room for anything, you have to give them a reason to care. We open with the real story behind this, not just a name and a demand. Yes, the title's a little on the nose. It's still the right move.",
                demboy: "If we open with the cause, with why this actually matters, people care before we ever get to the ask. That's a stronger opening than jumping straight to a demand. This paper gets that.",
                power: "I'm the one who insisted the opening story stay short so the actual point still lands fast, so I can tell you that compromise is built in. I won't walk through the full story beat by beat right now. What matters is this opening simply connects better with a room than jumping straight to a demand does, and that's worth voting for.",
            },
            against: {
                power: "An opening built around a story is a stall tactic wearing empathy as a costume. My statement leads with the point because the point is what moves a room, not a warm-up act before it. This paper wastes the only moment you have everyone's attention. Reject it.",
                demboy: "{boss}'s point is the clearest thing we have. It should go first, not get buried under a story.",
                carolina: "A good story is nice, but by the time this paper gets to the actual ask, half the room's already checked their phone. Sometimes you just lead with the point.",
            },
        },
    },
};

/* ==========================================================
   PHASE 4 STAGE 4 — AMENDMENT PERIOD TUNING (v38)
========================================================== */
// Matches the "30 second amendment period" already hardcoded into
// buildVotingMotion()'s spoken/written text for amendment-bearing
// voting motions — one constant, referenced by both.
const AMENDMENT_PERIOD_SECONDS = 30;
// Approx. center of the room (SEAT_POSITIONS spans roughly left 8-92,
// top 20-62), for the amendment-announcement leader slide.
const STAGE4_CENTER_POS = { left: 50, top: 44 };

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

// ---------- TUTORIAL STEPS (v44) ----------
// Content for the Phase 1-4 tutorial overlay (see showTutorial() below).
// Phase 5 is a dev-only speed-run of mechanics already taught, so it
// never triggers any of these (enforced inside showTutorial() itself,
// not at each call site). targetSelector is resolved fresh at trigger
// time via document.querySelectorAll, since most targets (a raised
// placard, a specific seat, whichever button the dais currently shows)
// don't exist yet when this file loads.
const TUTORIAL_STEPS = [
    {
        id: "p1_intro",
        text: "Let's take roll. In committee, you'll go down the list alphabetically and click each delegate to mark them Present, Present and Voting, or Absent, based on how they respond. Get everyone right before you move on.",
        // v48 — anchored to the dais bar, flush against it (gap: 0),
        // instead of centered over the room.
        targetSelector: "#committee-room .room-dais",
        placement: "top",
        gap: 0,
    },
    {
        id: "p1_correction",
        text: "Gold boxes are things you, as Chair, say out loud during committee. Delegates sometimes use incorrect parliamentary procedure, and it's your job to politely correct them. Miss one of these and it'll cost you.",
        targetSelector: "#correct-btn",
        placement: "top",
    },
    {
        id: "p2_intro",
        text: "Those raised placards are delegates with motions. Click one to hear it out, and the Assistant Chair will add it to the agenda. Once you've got 3 on the floor, you'll call votes on them.",
        // v47 — was ".chair-prompt-btn"; moved to fire after placards
        // are actually raised (handleCallForMotions()), by which point
        // that button is gone, replaced by the "requesting" status text.
        targetSelector: ".delegate-seat.raised",
        placement: "bottom",
    },
    {
        id: "p2_disruptiveness",
        text: "Always put the most disruptive unresolved motion to a vote first. Not sure which that is? Open the Key. Calling votes out of order will cost you, so when in doubt, check it. Disruptiveness is a fixed ranking, so you can always work it out.",
        targetSelector: ".agenda-panel",
        placement: "left",
    },
    {
        id: "p2_dilatory",
        text: "Some motions are out of order and shouldn't be entertained at all. Rule these dilatory instead of putting them to the floor. Getting this wrong, or missing it, costs a star. When in doubt, the Chair is the boss and can rule any nonsense dilatory.",
        targetSelector: ".chair-prompt-btn.dilatory",
        placement: "top",
    },
    {
        id: "p2_speaker_select",
        text: "Now build the first half of the speakers list for the motion that just passed. Click delegates with raised placards to add them.",
        targetSelector: ".delegate-seat.raised",
        placement: "bottom",
    },
    {
        id: "p2_speech_timer",
        text: "Keep an eye on the clock. Give the time warning with one gavel tap at 10 seconds left, then keep hitting the gavel at 0:00 until the delegate finishes speaking. Missing or botching either one costs you. Speeches run on compressed seconds here instead of real seconds just to keep the game moving, but the timer will be accurate at the real conference.",
        targetSelector: ".speech-dais",
        placement: "top",
    },
    {
        id: "p2_round2",
        text: "Second half now. Don't call on someone who already spoke if there's an unused speaker available; that's an avoidable repeat and it'll cost you.",
        targetSelector: "#speakers-list",
        placement: "left",
    },
    {
        id: "p3_intro",
        text: "Hover over a bloc to listen in on their conversation. While you listen, try to spot who's actually leading the bloc, then click that delegate to lock in your guess. You can change your mind anytime before the caucus ends. Typically, the person who leads the most unmods will end up a frontrunner.",
        targetSelector: "#committee-room-p2",
        placement: "center",
    },
    {
        id: "p3_timer",
        text: "Same warning and gavel discipline as before, but it's a one-minute warning this time, not ten seconds. Use the fast-forward button if you'd rather speed things along. The unmod here is squeezed into about a minute of real time no matter how long the motion asked for, but the real conference will have an accurate timer.",
        targetSelector: ".speech-dais",
        placement: "top",
    },
    {
        id: "p4_intro",
        text: "Same motion-and-vote loop as before, but the ranking's different in Voting Procedure: whether a motion has an amendment period beats speaking time, which beats submission order. Voting procedure is the single hardest motion to keep track of, so check the Key. It's a separate scale from the one you used earlier.",
        targetSelector: "#key-toggle-btn",
        placement: "left",
    },
    {
        id: "p4_papers",
        text: "After you, as the Chair, read out the first paper, pick two speakers for and two against. Try not to repeat a speaker between paper one and paper two if someone fresh is still available. In a real committee, these papers are actual delegate-written policy; here the text is pre-written.",
        targetSelector: "#speakers-panel",
        placement: "left",
    },
    {
        id: "p4_amendment",
        text: "Friendly amendments go straight onto the paper. Unfriendly ones need a two-thirds vote of their own first. Nothing for you to decide here, just know what's coming.",
        targetSelector: null,
        placement: "bottom",
    },
    // v47 — the only two steps written for Phase 5 itself (see
    // showTutorial()'s allowInPhase5 check above); every other step on
    // this list is Phase 1-4 content Phase 5 deliberately never shows.
    {
        id: "p5_intro",
        text: "Now it's your turn to run through a whole directive cycle. In real committee, this is the core procedural loop. Each loop takes around 30-40 minutes, capped off with a Crisis Update after passing the directive. Good luck!",
        targetSelector: null,
        placement: "center",
        allowInPhase5: true,
    },
    {
        id: "p5_gavel",
        text: "Before you adjourn, the committee awards the Gavel, its highest honor, to the Best Delegate. Who do you recognize?",
        targetSelector: null,
        placement: "center",
        allowInPhase5: true,
    },
];

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
    // v41 — set once when Phase 2's real debrief first resolves ("mod"
    // or "rr"); Phase 5 Stage 1 rigs its own vote to guarantee the
    // OTHER type passes. Never set by Phase 5's own Stage 1 (reuses
    // finishPhase2() but takes an early-return branch before reaching
    // the line that sets this).
    phase2WinningType: null,
    // v41 — non-null only while Phase 5 ("Timed Crisis") is running.
    // See startPhase5Stage1() for the full shape.
    phase5: null,
    // v42 — set once by the real Phase 3's own startUnmodCaucus() call
    // (the blocs array assignBlocs() built there). Bloc leadership
    // persists across the whole session, so Phase 5's Stage 2 reuses
    // these same bloc objects (same delegates, same leader) instead of
    // calling assignBlocs() fresh — this is what Phase 5's Best
    // Delegate stage checks the correct answer against.
    phase3Blocs: null,
    // v47 — raw bloc-leader guesses (delegate indices, right or wrong),
    // stashed by finishPhase3Debrief() the moment it reads bloc.guessIdx
    // for scoring, before anything later could touch it again. Phase 5's
    // own unmod caucus stashes the same shape into phase5BlocGuesses via
    // that same function's Phase-5 branch. Pure memory aid for the Gavel
    // stage (startPhase5BestDelegate()) — never used for scoring.
    phase3BlocGuesses: [],
    phase5BlocGuesses: [],
    // v45 — each phase's own real debrief sets its entry the moment it
    // computes its final stars value (never when a later phase reuses
    // that same debrief function internally — see finishPhase2()/
    // finishPhase3Debrief()/finishPhase4()'s Phase 5 early-return
    // branches). A phase only ever reached via a dev-panel skip leaves
    // its entry null forever; showGlobalDebrief() reads that as "Not
    // Played" and it fails the perfect-session check by design.
    phaseStars: { p1: null, p2: null, p3: null, p4: null, p5: null },
    // v44 — tutorial overlay (Phases 1-4 only; see showTutorial() below).
    // tutorialSeen is session-scoped: both reset to their defaults on
    // page load, which is also what every restart button does.
    tutorialMode: true,
    tutorialSeen: new Set(),
    _tutorialCurrent: null,
    _tutorialQueue: [],
    _tutorialHighlighted: [],
    // v46 — see renderTutorialStep()'s self-dismiss bugfix.
    _tutorialJustShown: false,
    // v49 — same self-dismiss guard, for the Disruptiveness Key popup
    // when it's auto-opened from a button other than its own toggle.
    // See openDisruptivenessKey().
    _keyJustOpened: false,
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

// ---------- TUTORIAL OVERLAY (v44) ----------
// Additive, non-blocking help system for Phases 1-4. A single reusable
// #tutorial-popup element (index.html) is positioned over whatever's
// currently on screen; nothing here touches game state or scoring.
//
// showTutorial(id) is the one line every trigger point below adds.
// targetSelector is optional and overrides the step's own config
// selector for triggers whose target is only known at call time (a
// specific seat, two specific sponsor seats). Returns true if the step
// actually fired (shown or queued) this call, false on every no-op —
// callers that pair a step with a side effect (e.g. auto-opening the
// Disruptiveness Key alongside p2_disruptiveness/p4_intro) use this
// instead of re-checking tutorialMode/tutorialSeen/phase5 themselves.
function showTutorial(id, targetSelector) {
    if (!state.tutorialMode) return false;
    if (state.tutorialSeen.has(id)) return false;
    const step = TUTORIAL_STEPS.find(s => s.id === id);
    if (!step) return false;
    // Phase 5 ("Timed Crisis") reuses almost every function these trigger
    // points live in, verbatim, and gets none of Phases 1-4's tutorial
    // content (it's a speed-run of mechanics already taught) — enforcing
    // that here, once, means no call site below needs its own Phase 5
    // check. v47 — except the small number of steps written specifically
    // for Phase 5 itself (step.allowInPhase5: true), which still need
    // the usual tutorialMode/tutorialSeen gating above.
    if (state.phase5 && state.phase5.active && !step.allowInPhase5) return false;
    state.tutorialSeen.add(id);

    const job = { step, targetSelector: targetSelector || step.targetSelector };
    if (state._tutorialCurrent) {
        // Two steps can legitimately trigger in the same tick (e.g. two
        // things both becoming true the instant a caucus starts); queue
        // the second rather than silently overwriting the first before
        // it's ever been seen.
        state._tutorialQueue.push(job);
        return true;
    }
    renderTutorialStep(job);
    return true;
}

function renderTutorialStep(job) {
    const popup = document.getElementById("tutorial-popup");
    const textEl = document.getElementById("tutorial-text");
    if (!popup || !textEl) return;
    state._tutorialCurrent = job;
    textEl.textContent = job.step.text;
    clearTutorialHighlight();

    let rect = null;
    if (job.targetSelector) {
        const targets = Array.from(document.querySelectorAll(job.targetSelector));
        if (targets.length) {
            state._tutorialHighlighted = targets;
            targets.forEach(el => el.classList.add("tutorial-highlight"));
            rect = targets.reduce((acc, el) => {
                const r = el.getBoundingClientRect();
                if (!acc) return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
                return {
                    left: Math.min(acc.left, r.left),
                    top: Math.min(acc.top, r.top),
                    right: Math.max(acc.right, r.right),
                    bottom: Math.max(acc.bottom, r.bottom),
                };
            }, null);
        } else {
            // v46 — defensive fallback: a step with a configured target
            // whose selector matches nothing at trigger time still shows,
            // centered, rather than silently doing nothing. Warns so a
            // future case like this is never invisible.
            console.warn(`showTutorial("${job.step.id}"): targetSelector "${job.targetSelector}" matched no element; showing centered.`);
        }
    }

    popup.hidden = false;
    // v46 — bugfix: showTutorial() is almost always called synchronously
    // from inside a click handler (the click that raises a placard, calls
    // for motions, accepts a motion, etc.). That same click then bubbles
    // up to document, where the "click outside closes it" listener below
    // was dismissing the popup THIS SAME TICK, before it was ever
    // painted — every step that wasn't deferred behind a setTimeout/await
    // (p1_correction, p2_speaker_select) looked like it silently never
    // appeared. _tutorialJustShown suppresses exactly that one triggering
    // click; it's cleared on the next tick, well before any real
    // follow-up click, so genuine outside clicks still dismiss normally.
    state._tutorialJustShown = true;
    setTimeout(() => { state._tutorialJustShown = false; }, 0);
    positionTutorialPopup(popup, rect, job.step.placement, job.step.gap);
}

// v48 — gap is the distance between the popup and its target along the
// placement direction (defaults to the same 14px used for viewport edge
// clamping); a step can override it, e.g. gap: 0 to sit flush against
// the target instead of leaving the usual breathing room.
function positionTutorialPopup(popup, rect, placement, gap = 14) {
    const edgeMargin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Measure with the popup already in final content/visibility state
    // but off in a neutral spot, so offsetWidth/Height reflect this
    // step's actual text length before we place it.
    popup.style.visibility = "hidden";
    popup.style.left = "0px";
    popup.style.top = "0px";
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;

    let left, top;
    if (!rect || placement === "center") {
        left = (vw - pw) / 2;
        top = (vh - ph) / 2;
    } else {
        const cx = rect.left + (rect.right - rect.left) / 2;
        const cy = rect.top + (rect.bottom - rect.top) / 2;
        switch (placement) {
            case "top":
                left = cx - pw / 2;
                top = rect.top - ph - gap;
                break;
            case "bottom":
                left = cx - pw / 2;
                top = rect.bottom + gap;
                break;
            case "left":
                left = rect.left - pw - gap;
                top = cy - ph / 2;
                break;
            case "right":
                left = rect.right + gap;
                top = cy - ph / 2;
                break;
            default:
                left = (vw - pw) / 2;
                top = (vh - ph) / 2;
        }
    }

    left = Math.max(edgeMargin, Math.min(left, vw - pw - edgeMargin));
    top = Math.max(edgeMargin, Math.min(top, vh - ph - edgeMargin));
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.visibility = "visible";
}

function clearTutorialHighlight() {
    state._tutorialHighlighted.forEach(el => el.classList.remove("tutorial-highlight"));
    state._tutorialHighlighted = [];
}

function dismissTutorial() {
    const popup = document.getElementById("tutorial-popup");
    if (popup) popup.hidden = true;
    clearTutorialHighlight();
    state._tutorialCurrent = null;
    if (state._tutorialQueue.length) {
        renderTutorialStep(state._tutorialQueue.shift());
    }
}

// v47 — unlike dismissTutorial() (player-driven "Got it"/outside click,
// which promotes whatever's queued next), clearTutorial() is for phase
// boundaries: it forcibly hides whatever's showing AND drops the queue,
// so nothing from the phase that just ended can bleed into the next one.
function clearTutorial() {
    const popup = document.getElementById("tutorial-popup");
    if (popup) popup.hidden = true;
    clearTutorialHighlight();
    state._tutorialCurrent = null;
    state._tutorialQueue = [];
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

// v34 — isHTML lets Stage 3 speeches render <strong> around paper-name
// mentions (SPEECH_CONTENT); every other caller keeps passing plain
// text through textContent, unaffected.
function showSpeechBubble(delegate, text, containerId = "committee-room", isHTML = false) {
    const seat = getSeatElement(delegateIndexOf(delegate), containerId);
    if (!seat) return;
    seat.querySelectorAll(".speech-bubble").forEach(b => b.remove());
    const bubble = document.createElement("div");
    bubble.className = "speech-bubble";
    if (isHTML) bubble.innerHTML = text;
    else bubble.textContent = text;
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
    // v47 — centered, not anchored to the first seat: a target there
    // overlapped the chair's own dialogue line.
    showTutorial("p1_intro");
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
            showTutorial("p1_correction");
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

// v31 — a Phase 1 misclick that marks an actually-present (or P&V) delegate
// "absent" sets del.markedAs = "absent" (handleRollAction), which is what
// Phase 2/3/4's room renders check (`del.markedAs === "absent" || !del.present`)
// to decide the grayed-out seat state. Left alone, that "absent" markedAs
// value outlives the roll call and grays the delegate out for the rest of
// committee even though del.present (their true, never-mutated attendance
// flag) is still true. Reconcile it back to their real status here so the
// stray visual doesn't survive into later phases. Truly absent delegates
// (del.present === false) are untouched — the `!del.present` half of that
// same OR check already grays them out correctly regardless of markedAs.
function reconcileMarkedAsAfterRollCall() {
    state.delegates.forEach(d => {
        if (d.present && d.markedAs === "absent") {
            d.markedAs = PERSONALITIES[d.personality].expected;
        }
    });
}

function finishRollCall() {
    document.getElementById("roll-progress-fill").style.width = "100%";
    document.getElementById("calling-country").textContent = "—";
    reconcileMarkedAsAfterRollCall();
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
    state.phaseStars.p1 = stars;

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
        votingMode: false,
        priorTopic: null,
        caucus: null,
        priorCaucus: null,
        stage2: null,
        stage4: null, // v38 — set fresh by beginStage4() for each paper
        // v37 — reentrancy guard for handleDilatory()/handleModCorrection(),
        // both of which defer their actual stage change 500ms behind a
        // setTimeout while leaving their triggering button live/clickable
        // in the DOM for that whole window. See those functions.
        motionTransitioning: false,
    };
}

// ==========================================================
//  PHASE 4 STAGE 1 — VOTING PROCEDURE MOTION COMBOS (v30)
// ==========================================================
function allVotingCombos() {
    const combos = [];
    VOTING_ORDERS.forEach(order => {
        VOTING_SECONDS.forEach(seconds => {
            VOTING_AMENDMENTS.forEach(amendment => {
                combos.push({ order, seconds, amendment });
            });
        });
    });
    return combos; // 8 total: 2 orders x 2 seconds x 2 amendment
}
function comboEquals(a, b) {
    return a.order === b.order && a.seconds === b.seconds && a.amendment === b.amendment;
}

// v30 — coverage-guaranteed combo pick for Phase 4's 3 raised delegates.
// With only 3 slots, Slot A and Slot B alone guarantee full coverage of
// both axes that matter for grading: A is "submitted" with a coinflip
// amendment value, B is "reverse" with the OPPOSITE amendment value (so
// both orders and both amendment values are always represented in just
// two slots). Slot C is any remaining combo (excluding exact duplicates
// of A/B) and carries no coverage obligation of its own. Final 3 are
// shuffled so the coverage guarantee doesn't correlate with proposal/
// click order.
function buildForcedVotingCombos() {
    const all = allVotingCombos();
    const A = { order: "submitted", seconds: pick(VOTING_SECONDS), amendment: pick(VOTING_AMENDMENTS) };
    const B = { order: "reverse", seconds: pick(VOTING_SECONDS), amendment: !A.amendment };
    const remaining = all.filter(c => !comboEquals(c, A) && !comboEquals(c, B));
    const C = pick(remaining);
    return shuffle([A, B, C]);
}

function buildVotingMotion(delegate, combo) {
    const { order, seconds, amendment } = combo;
    const spoken =
        "Motion to enter voting procedure in " +
        (order === "reverse" ? "reverse order submitted" : "order submitted") +
        " with a 2 for/2 against with " + seconds + " seconds speaking time " +
        (amendment ? `and a ${AMENDMENT_PERIOD_SECONDS} second amendment period` : "and straight into voting");
    const written =
        shortName(delegate.country) + " voting" +
        (order === "reverse" ? " rev" : "") +
        " 2/2 " + seconds + " sec" +
        (amendment ? ` ${AMENDMENT_PERIOD_SECONDS} sec amend` : "");
    return {
        type: "voting",
        order, seconds, amendment,
        spoken, written,
        topic: null,
    };
}

// v40 — Phase 4 Stage 1's own tuple order (amendment status outranks
// speaking time outranks order), replacing the v30-v39 [orderVal,
// seconds, amendVal] tuple this branch used. Phase 2/3 motions are
// never type "voting", so they never reach this branch and are
// unaffected — see the new Phase 4 Disruptiveness Key (DESIGN.md §8.11)
// for the player-facing version of this same rule.
function votingDisruptivenessRank(motion) {
    const amendVal = motion.amendment ? 1 : 0;
    const orderVal = motion.order === "reverse" ? 1 : 0;
    return [amendVal, motion.seconds, orderVal];
}
function disruptivenessRank(motion) {
    if (motion.type === "voting") return votingDisruptivenessRank(motion);
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
    // v30 — voting-type ranks carry a 3rd tuple slot (v40: order,
    // breaking ties where amendment status AND seconds both match);
    // 2-element ranks (unmod/rr/mod) never reach this since both sides
    // would be undefined and the comparison is skipped.
    if (ra[2] !== undefined && rb[2] !== undefined && ra[2] !== rb[2]) return ra[2] - rb[2];
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
    clearTutorial(); // v47 — a Phase 1 popup must never bleed into Phase 2
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
            // v30 — standing rule across all phases: the player selects
            // exactly 3 motions regardless of how many placards raise.
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
                showTutorial("p2_dilatory", ".chair-prompt-btn.dilatory");
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
                // v47 — moved from handleAcceptMotion()'s first-motion-
                // on-the-agenda moment to here: the agenda is now in its
                // final voting state, matching what these two steps
                // actually describe ("vote on the most disruptive...").
                // v49 — the Key auto-opens alongside whichever of these
                // two steps actually fires (shown is a one-time thing;
                // selectMotionForVote() auto-closes it again once the
                // player acts), so the player isn't told to "check the
                // Key" while it's sitting closed.
                if (p2.votingMode) {
                    if (showTutorial("p4_intro", "#key-toggle-btn")) openDisruptivenessKey();
                } else if (!p2.unmodMode) {
                    if (showTutorial("p2_disruptiveness", ".agenda-panel")) openDisruptivenessKey();
                }
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

        // v33 — Phase 4 Stage 2
        case "stage2_reading": {
            const paper = currentStage2Paper();
            const [sponsor1, sponsor2] = paperSponsors(paper);
            const btn = daisButton(
                `I will now read out the paper called <strong>${paper.name}</strong> sponsored by ` +
                `<strong>${sponsor1.country}</strong> and <strong>${sponsor2.country}</strong>.`
            );
            btn.addEventListener("click", () => {
                p2.stage = "stage2_announcing_for";
                renderMotionsDais();
                // v47 — moved from enterStage2Paper(): fires once the
                // paper has actually been read into the record (this
                // click), not the instant its screen renders.
                showTutorial("p4_papers", "#speakers-panel");
            });
            bar.appendChild(btn);
            break;
        }
        case "stage2_announcing_for": {
            const btn = daisButton(`I will now be taking 2 <b>for</b> speakers.`, "dilatory");
            btn.addEventListener("click", () => beginStage2Selection("for"));
            bar.appendChild(btn);
            break;
        }
        case "stage2_selecting_for":
        case "stage2_selecting_against": {
            const kind = p2.stage2.selectingKind;
            const paper = currentStage2Paper();
            const arr = kind === "for" ? paper.forSpeakers : paper.againstSpeakers;
            const filled = arr.filter(x => x != null).length;
            const status = daisStatus(
                `Select the <span class="prompt-emph">${kind}</span> speakers &nbsp; ` +
                `<span class="tally">${filled} / 2</span> &nbsp; ` +
                `<span class="hint">Click a raised placard.</span>`
            );
            status.id = "stage2-selection-status";
            bar.appendChild(status);
            break;
        }
        case "stage2_announcing_against": {
            const btn = daisButton(`I will now be taking 2 <b>against</b> speakers.`, "dilatory");
            btn.addEventListener("click", () => beginStage2Selection("against"));
            bar.appendChild(btn);
            break;
        }

        // v34 — Phase 4 Stage 3: paper 1's 4 speeches, reusing the
        // exact same speech-dais rendering Phase 2's mod/RR loop uses.
        case "stage3_speeches": {
            renderSpeechDais(bar);
            break;
        }

        // v38 — Phase 4 Stage 4: amendment period + paper vote.
        case "stage4_announcing_timer": {
            const btn = daisButton(
                `I will now start the ${AMENDMENT_PERIOD_SECONDS} second timer for you to bring your amendments to the dais.`
            );
            btn.addEventListener("click", beginAmendmentAnnouncementAnimation);
            bar.appendChild(btn);
            break;
        }
        case "stage4_reading_amendment": {
            const submitter = p2.stage4.submitter;
            const btn = daisButton(
                `I will now read out the amendment submitted by <strong>${submitter.country}</strong>.`
            );
            btn.addEventListener("click", () => {
                p2.stage = "stage4_declaring";
                renderMotionsDais();
            });
            bar.appendChild(btn);
            break;
        }
        case "stage4_declaring": {
            const btn = daisButton(`Is this amendment friendly or unfriendly?`);
            btn.addEventListener("click", handleAmendmentDeclaration);
            bar.appendChild(btn);
            // v47 — moved earlier (was in handleAmendmentDeclaration(),
            // after the verdict was already announced): fires the
            // instant this button appears, so the player is informed
            // before making the call, not after.
            const decPaper = currentStage2Paper();
            const [decSponsor1, decSponsor2] = paperSponsors(decPaper);
            showTutorial(
                "p4_amendment",
                `#committee-room-p2 .delegate-seat[data-index="${delegateIndexOf(decSponsor1)}"], ` +
                `#committee-room-p2 .delegate-seat[data-index="${delegateIndexOf(decSponsor2)}"]`
            );
            break;
        }
        case "stage4_amendment_vote_announcing": {
            const btn = daisButton(
                `Seeing that this amendment is <b>unfriendly</b>, we will now vote with 2/3 majority on this amendment.`,
                "dilatory"
            );
            btn.addEventListener("click", () => {
                p2.stage = "stage4_amendment_calling_favor";
                renderMotionsDais();
            });
            bar.appendChild(btn);
            break;
        }
        case "stage4_amendment_calling_favor": {
            const submitter = p2.stage4.submitter;
            const btn = daisButton(
                `All those in favor of <strong>${submitter.country}</strong>'s amendment please raise your placards high.`,
                "vote-favor-btn"
            );
            btn.addEventListener("click", handleAmendmentCallFavor);
            bar.appendChild(btn);
            break;
        }
        case "stage4_amendment_showing_favor": {
            const t = p2.stage4.amendmentTally;
            const status = daisStatus(`<span class="tally">${t.favor} in favor</span>.`);
            bar.appendChild(status);
            setTimeout(() => {
                p2.stage = "stage4_amendment_calling_oppose";
                renderMotionsDais();
            }, 1400);
            break;
        }
        case "stage4_amendment_calling_oppose": {
            const submitter = p2.stage4.submitter;
            clearVoteVisuals();
            const btn = daisButton(
                `All those opposed to <strong>${submitter.country}</strong>'s amendment please raise your placards high.`,
                "vote-oppose-btn"
            );
            btn.addEventListener("click", handleAmendmentCallOppose);
            bar.appendChild(btn);
            break;
        }
        case "stage4_amendment_showing_result": {
            const t = p2.stage4.amendmentTally;
            const status = daisStatus(
                `<span class="tally">${t.favor} for / ${t.oppose} against</span> of ${t.needed} needed. ` +
                (p2.stage4.amendmentVerdict === "pass"
                    ? `<span class="verdict-pass">The amendment passes.</span>`
                    : `<span class="verdict-fail">The amendment fails.</span>`)
            );
            bar.appendChild(status);
            setTimeout(() => {
                clearVoteVisuals();
                p2.stage = "stage4_paper_calling_favor";
                updateMotionsInstructions("Call the vote on the paper.");
                renderMotionsDais();
            }, 1800);
            break;
        }
        case "stage4_paper_calling_favor": {
            const paper = currentStage2Paper();
            const [sponsor1, sponsor2] = paperSponsors(paper);
            const btn = daisButton(
                `All those in favor of <strong>${paper.name}</strong> with sponsors ` +
                `<strong>${sponsor1.country}</strong> and <strong>${sponsor2.country}</strong> please raise your placards high.`,
                "vote-favor-btn"
            );
            btn.addEventListener("click", handlePaperCallFavor);
            bar.appendChild(btn);
            break;
        }
        case "stage4_paper_showing_favor": {
            const t = p2.stage4.paperTally;
            const status = daisStatus(`<span class="tally">${t.favor} in favor</span>.`);
            bar.appendChild(status);
            setTimeout(() => {
                p2.stage = "stage4_paper_calling_oppose";
                renderMotionsDais();
            }, 1400);
            break;
        }
        case "stage4_paper_calling_oppose": {
            const paper = currentStage2Paper();
            const [sponsor1, sponsor2] = paperSponsors(paper);
            clearVoteVisuals();
            const btn = daisButton(
                `All those opposed to <strong>${paper.name}</strong> with sponsors ` +
                `<strong>${sponsor1.country}</strong> and <strong>${sponsor2.country}</strong> please raise your placards high.`,
                "vote-oppose-btn"
            );
            btn.addEventListener("click", handlePaperCallOppose);
            bar.appendChild(btn);
            break;
        }
        case "stage4_paper_showing_result": {
            const t = p2.stage4.paperTally;
            const paper = currentStage2Paper();
            const status = daisStatus(
                `<span class="tally">${t.favor} for / ${t.oppose} against</span> of ${t.needed} needed. ` +
                (p2.stage4.paperVerdict === "pass"
                    ? `<strong>${paper.name}</strong> <span class="verdict-pass">passes.</span>`
                    : `<strong>${paper.name}</strong> <span class="verdict-fail">fails.</span>`)
            );
            bar.appendChild(status);
            setTimeout(() => {
                clearVoteVisuals();
                advanceAfterPaperVote();
            }, 1800);
            break;
        }

        // v42 — Phase 5's new Best Delegate stage, inserted right before
        // the combined debrief.
        case "phase5_best_delegate": {
            if (p2.bestDelegateIdx == null) {
                // v47 — the full ceremonial line now lives in the
                // "p5_gavel" tutorial step (startPhase5BestDelegate()),
                // shown only when tutorial mode is on; this permanent,
                // always-visible prompt stays minimal so it isn't
                // duplicated for every player.
                const status = daisStatus(`Select a delegate for the <strong>Gavel</strong>.`);
                bar.appendChild(status);
            } else {
                const del = state.delegates[p2.bestDelegateIdx];
                const status = daisStatus(
                    `<strong>${del.country}</strong> selected for Best Delegate.`
                );
                bar.appendChild(status);
                const btn = daisButton("Award the Gavel", "proceed");
                btn.addEventListener("click", confirmBestDelegate);
                bar.appendChild(btn);
            }
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
        // v36 — from the 4th speaker onward in a Round Robin, let the
        // player skip the rest of the speaker list instead of clicking
        // through every remaining recognition/timer/gavel step by hand.
        // Reuses .caucus-ff-btn's styling and its exact slot in the
        // .speech-dais flex row (first child, left of the speaker
        // label) — "the same spot as the fast forward button in
        // Phase 3". isRR naturally excludes Stage 3 speeches, whose
        // motion.type is "voting", not "rr".
        const isRR = p2.speakersMotion && p2.speakersMotion.type === "rr";
        const skipButtonHTML = (isRR && sp.currentSlot >= 3)
            ? `<button class="caucus-ff-btn" id="rr-skip-btn"
                       aria-label="Autocomplete remaining speeches" title="Autocomplete remaining speeches">
                   <span class="caucus-ff-icon">&#9193;</span>
               </button>`
            : "";
        const wrap = document.createElement("div");
        wrap.className = "speech-dais";
        wrap.innerHTML = `
            ${skipButtonHTML}
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
        const skipBtn = wrap.querySelector("#rr-skip-btn");
        if (skipBtn) skipBtn.addEventListener("click", autocompleteRRSpeeches);
    } else if (sp.mode === "done") {
        const p2Ref = state.p2;
        // v34 — Stage 3's 4 fixed speeches have no round 2 of their
        // own. v38: this used to be a dead end (finishStage3Paper1,
        // removed) — now it hands off into Stage 4 (amendment period +
        // paper vote) instead.
        if (p2Ref.stage === "stage3_speeches") {
            const btn = daisButton("Conclude speeches &rarr;", "proceed");
            btn.addEventListener("click", beginStage4);
            bar.appendChild(btn);
            return;
        }
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
    if (state.phase5 && state.phase5.active && state.phase5.stage === "mod") {
        // v41 — Phase 5 Stage 1: raise exactly 3 (not Phase 2's 5), all
        // 3 required, mirroring Phase 3/4's more reliable coverage
        // pattern — one guaranteed the target type via _forcedMotionType
        // (handleCallFavor() rigs the vote off that same target), the
        // other two follow normal personality-based generation.
        chosen = shuffle(presentIdxs).slice(0, 3);
        const guaranteedIdx = pick(chosen);
        state.delegates[guaranteedIdx]._forcedMotionType = state.phase5.stage1TargetType;
    } else if (p2.votingMode) {
        // v30 — Phase 4 Stage 1: pick 3 random present delegates (any
        // personality) and pre-assign each a distinct, coverage-guaranteed
        // {order, seconds, amendment} combo.
        chosen = shuffle(presentIdxs).slice(0, 3);
        const combos = buildForcedVotingCombos();
        chosen.forEach((idx, i) => {
            state.delegates[idx]._forcedVotingCombo = combos[i];
        });
    } else if (p2.unmodMode) {
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
    // v47 — moved here from startPhase2(): the placards this step points
    // at (well, describes — it has no target) don't actually exist until
    // this function raises them. Phase-2-specific; Phase 3/4 have their
    // own intro steps (p3_intro / p4_intro) for this same raise.
    if (!p2.unmodMode && !p2.votingMode) showTutorial("p2_intro");
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
            : motion.type === "voting"
                ? `${del.country} has motioned to enter <em>voting procedure</em>. Note it and continue.`
                : `${del.country} has motioned. Note it and continue.`
    );
    renderMotionsDais();

    // v22 — appearance-time thud for correction buttons, but not in unmodMode
    // (no such buttons appear during Phase 3). v30 — "voting"-type motions
    // never match the unmod/needsCorrection checks below either way, so
    // Phase 4 needed no extra suppression here.
    if (!p2.unmodMode) {
        if (motion.type === "unmod" || (motion.type === "mod" && motion.needsCorrection)) {
            playThud();
        }
    }
}

// v37 — motionTransitioning guards against a rapid double-click on this
// button: p2.stage stays "speaking" and the triggering .chair-prompt-btn
// is left in the DOM, unchanged and still clickable, for the whole 500ms
// setTimeout below (renderMotionsDais(), which would remove it, doesn't
// run until the timeout fires). A second click inside that window used to
// re-run generateSecondChanceMotion/generateCorrectedMotion a second time
// harmlessly for Dilatory, but for the correction path it read
// del._pendingMotion AFTER the first click had already overwritten it with
// the corrected motion (which has no .correctedMin field), silently
// producing min: undefined and a "[Country] undefined [sec] [topic]"
// motion that soft-locked speaker selection once it passed. Fixed at the
// source: block reentry until the deferred transition actually completes.
function handleDilatory() {
    const p2 = state.p2;
    if (p2.motionTransitioning) return;
    p2.motionTransitioning = true;
    const del = p2.currentSpeaker;
    clearSpeechBubble(del, "committee-room-p2");
    const secondMotion = generateSecondChanceMotion(del);
    del._pendingMotion = secondMotion;
    setTimeout(() => {
        p2.motionTransitioning = false;
        showSpeechBubble(del, secondMotion.spoken, "committee-room-p2");
        p2.stage = "speaking2";
        updateMotionsInstructions(`${del.country} tries again with a different motion.`);
        renderMotionsDais();
    }, 500);
}

function handleModCorrection() {
    const p2 = state.p2;
    if (p2.motionTransitioning) return;
    p2.motionTransitioning = true;
    const del = p2.currentSpeaker;
    const original = del._pendingMotion;
    clearSpeechBubble(del, "committee-room-p2");
    const corrected = generateCorrectedMotion(del, original);
    del._pendingMotion = corrected;
    setTimeout(() => {
        p2.motionTransitioning = false;
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
        order: motion.order,
        seconds: motion.seconds,
        amendment: motion.amendment,
        status: null,
        proposalOrder: p2.motionsCollected.length,
    });
    p2.currentSpeaker = null;
    renderAgenda();

    // v30 — standing rule across all phases: the player selects exactly 3
    // motions regardless of how many placards raise (Phase 2 has always
    // worked this way; Phase 3 and Phase 4 Stage 1 match it).
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
    // v49 — the Key auto-opens alongside the p2_disruptiveness/p4_intro
    // tutorial steps (the "ready_to_vote" button handler above); closing
    // it here, the instant a motion is actually put to a vote, is the
    // other half of that. Harmless no-op if it was never open.
    closeDisruptivenessKey();
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
    const motion = p2.motionsCollected[p2.currentMotionIdx];

    let willPass;
    if (state.phase5 && state.phase5.active && state.phase5.stage === "mod") {
        // v41 — Phase 5 Stage 1 is rigged directly by motion type, same
        // trust-the-rig pattern as Phase 4 Stage 1's amendment rig below:
        // the type OPPOSITE state.phase2WinningType always passes; the
        // same type always fails, no matter how many times it's called.
        // Order-pick grading is unaffected.
        willPass = motion.type === state.phase5.stage1TargetType;
    } else if (p2.votingMode) {
        // v30 — Stage 1 voting is rigged directly by motion content, not
        // the normal fail-fail-pass retry pattern: amendment-bearing
        // motions always pass first try, others always fail no matter how
        // many times they're called. Order-pick grading is unaffected.
        willPass = motion.amendment === true;
    } else if (p2.voteAttempt >= 2) {
        willPass = true;
    } else {
        willPass = Math.random() < 0.4;
    }

    let favorCount;
    if (willPass) favorCount = needed + Math.floor(Math.random() * (totalPresent - needed + 1));
    else favorCount = Math.floor(Math.random() * needed);

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
    } else if (p2.votingMode) {
        // v33 — route into Stage 2 (was the Stage 1 dead end through v32).
        // Only reachable via an amendment-bearing motion, since
        // non-amendment motions never pass.
        const motion = p2.motionsCollected[p2.currentMotionIdx];
        startPhase4Stage2(motion);
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

    // v41 — Phase 5 Stage 1 reuses this exact function but shows no
    // debrief screen of its own: stash the mistake tally into
    // state.phase5 and chain straight into Stage 2 (unmod caucus)
    // instead. Real Phase 2 (the branch below) is the only path that
    // ever sets state.phase2WinningType.
    if (state.phase5 && state.phase5.active) {
        state.phase5.mistakes.mod = {
            orderMistakes, repeatMistakes, recogMistakes, missedWarns, lateWarns, gavelMistakes,
        };
        startPhase5Stage2();
        return;
    }
    if (state.phase2WinningType == null) state.phase2WinningType = passed.type;

    const totalMistakes = orderMistakes + repeatMistakes + recogMistakes
                        + missedWarns + lateWarns + gavelMistakes;
    const stars = Math.max(0, 3 - totalMistakes);
    state.phaseStars.p2 = stars;

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
// v41 — Phase 5 Stage 1 forces every mod/RR motion's topic to belong to
// the phase's single forced bucket (state.phase5.topicBucket). Every
// other caller (Phase 2, Phase 3's unmod-motion stage — whose motions
// have no real topic anyway) gets a normal unconstrained pick(TOPICS).
function pickMotionTopic() {
    if (state.phase5 && state.phase5.active && state.phase5.stage === "mod") {
        const pool = TOPICS.filter(t => TOPIC_BUCKETS[t.long] === state.phase5.topicBucket);
        if (pool.length) return pick(pool);
    }
    return pick(TOPICS);
}

function generateMotion(delegate) {
    // v30 — forced voting combo takes precedence (Phase 4 Stage 1).
    if (delegate._forcedVotingCombo != null) {
        const combo = delegate._forcedVotingCombo;
        delegate._forcedVotingCombo = null;
        return buildVotingMotion(delegate, combo);
    }
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
    // v41 — forced mod/rr type takes precedence (Phase 5 Stage 1's
    // type-coverage guarantee; see startPhase5Stage1()/handleCallForMotions()).
    if (delegate._forcedMotionType != null) {
        const type = delegate._forcedMotionType;
        delegate._forcedMotionType = null;
        const topic = pickMotionTopic();
        if (type === "rr") {
            const sec = pick(RR_SECONDS);
            return {
                type: "rr",
                spoken: `${sec} second round robin on ${topic.long}`,
                written: `${shortName(delegate.country)} ${sec} sec rr ${topic.short}`,
                topic,
            };
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
    const p = delegate.personality;
    const topic = pickMotionTopic();
    // v41 — Phase 5 Stage 1: unmods never appear there, so slackers
    // propose mod or RR like everyone else instead of always defaulting
    // to unmod. Every other phase keeps the original unmod default.
    const inPhase5Stage1 = state.phase5 && state.phase5.active && state.phase5.stage === "mod";
    if (p === "slacker" && !inPhase5Stage1) {
        const time = pick(UNMOD_TIMES);
        return {
            type: "unmod",
            min: time,
            spoken: `${time} minute unmod`,
            written: `${shortName(delegate.country)} ${time} min unmod`,
            topic: null,
        };
    }
    let wantsRR = p === "carolina";
    if (p === "slacker" && inPhase5Stage1) wantsRR = Math.random() < 0.5;
    if (wantsRR) {
        const sec = pick(RR_SECONDS);
        return {
            type: "rr",
            spoken: `${sec} second round robin on ${topic.long}`,
            written: `${shortName(delegate.country)} ${sec} sec rr ${topic.short}`,
            topic,
        };
    }
    // v41 — Dem-Boy's guaranteed correction never applies in Phase 5:
    // startPhase5Stage1() never sets guaranteedBadMod, so this stays
    // naturally false there with no extra guard needed here.
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

    // v34 — Stage 3 speeches reuse this function's caller sites
    // (beginSpeech/endCurrentSpeech) but keep showing the paper-name +
    // For:/Against: sidebar Stage 2 already built, not this generic
    // speaker-order list.
    if (p2 && p2.stage === "stage3_speeches") {
        renderStage2SpeakersPanel();
        return;
    }

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
    showTutorial("p2_speaker_select", ".delegate-seat.raised");

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
    showTutorial("p2_round2", "#speakers-list");

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
        s.removeEventListener("click", onDelegateClickForStage2); // v33
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
    if (motion.type === "voting") return motion.seconds; // v34 — Stage 3 speeches
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

    // v34 — Stage 3 speeches draw from the authored paper content
    // instead of the generic random-pool speech lines.
    const isStage3 = sp.roundKey === "stage3";
    const line = isStage3
        ? drawStage3SpeechLine(del, slotIdx)
        : drawSpeechLine(del);
    showSpeechBubble(del, line, "committee-room-p2", isStage3);

    renderMotionsDais();
    renderSpeakersList(false);
    showTutorial("p2_speech_timer", ".speech-dais");

    sp.timerId = setInterval(tickSpeech, 50);
}

function tickSpeech() {
    const sp = state.p2 && state.p2.speeches;
    if (!sp || sp.mode !== "speaking") return;

    const now = performance.now();
    const dt = (now - sp.lastTick) / 1000;
    sp.lastTick = now;

    if (sp.phase === "pre" || sp.phase === "warn") {
        const baseRate = sp.phase === "pre" ? sp.preRate : sp.warnRate;
        // v32 — fast-forward multiplies whichever rate is currently active
        // (preRate during pre, warnRate if re-enabled during warn).
        const rate = (sp.caucusMode && sp.ffActive) ? baseRate * CAUCUS_FF_MULTIPLIER : baseRate;
        sp.displayedSec -= rate * dt;

        if (sp.displayedSec <= (sp.warnThreshold || 10) && sp.phase === "pre") {
            sp.phase = "warn";
            // v32 — FF auto-reverts the instant warn phase is reached. The
            // <= check above (not ==) already guarantees this fires even
            // if a 3x-sped tick jumped straight past the exact threshold.
            if (sp.caucusMode && sp.ffActive) setCaucusFF(false);
            renderMotionsDais();
            return;
        }
        if (sp.displayedSec <= 0) {
            sp.displayedSec = 0;
            sp.phase = "zero";
            // v32 — the FF button disappears entirely once the timer hits
            // 0:00; no FF state should persist past that point.
            if (sp.caucusMode) sp.ffActive = false;
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

// v36 — Round Robin 4th-speaker-onward skip (see renderSpeechDais's
// "speaking" branch for the button itself). Marks every remaining slot
// (the one in progress through rangeEnd) spoken with no sp.log entry,
// so debrief scoring simply has fewer graded speeches to look at —
// never a fabricated "perfect" and never a penalty for skipping. Jumps
// straight to the same sp.mode = "done" state a real last speech
// reaches, so the phase concludes exactly like the player clicked
// through every remaining speech themselves.
function autocompleteRRSpeeches() {
    const p2 = state.p2;
    const sp = p2.speeches;
    if (!sp || sp.mode !== "speaking") return;

    if (sp.timerId) { clearInterval(sp.timerId); sp.timerId = null; }
    if (sp._spamTimer) { clearTimeout(sp._spamTimer); sp._spamTimer = null; }
    clearRecognitionHighlight();

    const del = state.delegates[p2.speakerOrder[sp.currentSlot]];
    clearSpeechBubble(del, "committee-room-p2");

    for (let i = sp.currentSlot; i <= sp.rangeEnd; i++) {
        sp.spokenSlots.add(i);
    }
    sp.mode = "done";
    renderMotionsDais();
    renderSpeakersList(false);
}

// ==========================================================
//  PHASE 3 — STAGE A/B: MOTIONS & VOTE
// ==========================================================

function startPhase3() {
    // v23 — preserve Phase 2 topic before init wipes state.p2.
    const prior = state.p2 && state.p2.speakersMotion;
    const priorTopic = prior && prior.topic;

    showScreen("motions-screen");
    clearTutorial(); // v47 — a Phase 2 popup must never bleed into Phase 3
    initPhase2State();
    state.p2.unmodMode = true;
    state.p2.votingMode = false; // v30 — the two flags never overlap.
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
        d._forcedVotingCombo = null;
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
//  PHASE 4 STAGE 1 — MOTIONS & VOTE (v30)
// ==========================================================
function startPhase4() {
    // v33 — preserve Phase 3's blocs/topicBucket before init wipes state.p2;
    // Stage 2 builds its two papers from these. Mirrors startPhase3()'s
    // priorTopic stash.
    const priorCaucus = state.p2 && state.p2.caucus;

    showScreen("motions-screen");
    clearTutorial(); // v47 — a Phase 3 popup must never bleed into Phase 4
    initPhase2State();
    state.p2.votingMode = true;
    state.p2.unmodMode = false; // v30 — the two flags never overlap.
    state.p2.priorCaucus = priorCaucus;

    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 4 of 5 · Voting Procedure";

    const body = document.querySelector(".phase2-body");
    if (body) body.classList.remove("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.remove("hidden-in-caucus");

    // Clear leftover per-delegate flags from earlier phases.
    state.delegates.forEach(d => {
        d.guaranteedBadMod = false;
        d._pendingMotion = null;
        d._forcedUnmodMinutes = null;
        d._forcedVotingCombo = null;
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
//  PHASE 4 STAGE 2 — DIRECTIVE READING + FOR/AGAINST SELECTION (v33)
// ==========================================================
// v33 — replaces the old Stage 1 dead end (showVotingStage1Placeholder).
// Only reachable once a player votes through to an amendment-bearing
// motion. Builds two directive papers from Phase 3's blocs and walks
// through reading + for/against speaker selection for whichever paper
// processes first; stops at a temporary placeholder after that paper's
// against speakers are picked (Stage 3 — amendments/vote — and paper 2
// are not yet built). See DESIGN.md §8.8.

function buildStage2Papers(motion) {
    const priorCaucus = state.p2.priorCaucus;
    const blocs = (priorCaucus && priorCaucus.blocs) || assignBlocs();
    const topicBucket = (priorCaucus && priorCaucus.topicBucket) || "substance";
    const blocA = blocs.find(b => b.side === "A");
    const blocB = blocs.find(b => b.side === "B");

    function buildPaper(ownBloc, otherBloc) {
        return {
            bloc: ownBloc,
            leader: ownBloc.leader,
            name: PAPER_NAMES[topicBucket][ownBloc.leader],
            forGroup: ownBloc.delegates.filter(d => d.personality !== "slacker"),
            againstGroup: otherBloc.delegates.filter(d => d.personality !== "slacker"),
            forSpeakers: [null, null],
            againstSpeakers: [null, null],
            // Internal bookkeeping only (not part of the spec'd shape):
            // whether this paper's for/against agenda subsection has
            // started rendering yet.
            _forStarted: false,
            _againstStarted: false,
        };
    }

    // Submission order convention: Bloc A is always paper 1 (index 0),
    // Bloc B is always paper 2 (index 1). The motion's order/reverse
    // field only determines PROCESSING order, not this indexing.
    const paper1 = buildPaper(blocA, blocB);
    const paper2 = buildPaper(blocB, blocA);
    const processingOrder = motion.order === "reverse" ? [1, 0] : [0, 1];

    return { papers: [paper1, paper2], processingOrder };
}

function currentStage2Paper() {
    const s2 = state.p2.stage2;
    return s2.papers[s2.processingOrder[s2.processingIdx]];
}

function startPhase4Stage2(motion) {
    const p2 = state.p2;
    const { papers, processingOrder } = buildStage2Papers(motion);
    p2.stage2 = {
        papers,
        processingOrder,
        processingIdx: 0,
        motion, // seconds/amendment are motion-level, not per-paper — read from here
        selectingKind: null,
        raisedPool: [],
        repeatSpeakerMistakes: 0, // v40 — paper 1 -> paper 2 avoidable-repeat debrief count
    };
    clearRoomForSpeakerSelection();
    enterStage2Paper(0);
}

function enterStage2Paper(processingIdx) {
    const p2 = state.p2;
    p2.stage2.processingIdx = processingIdx;
    p2.stage = "stage2_reading";
    // v33 — the motions agenda is untouched from here on; just re-render
    // it once for robustness. The speakers panel shows the paper name
    // immediately (with no For:/Against: subsections yet).
    renderAgenda();
    renderStage2SpeakersPanel();
    renderMotionsDais();
    updateMotionsInstructions("Read the paper into the record.");
}

function beginStage2Selection(kind) {
    const p2 = state.p2;
    const paper = currentStage2Paper();
    const group = kind === "for" ? paper.forGroup : paper.againstGroup;
    if (kind === "for") paper._forStarted = true;
    else paper._againstStarted = true;

    p2.stage2.selectingKind = kind;
    applyStage2RaisePool(group.map(d => delegateIndexOf(d)));
    p2.stage = kind === "for" ? "stage2_selecting_for" : "stage2_selecting_against";
    updateMotionsInstructions(
        kind === "for" ? "Select the two for speakers." : "Select the two against speakers."
    );
    renderStage2SpeakersPanel();
    renderMotionsDais();
}

function applyStage2RaisePool(pool) {
    const p2 = state.p2;
    p2.stage2.raisedPool = [...pool];
    pool.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (!seat) return;
        const del = state.delegates[idx];
        const variant = (del.personality === "power" || del.personality === "demboy")
            ? "raised-voting" : "raised";
        seat.classList.add(variant, "requesting");
        seat.addEventListener("click", onDelegateClickForStage2);
    });
}

function clearStage2RaisePool() {
    const p2 = state.p2;
    (p2.stage2.raisedPool || []).forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (!seat) return;
        seat.classList.remove("raised", "raised-voting", "requesting");
        seat.removeEventListener("click", onDelegateClickForStage2);
    });
    p2.stage2.raisedPool = [];
}

function onDelegateClickForStage2(e) {
    const p2 = state.p2;
    if (p2.stage !== "stage2_selecting_for" && p2.stage !== "stage2_selecting_against") return;
    const seat = e.currentTarget;
    const idx = parseInt(seat.dataset.index, 10);
    if (!p2.stage2.raisedPool.includes(idx)) return;

    seat.classList.remove("raised", "raised-voting", "requesting");
    seat.removeEventListener("click", onDelegateClickForStage2);
    p2.stage2.raisedPool = p2.stage2.raisedPool.filter(i => i !== idx);

    const paper = currentStage2Paper();
    const kind = p2.stage2.selectingKind;
    const arr = kind === "for" ? paper.forSpeakers : paper.againstSpeakers;
    const slot = arr.indexOf(null);
    if (slot !== -1) arr[slot] = idx; // click order preserved: first empty slot wins

    renderStage2SpeakersPanel(slot);
    updateStage2SelectionCounter();

    const filled = arr.filter(x => x != null).length;
    if (filled >= 2) {
        checkAvoidableRepeatSpeaker(paper, kind, arr); // v40 — debrief tracking, paper 2 only
        clearStage2RaisePool();
        setTimeout(() => {
            if (kind === "for") {
                p2.stage = "stage2_announcing_against";
                renderMotionsDais();
            } else {
                beginStage3Speeches();
            }
        }, 350);
    }
}

// v40 — debrief: an "avoidable repeat speaker" mistake. Each bloc's
// pool of non-slacker present delegates is shared across both papers
// in the opposite role (paper.forGroup === the sibling paper's
// againstGroup, and vice versa — buildPaper() draws forGroup from its
// own bloc and againstGroup from the other, so the two papers'
// opposite-role groups are always the same bloc's pool). Only checked
// once paper 2's (the second-processed paper's) selection for a given
// role completes: if that pool has an eligible delegate who was never
// selected on paper 1, and the player picked 2 who were both already
// used on paper 1 instead, that's a mistake. A pool of exactly 2 (an
// absent non-slacker delegate) means both were necessarily used on
// paper 1 already — unavoidable, not penalized. Fires at most twice
// total (once per bloc's pool, each crossing from paper 1 to paper 2
// exactly once).
function checkAvoidableRepeatSpeaker(paper, kind, arr) {
    const p2 = state.p2;
    const s2 = p2.stage2;
    if (s2.processingIdx !== 1) return; // only paper 2 has a "prior paper" to compare against
    const siblingPaper = s2.papers.find(p => p !== paper);
    const siblingUsed = new Set(kind === "for" ? siblingPaper.againstSpeakers : siblingPaper.forSpeakers);
    const pool = kind === "for" ? paper.forGroup : paper.againstGroup;
    const freshAvailable = pool.some(d => !siblingUsed.has(delegateIndexOf(d)));
    const bothAlreadyUsed = arr.every(idx => siblingUsed.has(idx));
    if (freshAvailable && bothAlreadyUsed) {
        s2.repeatSpeakerMistakes = (s2.repeatSpeakerMistakes || 0) + 1;
    }
}

function updateStage2SelectionCounter() {
    const p2 = state.p2;
    const status = document.getElementById("stage2-selection-status");
    if (!status) return;
    const tally = status.querySelector(".tally");
    if (!tally) return;
    const paper = currentStage2Paper();
    const kind = p2.stage2.selectingKind;
    const arr = kind === "for" ? paper.forSpeakers : paper.againstSpeakers;
    tally.textContent = `${arr.filter(x => x != null).length} / 2`;
}

// ==========================================================
//  PHASE 4 STAGE 3 — FOR/AGAINST SPEECHES, PAPER 1 ONLY (v34)
// ==========================================================
// v34 — replaces the old finishStage2FirstPaper() dead end: once both
// for/against speaker arrays are filled for the first-processed paper,
// the flow now continues straight into these 4 speeches instead of
// stopping. Reuses the Phase 2 mod/RR speech loop's timer/recognition/
// gavel machinery verbatim (startSpeechesRound/applyRecognitionHighlight/
// beginSpeech/tickSpeech/endCurrentSpeech, all untouched) — the only
// new thing is a predetermined speakerOrder instead of one built via
// raise-pool selection, and stage3-specific content lookup inside
// beginSpeech(). See DESIGN.md §8.9.

// Speech order is fixed by array position, per Stage 2's forward-compat
// requirement: forSpeakers[0] -> againstSpeakers[0] -> forSpeakers[1]
// -> againstSpeakers[1]. Even slots are "for", odd slots are "against".
function beginStage3Speeches() {
    const p2 = state.p2;
    const paper = currentStage2Paper();
    p2.speakerOrder = [
        paper.forSpeakers[0], paper.againstSpeakers[0],
        paper.forSpeakers[1], paper.againstSpeakers[1],
    ];
    // Both papers share the passed motion's `seconds` value (v33 §8.8) —
    // speechSecondsForMotion() reads it via the "voting" type branch.
    p2.speakersMotion = p2.stage2.motion;

    startSpeechesRound({ start: 0, end: 3, roundKey: "stage3" });
    // v39 — bugfix: startSpeechesRound() only builds a fresh p2.speeches
    // object the FIRST time it's ever called (so Phase 2's round1 ->
    // round2 transition keeps accumulating into the same log/
    // spokenSlots across both rounds, which is correct there — they
    // share one continuous speakerOrder). Stage 3 calls this once per
    // paper, though, and slot indices 0-3 mean a different set of 4
    // people each time; without this, paper 2's speakers panel opened
    // with every name already struck through, carried over from paper
    // 1's now-irrelevant spokenSlots. Force a fresh one every time.
    p2.speeches.spokenSlots = new Set();
    p2.stage = "stage3_speeches";
    updateMotionsInstructions("Click the highlighted delegate to recognize them.");
    renderStage2SpeakersPanel();
    renderMotionsDais();
    applyRecognitionHighlight();
}

// Resolves one speaker's line from SPEECH_CONTENT. paper.leader already
// encodes which specific paper is on the floor, so keying on it (rather
// than branching on role separately) is what makes the right Power-Del
// variant (leading/dominant vs. non-leading/sloppy-pivot) and Dem-Boy
// variant (glazes-boss vs. empowered) fall out automatically — see the
// SPEECH_CONTENT table's header comment.
function drawStage3SpeechLine(del, slotIdx) {
    const paper = currentStage2Paper();
    const side = slotIdx % 2 === 0 ? "for" : "against";
    const topicBucket = state.p2.priorCaucus.topicBucket;
    const template = SPEECH_CONTENT[topicBucket][paper.leader][side][del.personality];
    return substituteStage3Line(template, del, paper);
}

// Extends the {country}/{boss} convention substituteLine() already uses
// (see the caucus dialogue engine) with {carolinaLeadCountry} and
// {paperName}. {boss} is looked up fresh from both Stage 2 papers'
// blocs (not the speaker's own delegate.boss) so it resolves correctly
// for both the glazing Dem-Boy AND any other role reading a line that
// happens to reference it.
function substituteStage3Line(template, del, paper) {
    const s2 = state.p2.stage2;
    const powerLedPaper = s2.papers.find(p => p.leader === "power");
    const carolinaLedPaper = s2.papers.find(p => p.leader === "carolina");
    const boss = powerLedPaper.bloc.power.country;
    const carolinaLeadCountry = carolinaLedPaper.bloc.carolina.country;
    return template
        .replace(/\{country\}/g, del.country)
        .replace(/\{boss\}/g, boss)
        .replace(/\{carolinaLeadCountry\}/g, carolinaLeadCountry)
        .replace(/\{paperName\}/g, `<strong>${paper.name}</strong>`);
}

// ==========================================================
//  PHASE 4 STAGE 4 — AMENDMENT PERIOD + PAPER VOTE (v38)
// ==========================================================
// v38 — replaces the old finishStage3Paper1() dead end: once a paper's
// 4 speeches conclude, the flow now continues into its amendment period
// (if the passed voting motion has amendment: true) or straight to its
// favor/oppose vote (if amendment: false), then loops back through
// Stage 2 -> Stage 3 -> Stage 4 for paper 2, then a genuine Phase 4
// dead end. See DESIGN.md §8.10. AMENDMENT_PERIOD_SECONDS and
// STAGE4_CENTER_POS are declared up with the other tuning constants.

// Shared by Stage 2's reading button and Stage 4's amendment/paper-vote
// lines: this paper's leader sponsor (Power-Del if power-led, Carolina
// if carolina-led) plus that bloc's Dem-Boy.
function paperSponsors(paper) {
    const sponsor1 = paper.leader === "power" ? paper.bloc.power : paper.bloc.carolina;
    const sponsor2 = paper.bloc.demboy;
    return [sponsor1, sponsor2];
}

// The bloc that did NOT author this paper — i.e. the sibling paper's
// bloc. Stage 2's forGroup/againstGroup already encode this same
// relationship at the delegate-list level; this exposes the BLOC object
// itself, for its .leader/.power/.carolina fields.
function otherBlocForPaper(paper) {
    const s2 = state.p2.stage2;
    return s2.papers.find(p => p !== paper).bloc;
}

function beginStage4() {
    const p2 = state.p2;
    const paper = currentStage2Paper();
    // "Paper 1"/"paper 2" here means processing order, same convention
    // Stage 2/3 already use — not necessarily Bloc A's paper.
    const isFirstPaper = p2.stage2.processingIdx === 0;
    const otherBloc = otherBlocForPaper(paper);
    const submitter = otherBloc.leader === "power" ? otherBloc.power : otherBloc.carolina;
    // v41 — Phase 5 Stage 3 forces both papers' amendments friendly,
    // skipping the unfriendly 2/3-majority vote branch entirely (same
    // as Phase 4's normal friendly path — see handleAmendmentDeclaration()).
    const forcedFriendly = state.phase5 && state.phase5.active;

    p2.stage4 = {
        friendly: forcedFriendly ? true : isFirstPaper,
        submitter,
        favorIdxs: [],
        amendmentTally: null,
        amendmentVerdict: null,
        paperTally: null,
        paperVerdict: null,
    };

    if (p2.stage2.motion.amendment === true) {
        p2.stage = "stage4_announcing_timer";
        updateMotionsInstructions("Bring the amendment period to order.");
    } else {
        p2.stage = "stage4_paper_calling_favor";
        updateMotionsInstructions("No amendment period. Move straight to the paper vote.");
    }
    renderMotionsDais();
}

// Slides the opposing bloc's leader to the center of the room and back,
// reusing the same left/top inline-style + CSS-transition mechanism
// Phase 3's animateIntoBlocs() uses for bloc formation (.delegate-seat's
// existing 0.6s left/top transition, unchanged). Purely a narrative
// beat — no real countdown runs.
function beginAmendmentAnnouncementAnimation() {
    const p2 = state.p2;
    const leaderDel = p2.stage4.submitter;
    const seat = getSeatElement(delegateIndexOf(leaderDel), "committee-room-p2");
    if (seat) {
        const orig = SEAT_POSITIONS[leaderDel.seat];
        seat.style.left = `${STAGE4_CENTER_POS.left}%`;
        seat.style.top = `${STAGE4_CENTER_POS.top}%`;
        setTimeout(() => {
            seat.style.left = `${orig.left}%`;
            seat.style.top = `${orig.top}%`;
        }, 900);
    }
    setTimeout(() => {
        p2.stage = "stage4_reading_amendment";
        renderMotionsDais();
    }, 1600);
}

// Fixed per paper (not randomized): the first-processed paper's
// amendment is always friendly, the second's is always unfriendly.
// Both of the current paper's sponsors get a matching speech bubble.
function handleAmendmentDeclaration() {
    const p2 = state.p2;
    const paper = currentStage2Paper();
    const [sponsor1, sponsor2] = paperSponsors(paper);
    const friendly = p2.stage4.friendly;
    const label = friendly ? "Friendly" : "Unfriendly";
    showSpeechBubble(sponsor1, label, "committee-room-p2");
    showSpeechBubble(sponsor2, label, "committee-room-p2");
    setTimeout(() => {
        clearSpeechBubble(sponsor1, "committee-room-p2");
        clearSpeechBubble(sponsor2, "committee-room-p2");
        if (friendly) {
            p2.stage = "stage4_paper_calling_favor";
            updateMotionsInstructions("Friendly. Move straight to the paper vote.");
        } else {
            p2.stage = "stage4_amendment_vote_announcing";
            updateMotionsInstructions("Unfriendly. Call the vote on the amendment.");
        }
        renderMotionsDais();
    }, 1400);
}

// Unfriendly-amendment vote (2/3 majority). Every present delegate votes
// randomly, except the amendment's submitter (always favor) and the
// paper's two sponsors — the ones who declared it unfriendly — (always
// oppose). No abstentions.
function handleAmendmentCallFavor() {
    const p2 = state.p2;
    const paper = currentStage2Paper();
    const [sponsor1, sponsor2] = paperSponsors(paper);
    const submitterIdx = delegateIndexOf(p2.stage4.submitter);
    const forcedOpposeIdxs = new Set([delegateIndexOf(sponsor1), delegateIndexOf(sponsor2)]);

    const presentDels = state.delegates.filter(d => d.present);
    const totalPresent = presentDels.length;
    const needed = Math.ceil(totalPresent * 2 / 3);

    const favorSet = new Set([submitterIdx]);
    presentDels.forEach(d => {
        const idx = delegateIndexOf(d);
        if (idx === submitterIdx || forcedOpposeIdxs.has(idx)) return;
        if (Math.random() < 0.5) favorSet.add(idx);
    });

    favorSet.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (seat) seat.classList.add("vote-favor");
    });

    p2.stage4.favorIdxs = Array.from(favorSet);
    p2.stage4.amendmentTally = { favor: favorSet.size, needed, totalPresent };
    p2.stage = "stage4_amendment_showing_favor";
    renderMotionsDais();
}

function handleAmendmentCallOppose() {
    const p2 = state.p2;
    const presentDels = state.delegates.filter(d => d.present);
    const favorSet = new Set(p2.stage4.favorIdxs || []);
    const opposeIdxs = [];
    presentDels.forEach(d => {
        const idx = delegateIndexOf(d);
        if (!favorSet.has(idx)) opposeIdxs.push(idx);
    });
    opposeIdxs.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (seat) seat.classList.add("vote-oppose");
    });
    p2.stage4.amendmentTally.oppose = opposeIdxs.length;
    p2.stage4.amendmentVerdict =
        p2.stage4.amendmentTally.favor >= p2.stage4.amendmentTally.needed ? "pass" : "fail";
    p2.stage = "stage4_amendment_showing_result";
    renderMotionsDais();
}

// Paper favor/oppose vote (simple majority). Runs for both friendly and
// unfriendly papers, and regardless of the amendment's outcome — that
// outcome has no downstream effect here. Every present delegate votes
// randomly except the paper's two sponsors, who always vote favor. No
// abstentions.
function handlePaperCallFavor() {
    const p2 = state.p2;
    const paper = currentStage2Paper();
    const [sponsor1, sponsor2] = paperSponsors(paper);
    const sponsor1Idx = delegateIndexOf(sponsor1);
    const sponsor2Idx = delegateIndexOf(sponsor2);

    const presentDels = state.delegates.filter(d => d.present);
    const totalPresent = presentDels.length;
    const needed = Math.floor(totalPresent / 2) + 1;

    const favorSet = new Set([sponsor1Idx, sponsor2Idx]);
    presentDels.forEach(d => {
        const idx = delegateIndexOf(d);
        if (idx === sponsor1Idx || idx === sponsor2Idx) return;
        if (Math.random() < 0.5) favorSet.add(idx);
    });

    favorSet.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (seat) seat.classList.add("vote-favor");
    });

    p2.stage4.favorIdxs = Array.from(favorSet);
    p2.stage4.paperTally = { favor: favorSet.size, needed, totalPresent };
    p2.stage = "stage4_paper_showing_favor";
    renderMotionsDais();
}

function handlePaperCallOppose() {
    const p2 = state.p2;
    const presentDels = state.delegates.filter(d => d.present);
    const favorSet = new Set(p2.stage4.favorIdxs || []);
    const opposeIdxs = [];
    presentDels.forEach(d => {
        const idx = delegateIndexOf(d);
        if (!favorSet.has(idx)) opposeIdxs.push(idx);
    });
    opposeIdxs.forEach(idx => {
        const seat = getSeatElement(idx, "committee-room-p2");
        if (seat) seat.classList.add("vote-oppose");
    });
    p2.stage4.paperTally.oppose = opposeIdxs.length;
    p2.stage4.paperVerdict =
        p2.stage4.paperTally.favor >= p2.stage4.paperTally.needed ? "pass" : "fail";
    p2.stage = "stage4_paper_showing_result";
    renderMotionsDais();
}

// After paper 1's vote: restart the whole Stage 2 -> 3 -> 4 cycle for
// paper 2 via the exact same entry point Stage 2 always used
// (enterStage2Paper), just now reached a second time instead of never.
// After paper 2's vote: Phase 4 is genuinely done for this pass.
function advanceAfterPaperVote() {
    const p2 = state.p2;
    if (p2.stage2.processingIdx === 0) {
        p2.stage4 = null;
        enterStage2Paper(1);
    } else {
        finishPhase4();
    }
}

// v38 — genuine dead end for this pass: both papers have been read,
// debated, and voted on procedurally, but nothing is scored yet.
// Reuses the same #post-motions-screen placeholder pattern every prior
// stage stub in Phase 4 has used.
// v40 — real Phase 4 debrief, replacing the old placeholder. Same
// Phase-2-style formula (uncapped, floor at 0) across 4 categories:
//
// - Wrong disruptiveness pick (Stage 1): p2.orderPicks, same mechanism
//   Phase 2/3 already use, now correctly graded against
//   votingDisruptivenessRank via disruptivenessRank()'s "voting" branch.
// - Avoidable repeat speaker (Stage 2, paper 1 -> paper 2 handoff only):
//   p2.stage2.repeatSpeakerMistakes, tallied live by
//   checkAvoidableRepeatSpeaker() as each paper 2 pool selection
//   completes. Caps out at 2 (one per bloc's pool) by construction.
// - Recognition misclick + speech timing (Stage 3, both papers'
//   8 speeches combined): p2.speeches.log, the exact same shared
//   speech-loop log Phase 2 reads — Stage 3 never cleared it between
//   papers (only spokenSlots resets per paper, v39), so by the time
//   paper 2's speeches conclude it already holds all 8 entries.
//
// Stage 4 (amendment period + paper votes) contributes nothing: it's
// purely procedural/narrated, no player-judgment call to grade.
function finishPhase4() {
    const p2 = state.p2;
    p2.stage = "phase4_done";
    if (p2.speeches && p2.speeches.timerId) {
        clearInterval(p2.speeches.timerId);
        p2.speeches.timerId = null;
    }
    if (p2.speeches && p2.speeches._spamTimer) {
        clearTimeout(p2.speeches._spamTimer);
        p2.speeches._spamTimer = null;
    }
    const _sp = document.getElementById("speakers-panel");
    if (_sp) _sp.hidden = true;
    clearVoteVisuals();

    const orderMistakes  = p2.orderPicks.filter(p => !p.correct).length;
    const repeatMistakes = (p2.stage2 && p2.stage2.repeatSpeakerMistakes) || 0;
    const speechLog      = (p2.speeches && p2.speeches.log) || [];
    const recogMistakes  = speechLog.reduce((s, e) => s + (e.recognitionMisclicks || 0), 0);
    const missedWarns    = speechLog.filter(e => e.warning === "missed").length;
    const lateWarns      = speechLog.filter(e => e.warning === "late").length;
    const gavelMistakes  = speechLog.filter(e => e.gavelDown === "missed").length;

    // v41 — Phase 5 Stage 3 reuses this exact function but shows no
    // debrief screen of its own: stash the mistake tally and hand off
    // to Phase 5's own Best Delegate stage (v42), which itself hands
    // off to the combined debrief once confirmed.
    if (state.phase5 && state.phase5.active) {
        state.phase5.mistakes.voting = {
            orderMistakes, repeatMistakes, recogMistakes, missedWarns, lateWarns, gavelMistakes,
        };
        startPhase5BestDelegate();
        return;
    }

    const totalMistakes = orderMistakes + repeatMistakes + recogMistakes
                        + missedWarns + lateWarns + gavelMistakes;
    const stars = Math.max(0, 3 - totalMistakes);
    state.phaseStars.p4 = stars;

    const clauses = [];
    if (orderMistakes > 0)  clauses.push(`${orderMistakes} wrong disruptiveness pick${orderMistakes > 1 ? "s" : ""}.`);
    if (repeatMistakes > 0) clauses.push(`${repeatMistakes} avoidable repeat speaker${repeatMistakes > 1 ? "s" : ""} called on.`);
    if (recogMistakes > 0)  clauses.push(`${recogMistakes} wrong recognition${recogMistakes > 1 ? "s" : ""}.`);
    if (missedWarns > 0)    clauses.push(`${missedWarns} missed 10-second warning${missedWarns > 1 ? "s" : ""}.`);
    if (lateWarns > 0)      clauses.push(`${lateWarns} late 10-second warning${lateWarns > 1 ? "s" : ""}.`);
    if (gavelMistakes > 0)  clauses.push(`${gavelMistakes} missed gavel-down${gavelMistakes > 1 ? "s" : ""}.`);
    const summary = buildMultilineSummary(clauses, "A masterclass in voting procedure.");

    const starResult = document.querySelector("#post-motions-screen .star-result");
    if (starResult) starResult.style.display = "";

    const titleEl = document.querySelector("#post-motions-screen .phase-title");
    if (titleEl) titleEl.textContent = "Phase 4 Concluded";
    const flavorEl = document.getElementById("post-motions-flavor");
    if (flavorEl) {
        flavorEl.innerHTML =
            `Both directive papers have been read, debated, and voted on.`;
    }
    renderStarBlock("phase2-stars", stars, summary);

    renderPostMotionsScreen("phase4");
    showScreen("post-motions-screen");
}

// ==========================================================
//  PHASE 5 — "TIMED CRISIS" (v41)
// ==========================================================
// v41 — Phases 2, 3, and 4's mechanics run back to back to back, reusing
// the exact same committee (no re-roll) and reusing every stage's own
// underlying mechanism functions completely unmodified: the only
// changes are the small, targeted branches sprinkled through
// generateMotion()/handleCallForMotions()/handleCallFavor()/
// startUnmodCaucus()/beginStage4() above, all gated on state.phase5.
// There is no debrief or transition screen between stages — each
// stage's own normal finish function (finishPhase2()/
// finishPhase3Debrief()/finishPhase4()) already takes an early-return
// branch when state.phase5.active is set (see above), stashing that
// stage's mistake tally and chaining straight into the next stage's
// start function instead of ever touching #post-motions-screen. Only
// after Stage 3 (voting procedure) resolves does showPhase5CombinedDebrief()
// finally show one screen, combining all three stages' tallies into a
// single 3-star scale. See DESIGN.md's Phase 5 section for the full spec.

function startPhase5Stage1() {
    // Pick the forced topic bucket once, here, excluding whichever
    // bucket Phases 2/3/4 used (state.p2.priorCaucus.topicBucket — the
    // same value Phase 4's Stage 2 already reads, still present since
    // nothing has wiped state.p2 since Phase 4 finished). Also resolve
    // Stage 1's rig target: the type OPPOSITE whichever won the real
    // Phase 2 (state.phase2WinningType), defaulting via a coin flip if
    // Phase 2 never actually ran (a straight dev-skip to Phase 5).
    const priorBucket = state.p2 && state.p2.priorCaucus && state.p2.priorCaucus.topicBucket;
    const otherBuckets = Object.keys(PAPER_NAMES).filter(b => b !== priorBucket);
    const topicBucket = otherBuckets.length ? pick(otherBuckets) : pick(Object.keys(PAPER_NAMES));
    const winningType = state.phase2WinningType || pick(["mod", "rr"]);
    const stage1TargetType = winningType === "mod" ? "rr" : "mod";

    state.phase5 = {
        active: true,
        stage: "mod", // "mod" | "unmod" | "voting" — current stage
        topicBucket,
        stage1TargetType,
        mistakes: { mod: null, unmod: null, voting: null },
        bestDelegateMistake: false, // v42 — set by confirmBestDelegate()
    };

    showScreen("motions-screen");
    clearTutorial(); // v47 — a Phase 4 popup must never bleed into Phase 5
    initPhase2State();

    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 5 of 5 · Moderated Caucus";
    const body = document.querySelector(".phase2-body");
    if (body) body.classList.remove("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.remove("hidden-in-caucus");

    // Clear leftover per-delegate flags from earlier phases.
    state.delegates.forEach(d => {
        d.guaranteedBadMod = false;
        d._pendingMotion = null;
        d._forcedUnmodMinutes = null;
        d._forcedVotingCombo = null;
        d._forcedMotionType = null;
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
    // v47 — new, Phase-5-only step (allowInPhase5): fires once, at the
    // very start of the phase, alongside the opening chair prompt above.
    showTutorial("p5_intro");
}

// No transition screen: the chair's opening prompt re-appearing IS the
// transition, right as the phase label silently updates.
function startPhase5Stage2() {
    state.phase5.stage = "unmod";

    showScreen("motions-screen");
    initPhase2State();
    state.p2.unmodMode = true;
    state.p2.votingMode = false;

    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 5 of 5 · Unmoderated Caucus";
    const body = document.querySelector(".phase2-body");
    if (body) body.classList.remove("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.remove("hidden-in-caucus");

    state.delegates.forEach(d => {
        d.guaranteedBadMod = false;
        d._pendingMotion = null;
        d._forcedUnmodMinutes = null;
        d._forcedVotingCombo = null;
        d._forcedMotionType = null;
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

function startPhase5Stage3() {
    state.phase5.stage = "voting";
    // Stashes Stage 2's fresh blocs/topicBucket (the forced bucket,
    // unchanged since startUnmodCaucus() set it) across the wipe below —
    // same pattern startPhase4() itself uses.
    const priorCaucus = state.p2 && state.p2.caucus;

    showScreen("motions-screen");
    initPhase2State();
    state.p2.votingMode = true;
    state.p2.unmodMode = false;
    state.p2.priorCaucus = priorCaucus;

    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 5 of 5 · Voting Procedure";
    const body = document.querySelector(".phase2-body");
    if (body) body.classList.remove("caucus-mode");
    const agenda = document.querySelector(".agenda-panel");
    if (agenda) agenda.classList.remove("hidden-in-caucus");

    state.delegates.forEach(d => {
        d.guaranteedBadMod = false;
        d._pendingMotion = null;
        d._forcedUnmodMinutes = null;
        d._forcedVotingCombo = null;
        d._forcedMotionType = null;
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

// v42 — Best Delegate stage: inserted right after Stage 3 (voting
// procedure) resolves and right before the combined debrief. Reuses
// the same #motions-screen/#motions-dais-bar every other stage does,
// but skips initPhase2State() entirely — this doesn't need a fresh
// state.p2, just a new stage value and one scratch field on the
// existing one. Room stays in normal seating (never re-entered
// caucus/bloc-huddle mode since Stage 3), no extra render needed.
function startPhase5BestDelegate() {
    const p2 = state.p2;
    p2.stage = "phase5_best_delegate";
    p2.bestDelegateIdx = null;

    const label = document.getElementById("motions-phase-label");
    if (label) label.textContent = "Phase 5 of 5 · Best Delegate";

    // Clear Stage 3's leftover interactive seat state, then wire every
    // PRESENT delegate's seat clickable (absent ones stay inert).
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("raised", "raised-voting", "requesting",
                           "vote-favor", "vote-oppose", "active",
                           "awaiting-recognition", "misclick-seat", "leader-guess",
                           "bloc-guess-p3", "bloc-guess-p5");
        s.removeEventListener("click", onBestDelegateSeatClick);
        const idx = parseInt(s.dataset.index, 10);
        const del = state.delegates[idx];
        if (!del || !del.present) return;
        s.addEventListener("click", onBestDelegateSeatClick);
        // v47 — item 7: reuses the existing raised-placard hover glow
        // verbatim (.delegate-seat.raised:not(.active):hover in
        // style.css) rather than inventing a new one; purely cosmetic,
        // the actual pick is still handled by onBestDelegateSeatClick.
        s.classList.add("raised");
        // v47 — item 6: bloc-leader memory badges. Reference only (every
        // guess the player made, right or wrong, from both caucuses);
        // never restricts or auto-fills the actual Gavel pick.
        if ((state.phase3BlocGuesses || []).includes(idx)) s.classList.add("bloc-guess-p3");
        if ((state.phase5BlocGuesses || []).includes(idx)) s.classList.add("bloc-guess-p5");
    });

    updateMotionsInstructions("Click the delegate who deserves Best Delegate.");
    renderMotionsDais();
    // v47 — new, Phase-5-only step (allowInPhase5): the full ceremonial
    // line that used to live permanently in the dais prompt above.
    showTutorial("p5_gavel");
}

// Selection is swap-able before confirming: clicking a different
// delegate moves the gold glow, it never adds to it. Reuses Phase 3's
// .leader-guess visual treatment verbatim (no new CSS) — minus its
// persistent-until-caucus-ends behavior, since this is a single
// confirm-once action with no timer to survive.
function onBestDelegateSeatClick(e) {
    const p2 = state.p2;
    if (p2.stage !== "phase5_best_delegate") return;
    const seat = e.currentTarget;
    const idx = parseInt(seat.dataset.index, 10);

    if (p2.bestDelegateIdx != null) {
        const prevSeat = getSeatElement(p2.bestDelegateIdx, "committee-room-p2");
        if (prevSeat) prevSeat.classList.remove("leader-guess");
    }
    p2.bestDelegateIdx = idx;
    seat.classList.add("leader-guess");
    renderMotionsDais();
}

// The correct answer: the CarolinaMUN-style delegate who led one of
// the two blocs — the same individual from the ORIGINAL Phase 3
// caucus (state.phase3Blocs), since bloc leadership persists across
// the whole session and is never re-rolled for Phase 5 (see
// startUnmodCaucus()'s v42 bloc-reuse branch).
function bestDelegateCorrectIdx() {
    const blocs = state.phase3Blocs;
    if (!blocs) return -1;
    const carolinaLedBloc = blocs.find(b => b.leader === "carolina");
    if (!carolinaLedBloc || !carolinaLedBloc.carolina) return -1;
    return delegateIndexOf(carolinaLedBloc.carolina);
}

function confirmBestDelegate() {
    const p2 = state.p2;
    if (p2.bestDelegateIdx == null) return;

    // Wrong pick (including no pick, if ever reachable) costs one
    // mistake under the combined debrief's "Overall" heading; a
    // correct pick contributes nothing.
    state.phase5.bestDelegateMistake = p2.bestDelegateIdx !== bestDelegateCorrectIdx();

    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("leader-guess");
        s.removeEventListener("click", onBestDelegateSeatClick);
    });

    showPhase5CombinedDebrief();
}

// One combined debrief for the entire phase, shown once after the Best
// Delegate stage resolves. Each earlier stage's mistake tally was
// already computed and stashed by that stage's own unchanged internal
// formula — this just sums them (plus the Best Delegate pick) into a
// single 3-star scale and groups their clauses under four headings.
function showPhase5CombinedDebrief() {
    const m = state.phase5.mistakes;

    const modTotal = m.mod.orderMistakes + m.mod.repeatMistakes + m.mod.recogMistakes
                   + m.mod.missedWarns + m.mod.lateWarns + m.mod.gavelMistakes;
    const unmodTimingMistake = (m.unmod.warnMissed || m.unmod.warnLate || m.unmod.gavelMissed) ? 1 : 0;
    const unmodTotal = m.unmod.blocMistakes + unmodTimingMistake;
    const votingTotal = m.voting.orderMistakes + m.voting.repeatMistakes + m.voting.recogMistakes
                       + m.voting.missedWarns + m.voting.lateWarns + m.voting.gavelMistakes;
    // v42 — Best Delegate: wrong pick (including no pick, if ever
    // reachable) costs one mistake here, folded into the same total.
    const overallTotal = state.phase5.bestDelegateMistake ? 1 : 0;

    const totalMistakes = modTotal + unmodTotal + votingTotal + overallTotal;
    const stars = Math.max(0, 3 - totalMistakes);
    state.phaseStars.p5 = stars;

    const modClauses = [];
    if (m.mod.orderMistakes > 0)  modClauses.push(`${m.mod.orderMistakes} wrong order pick${m.mod.orderMistakes > 1 ? "s" : ""}.`);
    if (m.mod.repeatMistakes > 0) modClauses.push(`${m.mod.repeatMistakes} repeat speaker${m.mod.repeatMistakes > 1 ? "s" : ""} called on.`);
    if (m.mod.recogMistakes > 0)  modClauses.push(`${m.mod.recogMistakes} wrong recognition${m.mod.recogMistakes > 1 ? "s" : ""}.`);
    if (m.mod.missedWarns > 0)    modClauses.push(`${m.mod.missedWarns} missed 10-second warning${m.mod.missedWarns > 1 ? "s" : ""}.`);
    if (m.mod.lateWarns > 0)      modClauses.push(`${m.mod.lateWarns} late 10-second warning${m.mod.lateWarns > 1 ? "s" : ""}.`);
    if (m.mod.gavelMistakes > 0)  modClauses.push(`${m.mod.gavelMistakes} missed gavel-down${m.mod.gavelMistakes > 1 ? "s" : ""}.`);

    const unmodClauses = [];
    if (m.unmod.blocMistakes === 1) unmodClauses.push("1 bloc leader missed or misread.");
    if (m.unmod.blocMistakes === 2) unmodClauses.push("Both bloc leaders missed or misread.");
    if (m.unmod.warnMissed) unmodClauses.push("Never gave the one-minute warning.");
    if (m.unmod.warnLate)   unmodClauses.push("Gave the one-minute warning late.");
    if (m.unmod.gavelMissed) unmodClauses.push("Caucus ran over, no gavel-down.");

    const votingClauses = [];
    if (m.voting.orderMistakes > 0)  votingClauses.push(`${m.voting.orderMistakes} wrong disruptiveness pick${m.voting.orderMistakes > 1 ? "s" : ""}.`);
    if (m.voting.repeatMistakes > 0) votingClauses.push(`${m.voting.repeatMistakes} avoidable repeat speaker${m.voting.repeatMistakes > 1 ? "s" : ""} called on.`);
    if (m.voting.recogMistakes > 0)  votingClauses.push(`${m.voting.recogMistakes} wrong recognition${m.voting.recogMistakes > 1 ? "s" : ""}.`);
    if (m.voting.missedWarns > 0)    votingClauses.push(`${m.voting.missedWarns} missed 10-second warning${m.voting.missedWarns > 1 ? "s" : ""}.`);
    if (m.voting.lateWarns > 0)      votingClauses.push(`${m.voting.lateWarns} late 10-second warning${m.voting.lateWarns > 1 ? "s" : ""}.`);
    if (m.voting.gavelMistakes > 0)  votingClauses.push(`${m.voting.gavelMistakes} missed gavel-down${m.voting.gavelMistakes > 1 ? "s" : ""}.`);

    // v42 — the only clause the "Overall" heading ever shows.
    const overallClauses = [];
    if (state.phase5.bestDelegateMistake) overallClauses.push("Misidentified Best Delegate.");

    const sections = [
        { heading: "Moderated Caucus", clauses: modClauses },
        { heading: "Unmoderated Caucus", clauses: unmodClauses },
        { heading: "Voting Procedure", clauses: votingClauses },
        { heading: "Overall", clauses: overallClauses },
    ];
    const nonEmpty = sections.filter(s => s.clauses.length > 0);
    const summary = nonEmpty.length
        ? nonEmpty
            .map(s => `<div class="mistake-heading">${s.heading}</div>` + s.clauses.map(c => `<div>${c}</div>`).join(""))
            .join("")
        : `<div>A flawless crisis, gavel to gavel.</div>`;

    const starResult = document.querySelector("#post-motions-screen .star-result");
    if (starResult) starResult.style.display = "";

    const titleEl = document.querySelector("#post-motions-screen .phase-title");
    if (titleEl) titleEl.textContent = "Phase 5 Concluded";
    const flavorEl = document.getElementById("post-motions-flavor");
    if (flavorEl) {
        flavorEl.innerHTML =
            `Moderated caucus, unmoderated caucus, and voting procedure, back to back with no stops.`;
    }
    renderStarBlock("phase2-stars", stars, summary);

    renderPostMotionsScreen("phase5");
    showScreen("post-motions-screen");
}

// ----- Stage 2 speakers-panel rendering -----
// v33 — the motions agenda (#agenda-list) is left alone through Stage 2:
// it already shows the 3 motions with pass/fail styling exactly like
// Phase 2, and nothing about entering Stage 2 should clear or replace it
// (renderAgenda() is called once on entry purely for robustness; nothing
// in Stage 2 touches #agenda-list again after that). For/against
// selection reuses the existing #speakers-panel/#speakers-list sidebar
// (the same one Phase 2's mod speeches populate) instead of inventing new
// markup inside the agenda: paper name goes in the existing
// #speakers-motion-label slot, then a "For:"/"Against:" grouped,
// independently-numbered list (1./2. each). Numbering is written
// explicitly per slot (i + 1) rather than via the speakers-list's shared
// CSS counter — a per-group counter-reset on the subheader row did NOT
// actually restart the shared counter for later siblings in testing (it
// kept counting 1,2,3,4 straight through both groups), so this sidesteps
// that entirely instead of relying on a counter-scoping behavior that
// didn't hold up.
function renderStage2SpeakersPanel(justFilledSlot) {
    const panel = document.getElementById("speakers-panel");
    const list = document.getElementById("speakers-list");
    const label = document.getElementById("speakers-motion-label");
    const p2 = state.p2;
    const s2 = p2.stage2;
    if (!panel || !list || !s2) return;

    const paper = currentStage2Paper();
    panel.hidden = false;
    if (label) label.textContent = paper.name;

    const kind = s2.selectingKind;
    // v36 — during Stage 3 speeches, slot highlighting mirrors Phase 2's
    // renderSpeakersList() exactly (current-speaker/active-speaker/
    // spoken), keyed off the GLOBAL speakerOrder slot each name occupies:
    // forSpeakers[i] -> slot i*2, againstSpeakers[i] -> slot i*2 + 1 (the
    // fixed for->against->for->against order beginStage3Speeches() uses).
    const sp = p2.stage === "stage3_speeches" ? p2.speeches : null;
    list.innerHTML = "";
    if (paper._forStarted) {
        list.appendChild(buildSpeakersSubheader("For:"));
        paper.forSpeakers.forEach((idx, i) => {
            list.appendChild(buildStage2SpeakerSlot(idx, i, kind === "for" && i === justFilledSlot, sp, i * 2));
        });
    }
    if (paper._againstStarted) {
        list.appendChild(buildSpeakersSubheader("Against:"));
        paper.againstSpeakers.forEach((idx, i) => {
            list.appendChild(buildStage2SpeakerSlot(idx, i, kind === "against" && i === justFilledSlot, sp, i * 2 + 1));
        });
    }
}

function buildSpeakersSubheader(text) {
    const li = document.createElement("li");
    li.className = "speakers-subheader";
    li.textContent = text;
    return li;
}

function buildStage2SpeakerSlot(idx, i, justFilled, sp, globalSlot) {
    const li = document.createElement("li");
    li.className = "stage2-slot";
    const num = document.createElement("span");
    num.className = "speakers-num";
    num.textContent = `${i + 1}.`;
    li.appendChild(num);
    if (idx == null) {
        li.classList.add("empty-slot");
    } else {
        const nameSpan = document.createElement("span");
        nameSpan.textContent = state.delegates[idx].country;
        li.appendChild(nameSpan);
        if (justFilled) li.classList.add("just-filled");
        if (sp) {
            if (sp.spokenSlots && sp.spokenSlots.has(globalSlot)) {
                li.classList.add("spoken");
            }
            if (sp.mode === "recognizing" && globalSlot === sp.currentSlot) {
                li.classList.add("current-speaker");
            } else if (sp.mode === "speaking" && globalSlot === sp.currentSlot) {
                li.classList.add("active-speaker");
            }
        }
    }
    return li;
}

// ==========================================================
//  PHASE 3 — STAGE C: UNMOD CAUCUS (v23)
// ==========================================================

function startUnmodCaucus(motion) {
    const p2 = state.p2;
    p2.stage = "unmod_caucus";
    // v47 — a popup from the motions/vote stage just before this (real
    // Phase 3), or Phase 5's own p5_intro if the player never dismissed
    // it (Phase 5 Stage 2's entry, startPhase5Stage2(), doesn't clear),
    // must never bleed into the caucus below.
    clearTutorial();

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

    // v42 — Build blocs. Phase 5's Stage 2 reuses the ORIGINAL Phase 3
    // bloc assignment (bloc leadership persists across the whole
    // session — Phase 5's own Best Delegate stage depends on this)
    // instead of calling assignBlocs() fresh; falls back to a fresh
    // call only if Phase 3 never actually ran (a straight dev-skip to
    // Phase 5). The real Phase 3 (every other caller) builds fresh
    // blocs as always and stashes them as that original for later.
    let blocs;
    if (state.phase5 && state.phase5.active) {
        blocs = state.phase3Blocs || assignBlocs();
        // If Phase 3 never actually ran (dev-skip straight to Phase 5),
        // still let the Best Delegate stage reference whatever blocs
        // Stage 2's caucus actually ends up using, rather than finding
        // nothing later and treating every pick as wrong.
        if (!state.phase3Blocs) state.phase3Blocs = blocs;
    } else {
        blocs = assignBlocs();
        state.phase3Blocs = blocs;
    }
    // v41 — Phase 5 forces one single bucket for the whole phase
    // (state.phase5.topicBucket, picked once in startPhase5Stage1());
    // every other caller keeps deriving it from Phase 2's winning
    // motion topic as before.
    const bucket = (state.phase5 && state.phase5.active)
        ? state.phase5.topicBucket
        : (TOPIC_BUCKETS[(p2.priorTopic && p2.priorTopic.long) || ""] || "substance");
    blocs.forEach(bloc => {
        const key = bloc.leader === "power" ? "powerLed" : "carolinaLed";
        bloc.script = CAUCUS_CONVOS[bucket][key];
        bloc.turnIdx = 0;
        bloc.turnTimer = null;
        bloc.currentBubble = null;
        bloc.overlappingBubble = null;
        // v42 — reset the player's guess too: if these bloc objects are
        // being reused from Phase 3 (the branch above), guessIdx would
        // otherwise still hold Phase 3's actual final guess. Harmless
        // no-op for fresh blocs, which already start with guessIdx: null.
        bloc.guessIdx = null;
        // v32 — fast-forward toggle-safe rescaling bookkeeping for whatever
        // dialogue lifecycle step is currently in flight (see
        // scheduleFFAwareStep/rescaleActiveCaucusStep).
        bloc._stepNominalMs = null;
        bloc._stepStartedAt = null;
        bloc._stepFFAtStart = null;
        bloc._stepCallback = null;
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
    showTutorial("p3_intro", "#committee-room-p2");
    showTutorial("p3_timer", ".speech-dais");
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

// ----- Fast-forward toggle-safe step scheduling (v32) -----
// Dialogue turn timing used to be raw nested setTimeout calls with fixed
// durations baked in at schedule time; a rate change (FF toggling on/off)
// couldn't affect an already-in-flight timeout, causing a stutter/desync
// between the timer and dialogue speed. Every dialogue wait now goes
// through scheduleFFAwareStep, which records enough bookkeeping (nominal
// 1x duration, when the step started, and the FF rate that was active at
// that moment) for rescaleActiveCaucusStep to cancel an in-flight wait and
// reschedule the *remaining* nominal time at whatever rate is current.
function isCaucusFFActive() {
    const sp = state.p2 && state.p2.speeches;
    return !!(sp && sp.caucusMode && sp.ffActive);
}

function scheduleFFAwareStep(blocIdx, nominalMs, callback) {
    const bloc = state.p2.caucus.blocs[blocIdx];
    const ff = isCaucusFFActive();
    bloc._stepNominalMs = nominalMs;
    bloc._stepStartedAt = performance.now();
    bloc._stepFFAtStart = ff;
    bloc._stepCallback = callback;
    const delay = Math.max(0, ff ? nominalMs / CAUCUS_FF_MULTIPLIER : nominalMs);
    bloc.turnTimer = setTimeout(() => {
        bloc._stepNominalMs = null;
        bloc._stepStartedAt = null;
        bloc._stepFFAtStart = null;
        bloc._stepCallback = null;
        bloc.turnTimer = null;
        callback();
    }, delay);
}

// Called whenever FF toggles (manual click or auto-revert). Only the
// currently-active bloc can have a live dialogue timer, so this rescales
// that one step in place; the inactive bloc has no running timer to touch
// and will simply pick up the current FF state whenever it next activates.
function rescaleActiveCaucusStep() {
    const c = state.p2.caucus;
    if (!c || c.activeIdx == null) return;
    const blocIdx = c.activeIdx;
    const bloc = c.blocs[blocIdx];
    if (bloc._stepNominalMs == null || !bloc.turnTimer) return;
    const now = performance.now();
    const elapsedReal = now - bloc._stepStartedAt;
    const elapsedNominal = elapsedReal * (bloc._stepFFAtStart ? CAUCUS_FF_MULTIPLIER : 1);
    const remainingNominal = Math.max(0, bloc._stepNominalMs - elapsedNominal);
    clearTimeout(bloc.turnTimer);
    bloc.turnTimer = null;
    const callback = bloc._stepCallback;
    scheduleFFAwareStep(blocIdx, remainingNominal, callback);
}

function scheduleLifecycle(blocIdx, idx, elapsedMs = 0) {
    const bloc = state.p2.caucus.blocs[blocIdx];
    const entry = bloc.script[idx];
    const hasNext = idx + 1 < bloc.script.length;
    const cutoff = hasNext && isCutoffLine(entry.line);

    if (cutoff) {
        const toOverlap = Math.max(0, CAUCUS_CUTOFF_OVERLAP_MS - elapsedMs);
        scheduleFFAwareStep(blocIdx, toOverlap, () => {
            displayTurn(blocIdx, idx + 1, { asOverlap: true });
            const toHide = CAUCUS_BUBBLE_VISIBLE_MS - CAUCUS_CUTOFF_OVERLAP_MS;
            scheduleFFAwareStep(blocIdx, toHide, () => {
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
            });
        });
    } else {
        const toHide = Math.max(0, CAUCUS_BUBBLE_VISIBLE_MS - elapsedMs);
        scheduleFFAwareStep(blocIdx, toHide, () => {
            clearCaucusBubbleRef(bloc.currentBubble);
            bloc.currentBubble = null;
            scheduleFFAwareStep(blocIdx, CAUCUS_BUBBLE_GAP_MS, () => {
                bloc.turnIdx = idx + 1;
                if (!hasNext) return; // script done; hold silent
                displayTurn(blocIdx, idx + 1);
                scheduleLifecycle(blocIdx, idx + 1, 0);
            });
        });
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
    // v32 — also clear FF step bookkeeping so a stale in-flight-step record
    // from before this pause can't be misread by rescaleActiveCaucusStep()
    // if this bloc reactivates and FF gets toggled during its hover-in
    // delay (before scheduleLifecycle has scheduled a fresh tracked step).
    bloc._stepNominalMs = null;
    bloc._stepStartedAt = null;
    bloc._stepFFAtStart = null;
    bloc._stepCallback = null;
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
    sp.ffActive = false; // v32 — fast-forward toggle, off by default
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
    // v32 — fast-forward toggle. Appears the moment the caucus clock
    // starts (phase "pre") and disappears entirely (not just disabled)
    // once the timer hits 0:00; see tickSpeech's zero-transition, which
    // triggers the re-render that omits this markup. Icon-only (two
    // right-facing triangles, the conventional fast-forward glyph); no
    // "3x" label.
    const ffButtonHTML = sp.phase !== "zero"
        ? `<button class="caucus-ff-btn${sp.ffActive ? " active" : ""}" id="caucus-ff-btn"
                   aria-pressed="${sp.ffActive ? "true" : "false"}" aria-label="Fast-forward" title="Fast-forward">
               <span class="caucus-ff-icon">&#9193;</span>
           </button>`
        : "";
    wrap.innerHTML = `
        ${ffButtonHTML}
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
    const ffbtn = wrap.querySelector("#caucus-ff-btn");
    if (ffbtn) ffbtn.addEventListener("click", onCaucusFFClick);
    const gbtn = wrap.querySelector("#gavel-btn");
    if (gbtn) gbtn.addEventListener("click", onGavelClick);
}

// ----- Fast-forward button (v32) -----
// Sets sp.ffActive and rescales whatever dialogue step is currently in
// flight for the active bloc; patches the button's own DOM in place
// rather than doing a full renderMotionsDais() re-render (matching the
// gavel button's pattern of direct DOM updates on click), so toggling FF
// doesn't disturb the timer/thud-layer mid-tick. Called both from the
// manual click handler and from tickSpeech's pre->warn auto-revert.
function setCaucusFF(active) {
    const sp = state.p2 && state.p2.speeches;
    if (!sp || sp.ffActive === active) return;
    sp.ffActive = active;
    rescaleActiveCaucusStep();
    const btn = document.getElementById("caucus-ff-btn");
    if (btn) {
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
}

function onCaucusFFClick() {
    const sp = state.p2 && state.p2.speeches;
    if (!sp || !sp.caucusMode || sp.mode !== "speaking") return;
    if (sp.phase === "zero") return; // button shouldn't even be rendered here
    setCaucusFF(!sp.ffActive);
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

    // v47 — stash the player's raw guesses (right or wrong — this is a
    // memory aid for Phase 5's Gavel stage, not a correctness reveal)
    // while guessIdx still holds this caucus's actual picks, before
    // anything later ever has a chance to touch it again.
    const blocGuesses = caucus.blocs.map(b => b.guessIdx).filter(idx => idx != null);

    // Timing mistake: any of missed warning / late warning / missed gavel-down.
    const warnMissed = sp.warning === "missed";
    const warnLate   = sp.warning === "late";
    const gavelMissed = sp.finalGavelDown === "missed";
    const timingMistake = (warnMissed || warnLate || gavelMissed) ? 1 : 0;

    // Clean up caucus UI — shared by both the Phase 5 chain-through
    // branch below and the normal Phase 3 debrief.
    document.querySelectorAll("#committee-room-p2 .delegate-seat").forEach(s => {
        s.classList.remove("caucus-clickable", "leader-guess");
        s.removeEventListener("click", onCaucusDelegateClick);
    });

    // v41 — Phase 5 Stage 2 reuses this exact function but shows no
    // debrief screen of its own: stash the raw mistake booleans (so the
    // combined debrief can reproduce these exact clause texts) and
    // chain straight into Stage 3 (voting procedure) instead.
    if (state.phase5 && state.phase5.active) {
        state.phase5BlocGuesses = blocGuesses;
        state.phase5.mistakes.unmod = { blocMistakes, warnMissed, warnLate, gavelMissed };
        startPhase5Stage3();
        return;
    }

    state.phase3BlocGuesses = blocGuesses;
    const stars = Math.max(0, 3 - blocMistakes - timingMistake);
    state.phaseStars.p3 = stars;

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
    } else if (phase === "phase3") {
        // v30 — was "Adjourn & Restart" / page reload; now hands off to
        // Phase 4 Stage 1 instead.
        fresh.textContent = "Proceed to Voting Procedure →";
        fresh.addEventListener("click", startPhase4);
    } else if (phase === "phase4") {
        // v43 — Phase 4's debrief used to be the true end of the game
        // (Phase 5 was dev-panel-only). Now it hands off into Phase 5,
        // "Timed Crisis," exactly like "phase2"/"phase3" hand off into
        // the next phase — this is the only place a real playthrough
        // ever reaches state.phase5.active = true. finishPhase4() never
        // calls renderPostMotionsScreen("phase4") when a Phase 5 run is
        // already in progress (its own early-return branch goes to
        // startPhase5BestDelegate() instead), so this case is only ever
        // hit once per session.
        fresh.textContent = "Proceed to Timed Crisis →";
        fresh.addEventListener("click", startPhase5Stage1);
    } else if (phase === "phase5") {
        // v45 — Phase 5's own debrief no longer ends the game directly;
        // it now hands off to the new global, whole-session debrief.
        fresh.textContent = "Next →";
        fresh.addEventListener("click", showGlobalDebrief);
    } else {
        // Fallback for any future terminal phase.
        fresh.textContent = "Adjourn & Restart";
        fresh.addEventListener("click", () => location.reload());
    }
}

// ==========================================================
//  GLOBAL DEBRIEF (v45) — whole-session summary across all 5 phases
// ==========================================================
const GLOBAL_DEBRIEF_PHASES = [
    { key: "p1", label: "Phase 1 — Roll Call" },
    { key: "p2", label: "Phase 2 — Moderated Caucus" },
    { key: "p3", label: "Phase 3 — Unmoderated Caucus" },
    { key: "p4", label: "Phase 4 — Voting Procedure" },
    { key: "p5", label: "Phase 5 — Timed Crisis" },
];
const CHAIR_AWARD_FORM_URL = "https://forms.gle/opNfNUkK4ceyA7nJ8";

function buildGlobalDebriefRow(label, stars) {
    const row = document.createElement("div");
    row.className = "global-debrief-row";

    const labelEl = document.createElement("span");
    labelEl.className = "global-debrief-label";
    labelEl.textContent = label;
    row.appendChild(labelEl);

    if (stars == null) {
        const notPlayed = document.createElement("span");
        notPlayed.className = "global-debrief-not-played";
        notPlayed.textContent = "Not Played";
        row.appendChild(notPlayed);
    } else {
        const starsWrap = document.createElement("span");
        starsWrap.className = "global-debrief-stars";
        // Reuses renderStarBlock()'s exact star SVG/markup and its
        // .star.earned/.missed color rules; .global-debrief-star (CSS)
        // just shrinks them to fit five rows on one screen.
        for (let i = 0; i < 3; i++) {
            const star = document.createElement("span");
            star.className = `star global-debrief-star ${i < stars ? "earned" : "missed"}`;
            star.innerHTML = `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 2.2l2.95 6.36 6.9.72-5.2 4.72 1.5 6.86L12 17.3l-6.15 3.56 1.5-6.86-5.2-4.72 6.9-.72z"/>
                </svg>`;
            starsWrap.appendChild(star);
        }
        row.appendChild(starsWrap);
    }
    return row;
}

// A phase reached only via a dev-panel skip (its real debrief never
// ran) leaves its state.phaseStars entry null forever — shown as "Not
// Played" above, and here it simply fails the `=== 3` check like any
// other non-3 value, so a dev-skipped session can never read as perfect.
function showGlobalDebrief() {
    clearTutorial(); // v47 — a Phase 5 popup must never bleed into this screen
    const rowsEl = document.getElementById("global-debrief-rows");
    const messageEl = document.getElementById("global-debrief-message");
    const awardBtn = document.getElementById("chair-award-btn");
    const screenshotHint = document.getElementById("global-debrief-screenshot-hint");

    rowsEl.innerHTML = "";
    GLOBAL_DEBRIEF_PHASES.forEach(({ key, label }) => {
        rowsEl.appendChild(buildGlobalDebriefRow(label, state.phaseStars[key]));
    });

    const [p1, p2, p3, p4, p5] = GLOBAL_DEBRIEF_PHASES.map(({ key }) => state.phaseStars[key]);
    const perfect = [p1, p2, p3, p4, p5].every(s => s === 3);

    // v48 — the button is always visible now; only its disabled state
    // (never "hidden") gates whether it can be clicked.
    awardBtn.disabled = !perfect;
    if (perfect) {
        messageEl.textContent = "A perfect committee! Claim your Chair Award.";
        screenshotHint.hidden = false;
    } else {
        messageEl.textContent = "Replay committee until you earn three stars in every phase, then come back to claim your Chair Award for full credit.";
        screenshotHint.hidden = true;
    }

    showScreen("global-debrief-screen");
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
// v45 — #global-debrief-screen's own restart button is static markup
// (unlike #restart-btn, it's never reused for a different phase), so
// it gets one static listener here instead.
document.getElementById("global-restart-btn").addEventListener("click", () => location.reload());
// v48 — entirely separate listener, on a separate element, from the
// restart button above: this one only ever opens the form in a new tab
// (never reloads/resets this one). Disabled via the DOM `disabled`
// attribute (set in showGlobalDebrief()), which browsers already refuse
// to dispatch "click" for, so no !perfect check is needed here too.
document.getElementById("chair-award-btn").addEventListener("click", () => {
    window.open(CHAIR_AWARD_FORM_URL, "_blank");
});

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
    if (phase === 4) {
        devAutoCompletePhase1();
        // v33 — Stage 2 builds its two papers from Phase 3's bloc
        // assignment (state.p2.caucus.blocs/topicBucket), which doesn't
        // exist on a fresh dev-skip. Fake a minimal caucus shell via
        // assignBlocs() directly, mirroring how Phase 3's dev-skip fakes
        // a speakersMotion.topic for the caucus dialogue bucket.
        state.p2 = {
            caucus: {
                blocs: assignBlocs(),
                topicBucket: pick(Object.keys(PAPER_NAMES)),
            },
        };
        startPhase4();
        return;
    }
    if (phase === 5) {
        // v41 — unlike Phases 3/4's dev-skips, Stage 1 itself needs no
        // faked bloc/caucus data (Stage 2's own startUnmodCaucus()
        // generates fresh blocs when IT runs, same as normal play);
        // startPhase5Stage1() already degrades gracefully to "no prior
        // bucket to exclude" when state.p2 is empty like this.
        devAutoCompletePhase1();
        state.p2 = {};
        startPhase5Stage1();
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
// v49 \u2014 pulled out of initDisruptivenessKey()'s closure (top-level now,
// not just click/Escape-handler-local) so showTutorial()'s p2_disruptiveness/
// p4_intro call site and selectMotionForVote() can also open/close the
// Key, not just the toggle button itself.
function openDisruptivenessKey() {
    const btn = document.getElementById("key-toggle-btn");
    const popup = document.getElementById("key-popup");
    if (!btn || !popup) return;
    // v40 \u2014 two static #key-rows blocks live side by side in #key-popup;
    // only one is ever shown, picked fresh each time the popup opens so
    // it always matches whichever phase is currently active. Phase 2/3's
    // block (#key-rows-p23) and its content are completely untouched.
    const rowsP23 = document.getElementById("key-rows-p23");
    const rowsP4 = document.getElementById("key-rows-p4");
    if (rowsP23 && rowsP4) {
        const isPhase4 = !!(state.p2 && state.p2.votingMode);
        rowsP23.classList.toggle("hidden", isPhase4);
        rowsP4.classList.toggle("hidden", !isPhase4);
    }
    popup.classList.remove("hidden");
    btn.classList.add("active");
    btn.setAttribute("aria-expanded", "true");
    btn.innerHTML = "Disruptiveness Key \u25B4";
    // v49 \u2014 openDisruptivenessKey() is now also called from OTHER
    // buttons' click handlers (the "ready_to_vote" one, auto-opening
    // alongside p2_disruptiveness/p4_intro), not just the toggle button
    // itself (which stops its own click from propagating). That same
    // click then bubbles to the outside-click listener below, which
    // would otherwise close the Key the instant it opened. Same
    // suppress-the-opening-click pattern as the tutorial popup's
    // _tutorialJustShown.
    state._keyJustOpened = true;
    setTimeout(() => { state._keyJustOpened = false; }, 0);
}
function closeDisruptivenessKey() {
    const btn = document.getElementById("key-toggle-btn");
    const popup = document.getElementById("key-popup");
    if (!btn || !popup) return;
    popup.classList.add("hidden");
    btn.classList.remove("active");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "Disruptiveness Key \u25BE";
}

(function initDisruptivenessKey() {
    const btn = document.getElementById("key-toggle-btn");
    const popup = document.getElementById("key-popup");
    if (!btn || !popup) return;

    function toggleKey(e) {
        e.stopPropagation();
        if (popup.classList.contains("hidden")) openDisruptivenessKey();
        else closeDisruptivenessKey();
    }

    btn.addEventListener("click", toggleKey);

    document.addEventListener("click", (e) => {
        if (popup.classList.contains("hidden")) return;
        if (state._keyJustOpened) return;
        if (popup.contains(e.target) || btn.contains(e.target)) return;
        closeDisruptivenessKey();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !popup.classList.contains("hidden")) {
            closeDisruptivenessKey();
        }
    });
})();

// ---------- TUTORIAL OVERLAY WIRING (v44) ----------
(function initTutorialOverlay() {
    const popup = document.getElementById("tutorial-popup");
    const dismissBtn = document.getElementById("tutorial-dismiss-btn");
    if (dismissBtn) dismissBtn.addEventListener("click", dismissTutorial);

    // Non-blocking: clicking the real UI underneath never needs to
    // dismiss the popup first. This listener just also closes it when
    // the click lands outside it, same pattern as the Key popup above.
    // v46 — _tutorialJustShown skips exactly the one click that caused
    // showTutorial() to show the popup in the first place (every trigger
    // point fires from inside some button/seat's own click handler, and
    // that same click then bubbles here); see renderTutorialStep().
    document.addEventListener("click", (e) => {
        if (!popup || popup.hidden) return;
        if (state._tutorialJustShown) return;
        if (popup.contains(e.target)) return;
        dismissTutorial();
    });

    const checkbox = document.getElementById("tutorial-toggle-checkbox");
    if (checkbox) {
        checkbox.checked = state.tutorialMode;
        checkbox.addEventListener("change", () => {
            state.tutorialMode = checkbox.checked;
        });
    }
})();

// ---------- BOOT ----------
initThudAudioPool();
