# Point of Order — Design Specification

**A UNCMUNC Chair Simulator**

---

## 0. Current Versions (Source of Truth)

- `game.js` — **v43**
- `style.css` — **v27**
- `index.html` — **v15**

When starting a fresh chat: read this doc first, then confirm the version headers in each file match the numbers above. If they don't, flag the mismatch before making changes.

---

## 1. Pitch

*Point of Order* is a browser-based, single-session simulator that puts the player in the chair of a collegiate Model United Nations committee. In under 30 minutes, the player runs a full committee session, roll call through voting procedure, testing the procedural fluency, room awareness, and pacing judgment that define a good Chair.

---

## 2. Purpose & Audience

### Purpose
- **Train** new and prospective Chairs on the mechanics of running committee before they sit on a real dais.
- **Reinforce** the procedural muscle memory (motion formats, rulings, disruptiveness order, correction habits, gavel timing) that experienced Chairs are expected to perform reflexively.
- **Preserve institutional style**, encode the specific chairing conventions of UNCMUNC so they survive turnover in the Secretariat.

### Primary Audience
- UNCMUNC dais staff, Secretariat, and prospective Chairs.
- Broader collegiate MUN circuit; anyone preparing to chair a GA-style committee.

### Secondary Audience
- Delegates who want to better understand why the Chair rules the way they do.
- Advisors and coaches introducing new members to procedure.

---

## 3. Design Principles

1. **Procedure over politics.** The topic of committee is deliberately irrelevant. The player is graded on how they run the room, not on substance.
2. **Sessions are short and replayable.** Full loop ≤ 30 minutes; ideally 15–20. Randomization drives replayability. Speeches and caucuses use **compressed time** so the game moves.
3. **Learn by doing, not by reading.** Systems should be discoverable through visual cues (raised placards, speech bubbles, agenda notes, gavel state colors). Textual instructions are minimal and always paired with a visible action.
4. **Failure is instructive, not punishing.** Wrong rulings, missed corrections, missed leader guesses, and missed gavels cost stars but never block progress. Every session resolves.
5. **Formal but handmade.** The aesthetic must read as *institutionally serious* while feeling *warm and student-made*.
6. **UNCMUNC-first.** Where general MUN convention conflicts with UNCMUNC practice, UNCMUNC practice wins.
7. **Fits one viewport.** No scrolling within a phase.
8. **No em-dashes in player-facing text (v23).** Use commas, semicolons, or short sentences instead. Author-facing code comments may still use em-dashes freely.

---

## 4. Aesthetic Direction

### Palette
- **Carolina Blue** (`#4B9CD3`), primary action color, current-speaker highlight.
- **Carolina Blue Dark** (`#13294B`), dais, Disruptiveness Key popup, focus-lock button idle state.
- **Cream** (`#f5efe1`), paper background.
- **Red stamp** (`#a63a2a`), official markings, phase labels, absent state.
- **Gold** (`#c9a24b`), tape, borders, "active" glow, active-speaker row, recognition seat glow, **leader-guess glow (Phase 3)**, focus-lock button locked state.
- **Amber** (`#e69f28`), warning window (timer + gavel), both speeches (10-sec) and caucuses (1-min).
- **Danger red** (`#d93f2a`), gavel-down state, THUD bubble text, misclick-seat shake.
- **Star gold** (`#f5c542`) / **star gold highlight** (`#ffe680`), earned stars in debrief scoring, with warm drop-shadow glow.
- **Star missed** (`#3a2410`), dark brown fill for un-earned stars (no glow).
- **Ink** (`#2a2a28`), body text.

### Typography
- **Playfair Display**, screen titles, memo headers, big moments, timer digits, THUD bubbles.
- **Special Elite**, stamps, dates, procedural labels, chair-speech buttons, dev-mode label, mistake summary lines, focus-lock button label.
- **Lora**, body text, speech bubbles, caucus dialogue bubbles, agenda notes, speakers list.

### Placards & Glow (locked as of v9)
- Placards are always white, no yellow/gold tint for P&V or raised states.
- Raised delegates have no always-on glow; hover-only gold drop-shadow.
- Roll Call's gold glow on the currently-called seat is preserved as a distinct signal.
- **Speech recognition (v14)** reuses the same Roll Call `.active` treatment (gold glow + 1.18× scale), layered with `.awaiting-recognition` which adds a slow pulse.
- **Leader guess (v23)** applies a soft gold ring/drop-shadow to a delegate seat plus a tinted placard, indicating the player's current guess for that bloc's leader. Only one guess active per bloc at a time.

### Illustration-Ready Architecture
Delegate figures currently render as CSS "head + shoulders" stick figures. When hand-drawn illustrations are ready, they are dropped into `assets/` and referenced via config objects at the top of `game.js` (`DELEGATE_ART`, `GAVEL_ART`). The render functions automatically swap to `<img>` tags when a path is set. **This swap pattern is a design commitment.** No hardcoded image paths elsewhere.

### Audio-Swap Architecture
Same pattern via `GAVEL_SOUND`. On load, if a path is set, a pool of 6 `<Audio>` elements is preloaded and rotated. When `null`, silence is graceful.

**Warm-up (v14, refined v17):** On "Gavel In →", `playThud()` fires first (unlocks browser audio), then `warmUpThudAudioPool()` primes the rest of the pool. The warm-up loop skips any element currently playing so it can't clobber the live thud.

**Thud trigger points (v16, refined v17):**
1. Title screen "Gavel In →" (unlocks + warms audio).
2. Briefing "Begin Roll Call →".
3. Roll Call, on appearance of the "here" correction button.
4. Phase 2, on appearance of the dilatory ruling button.
5. Phase 2, on appearance of the 45-sec mod correction button.
6. Phases 2 & 3, "Proceed →" after a motion passes.
7. In-speech and in-caucus gavel triggers (warning click, each gavel-down click).

Phase 3 unmod motions never trigger the dilatory or mod-correction thuds (those UI paths are suppressed via `unmodMode`).

**Delegate voices (v50):** `DELEGATE_SOUND` (next to `GAVEL_SOUND`) maps each personality to two ~20s clips in `assets/`; an empty/missing array makes that role silently voiceless. `generateCommittee()` gives every delegate their own preloaded, looping `<audio>`, alternating clip 1/2 within a personality. `showSpeechBubble()` starts the speaker's clip from 0. A MutationObserver stops and rewinds it once that bubble element leaves the DOM, whichever code path removed it, so both voices play during a caucus cutoff overlap. `showScreen()` stops all voices. Volume comes from `DELEGATE_VOICE_VOLUME` (0.5, against the thud's 0.75). It is always on and has no warm-up: voices unlock lazily, after the "Gavel In →" thud has already unlocked page audio.

**Voice scope (v51):** only speeches (Phase 2, Phase 4 Stage 3) and unmod caucus dialogue are voiced. Roll call replies, motion proposals and the Friendly/Unfriendly bubbles pass `voice = false` (5th arg of `showSpeechBubble()`). Unmod lines start at `CAUCUS_VOICE_START_SEC` (1s) and play at `CAUCUS_VOICE_FF_RATE` (3x) while fast-forward is on. Toggling FF changes the speed of a clip that's already playing.

**Background music (v52):** `BACKGROUND_MUSIC` (`path`, `volume` 0.08, `trimEndSec` 3). One `<audio>` starts on "Gavel In →" (or a dev-skip) and loops for the whole session; nothing stops it between phases. The code loops it by hand, jumping back to 0 three seconds before the end of the file (checked every 100ms). A restart reloads the page, so the music starts over at the next "Gavel In".

**Mute toggles (v54):** two buttons sit fixed in the bottom-left on every screen (`#audio-controls`, outside `<main>`). **♪ Music** mutes only the background music, which keeps playing silently so it doesn't lose its place. **🔊 SFX** mutes everything else: the gavel thud and all delegate voices. A voice already playing under a bubble goes quiet immediately. The setting lasts for the session only and isn't saved. Clicks don't propagate, so they never count as an outside-click for the Key or tutorial popups. The button loses focus after each click, so Space can't toggle it again during roll call.

---

## 5. Game Structure

| # | Phase | Duration | Teaches | Status |
|---|---|---|---|---|
| 0 | Title & Committee Briefing | ~15 sec | Framing, randomized committee context | ✅ Built |
| 1 | Roll Call | ~1–2 min | Alphabetical calling, present/P&V/absent distinction, the "here" correction | ✅ Built |
| 2 | Points & Motions → Vote → Speaker Selection → Speeches | ~5–8 min | Motion formats, dilatory rulings, disruptiveness ordering, voting, speaker-list construction, repeat-speaker discipline, speech timing and gavel discipline | ✅ Built |
| 3 | Unmoderated Caucus (Motion Collection → Vote → Caucus) | ~3–4 min | Same motion/vote loop for unmods only; caucus-time management; **bloc leadership assessment**; warning + gavel timing on a compressed clock | ✅ Built (v23) |
| 4 | Voting Procedure (Motion → Vote → Speaker Selection → Speeches → Amendment Period → Paper Vote, both papers) | ~6–9 min | Motion/vote loop for voting-procedure motions with its own disruptiveness scale; directive-paper reading and for/against speaker selection with cross-paper repeat-speaker discipline; speeches; amendment friendly/unfriendly declaration and 2/3-majority vote; simple-majority paper vote | ✅ Built, full debrief (v40) |
| 5 | "Timed Crisis" (Phases 2, 3, 4's mechanics back to back, a Best Delegate vote, no screens between any of it, one combined debrief) | ~15–21 min | Everything Phases 2–4 teach, run under time pressure with no pause to reset; reading which motion type is being steered toward; recognizing a forced-friendly amendment period; recalling bloc leadership across the whole session | ✅ Built, reachable in regular play right after Phase 4's debrief (v43) — see §8.12 |
| — | Debrief | ~30 sec | Star summary across all phases | 🚧 Per-phase debriefs built (all phases now scored, including Phase 5's own combined one); global cross-playthrough debrief planned |

**Explicitly deferred:** a standalone *Crisis Break* phase.

### Scoring Model (v19+)

Every phase uses a **three-star debrief**. Star math: `stars = max(0, 3 - totalMistakes)` (or a phase-specific formula).

Below the stars: a **mistake summary**. Zero mistakes → single celebratory line. Any mistakes → one short clause per mistake category, each on its own line (v21).

**Phase 1 mistakes** (each -1 star, floored at 0):
- Each incorrect action (wrong Present/P&V/Absent ruling).
- Each missed "here" correction.

**Phase 2 mistakes** (each -1 star, floored at 0):
- Wrong disruptiveness order pick.
- Repeat speaker called on in Round 2.
- Wrong recognition (misclicked seat during a speech).
- Missed 10-second warning.
- Late 10-second warning (v20).
- Missed gavel-down.

**Phase 3 mistakes (v23)** (star math slightly different):
- **Bloc leader guess**: -1 star per bloc where the player's guessed delegate is null or wrong. (0, 1, or 2 star loss from bloc guesses.)
- **Timing**: -1 star, once, if ANY of {missed one-minute warning, late one-minute warning, missed gavel-down} occurs. Multiple timing mistakes still only cost one star.
- Formula: `stars = max(0, 3 - blocMistakes - (timingMistake ? 1 : 0))`.

**Phase 4 mistakes (v40)** (Phase 2-style formula, uncapped, floored at 0; counted across both papers, shown once at the end):
- Wrong disruptiveness pick (Stage 1), graded against `votingDisruptivenessRank()`.
- Avoidable repeat speaker (Stage 2, paper 1 → paper 2 handoff only) — at most 2, one per bloc's pool.
- Wrong recognition (misclicked seat during a Stage 3 speech), across all 8 speeches.
- Missed 10-second warning, late 10-second warning, missed gavel-down — each its own uncapped category (Phase 2's style, not Phase 3's single-capped-category style), across all 8 speeches.
- Stage 4 (amendment period + paper votes) contributes nothing — purely procedural, no player-judgment call. See §8.11.

**Phase 5 mistakes (v41, Stage 4 added v42)** (one combined debrief for the whole phase, not per-stage). Phase 5's own 4 stages, not to be confused with Phase 4's own internal Stage 1–4 numbering that Phase 5's Stage 3 reuses:
- Phase 5 Stage 1 (mod caucus) and Stage 3 (voting procedure): each stage's own Phase 2/4-style categories above, summed directly, uncapped. (Phase 4's own internal amendment period + paper votes, nested inside Phase 5 Stage 3, contribute nothing, same as a real Phase 4.)
- Phase 5 Stage 2 (unmod caucus): Phase 3's own bloc-guess count plus its single capped timing point.
- Phase 5 Stage 4 (Best Delegate, v42): -1 if the pick doesn't match the CarolinaMUN-style delegate who led a bloc in the original Phase 3 caucus (bloc leadership persists across the session, never re-rolled for Phase 5); 0 if correct.
- Formula: `stars = max(0, 3 - (stage1Total + stage2Total + stage3Total + bestDelegateTotal))` — one 3-star scale for the entire phase. See §8.12.

---

## 6. Delegate Personality System

| Personality | Roll Call Response | Motion Type | Speaker Preference |
|---|---|---|---|
| **Power-Del** | *"The delegation of [X] is present and voting."* | Mods only | First (also always raises R2, repeat trap) |
| **Dem-Boy** | *"Present and voting."* | Mods (one guaranteed 45-sec correction/session) | Last |
| **CarolinaMUN-Style** | *"Present!"* | Round robins only | First |
| **Slacker** | *"Present." / "Here."* | Unmods only (always dilatory in Phase 2) | Last (designated one refuses R1) |

Distribution fixed at 2 of each per session; countries and seats randomized. Power-Dels never occupy edge seats (0 or 7).

**v23 pairing rule:** each Power-Del is now assigned exactly one Dem-Boy as their `boss` at committee generation. No two Dem-Boys ever share a boss. This is invisible to Phase 1/2 but essential for Phase 3 bloc splitting.

### Speech Line Pool (v13, edited v16)
Every personality has 4 flavored speech lines plus a 4-line generic pool. Session-scoped no-reuse; if a personality's pool is exhausted, generic lines fill in.

### Caucus Line Pool (v23, Phase 3 only)
Separate `CAUCUS_LINES` object organized by **bloc-type × role × topic bucket**. Session-scoped no-reuse per bloc (`bloc.usedLines: Set`). See §8.5 for details.

---

## 7. Phase 1: Roll Call, Full Spec

*(Unchanged. See prior versions.)*

---

## 8. Phase 2: Points & Motions → Vote → Speaker Selection → Speeches, Full Spec

*(Unchanged except the Round Robin skip button below. See prior versions for the rest.)*

### Round Robin Skip (v36)

From the 4th speaker onward in a Round Robin (`p2.speakersMotion.type === "rr"`; RR is always single-round, so this only ever applies during `round1_speeches`), the "speaking" dais gains a skip button: `renderSpeechDais()`'s `sp.mode === "speaking"` branch adds it as the first child of the `.speech-dais` flex row whenever `sp.currentSlot >= 3`, reusing `.caucus-ff-btn`'s styling verbatim — the same visual slot Phase 3's caucus fast-forward button occupies (left of the speaker-name label). Gated on `isRR`, so it never appears for mod speeches or Stage 3 speeches (whose motion `type` is `"voting"`).

Clicking it calls new `autocompleteRRSpeeches()`: stops the timer, clears the current speech bubble and recognition highlight, then marks every slot from `sp.currentSlot` through `sp.rangeEnd` as spoken (`sp.spokenSlots`) **without** pushing an `sp.log` entry for any of them, and sets `sp.mode = "done"`. No log entry means debrief scoring (`finishPhase2`) simply has fewer graded speeches to look at — skipping is never scored as a fabricated "perfect" run and never penalized either. From `"done"`, the existing done-branch logic (unchanged) shows "Conclude speeches →" exactly as it would after a real last speech, since `isRR` already forces `nextIsRound2 = false`.

Not clicking it changes nothing: the player can still recognize and deliver every remaining speech by hand, exactly as before this pass.

---

## 8.5. Phase 3: Unmoderated Caucus, Full Spec (v23)

Phase 3 is a three-stage sequence that reuses the Phase 2 `#motions-screen` DOM throughout, gated by `state.p2.unmodMode = true`.

### Entry

After a Phase 2 motion passes, the post-motions screen's button reads **"Proceed to Unmods →"** and calls `startPhase3()`. Button text/handler is set at runtime by `renderPostMotionsScreen(phase)`; no static listener on `#restart-btn`.

`startPhase3()` re-initializes `state.p2` with `unmodMode: true`, stashes the Phase 2 passed motion's `.topic` on `p2.priorTopic` (used by caucus dialogue for topic-bucket flavor), retitles the phase label to *"Phase 3 of 5 · Unmoderated Caucus"*, clears Phase 2 per-delegate flags, and re-renders the committee room with the original seat positions.

The opening chair prompt is the **same** as Phase 2: *"Are there any points or motions on the floor?"* This is intentional; procedure phrasing does not change between phases.

### Stage A: Motion Solicitation & Capture

- Three random present delegates raise placards (any personality). Personality is irrelevant here.
- Each of the three is pre-assigned one duration from a shuffled `[5, 7, 10]` via `_forcedUnmodMinutes`. Each duration appears exactly once.
- Player clicks any raised delegate in any order. `generateMotion()` sees `_forcedUnmodMinutes` and short-circuits to return `{ type: "unmod", min, spoken: "X minute unmod", written: "shortName X min unmod" }`, ignoring personality.
- **No dilatory prompt appears in Phase 3.** The `renderMotionsDais` "speaking" stage skips the dilatory branch when `unmodMode` is on. All three unmods go straight to *"Note motion & recognize next delegate →"*.
- No appearance-time thuds fire on unmod motion clicks in Phase 3 (the correction buttons that trigger those never render).

### Stage B: Voting

Identical to Phase 2's vote loop. Player selects the most disruptive unresolved motion from the agenda and calls the vote.

**Disruptiveness fix (v22):** `disruptivenessRank(unmod)` returns `[3, minutes]`. Longer unmods rank as more disruptive. 10-min > 7-min > 5-min. Matches the Disruptiveness Key ("longer = more"). Does not affect Phase 2 (only one unmod ever exists there and it's ruled dilatory).

Vote-fail retry logic is unchanged; if the first two picks fail, the third attempt is forced to pass.

### Stage C: The Unmod Caucus (v23)

When an unmod motion passes and the player clicks **Proceed →**, `handlePassProceed()` (`unmodMode` branch) routes to `startUnmodCaucus(motion)` instead of Phase 2's `enterSpeakerSelection()`.

#### Bloc assignment

`assignBlocs()` runs at caucus start:

1. Shuffle the two Power-Dels; one to Bloc A, one to Bloc B.
2. Each Dem-Boy joins the bloc containing their paired Power-Del (guaranteed 1:1 by v23 generation).
3. Assign one Carolina to each bloc (random).
4. **Coin-flip which bloc is Power-led vs. Carolina-led.** This happens BEFORE slacker assignment.
5. Slackers:
   - If both slackers present: shuffle, one to each bloc.
   - If one slacker absent: the absent slacker is placed in the **Power-led bloc**. That bloc will visibly show 3 delegates instead of 4.

Each bloc object carries `{ side, leader ("power"|"carolina"), power, demboy, carolina, slacker, delegates[], openerUsed, usedLines: Set, guessIdx }`.

#### Layout & animation

Two 2×2 huddles, one per side. If a bloc is 3-delegate (absent slacker), a triangle arrangement is used instead. Positions defined in `BLOC_LAYOUT`. The agenda panel is hidden via `.phase2-body.caucus-mode` + `.agenda-panel.hidden-in-caucus`; the committee room takes the full width.

Delegate seats slide from their Phase 2 positions into bloc positions over ~600ms via a CSS `left`/`top` transition (v17 added to `.delegate-seat`). The absent slacker's seat is hidden entirely via `display: none`.

#### Caucus dialogue (v24 — scripted playback)

Each bloc plays exactly **one authored script**, turn by turn, from `unmod_dialogue.md`: 8 scripts total (4 topic buckets × 2 leader variants), ~12 turns each. No randomness in line selection; the weighted-random engine (`pickCaucusLine`) is gone. Dialogue is **only active for the currently focused bloc**. Nothing runs in the background.

**Script selection:** at caucus start, each bloc picks `CAUCUS_CONVOS[topicBucket][bloc.leader === "power" ? "powerLed" : "carolinaLed"]` and starts at `turnIdx = 0`. `TOPIC_BUCKETS` (13 topics → 4 buckets) is unchanged.

**Per-bloc playback state:** `turnIdx` (the most recently displayed line, whether shown normally or as a cutoff overlap), `turnTimer`, `currentBubble`, `overlappingBubble`.

**Cadence (v25):**
- **Normal turn** (line does not end in `,` or `...`): bubble shows for 2800ms, clears, 400ms gap, next line appears.
- **Cutoff turn** (line ends in `,` or `...`, and isn't the script's last line): the next line appears alongside the current one at the 1900ms mark, both visible together for 900ms, then the older one clears and the new one continues its own lifecycle from that moment. Chains correctly if the new line is itself a cutoff. No positional offset between the two bubbles; the interrupting bubble's seat gets a temporary z-index boost (cleared once the overlap resolves) so it reliably renders above the one it's cutting off, rather than leaving stacking to DOM order between the two delegates.
- **Script end:** once `turnIdx` reaches the script's length, the bloc holds silent for the rest of the caucus. No looping.
- At this cadence, a full 12-line script takes roughly 37 to 38 real seconds of active hover time regardless of leader type; both blocs together need about 75 to 76 seconds. As of v27 the caucus window is a fixed 70 real seconds (see Timer below), which is *less* than the combined 75 to 76 seconds both full scripts need — a player who splits attention evenly between blocs will generally not hear either script all the way to its ending line, and definitely won't hear both in full. That's a known, deliberate tradeoff of shortening the window in v27; revisit if playtesting says it feels too rushed rather than appropriately paced.

**Focus & hover model (v24, glow added v25):**
- `mousemove` on the committee room reads cursor X to decide hovered bloc (< 50% = A, >= 50% = B). Only the upper 80% of the room counts (below is the dais label).
- Hover changes are debounced 150ms before `hoveredIdx` updates, preventing thrash at the 50% boundary.
- `activeIdx = hoveredIdx` (no lock concept; the "Lock focus" button was removed entirely).
- Activating a bloc (first hover or a return hover) waits an additional 200ms "soft hover-in" delay before its first bubble appears, so brief mouse-flickers don't jump-scare a line into view. It also dims the **other** bloc (`.bloc-dimmed`: opacity 0.55, `grayscale(0.4)`), so the focused bloc reads by contrast rather than by glowing itself. (An earlier version glowed the focused bloc in Carolina Blue; that read as too strong and distracting in playtest.) A leader guess already made in the dimmed bloc stays legible via a `.bloc-dimmed.leader-guess` opacity override.
- **Pausing** (un-hovering the active bloc) immediately hides both `currentBubble` and `overlappingBubble`, un-dims the other bloc, and cancels all pending timers, but leaves `turnIdx` untouched. **Resuming** replays the line at `turnIdx` fresh, full-length, never mid-way through its old display timer — including a line that was only ever shown as a cutoff overlap.

**Delegate clicks are leader guesses only, never focus changes.** Clicking a delegate:
- Applies `.leader-guess` glow to that delegate.
- Removes `.leader-guess` from any prior guess in the same bloc.
- Sets `bloc.guessIdx = delegateIdx`.
- Free to change until the caucus ends.

**Placeholders substituted** (unchanged): `{country}` (speaker), `{boss}` (speaker.boss or bloc's Power-Del's country as fallback), `{demboyCountry}` (bloc's Dem-Boy's country).

**Slacker never speaks** in any script.

**Role behavior encoded in each script:**
- Power-led bloc: Power dominates and shoehorns their idea; Dem-Boy meat-rides Power by name; Carolina tries to add ideas and gets cut off mid-sentence.
- Carolina-led bloc: Carolina names other delegates and protects ideas; Power tries to interrupt and dismiss; Dem-Boy proposes a substantive idea that Carolina champions over Power's pushback.

#### Timer

Reuses `state.p2.speeches` with `caucusMode: true`. Compression rule (v27):
- First `(N-1)` displayed minutes → **55 real seconds** (`preRate = (N-1)*60/55`).
- Last displayed minute → **15 real seconds** (`warnRate = 60/15 = 4`).
- Total real duration always **70 sec**, regardless of motion length. (Was 90 sec through v26; shortened in v27 — see the dialogue-fit caveat above.)

Threshold overrides:
- `warnThreshold = 60` (pre → warn transition when displayedSec ≤ 60).
- `lateThreshold = 48` (on-time → late transition; matches speeches' 8/10 = 20% ratio).

#### Gavel

Same three-state button (`pre` / `warn` / `zero`) as speeches, but with caucus-specific labels and flashes:
- **Warn label:** "One-Minute Warning" (versus "10-Second Warning" for speeches).
- **Early click** (`pre` phase): flash reads *"Not yet, the caucus has time."*
- **On-time click** (`warn`, displayedSec > 48): flash reads *"The chair recognizes one minute remaining."* Sets `warning = "on-time"`.
- **Late click** (`warn`, displayedSec ≤ 48): flash reads *"Warning given late."* Sets `warning = "late"`.
- **Never clicked**: at 0:00 `warning = "missed"` is auto-recorded and a flash fires: *"The one-minute warning was never given."*
- **Gavel-down** at 0:00: same ≥2 click / ≤20 cap / 800ms spam-window logic as speeches. `endUnmodCaucus({gavelDown: "on-time" | "missed"})` is the exit.
- **Missed gavel-down flash:** *"Caucus ran over, no gavel-down."*

#### Fast-Forward Toggle (v32)

An icon-only button (⏩, the conventional two-right-triangle fast-forward glyph, no text label) sits in the caucus dais to the left of the "UNMODERATED CAUCUS" / minutes label. Caucus-wide (one state for the whole caucus, not per bloc), not a per-delegate or per-bloc setting.

- **Lifecycle:** appears the instant the caucus timer enters `pre` phase (the same moment `setupCaucusTimer()` runs); toggles on/off on click; disappears entirely (not merely disabled) the instant the timer hits 0:00. `sp.ffActive` is explicitly reset to `false` at that same 0:00 transition, so no FF state survives past it.
- **Speed effect:** while active, multiplies the timer's currently-active rate (`preRate` during `pre`, `warnRate` if re-enabled during `warn`) by **3×**, and runs every per-bloc dialogue turn-display duration (2800ms visible / 400ms gap / 1900ms cutoff-overlap trigger / 900ms overlap window) at **1/3** its normal length.
- **Auto-revert:** the instant displayed seconds crosses into `warn` phase (`≤ warnThreshold`, i.e. the same `<=` comparison already used for that transition, so a 3×-sped tick can't jump past the exact threshold and skip the revert), FF is forced off and the button reverts to its "off" state. It can be clicked again afterward to re-enable FF during `warn`; that behaves identically to `pre`-phase FF, no special-casing.
- **Hover pause/resume:** unchanged in every other respect (cancels timers, hides bubbles, preserves `turnIdx` on pause; replays the current line fresh on resume). The only change: resuming plays at whatever FF state is currently active, never forced back to normal speed.
- **Toggle-safe rescaling:** dialogue turn timing runs through `scheduleFFAwareStep()`/`rescaleActiveCaucusStep()` (see §11) so an in-flight bubble — including mid-overlap — visibly speeds up or slows down the instant FF toggles, rather than waiting for its next already-scheduled turn.
- **Unaffected:** gavel-down logic, warning on-time/late/missed thresholds, and debrief scoring all key off displayed seconds, not real elapsed time, so FF (a real-time-to-displayed-time rate change) doesn't touch any of that.

#### Debrief

`finishPhase3Debrief()` computes:
- `blocMistakes = number of blocs where guessIdx is null or ≠ actual leader's delegateIdx` (0, 1, or 2).
- `timingMistake = 1 if any of {warning === "missed", warning === "late", finalGavelDown === "missed"}, else 0`.
- `stars = max(0, 3 - blocMistakes - timingMistake)`.

Summary clauses:
- 1 bloc missed → "1 bloc leader missed or misread."
- 2 blocs missed → "Both bloc leaders missed or misread."
- Warning missed → "Never gave the one-minute warning."
- Warning late → "Gave the one-minute warning late."
- Gavel-down missed → "Caucus ran over, no gavel-down."
- Zero mistakes → "A masterclass in caucus management."

Renders into `#phase2-stars` / `#phase2-summary` (reused). Post-motions title becomes "Caucus Concluded", flavor line reads *"The N minute unmoderated caucus concludes."* Button reads "Proceed to Voting Procedure →" and calls `startPhase4()` (was "Adjourn & Restart" / page reload prior to v30 — corrected here, this line had gone stale).

---

## 8.75. Phase 4 Stage 1: Voting Procedure (Motion → Vote only), Full Spec (v30)

**Phase 4 is fully built as of v40** — see §8.11 for the complete end-to-end spec (all 4 stages plus the debrief) and the current Disruptiveness Key. This section documents Stage 1 (motion proposition through the vote) specifically; §8.8/§8.9/§8.10 document Stages 2/3/4 in the same depth.

Phase 4 reuses the Phase 2/3 `#motions-screen` DOM throughout, gated by `state.p2.votingMode = true`. `unmodMode` and `votingMode` are mutually exclusive; `startPhase3()` and `startPhase4()` each explicitly clear the other flag so the two substates can never overlap.

### Entry

After the Phase 3 unmod caucus concludes, the post-motions screen's button reads **"Proceed to Voting Procedure →"** and calls `startPhase4()` (previously this button read "Adjourn & Restart" and reloaded the page; that behavior moved to the Stage 1 dead end instead). `renderPostMotionsScreen(phase)` is the single place button text/handler are set; no static listener on `#restart-btn`.

`startPhase4()` mirrors `startPhase3()`'s reuse pattern exactly: re-initializes `state.p2` with `votingMode: true` (`unmodMode` explicitly set `false`), clears leftover per-delegate flags from earlier phases (`guaranteedBadMod`, `_pendingMotion`, `_forcedUnmodMinutes`, `_forcedVotingCombo`), retitles the phase label to *"Phase 4 of 5 · Voting Procedure"*, and re-renders the committee room at the original seat positions. The opening chair prompt is the same as Phases 2 and 3: *"Are there any points or motions on the floor?"*

### Motion Data Model

```js
{
  type: "voting",
  order: "submitted" | "reverse",
  seconds: 30 | 60,
  amendment: true | false,
  spoken: "...",
  written: "...",
}
```

### Motion Count: 3 (standing rule across all phases)

Phase 4 solicits and requires exactly **3** motions, matching Phase 2 and Phase 3's existing pattern (Phase 2 raises 5 placards but only requires 3 accepted before `ready_to_vote`; Phase 3 raises and requires 3). The standing rule going forward across all phases: the player only ever selects 3 motions to place on the agenda, regardless of how many placards are raised. (Phase 4 was originally specced at 4 raised/4 required; corrected to 3 before this stage shipped.)

### Motion Solicitation & Capture

Three random present delegates raise placards (personality irrelevant, same as Phase 3's unmod solicitation). Each is pre-assigned a distinct `{order, seconds, amendment}` combo via `buildForcedVotingCombos()`, generated **before** any placard raises:

1. The full 8-combo space is `2 orders × 2 seconds × 2 amendment` values.
2. Slot A: `order: "submitted"`, `amendment` a random coinflip, `seconds` random.
3. Slot B: `order: "reverse"`, `amendment` the **opposite** of Slot A's value, `seconds` random. A and B alone guarantee both orders and both amendment values are represented, since only 3 slots are available (a single motion can satisfy two axes at once, e.g. "order submitted" + "amendment true" together).
4. Slot C: any remaining combo from the other 6, excluding exact duplicates of A or B. Carries no coverage obligation of its own.
5. The final 3 combos are shuffled before assignment, so coverage never correlates with click order.

`generateMotion()` checks `delegate._forcedVotingCombo` before the `_forcedUnmodMinutes` check and short-circuits to `buildVotingMotion()`, ignoring personality — mirrors the Phase 3 pattern exactly.

No dilatory prompt appears (motion `type` is `"voting"`, which matches neither the `type === "unmod"` nor `type === "mod" && needsCorrection` branches in `renderMotionsDais`'s "speaking" stage, so this needed no new suppression logic). All three go straight to *"Note motion & recognize next delegate →"*. No appearance-time thuds fire on these motion clicks, for the same reason.

### Spoken / Written Templates

```js
spoken = "Motion to enter voting procedure in " +
  (order === "reverse" ? "reverse order submitted" : "order submitted") +
  " with a 2 for/2 against with " + seconds + " seconds speaking time " +
  (amendment ? "and a 30 second amendment period" : "and straight into voting");

written = shortName(country) + " voting" +
  (order === "reverse" ? " rev" : "") +
  " 2/2 " + seconds + " sec" +
  (amendment ? " 30 sec amend" : "");
```

Four possible `written` outputs (all single-spaced, no doubles):

| order | amendment | `written` |
|---|---|---|
| submitted | false | `[Delegate] voting 2/2 30 sec` |
| submitted | true | `[Delegate] voting 2/2 30 sec 30 sec amend` |
| reverse | false | `[Delegate] voting rev 2/2 60 sec` |
| reverse | true | `[Delegate] voting rev 2/2 60 sec 30 sec amend` |

The spoken sentence is the longest string in the game. It appears verbatim in the proposing delegate's speech bubble and in the `calling_favor`/`calling_oppose` chair-prompt dais buttons ("All those in favor of X's motion for [sentence] please raise..."). Both surfaces wrap (no truncation, no font-size step-down): `.chair-prompt-btn` gained explicit `white-space: normal; word-wrap: break-word;` in style.css v22; `.speech-bubble` already had equivalent wrap rules plus a 240px max-width from earlier versions.

### Disruptiveness Ranking

```js
function disruptivenessRank(motion) {
  const orderVal = motion.order === "reverse" ? 1 : 0;
  const amendVal = motion.amendment ? 1 : 0;
  return [orderVal, motion.seconds, amendVal];
}
```

Compared lexicographically, descending, same mechanism as Phase 3's `[3, minutes]` tuples. Reverse order always outranks order submitted regardless of the other two fields. Within the same order, `seconds: 60` always outranks `seconds: 30`. `amendment` only acts as a tiebreak when order AND seconds both already match. `compareDisruptiveness()` was extended to compare an optional 3rd tuple slot when both ranks have one; 2-element ranks (unmod/rr/mod) are unaffected since the extra comparison is skipped when either side's 3rd slot is `undefined`.

### Voting Outcome (rigged)

Unlike Phase 2/3's fail-fail-pass retry pattern (`voteAttempt >= 2` forces a pass), Stage 1 voting is rigged directly by motion content:

- `amendment === true` → the vote always passes, on the first attempt.
- `amendment === false` → the vote always fails, no matter how many times it's called.

This is independent of disruptiveness-order grading — the player is still scored on whether they called the vote on the most disruptive unresolved motion each time (`orderPicks`, unchanged mechanism). The rig only controls the pass/fail roll itself, and guarantees the stage resolves once the player reaches an amendment-bearing motion (which is not necessarily the last one voted on — whichever amendment motion is called first ends the stage).

### Stage 1 → Stage 2 Handoff (v33)

When an amendment-bearing motion passes and the player clicks **Proceed →**, `handlePassProceed()`'s `votingMode` branch calls `startPhase4Stage2(motion)` instead of `enterSpeakerSelection()`/`startUnmodCaucus()`. Through v32 this used to be a genuine dead end (`showVotingStage1Placeholder`, since removed); as of v33 it instead flows directly into Stage 2 — see §8.8.

### Dev Mode

Dev-panel "4 · Voting" is enabled (index.html v13). `devSkipTo(4)` auto-completes Phase 1, then (v33) fakes a minimal `state.p2.caucus` shell (`{ blocs: assignBlocs(), topicBucket: <random> }`) before calling `startPhase4()`, since Stage 2 needs Phase 3's bloc assignment to build its papers and a fresh dev-skip has no real Phase 3 state to draw from — mirrors how Phase 3's own dev-skip fakes a `speakersMotion.topic` for the caucus dialogue bucket. (Through v32, Stage 1 alone had no such dependency and no faking was needed.)

### Status (v40)

Everything past the vote — speaker selection (§8.8), speeches (§8.9), the amendment period and paper votes (§8.10), and the debrief (§8.11) — is now built for both papers. `disruptivenessRank()`'s `"voting"` branch calls new `votingDisruptivenessRank()` (v40), which reorders the tiebreak tuple to `[amendVal, seconds, orderVal]` (amendment status first) — see §8.11 for why and for the new Phase 4-specific Disruptiveness Key that documents this to the player.

---

## 8.8. Phase 4 Stage 2: Directive Reading + For/Against Speaker Selection, Full Spec (v33, both papers as of v38)

Everything below describes what runs once per paper. As of v38, `beginStage4()` restarts this exact flow for the second-processed paper after the first's amendment period + vote (§8.10) resolve — nothing here is paper-1-specific despite the section title's original name; see §8.11 for the end-to-end picture and the v40 debrief, which adds one new mistake category scoped specifically to the paper 1 → paper 2 handoff (§8.11's Avoidable Repeat Speaker subsection).

Stage 2 continues to reuse the Phase 2/3/4-Stage-1 `#motions-screen` DOM (same committee room, same `#motions-dais-bar`), gated by `state.p2.stage2` being non-null. The motions agenda (`#agenda-list`) is left untouched — it keeps showing the 3 motions with pass/fail styling exactly like Phase 2, never cleared or replaced. For/against selection reuses the existing `#speakers-panel`/`#speakers-list` sidebar instead — the same one Phase 2's mod speeches populate — rather than inventing new markup inside the agenda.

### Two-Paper Data Model

```js
{
  bloc: <ref to bloc>,
  leader: "power" | "carolina",
  name: PAPER_NAMES[caucus.topicBucket][leader],
  forGroup: [...bloc.delegates minus slacker],
  againstGroup: [...otherBloc.delegates minus slacker],
  forSpeakers: [null, null],
  againstSpeakers: [null, null],
}
```

`PAPER_NAMES` is keyed by the same 4 topic buckets Phase 3's caucus dialogue uses:

```js
{
  substance: { power: "Sanctions Enforcement Framework", carolina: "Fund Me Maybe" },
  process:   { power: "Next Steps Protocol", carolina: "Define and Conquer" },
  people:    { power: "Humanitarian Relief Framework", carolina: "Heart of the Matter" },
  opening:   { power: "Joint Position Statement", carolina: "Position Yourself" },
}
```

**Submission order** is fixed regardless of motion content: Bloc A (`side: "A"` in `BLOC_LAYOUT`) is always paper index 0 ("paper 1"), Bloc B is always paper index 1 ("paper 2"). The passed motion's `order` field determines **processing** order only, stored separately as `processingOrder`: `"submitted"` → `[0, 1]` (paper 1 read first); `"reverse"` → `[1, 0]` (paper 2 read first). Both papers share the passed motion's `seconds` and `amendment` values — these are motion-level properties (read from `state.p2.stage2.motion`), never duplicated onto the paper objects.

`buildStage2Papers(motion)` pulls blocs from `state.p2.priorCaucus` (see "Data Handoff" below), builds both paper objects, and computes `processingOrder`. Two bookkeeping-only fields not in the spec'd shape above, `_forStarted`/`_againstStarted`, track whether each paper's speakers-panel subsection has started rendering.

### Data Handoff from Phase 3

`state.p2.caucus` (the live bloc assignment) is normally wiped when `startPhase4()` calls `initPhase2State()`. `startPhase4()` now stashes it into a local variable **before** that call and re-attaches it as `state.p2.priorCaucus` afterward — the same pattern `startPhase3()` already used to carry `priorTopic` across its own `initPhase2State()` wipe. `buildStage2Papers()` reads `priorCaucus.blocs`/`priorCaucus.topicBucket`.

### Per-Paper Flow

Runs once per paper, sequentially, for whichever paper is up next in `processingOrder`. New `p2.stage` values drive `renderMotionsDais()`:

1. **`stage2_reading`** — a golden chair-speaking button (the default `.chair-prompt-btn` gold/italic treatment, no `.dilatory` class needed): *"I will now read out the paper called **[name]** sponsored by **[Power-Del or Carolina, whichever led the paper's bloc]** and **[that bloc's Dem-Boy]**."* (v35: paper name and both sponsor countries all bolded via `<strong>`.) Click advances to announcing "for."
2. **`stage2_announcing_for`** — a gold button with the `.dilatory` class (same visual treatment as the existing dilatory-ruling emphasis: bold + underlined, non-italic, on just the emphasized word): *"I will now be taking 2 **for** speakers."* Click raises every delegate in `forGroup` (slacker always excluded, per bloc, regardless of which paper) and advances to selection.
3. **`stage2_selecting_for`** — player clicks 2 of the 3 raised placards, same interaction pattern as mod speaker selection (`applyStage2RaisePool`/`onDelegateClickForStage2`, mirroring `applyRaisePool`/`onDelegateClickForSpeaker`). Each click fills the first `null` slot in `forSpeakers`, so **click order is preserved as array order** (forward-compat requirement — see below). `#speakers-list` shows a new "For:" subheader row once selection starts (`paper._forStarted = true`), with two explicitly-numbered (1./2.) slots below it filling in progressively as each pick is made (reuses the panel's existing `.just-filled` flash animation) rather than appearing atomically once both are picked.
4. **`stage2_announcing_against`** — same gold `.dilatory` treatment: *"I will now be taking 2 **against** speakers."* Click raises every delegate in `againstGroup` (the OTHER bloc, slacker excluded) and advances to selection.
5. **`stage2_selecting_against`** — same click-2-of-3 pattern, filling `againstSpeakers`. `#speakers-list` gets an "Against:" subheader row below the "For:" group, with its own independently-numbered 1./2. slots.

### Speakers Panel Reuse

`renderStage2SpeakersPanel(justFilledSlot)` populates the existing `#speakers-panel`/`#speakers-list`/`#speakers-motion-label` elements (unhiding the panel, since it's `hidden` by default and otherwise only shown by Phase 2's `renderSpeakersList()`):

- `#speakers-motion-label` gets the current paper's `name` (reusing the exact slot that shows a mod motion's `written` text in Phase 2).
- `#speakers-list` gets a `.speakers-subheader` `<li>` ("For:" or "Against:") followed by that group's speaker slots.
- **Numbering is written explicitly per slot** (`${i + 1}.` via a `.speakers-num` span), not through the list's shared CSS counter — a `counter-reset` on the subheader row was tried first but did not actually restart the count for later siblings in testing (it kept incrementing 1,2,3,4 straight through both groups instead of resetting to 1,2 at "Against:"), so `.stage2-slot` suppresses the counter-based `::before` entirely and renders its own number instead.
- `.speakers-header`'s "Speakers List" label gained `white-space: nowrap` + `flex-shrink: 0` (style.css v24) since directive paper names (e.g. "Humanitarian Relief Framework") run longer than typical mod-motion strings and were wrapping it to two lines.

### Sequencing Across the Full Stage

Full intended order of events (as of v34, the first two bullets are built): all 4 speaker selections for the first-processed paper → its 4 for/against speeches (§8.9) → *(stop here for now)* → later, amendments to that paper → later, a vote on that paper → only after that vote resolves, the For/Against subsections clear and the second paper's announcement + speaker selection begins, repeating the same flow.

Note that "paper 1" in this sequencing sense means **whichever paper is first in `processingOrder`** — not necessarily Bloc A's paper (array index 0). A `"reverse"`-order motion processes Bloc B's paper first, and the stage still stops (as of v34, hands off into Stage 3 — see §8.9) after *that* paper's against-speakers are picked, regardless of its array index. `beginStage3Speeches()` (formerly the dead-end `finishStage2FirstPaper()`, removed in v34) implements this by always continuing after `processingIdx === 0` completes, never checking which bloc that paper belongs to.

### Stage 2 → Stage 3 Handoff (v34)

Once the first-processed paper's against-speakers are both selected, `onDelegateClickForStage2()` now calls `beginStage3Speeches()` instead of the old dead-end `finishStage2FirstPaper()`. See §8.9 for what that flows into.

### Forward-Compatibility Requirements

Data must survive intact into future stages that aren't built yet:

- **Speech order is derived from array position, never re-derived later.** `forSpeakers[0] → againstSpeakers[0] → forSpeakers[1] → againstSpeakers[1]` maps directly to first-for → first-against → last-for → last-against. The click-order-preserving fill logic in `onDelegateClickForStage2` is what guarantees this holds. (v34: this is now consumed directly by `beginStage3Speeches()` — see §8.9.)
- **Nothing in this stage may mutate or reset** `delegate.personality`, `delegate.boss`, `bloc.leader`, or a paper's `.bloc` reference. (v34: Stage 3's content lookup computes each speaker's rhetorical role on the fly from exactly these fields — CarolinaMUN-style jokes about their own bloc's paper name; a Power-Del from the authoring bloc self-attributes cleanly, one from the other bloc self-attributes sloppily; a Dem-Boy in a Carolina-led bloc is empowered, one in a Power-led bloc glazes their boss — so this requirement remains binding for whatever comes after Stage 3 too.)

### Status (v40)

All of this stage's non-goals as of the versions above are now built: amendment-period mechanics and the paper vote (§8.10), paper 2 (this same flow re-entered via `enterStage2Paper(1)`), and debrief/star scoring for the whole phase (§8.11) — including a new mistake category, Avoidable Repeat Speaker, scoped specifically to the paper 1 → paper 2 handoff this section's forward-compat notes protected: each bloc's pool of non-slacker present delegates is shared between paper 1's role and paper 2's opposite role (`forGroup`/`againstGroup` swap which bloc they draw from between the two papers), so `checkAvoidableRepeatSpeaker()` can tell whether an unused delegate from that pool existed when paper 2's picks were made. See §8.11.

---

## 8.9. Phase 4 Stage 3: For/Against Speeches (Paper 1 Only), Full Spec (v34)

As of v38, the 4th speech concluding flows directly into Stage 4 (amendment period + paper vote, §8.10), for both papers. As of v40, `p2.speeches.log` — already accumulated here exactly as described below, untouched — is what the debrief (§8.11) reads for the Recognition Misclick and Speech Timing mistake categories across all 8 speeches.

Stage 3 has no selection UI of its own — the speaking order was already fixed by Stage 2's for/against picks (§8.8's forward-compat requirement). `onDelegateClickForStage2()` calls `beginStage3Speeches()` the instant the second against-speaker is picked, with no intermediate announcement button.

### Speaking Order

Fixed by array position, never re-derived: `forSpeakers[0] → againstSpeakers[0] → forSpeakers[1] → againstSpeakers[1]`. `beginStage3Speeches()` flattens this into `p2.speakerOrder`, a plain 4-long array of delegate indices — the exact shape Phase 2's mod/RR speech loop already expects.

### Recognition/Timer/Gavel Loop (verbatim reuse)

`beginStage3Speeches()` sets `p2.speakersMotion = state.p2.stage2.motion` (both papers share that motion's `seconds`/`amendment` fields per §8.8) and calls `startSpeechesRound({ start: 0, end: 3, roundKey: "stage3" })`, then `applyRecognitionHighlight()` — the same functions Phase 2's `enterRound1Speeches()`/`enterRound2Speeches()` call. From there, seat-click recognition (`onSeatClickForRecognition`), the timer (`tickSpeech`), and gavel discipline (`onGavelClick`, warning/late/missed grading, `endCurrentSpeech`) are **entirely untouched** — new `p2.stage = "stage3_speeches"` just routes `renderMotionsDais()` to the existing `renderSpeechDais(bar)`, exactly like `round1_speeches`/`round2_speeches` already do. `speechSecondsForMotion()` gained one new branch, `motion.type === "voting"` → `motion.seconds`, alongside its existing `"rr"`/`mod` branches.

**v39 bugfix:** `startSpeechesRound()` only builds a fresh `p2.speeches` object (with an empty `spokenSlots`) the first time it's ever called — every later call just resets the per-speech transient fields and leaves `log`/`spokenSlots` alone, since Phase 2's round1 → round2 transition needs both to keep accumulating across one continuous `speakerOrder`. Because `beginStage3Speeches()` calls it once per paper, and slot indices 0-3 mean a different set of 4 people each time, paper 2's session used to inherit paper 1's `spokenSlots {0,1,2,3}`, striking through every name before anyone had spoken (a display-only bug — `endCurrentSpeech()`'s `log` entries were already correct). Fixed by having `beginStage3Speeches()` explicitly reset `p2.speeches.spokenSlots` to a fresh `Set` every time it runs; `log` is left alone.

The `#speakers-panel`/`#speakers-list` sidebar keeps showing Stage 2's paper-name + For:/Against: grouping throughout (`renderStage2SpeakersPanel()`) rather than switching to the generic per-round speaker list: `renderSpeakersList()` (called internally by `beginSpeech()`/`endCurrentSpeech()`) now checks `p2.stage === "stage3_speeches"` first and defers to `renderStage2SpeakersPanel()` in that case.

**v36:** that panel's For:/Against: slots now get the same `.current-speaker`/`.active-speaker`/`.spoken` highlighting Phase 2's `renderSpeakersList()` already applies (existing `.speakers-list li.*` CSS, no new styles). `renderStage2SpeakersPanel()` maps each name's local for/against index to its global `p2.speakerOrder` slot — `forSpeakers[i]` → slot `i*2`, `againstSpeakers[i]` → slot `i*2 + 1`, per the fixed order `beginStage3Speeches()` uses — and passes that into `buildStage2SpeakerSlot(idx, i, justFilled, sp, globalSlot)`, which adds `.current-speaker` while `sp.mode === "recognizing"` and that slot is up, `.active-speaker` while it's being spoken, and `.spoken` once `sp.spokenSlots` contains it. Only active during `stage3_speeches`; Stage 2's selection-time rendering (`sp` passed as `null`) is unaffected.

### Content Lookup

New `SPEECH_CONTENT` table (`game.js`, transcribed verbatim from `phase4_speech_content.md`), keyed `[topicBucket][paper.leader][side][role]`:

```js
{
  substance: {
    power:    { for: { power, demboy, carolina }, against: { power, demboy, carolina } },
    carolina: { for: { power, demboy, carolina }, against: { power, demboy, carolina } },
  },
  process: { ... }, people: { ... }, opening: { ... },
}
```

`beginSpeech()` checks `sp.roundKey === "stage3"` and, if so, calls `drawStage3SpeechLine(del, slotIdx)` instead of the generic `drawSpeechLine(del)` pool. That function derives `side` from the slot's parity (even → `"for"`, odd → `"against"`, matching the fixed speaking order above), reads `topicBucket` from `state.p2.priorCaucus.topicBucket`, and looks up `SPEECH_CONTENT[topicBucket][paper.leader][side][del.personality]`.

Because each paper's own leader is baked into the lookup key, the correct Power-Del variant falls out automatically with no extra role-branching: a `power`-role lookup under a power-led paper's `for` side is that Power-Del's own (leading/dominant, self-attributing) line; the same lookup under a carolina-led paper's `for` side is the non-leading Power-Del's (sloppy, feelings-pivot) line. Same mechanism gives Dem-Boy the glazes-boss line under a power-led paper and the empowered line under a carolina-led paper. Carolina-style dels get their scripted joke line regardless of side (text differs by side per the content file, not by role logic).

**v35:** every literal in-line mention of a paper's own title inside `SPEECH_CONTENT` is wrapped in `<strong>` (only the Carolina-role joke lines ever name a paper by its literal title; other roles refer to "this paper"/"my paper" generically and were left alone). For that bolding to actually render instead of showing as literal `<strong>` text, `showSpeechBubble()` gained an `isHTML` param (default `false`, so every other caller — roll call responses, motions, generic Phase 2 speech lines, caucus dialogue — is unaffected); `beginSpeech()` passes `true` only when `sp.roundKey === "stage3"`.

### Placeholder Substitution

New `substituteStage3Line(template, del, paper)` extends the existing `{country}`/`{boss}` convention (`substituteLine()`, used by the caucus dialogue engine) with `{carolinaLeadCountry}` and `{paperName}`:

- `{country}` → the speaking delegate's own country.
- `{boss}` → the power-led bloc's Power-Del's country, looked up fresh from `state.p2.stage2.papers` (not the speaker's own `delegate.boss`) so it resolves correctly regardless of which role is reading the line.
- `{carolinaLeadCountry}` → the carolina-led bloc's Carolina-style del's country.
- `{paperName}` → the current paper's `name`, wrapped in `<strong>` (v35) — unused by the current content file, but kept consistent with the direct-mention bolding above for any future line that references it.

### Stage 3 → Stage 4 Handoff (v38)

Once the 4th speech's `endCurrentSpeech()` sets `sp.mode = "done"`, `renderSpeechDais()`'s done-branch (still checking `p2.stage === "stage3_speeches"` first, skipping the round-2/debrief branching Phase 2 uses) shows the same "Conclude speeches →" button, now wired to `beginStage4()` instead of the old dead-end `finishStage3Paper1()` (removed). See §8.10 for what that flows into — the exact same function handles both papers, so nothing paper-2-specific lives here.

### Status (v40)

Debrief/star scoring for the whole phase is now built — see §8.11.

---

## 8.10. Phase 4 Stage 4: Amendment Period + Paper Vote (Both Papers), Full Spec (v38)

**Phase 4 now runs start to finish, fully scored.** Both papers are read, get their 4 for/against speeches, go through their amendment period (or skip straight to the vote if the passed motion has no amendment period), and get voted on — then Phase 4 ends on a real debrief (§8.11, v40). Stage 4 itself contributes zero mistake categories to that debrief: it's purely procedural/narrated, with no player-judgment call to grade.

Runs once per paper, right after that paper's Stage 3 speeches conclude (§8.9's Stage 3 → Stage 4 handoff), for both the first- and second-processed paper — the same code path handles both; nothing here branches on which paper it is except `p2.stage4.friendly`, set once at entry.

### Entry

`beginStage4()` sets up `p2.stage4` fresh for whichever paper just finished its speeches:

```js
{
  friendly: <bool>,      // true for the first-processed paper, false for the second
  submitter: <delegate>, // opposing bloc's leader (Power-Del if power-led, Carolina if carolina-led)
  favorIdxs: [],          // scratch: delegate indices currently shown as "in favor", reused across the amendment and paper votes in turn
  amendmentTally: null,   // { favor, oppose, needed, totalPresent } once the amendment vote runs
  amendmentVerdict: null, // "pass" | "fail"
  paperTally: null,       // same shape as amendmentTally, for the paper vote
  paperVerdict: null,     // "pass" | "fail"
}
```

`friendly` is fixed by **processing order**, not randomized — `processingIdx === 0` (the first-processed paper, i.e. "paper 1" in the same sense Stage 2/3 already use the term) is always friendly, the second is always unfriendly. `submitter` is resolved via new `otherBlocForPaper(paper)` (finds the sibling paper's `.bloc` in `state.p2.stage2.papers`) — the bloc that did *not* author the paper on the floor.

If `state.p2.stage2.motion.amendment === true`, `p2.stage` is set to `stage4_announcing_timer`. If `false`, the entire amendment section (steps 1–3 below) is skipped and `p2.stage` goes straight to `stage4_paper_calling_favor` (step 4).

### 1. Amendment Announcement

`stage4_announcing_timer` — a golden chair-speaking button: *"I will now start the `AMENDMENT_PERIOD_SECONDS` (30) second timer for you to bring your amendments to the dais."* No real countdown runs; the constant is shared with `buildVotingMotion()`'s existing "30 second amendment period" spoken/written text (§8.75) so both stay in sync from one source.

On click, `beginAmendmentAnnouncementAnimation()` plays a narrative-only beat: the opposing bloc's leader (`p2.stage4.submitter`) slides from their seat to `STAGE4_CENTER_POS` (an approximate room-center point) and back, purely via plain `seat.style.left`/`.top` writes — reusing `.delegate-seat`'s existing 0.6s left/top CSS transition verbatim, the same mechanism Phase 3's `animateIntoBlocs()` uses for bloc formation (§8.5). No new CSS. After ~1.6s total, advances to `stage4_reading_amendment`.

### 2. Amendment Submission + Friendly/Unfriendly Declaration

- `stage4_reading_amendment` — golden button: *"I will now read out the amendment submitted by **[submitter]**."* Click advances to `stage4_declaring`.
- `stage4_declaring` — golden button: *"Is this amendment friendly or unfriendly?"* Click calls `handleAmendmentDeclaration()`, which shows a `"Friendly"`/`"Unfriendly"` speech bubble (matching `p2.stage4.friendly`, fixed per paper as above) on both of the current paper's sponsors (new shared `paperSponsors(paper)` helper — the paper's leader role plus its Dem-Boy, factored out of Stage 2's reading-button logic, §8.8). After ~1.4s, branches: friendly → `stage4_paper_calling_favor` (step 4); unfriendly → `stage4_amendment_vote_announcing` (step 3).

### 3. Amendment Vote (Unfriendly Path Only)

- `stage4_amendment_vote_announcing` — golden `.dilatory`-styled button (bold "unfriendly" only): *"Seeing that this amendment is **unfriendly**, we will now vote with 2/3 majority on this amendment."*
- `stage4_amendment_calling_favor` / `stage4_amendment_showing_favor` / `stage4_amendment_calling_oppose` / `stage4_amendment_showing_result` — a 4-state favor/oppose vote loop shaped like Phase 2's existing `calling_favor`/`showing_favor`/`calling_oppose`/`showing_oppose` states, but **not** that same machinery: new `handleAmendmentCallFavor()`/`handleAmendmentCallOppose()` are self-contained, since the existing `handleCallFavor()`/`handleCallOppose()` reverse-engineer a target pass/fail outcome first (rigged by motion content) and have no way to force specific delegates onto specific sides. Here, every present delegate votes a genuine per-delegate coin flip, except:
  - the amendment's submitter always votes favor;
  - the paper's two sponsors — the ones who just declared it unfriendly — always vote oppose.

  No abstentions. Needs `Math.ceil(totalPresent * 2 / 3)` in favor to pass (2/3, rounding up — e.g. 6 of 8). The result is announced via a chair-flavor line (`daisStatus`, pass/fail styled like the existing `.verdict-pass`/`.verdict-fail` classes) and has **no effect** on the paper vote that follows — purely procedural. After ~1.8s, advances to `stage4_paper_calling_favor`.

  If friendly, this entire step is skipped (handled by the branch in step 2 above).

### 4. Paper Favor/Oppose Vote (Always Runs)

`stage4_paper_calling_favor` / `stage4_paper_showing_favor` / `stage4_paper_calling_oppose` / `stage4_paper_showing_result` — same 4-state shape, new self-contained `handlePaperCallFavor()`/`handlePaperCallOppose()`. Button text: *"All those in favor of **[Directive Name]** with sponsors **[delegate]** and **[delegate]** please raise your placards high."* (and the opposed equivalent) — directive name and both sponsor countries bolded, matching their first-mention formatting from Stage 2's reading button.

Every present delegate votes a genuine coin flip except the paper's two sponsors, who always vote favor. No abstentions. Simple majority (`Math.floor(totalPresent / 2) + 1`) to pass — not 2/3. The verdict is announced narratively (same styled `daisStatus` pattern) but **does not branch the flow** either way; after ~1.8s, `advanceAfterPaperVote()` runs regardless of pass or fail.

### 5. Repeat for Paper 2

`advanceAfterPaperVote()` checks `p2.stage2.processingIdx`: if `0` (the paper that just finished was first-processed), it clears `p2.stage4` and calls `enterStage2Paper(1)` — the exact same Stage 2 entry point used the first time, restarting the full Stage 2 → Stage 3 → Stage 4 cycle for the second-processed paper. `beginStage4()` is fully generic over `processingIdx` (it reads `friendly`/`submitter`/the current paper fresh every time it's called), so no paper-2-specific branch exists anywhere in Stage 4 — the second pass through is just the same code running again.

### 6. Phase 4 Exit → Debrief (v40)

If `advanceAfterPaperVote()` finds `processingIdx === 1` (the second-processed paper's vote just resolved), it calls `finishPhase4()` — as of v40, a real debrief rather than a dead end. See §8.11 for the full scoring spec; in brief, it reuses `#post-motions-screen`/`renderStarBlock("phase2-stars", ...)`/`buildMultilineSummary()` (same pattern as Phase 2/3), title *"Phase 4 Concluded"*, flavor line *"Both directive papers have been read, debated, and voted on."*, and `renderPostMotionsScreen("phase4")` wires `#restart-btn` to "Adjourn & Restart" (replaces the v38 `"phase4done"` disabled dead-end case).

### Non-Goals

- No handling for an absent bloc leader/Dem-Boy as a sponsor or amendment submitter (an existing, not newly-introduced, gap: Stage 2/3 already read `paper.bloc.power`/`.demboy`/`.carolina` directly with no presence check).

---

## 8.11. Phase 4: Voting Procedure, Full Spec End-to-End (v40)

**Phase 4 is fully built.** Motion → vote (Stage 1) → for/against speaker selection (Stage 2) → for/against speeches (Stage 3) → amendment period + paper vote (Stage 4), for both papers, then a real three-star debrief. This section is the complete, current, top-level picture, mirroring §8.5's role for Phase 3; §8.75/§8.8/§8.9/§8.10 remain the authoritative *mechanism-level* detail for each stage (exact function names, DOM, timing) and are not duplicated here except where summarized.

### Entry & Reuse

Phase 4 reuses the Phase 2/3 `#motions-screen` DOM throughout (same committee room, same `#motions-dais-bar`, same `#speakers-panel`/`#speakers-list` sidebar), gated by `state.p2.votingMode = true`. `startPhase4()` mirrors `startPhase3()`'s reuse pattern and stashes Phase 3's bloc assignment (`state.p2.caucus` → `state.p2.priorCaucus`) across `initPhase2State()`'s wipe, since Stage 2 needs it to build both papers. `unmodMode`/`votingMode` are mutually exclusive, each phase's entry function explicitly clearing the other.

### Stage 1: Motion → Vote (§8.75)

Three random present delegates each raise a `{order, seconds, amendment}` combo, coverage-guaranteed across all three (`buildForcedVotingCombos()`). The player calls the vote on the most disruptive unresolved motion each time, ranked by `votingDisruptivenessRank()` (below) via the shared `disruptivenessRank()`/`compareDisruptiveness()`/`mostDisruptiveUnresolvedIdx()` machinery Phase 2/3 also use. Voting outcome is rigged directly by motion content (`amendment: true` always passes first try, `amendment: false` always fails) rather than the fail-fail-pass retry pattern — independent of the disruptiveness-order grading, which still scores every call normally via `p2.orderPicks`.

#### Disruptiveness Ranking (v40)

```js
function votingDisruptivenessRank(motion) {
  const amendVal = motion.amendment ? 1 : 0;
  const orderVal = motion.order === "reverse" ? 1 : 0;
  return [amendVal, motion.seconds, orderVal];
}
```

Lexicographic descending, same comparison mechanism `compareDisruptiveness()` already uses for every other motion type (a 3-element rank compares its 3rd slot as an additional tiebreak after the first two match; 2-element unmod/rr/mod ranks skip that comparison since it's `undefined` on both sides). This **replaces** the `[orderVal, seconds, amendVal]` tuple `disruptivenessRank()`'s `"voting"` branch used through v40 — that branch now just calls `votingDisruptivenessRank(motion)` directly. Phase 2/3 motions are never type `"voting"`, so they never reach this branch and are completely unaffected; nothing about `disruptivenessRank()`'s `"unmod"`/`"rr"`/`"mod"` branches changed.

In plain terms: amendment status is compared first (an amendment-bearing motion always outranks one without, regardless of seconds/order), then speaking time (60 sec outranks 30 within the same amendment status), then order (reverse outranks submitted only when amendment status AND seconds both already match).

#### Disruptiveness Key (Phase 4-specific, v40)

`#key-popup` (the same popup element Phase 2/3 use) now holds **two** static `.key-rows` blocks side by side in the HTML — `#key-rows-p23` (Phase 2/3's key, completely unchanged) and `#key-rows-p4` (new) — with only one ever visible. `initDisruptivenessKey()`'s `openKey()` picks which to show, fresh on every open, based on `state.p2.votingMode`. No dynamic content generation; both blocks are static markup, matching the existing key's own "no runtime interpolation" character.

The Phase 4 key, top (most disruptive) to bottom (least):
- **Voting Procedure** (new tier, topmost) — gold swatch (`.key-swatch.voting`, `var(--gold)`, a color not used by any other tier). Its sub-rule block reuses the exact visual format `.mod-row`'s `.mod-explain`/`.mod-example` already establishes for a tier's compact explanatory text (indented, `flex-basis: 100%` so it wraps below the row, small monospace type) via new parallel classes `.voting-row .voting-explain`/`.voting-rule` (identical property values, kept separate so Phase 2/3's `.mod-explain`/`.mod-example` are never touched), holding 3 stacked lines instead of 1:
  - *"Motions with an amendment period outrank motions without one."*
  - *"Among motions with the same amendment status, longer speaking time outranks shorter."*
  - *"Among motions with the same amendment status and speaking time, reverse order outranks order submitted."*
- **Unmod**, **Round Robin**, **Mod** (with its existing `mod-example`), **Speaker's List** — identical rows to Phase 2/3's key, same relative order, unchanged content. (These motion types never actually occur in Phase 4 — every Stage 1 motion is type `"voting"` — but the key documents the full disruptiveness scale as instructed, not just what's reachable this phase.)
- **No Adjourn/Suspend row** — that tier is never raised in Phase 4 (Stage 1 has no dilatory-ruling branch at all, per §8.75), so it's omitted entirely rather than shown greyed out or similar.

The shared `.key-footer` ("tie? → earlier proposal wins") is unchanged and still accurate for Phase 4: `compareDisruptiveness()`'s final fallback (`b.proposalOrder - a.proposalOrder`) is the same for every motion type, `"voting"` included.

### Stage 2: For/Against Speaker Selection (§8.8)

Runs once per paper (both, as of v38): read the paper into the record, announce + raise-select 2 for speakers (slacker excluded), announce + raise-select 2 against speakers (from the opposing bloc). Click order is preserved as array order (`forSpeakers`/`againstSpeakers`), which Stage 3 later depends on directly.

### Stage 3: For/Against Speeches (§8.9)

The 4 picked speakers (`forSpeakers[0] → againstSpeakers[0] → forSpeakers[1] → againstSpeakers[1]`) each get recognized, timed, and gaveled through exactly like a Phase 2 mod/RR speech, reusing that machinery verbatim. Content is pulled from `SPEECH_CONTENT`, keyed by topic bucket, which paper is on the floor, side, and speaker role. `p2.speeches.log` — Phase 2's own speech-outcome log — keeps accumulating across both papers' speeches (only `spokenSlots`, the display-only crossed-out tracking, resets per paper as of the v39 bugfix), so by the time paper 2's speeches conclude it holds all 8 entries. The debrief (below) reads it directly.

### Stage 4: Amendment Period + Paper Vote (§8.10)

Runs once per paper: narrative-only amendment announcement (with the opposing bloc's leader sliding to room-center and back), amendment reading + friendly/unfriendly declaration (fixed per paper — first-processed always friendly, second always unfriendly, never randomized), an unfriendly-only 2/3-majority amendment vote (submitter forced favor, the paper's sponsors forced oppose), and an always-runs simple-majority paper vote (sponsors forced favor). Both votes use genuine per-delegate coin flips for every other present delegate, no abstentions; neither vote's outcome branches the flow. `advanceAfterPaperVote()` restarts the whole Stage 2 → 3 → 4 cycle for paper 2 via the same `enterStage2Paper(1)` entry point, then calls `finishPhase4()` once paper 2's vote resolves too.

### Debrief / Scoring (v40)

Phase-2-style formula, uncapped, floored at 0: `stars = max(0, 3 - totalMistakes)`, counted across the **whole phase** (both papers combined), shown once via `finishPhase4()` after paper 2's vote resolves. Reuses `renderStarBlock("phase2-stars", ...)`/`buildMultilineSummary()` — the same shared star-block element Phase 2/3 already retitle and repopulate, no new DOM.

**Four mistake categories:**

1. **Wrong disruptiveness pick (Stage 1).** `p2.orderPicks.filter(p => !p.correct).length` — the exact same mechanism Phase 2/3 use, now correctly graded against `votingDisruptivenessRank()` (above) instead of the old tuple order.

2. **Avoidable repeat speaker (Stage 2, paper 1 → paper 2 handoff only).** New `checkAvoidableRepeatSpeaker(paper, kind, arr)`, called from `onDelegateClickForStage2()`'s completion branch, a no-op unless `p2.stage2.processingIdx === 1` (only paper 2 has a "prior paper" to compare against). Each bloc's pool of non-slacker present delegates is shared between paper 1's role and paper 2's *opposite* role — `buildPaper(ownBloc, otherBloc)` draws `forGroup` from its own bloc and `againstGroup` from the other, so paper 1's `forGroup`/paper 2's `againstGroup` are always the same bloc's pool, and vice versa. The sibling paper's matching selection array is therefore `kind === "for" ? siblingPaper.againstSpeakers : siblingPaper.forSpeakers`. If that pool has an eligible delegate (`paper.forGroup`/`.againstGroup`, already slacker/absence-filtered) who was **not** in the sibling's matching array, and the player's 2 picks for this role are **both** already in it, that's a mistake. A pool of exactly 2 (one non-slacker delegate absent) means both were necessarily used already — unavoidable, never flagged. Fires at most twice total (once per bloc's pool, each crossing from paper 1 to paper 2 exactly once) — `p2.stage2.repeatSpeakerMistakes`.

3. **Recognition misclick (Stage 3).** `speechLog.reduce((s, e) => s + (e.recognitionMisclicks || 0), 0)` over `p2.speeches.log` — same category/mechanism as Phase 2, applied across all 8 speeches (both papers) since the log isn't reset between them.

4. **Speech timing (Stage 3).** Missed warning, late warning, missed gavel-down — each tracked **per-speech, uncapped** (Phase 2's style: `speechLog.filter(e => e.warning === "missed"/"late").length` / `e.gavelDown === "missed"`, three separate counted categories) rather than Phase 3's single-capped-category style, across all 8 speeches.

**Stage 4 contributes zero mistake categories** — the amendment period and both votes are purely procedural/narrated, with no player-judgment call to grade (who wins the votes is randomized, not something the player controls or is graded on).

**Summary clauses** follow the existing multiline convention (`buildMultilineSummary`): one clause per non-zero category, pluralized (`${n} X${n > 1 ? "s" : ""}.`), each on its own line; zero mistakes → the single fallback line *"A masterclass in voting procedure."*

**Exit:** title *"Phase 4 Concluded"*, flavor line *"Both directive papers have been read, debated, and voted on."*, `renderPostMotionsScreen("phase4")` wires `#restart-btn` to **"Proceed to Timed Crisis →"**, calling `startPhase5Stage1()` directly (v43; previously this button read "Adjourn & Restart" and ended the game, with Phase 5 reachable only via the dev panel). See §8.12 for what that flows into. No global debrief exists across the whole session; Phase 5's own combined debrief (§8.12) is the true end of a normal playthrough.

### Dev Mode

Unchanged from §8.75: dev-panel "4 · Voting" (index.html v13) auto-completes Phase 1, fakes a minimal `state.p2.caucus` shell via `assignBlocs()`, then calls `startPhase4()`. From there every stage — including the full paper 2 cycle and the debrief — plays out identically to a normal playthrough; no additional dev-skip wiring was needed for Stage 4 or the debrief.

---

## 8.12. Phase 5, "Timed Crisis", Full Spec (v41, Best Delegate stage added v42, reachable in regular play as of v43)

**Phases 2, 3, and 4's mechanics run back to back to back**, reusing the exact same committee generated at session start (same delegates, personalities, blocs, bosses — no re-roll) and the exact same underlying mechanism functions from each phase, completely unmodified. There are no post-motions/debrief screens and no click-through transition screens between stages — the chair's "Are there any points or motions on the floor?" re-appearing *is* the transition, with the phase label silently updating underneath it. Immediately after Stage 3 (voting procedure) resolves, a 4th stage — a Best Delegate vote (v42) — runs before the debrief. One combined three-star debrief shows once, at the very end. As of v43, a normal Phase 2→3→4 playthrough chains straight into Phase 5 from Phase 4's own debrief button (§8.11's Exit); the dev panel's "5 · Timed Crisis" entry still skips straight here for testing, degrading gracefully exactly as documented under Dev Mode below.

### Architecture: targeted branches, not new mechanics

Every stage's underlying functions — `generateMotion()`, `handleCallForMotions()`, `handleCallFavor()`, `startUnmodCaucus()`, `beginStage4()`, and each phase's own finish function — are the *exact same* functions Phases 2/3/4 already use. Phase 5 adds small, explicitly-commented branches to each, all gated on a single check: `state.phase5 && state.phase5.active` (and, where a specific stage matters, `state.phase5.stage === "mod"|"unmod"|"voting"`). Nothing about normal Phase 2/3/4 play is altered — every new branch is a genuine no-op when `state.phase5` is `null`, which it always is outside Phase 5.

`state.phase5` lives at the top level of `state`, *outside* `state.p2`, specifically so `initPhase2State()`'s full wipe between stages (the same wipe `startPhase2()`/`startPhase3()`/`startPhase4()` already trigger on every normal phase transition) can never touch it:

```js
state.phase5 = {
  active: true,
  stage: "mod" | "unmod" | "voting",   // which stage is currently running
  topicBucket: <one of the 4 PAPER_NAMES keys>,
  stage1TargetType: "mod" | "rr",      // the type Stage 1's vote is rigged to pass
  mistakes: { mod: null, unmod: null, voting: null }, // filled in as each stage resolves
}
```

`state.phase2WinningType` (top-level, outside `state.p2` and outside `state.phase5` too) is set exactly once, only when the *real* Phase 2's own debrief resolves (`finishPhase2()`'s normal path, after its Phase 5 early-return check) — `passed.type`, always `"mod"` or `"rr"` since unmods never pass Phase 2. Phase 5's own Stage 1 reuses `finishPhase2()` but always takes its early-return branch first, so it never sets this itself.

### Topic: one forced bucket for the whole phase

`startPhase5Stage1()` picks `state.phase5.topicBucket` once, excluding whichever bucket `state.p2.priorCaucus.topicBucket` names (the same value Phase 4's Stage 2 already reads to build its papers — still present at this point since nothing has wiped `state.p2` since Phase 4 finished). If that's absent (no real Phase 2→3→4 preceded this — the only reachable case today, since dev-skip is the sole entry point), it just picks among all 4 buckets.

- **Stage 1 motions:** new `pickMotionTopic()` — used everywhere `generateMotion()` used to call `pick(TOPICS)` directly — filters `TOPICS` down to entries whose `TOPIC_BUCKETS[t.long]` matches `state.phase5.topicBucket` whenever `state.phase5.stage === "mod"`; every other caller (real Phase 2, Phase 3's unmod-motion stage, whose motions have no real topic anyway) gets the original unconstrained `pick(TOPICS)`.
- **Stage 2 caucus dialogue:** `startUnmodCaucus()`'s bucket derivation (`const bucket = ...`) now checks `state.phase5.active` first and uses `state.phase5.topicBucket` directly, bypassing the normal `TOPIC_BUCKETS[priorTopic.long]` derivation entirely.
- **Stage 3 papers/speeches:** need no separate override at all — `p2.caucus.topicBucket` (now the forced bucket, per the point above) flows into `p2.priorCaucus.topicBucket` exactly the way it always does when `startPhase5Stage3()` stashes it across the wipe, and Stage 3 already reads `priorCaucus.topicBucket` for `PAPER_NAMES`/`SPEECH_CONTENT` unmodified.

### Stage 1 (mod caucus, reused Phase 2 machinery)

- **No unmods, ever.** `generateMotion()` gained an `inPhase5Stage1` check: when true, a slacker no longer defaults to proposing an unmod — instead, `wantsRR` (normally `p === "carolina"`) becomes a 50/50 coin flip for slackers too, so they end up proposing mod or RR "like everyone else." Since no personality path can produce `type: "unmod"` in Stage 1, the dilatory ruling branch in `renderMotionsDais()` (gated on `motion.type === "unmod" && !p2.unmodMode`) is structurally unreachable — no separate suppression code was needed.
- **Dem-Boy's guaranteed correction removed.** `startPhase5Stage1()`'s raise logic (below) never sets `guaranteedBadMod` on anyone, so `generateMotion()`'s `forceCorrection` check stays naturally false throughout Stage 1.
- **Power-Del's Round 2 repeat-trap persists and refires**, unmodified — speaker selection (`enterSpeakerSelection()`, `buildRound2RaisePool()`, `onDelegateClickForSpeaker()`) is fully generic and needed zero Phase 5-specific changes; `buildRound2RaisePool()`'s existing `d.personality === "power" || !p2.spokenSet.has(i)` check already re-raises Power-Dels in Round 2 regardless of whether they already spoke.
- **Raising:** new `handleCallForMotions()` branch (checked before the `votingMode`/`unmodMode`/else chain) raises exactly **3** present delegates (not Phase 2's 5) — all 3 required, mirroring Phase 3/4's more reliable coverage pattern rather than Phase 2's raise-5-accept-3 pattern, which doesn't guarantee a specific raised delegate's motion is ever generated (the player can dismiss up to 2 of the 5 without ever clicking them). One of the 3 is pre-assigned `_forcedMotionType = state.phase5.stage1TargetType`; `generateMotion()` checks this flag with the same priority as `_forcedVotingCombo`/`_forcedUnmodMinutes` (before personality branching), consuming it once read.
- **The rig:** new `handleCallFavor()` branch, checked before `p2.votingMode`'s existing amendment rig: `willPass = motion.type === state.phase5.stage1TargetType` — the OPPOSITE type from `state.phase2WinningType` always passes, the same type always fails, no matter how many times it's called. Same trust-the-rig pattern as Phase 4 Stage 1's amendment rig (§8.75). Because exactly one of the 3 raised motions is guaranteed the target type (and all 3 are always collected, unlike Phase 2's raise-5), the stage always resolves regardless of player vote-order skill.
- **Mistake tracking:** identical formula to real Phase 2 (`p2.orderPicks`, `p2.repeatPickCount`, `p2.speeches.log`'s recognition/warning/gavel fields) — `finishPhase2()` is reused verbatim through its mistake-computation, just early-returning before ever touching `#post-motions-screen`.

### Stage 2 (unmod caucus, reused Phase 3 machinery)

Unchanged mechanically — the only Phase 5-specific behavior is the forced topic bucket (above) and, as of v42, bloc reuse: `startUnmodCaucus()`'s bloc-building step now reuses `state.phase3Blocs` — the exact bloc objects the real Phase 3's own `startUnmodCaucus()` call built via `assignBlocs()` — instead of calling `assignBlocs()` fresh. **Bloc leadership persists across the whole session and is never re-rolled for Phase 5**, which is what Stage 4 (Best Delegate, below) depends on. Falls back to a fresh `assignBlocs()` call (stashed as the reference for later) only if Phase 3 never actually ran — the dev-skip-to-5 case. The reused bloc objects' per-instance scratch fields (`script`/`turnIdx`/`currentBubble`/etc., already reset every `startUnmodCaucus()` call regardless of freshness) now also reset `guessIdx` — a v42 fix, since reusing a bloc object without it would have opened Phase 5's leader-guess UI already showing Phase 3's old guess. Bloc leader guesses and timing are scored exactly as in a real Phase 3 (`finishPhase3Debrief()`'s `blocMistakes`/`warnMissed`/`warnLate`/`gavelMissed` computation, reused verbatim).

### Stage 3 (voting procedure, reused Phase 4 machinery)

Unchanged mechanically except one thing: `beginStage4()` gained a `forcedFriendly = state.phase5 && state.phase5.active` check, and `p2.stage4.friendly` is `true` whenever that's set (regardless of `isFirstPaper`) — both papers' amendment declarations come back friendly, skipping the unfriendly 2/3-majority vote branch entirely for both, exactly the same code path Phase 4's own normal friendly papers already take. Everything else — Stage 1/2/3 speaker selection and speeches, the paper vote, `advanceAfterPaperVote()`'s paper 1 → paper 2 loop — is identical to a real Phase 4.

### Stage 4: Best Delegate (v42)

Inserted right after Stage 3 fully resolves and right before the combined debrief. New `startPhase5BestDelegate()` (called from `finishPhase4()`'s Phase 5 branch, replacing its old direct call to `showPhase5CombinedDebrief()`) reuses the same `#motions-screen`/`#motions-dais-bar` every other stage does, but skips `initPhase2State()` entirely — no need for a fresh `state.p2`, just `p2.stage = "phase5_best_delegate"` and one new scratch field, `p2.bestDelegateIdx`. Phase label updates to `"Phase 5 of 5 · Best Delegate"`.

**Room state:** normal seating, not Phase 3's bloc huddles. This needs no explicit re-render — Stage 3 (voting procedure) never re-enters bloc-huddle mode in the first place, so the room is already exactly where it needs to be.

**Interaction:** every present delegate's seat is wired to new `onBestDelegateSeatClick()`; absent delegates stay inert. Selection is swap-able before confirming — clicking a different delegate moves the gold glow rather than adding to it, by removing `.leader-guess` from whatever seat currently holds it (if any) before adding it to the newly clicked one. Reuses Phase 3's exact `.leader-guess` visual treatment (no new CSS) minus its persistent-until-caucus-ends behavior, which doesn't apply here — there's no timer to survive, just a single confirm-once action. `renderMotionsDais()`'s new `"phase5_best_delegate"` case shows a prompt while `p2.bestDelegateIdx` is `null`; once a selection exists, it also shows a "Confirm" button (new `daisButton(..., "proceed")`). Clicking it (`confirmBestDelegate()`) strips the seat listeners, then hands off to the combined debrief.

**Correct answer:** new `bestDelegateCorrectIdx()` — the CarolinaMUN-style delegate from whichever of `state.phase3Blocs` has `leader === "carolina"`. Because Stage 2 now reuses those same bloc objects rather than re-rolling them (above), this is guaranteed to be the same individual delegate the player actually saw lead that bloc in Phase 5's own unmod caucus, not a different one from some other random assignment.

**Scoring:** `confirmBestDelegate()` sets `state.phase5.bestDelegateMistake = p2.bestDelegateIdx !== bestDelegateCorrectIdx()` — wrong pick (including no pick, if that state is ever reachable — the Confirm button's existence already prevents it in normal play) costs one mistake; a correct pick costs nothing. Folded into the combined debrief's single total under a new "Overall" heading, which only ever shows one clause: *"Misidentified Best Delegate."*

### No screens between stages

Each stage's own normal finish function gained an early-return branch, checked right after computing that stage's mistake numbers (so the formula itself is never duplicated) and before any `#post-motions-screen` code runs:

- `finishPhase2()` → stashes `state.phase5.mistakes.mod` → calls `startPhase5Stage2()`.
- `finishPhase3Debrief()` → stashes `state.phase5.mistakes.unmod` (the raw `blocMistakes`/`warnMissed`/`warnLate`/`gavelMissed` values, not the pre-combined `timingMistake`, so the combined debrief can reproduce the exact original clause wording) → calls `startPhase5Stage3()`. The caucus-UI cleanup block (`.caucus-clickable`/`.leader-guess` removal) was hoisted above this branch point so both paths run it once, not duplicated.
- `finishPhase4()` → stashes `state.phase5.mistakes.voting` → calls `startPhase5BestDelegate()` (v42; previously called `showPhase5CombinedDebrief()` directly).
- `confirmBestDelegate()` (v42, Stage 4 — not one of Phase 2/3/4's own finish functions, since this stage doesn't exist in any of them) → sets `state.phase5.bestDelegateMistake` → calls `showPhase5CombinedDebrief()`.

`startPhase5Stage1()`/`startPhase5Stage2()`/`startPhase5Stage3()` mirror `startPhase2()`/`startPhase3()`/`startPhase4()`'s entry boilerplate closely (show `#motions-screen`, `initPhase2State()`, set `unmodMode`/`votingMode`, stash `priorCaucus` where needed, clear per-delegate flags — now including `_forcedMotionType` — re-render the room, `renderAgenda()`/`renderMotionsDais()`/`updateMotionsInstructions("Ask the floor for motions.")`), just with the phase label text set to `"Phase 5 of 5 · Moderated Caucus"` / `"· Unmoderated Caucus"` / `"· Voting Procedure"` respectively. Because `showScreen("motions-screen")` is idempotent (it just re-applies the `.active` class; already-active is a harmless no-op) and nothing ever calls `showScreen("post-motions-screen")` in between, the screen genuinely never changes across all three stages — only the label and the chair's opening line change, exactly matching the "no transition screen" requirement.

The Disruptiveness Key needed no Phase 5-specific wiring at all: `initDisruptivenessKey()`'s `openKey()` already picks between `#key-rows-p23` and `#key-rows-p4` based on `state.p2.votingMode`, which Phase 5's own stage-start functions set using the exact same convention Phase 3/4 already do.

### Debrief (combined, once)

New `showPhase5CombinedDebrief()`, called once after Stage 4 (Best Delegate) resolves. Sums all four stages' already-computed mistake totals — Stage 1/3 uncapped per-category, summed directly; Stage 2's bloc-guess count plus its single capped timing point, `(warnMissed || warnLate || gavelMissed) ? 1 : 0`; Stage 4's Best Delegate pick, `bestDelegateMistake ? 1 : 0` — into one scale:

```js
stars = max(0, 3 - (stage1Total + stage2Total + stage3Total + overallTotal))
```

Reuses `renderStarBlock("phase2-stars", ...)`, the same shared star-block element every other phase's debrief retitles/repopulates. The summary HTML groups each stage's clauses under its own heading (new `.mistake-heading` span, style.css v27), omitting any stage with zero mistakes entirely — Stage 4 gets a heading literally called "Overall" (matching the spec's own naming) rather than "Best Delegate", and it never shows more than the one clause:

```
MODERATED CAUCUS
2 repeat speakers called on.
UNMODERATED CAUCUS
1 bloc leader missed or misread.
VOTING PROCEDURE
1 missed 10-second warning.
OVERALL
Misidentified Best Delegate.
```

Zero mistakes across all four stages → the single fallback line *"A flawless crisis, gavel to gavel."* (no headings shown), matching the existing convention's zero-mistake fallback pattern. Title *"Phase 5 Concluded"*, flavor line *"Moderated caucus, unmoderated caucus, and voting procedure, back to back with no stops."* (unchanged — Best Delegate doesn't get its own flavor line), `renderPostMotionsScreen("phase5")` wires `#restart-btn` to "Adjourn & Restart" — same terminal action as `"phase4"`, since no Phase 6 or global cross-playthrough debrief exists.

### Dev Mode

`devSkipTo(5)` auto-completes Phase 1 (`devAutoCompletePhase1()`), resets `state.p2` to `{}`, then calls `startPhase5Stage1()` directly. Unlike Phases 3/4's dev-skips, Stage 1 needs **no** faked bloc/caucus data at all: Stage 2's own `startUnmodCaucus()` generates fresh blocs via `assignBlocs()` when *it* runs (never dependent on anything pre-existing), and `startPhase5Stage1()`'s own bucket-exclusion and `phase2WinningType` reads both already degrade gracefully to their documented fallbacks (no bucket to exclude; coin-flip the target type) when `state.p2`/`state.phase2WinningType` are empty — which, since dev-skip is currently the *only* entry point into Phase 5, is the only case ever actually exercised.

---

## 9. Dev Mode

Panel is a yellow sticky note fixed top-right on the briefing screen when `DEV_MODE = true`. Phase-skip buttons:
- 1 · Roll Call (starts fresh Phase 1)
- 2 · Moderated Caucus (auto-marks Phase 1 correctly, jumps to Phase 2)
- 3 · Unmod (auto-marks Phase 1, fakes a Phase 2 topic, jumps directly to Phase 3 motion collection)
- 4 · Voting (auto-marks Phase 1, jumps directly to Phase 4 Stage 1 motion collection. v33: also fakes a minimal `state.p2.caucus` shell via `assignBlocs()` first, since Stage 2 needs Phase 3's bloc assignment to build its papers; through v32, Stage 1 alone had no such dependency)
- 5 · Timed Crisis (v41, replaces the old disabled "5 · Debrief" placeholder — that text referred to a different, still-unbuilt global debrief, not this phase). Auto-marks Phase 1, jumps directly into Phase 5 Stage 1's motion collection. Needs no faked bloc/caucus data at all, unlike 3/4's dev-skips: Stage 2 builds its own fresh blocs when it runs, and `startPhase5Stage1()` already degrades gracefully (no bucket to exclude, `state.phase2WinningType` unset → coin flip) when `state.p2` is empty.
- ★ Final Debrief (3★ all) (v53). Sets every `state.phaseStars` entry to 3 and opens the global debrief directly, so the perfect-session branch (message, enabled Chair Award button, screenshot hint) can be checked without playing through. This is the one dev path that deliberately reads as perfect.

---

## 10. Phase 5, "Timed Crisis", Full Spec (v41, Best Delegate stage added v42, reachable in regular play as of v43)

See §8.12.

---

## 11. Technical Architecture

### Stack
Plain HTML + CSS + JavaScript. No build step, no framework, no dependencies.

### File Layout
```
point-of-order/
├── index.html
├── style.css
├── game.js
└── assets/
    ├── thud.mp3
    └── (illustrations pending)
```

### State Shape
Single `state` object in `game.js`:
- `committee`, `delegates[]`, `rollOrder[]`, roll-call tracking
- `usedSpeechLines: Set`, global no-reuse tracker for Phase 2 speeches
- `phase2WinningType` (v41): `"mod" | "rr" | null`, set once when the real Phase 2's own debrief resolves; Phase 5 Stage 1 rigs its vote to guarantee the opposite type
- `phase5` (v41; `bestDelegateMistake` added v42): `null` outside Phase 5; see §8.12 for the full shape (`active`, `stage`, `topicBucket`, `stage1TargetType`, `mistakes: { mod, unmod, voting }`, `bestDelegateMistake`). Lives outside `p2` specifically so `initPhase2State()`'s wipe between stages can't touch it
- `phase3Blocs` (v42): `null` until the real Phase 3's own `startUnmodCaucus()` call builds its blocs via `assignBlocs()`; Phase 5's Stage 2 reuses these same bloc objects instead of re-rolling, and Phase 5's Stage 4 (Best Delegate) checks its correct answer against them
- `p2`, Phase 2, 3 & 4 substate (also reused, unmodified, by Phase 5's own three stages):
  - Phase 2 fields: motions, selection, speech loop state, `repeatPickCount`, `motionTransitioning` (v37 reentrancy guard for `handleDilatory()`/`handleModCorrection()`'s deferred stage change)
  - Phase 3 fields (v23): `unmodMode`, `priorTopic`, `caucus: { blocs[2], motion, topicBucket, hoveredIdx, lockedIdx, activeIdx }`
  - Phase 4 Stage 1 field (v30): `votingMode` (mutually exclusive with `unmodMode`; each of `startPhase3()`/`startPhase4()` explicitly clears the other)
  - Phase 4 Stage 2 fields (v33, `repeatSpeakerMistakes` added v40): `priorCaucus` (Phase 3's `caucus` stashed across `startPhase4()`'s `initPhase2State()` wipe, same pattern as `priorTopic`); `stage2: { papers[2], processingOrder, processingIdx, motion, selectingKind, raisedPool, repeatSpeakerMistakes }`
  - Phase 4 Stage 3 (v34): no new top-level `p2` fields — reuses Phase 2's own `speakerOrder`/`speakersMotion`/`totalSpeakers` (repurposed: `speakerOrder` set directly from the current paper's `forSpeakers`/`againstSpeakers` instead of built via raise-pool selection, `speakersMotion` pointed at `stage2.motion`) and the shared `speeches` object below, gated by `p2.stage === "stage3_speeches"`
  - Phase 4 Stage 4 (v38): `stage4: { friendly, submitter, favorIdxs, amendmentTally, amendmentVerdict, paperTally, paperVerdict }`, set fresh by `beginStage4()` for each paper in turn and cleared back to `null` between papers by `advanceAfterPaperVote()`
  - Phase 5 Stage 4 (v42): `bestDelegateIdx`, set by `startPhase5BestDelegate()`; not wiped by `initPhase2State()` since this stage deliberately skips calling it
  - `speeches`, shared speech-loop object; `caucusMode` flag flips it into caucus behavior

### Timer Engine
Single `setInterval` at 50ms drives both the speech clock and the caucus clock. Per-instance rates (`sp.preRate`, `sp.warnRate`) are set from either `beginSpeech()` (speeches) or `setupCaucusTimer()` (caucus). Thresholds (`sp.warnThreshold`, `sp.lateThreshold`) also configurable per instance. **v32:** in caucus mode, `tickSpeech()` multiplies whichever rate is active by `CAUCUS_FF_MULTIPLIER` (3) when `sp.ffActive` is true; see §8.5's Fast-Forward Toggle subsection.

### Caucus Dialogue Engine (v24, fast-forward-aware as of v32)
Per-bloc dialogue waits go through `scheduleFFAwareStep(blocIdx, nominalMs, callback)`, which replaced the raw nested `setTimeout` calls a plain rate-multiply couldn't retroactively affect. Each call records the step's nominal (1×) duration, a start timestamp, and the FF rate active at that moment (`bloc._stepNominalMs` / `_stepStartedAt` / `_stepFFAtStart` / `_stepCallback`), then schedules the real timeout at `nominalMs / (ffActive ? 3 : 1)`. `rescaleActiveCaucusStep()` — invoked by `setCaucusFF()` on every toggle — reads that bookkeeping for the currently-active bloc, computes how much nominal time has actually elapsed under whatever rate was running, cancels the in-flight timer, and reschedules the *remaining* nominal time at the new rate, so a bubble mid-display (including mid-overlap) audibly/visibly speeds up or slows down immediately instead of stuttering until its next scheduled turn.

`activateBloc(i)` starts the chain (after a 200ms soft hover-in delay, itself NOT fast-forward-scaled — only the visible/gap/overlap turn-display durations are); `deactivateBloc(i)` cancels timers, clears any visible bubble(s) immediately, preserves `turnIdx`, and (v32) also clears the paused bloc's step-tracking fields so a stale record can't be misread if that bloc reactivates and FF toggles during its hover-in delay, before a fresh tracked step exists. Only the `activeIdx` bloc runs. `displayTurn` shows a line; `scheduleLifecycle` drives normal vs. cutoff-overlap timing per turn via `scheduleFFAwareStep` (see §8.5). No line selection, no randomness, no per-bloc no-reuse set; each bloc plays its one assigned script start to finish. FF is caucus-wide: switching hover focus to the other bloc activates it fresh through this same path, which already reads the current `ffActive` state, so no separate per-bloc FF wiring is needed.

### Asset Swap
See §4. `DELEGATE_ART`, `GAVEL_ART`, `GAVEL_SOUND` are the sole points of change when assets are added.

### Star Rendering
`renderStarBlock(containerId, stars, summaryHTML)` injects three SVG stars and sets neighbor `#*-summary` innerHTML (v21). Callers use `buildMultilineSummary(clauses, fallback)`. Phase 3 reuses `#phase2-stars` / `#phase2-summary` on the shared `#post-motions-screen`.

### Post-Motions Button
`renderPostMotionsScreen(phase)` (v23, extended v30, v33, v34, v38, v41) rewires `#restart-btn` at runtime:
- `phase === "phase2"`: text "Proceed to Unmods →", handler `startPhase3()`.
- `phase === "phase3"`: text "Proceed to Voting Procedure →", handler `startPhase4()`.
- `phase === "phase4"`: text "Adjourn & Restart", handler reloads the page. The true end of a normal Phase 2→3→4 playthrough, named explicitly (rather than falling through to the generic fallback below) to read consistently with `"phase2"`/`"phase3"`. (Replaces the v38 `"phase4done"` disabled dead-end case, now that `finishPhase4()` is a real debrief.)
- `phase === "phase5"`: text "Adjourn & Restart", same handler as `"phase4"` — Phase 5's own combined debrief has nothing further to chain into either.

Uses `cloneNode` swap to purge any prior click handlers. No static listener on the button.

### Persistence
None.

---

## 12. Workflow Conventions (for Claude sessions)

- The user does not code. All code changes come from the assistant.
- The latest artifact is authoritative. If the code header disagrees with §0, code wins and §0 is stale; flag it.
- Before making changes, summarize the plan and wait for approval.
- Only regenerate files that changed. State "unchanged from vN" for others.
- Bump version comments in every changed file's header, update §0 in the same turn (unless the user explicitly defers the DESIGN.md update).
- Never break the asset-swap architecture. Never hardcode asset paths.
- Every source file carries a version comment block at the top.
- **v23 style rule:** No em-dashes in player-facing text.

---

## 13. Change Log (Major Milestones)

- **v42 (Phase 5 Best Delegate stage, current)** — New Stage 4, inserted right after Stage 3 (voting procedure) resolves and right before the combined debrief. Full spec folded into §8.12's Stage 2/Stage 4/Debrief subsections.
    - Bugfix folded in: Phase 5's Stage 2 used to call `assignBlocs()` fresh (re-rolling the bloc split and leader coin-flip every time), so its bloc leadership could silently differ from the real Phase 3 earlier in the session. New top-level `state.phase3Blocs`, set once by the real Phase 3's own `startUnmodCaucus()` call; Phase 5's Stage 2 now reuses those exact bloc objects instead. The reused objects' per-instance scratch-field reset (already run every `startUnmodCaucus()` call) now also resets `guessIdx`, which the old code left alone.
    - New `startPhase5BestDelegate()`: reuses `#motions-screen`/`#motions-dais-bar` without calling `initPhase2State()` (just `p2.stage` + new `p2.bestDelegateIdx`). Room stays in normal seating — Stage 3 never re-enters bloc-huddle mode. New `onBestDelegateSeatClick()` wires every present delegate's seat; selection is swap-able (moves a single `.leader-guess` glow — Phase 3's exact visual treatment, reused verbatim, no new CSS — rather than adding to a set). New `renderMotionsDais()` case shows the prompt, then a "Confirm" button once a delegate is selected.
    - New `bestDelegateCorrectIdx()`: the CarolinaMUN-style delegate from whichever of `state.phase3Blocs` has `leader === "carolina"`. New `confirmBestDelegate()` compares the pick against it, setting `state.phase5.bestDelegateMistake`, then hands off to `showPhase5CombinedDebrief()` (now called from here instead of directly from `finishPhase4()`'s Phase 5 branch).
    - `showPhase5CombinedDebrief()` gained a 4th "Overall" heading, folded into the same `totalMistakes` sum, showing only "Misidentified Best Delegate." when `bestDelegateMistake` is true.
    - style.css and index.html unchanged from v27/v15.
- **v41 (Phase 5, "Timed Crisis")** — Phases 2, 3, and 4's mechanics run back to back to back, reusing the same committee (no re-roll), with no debrief/transition screens between stages and one combined 3-star debrief at the very end. Full spec in §8.12. Dev-panel-only for now — nothing in a normal Phase 2→3→4 playthrough chains into it.
    - New top-level `state.phase5` (outside `state.p2`, so `initPhase2State()`'s wipe between stages can't touch it) and `state.phase2WinningType` (set once, only when the real Phase 2's own debrief resolves).
    - Topic: one forced bucket for the whole phase, picked once in `startPhase5Stage1()` excluding whichever bucket Phases 2/3/4 used. New `pickMotionTopic()` constrains Stage 1's mod/RR motion topics to it; `startUnmodCaucus()`'s bucket derivation uses it directly for Stage 2; Stage 3 inherits it automatically through the existing `priorCaucus` stash.
    - Stage 1 (mod caucus, reused Phase 2 machinery): `generateMotion()` suppresses slacker's unmod default (mod/RR coin flip instead) and Dem-Boy's guaranteed correction (never set). New `handleCallForMotions()` branch raises exactly 3 (not Phase 2's 5, all required), pre-assigning one a `_forcedMotionType` via new `state.phase5.stage1TargetType` (opposite `state.phase2WinningType`, coin-flipped if unset). New `handleCallFavor()` branch rigs the vote off `motion.type` against that target — same trust-the-rig pattern as Phase 4 Stage 1's amendment rig. Power-Del's Round 2 repeat-trap needed no changes (speaker selection is fully generic).
    - Stage 2 (unmod caucus, reused Phase 3 machinery): unchanged mechanically, only the forced topic bucket.
    - Stage 3 (voting procedure, reused Phase 4 machinery): unchanged mechanically except `beginStage4()` now forces `friendly: true` for both papers.
    - No screens between stages: `finishPhase2()`/`finishPhase3Debrief()`/`finishPhase4()` each gained an early-return branch that stashes that stage's mistake tally into `state.phase5.mistakes` and calls the next stage's start function directly. New `startPhase5Stage1()`/`2()`/`3()` mirror `startPhase2()`/`startPhase3()`/`startPhase4()`'s entry boilerplate, just with a different phase-label string each.
    - New `showPhase5CombinedDebrief()`: sums all three stages' mistake totals into one `stars = max(0, 3 - total)` scale, reusing `renderStarBlock("phase2-stars", ...)` with a new grouped summary (three headings, each only its own nonzero clauses; new `.mistake-heading` style, style.css v27). New `renderPostMotionsScreen("phase5")` case, same "Adjourn & Restart" terminal action as `"phase4"`.
    - Dev panel: "5 · Timed Crisis" enabled (index.html v15, replaces the old disabled "5 · Debrief" placeholder). `devSkipTo(5)` needs no faked bloc/caucus data at all, unlike Phases 3/4's dev-skips.
- **v40 (Phase 4 full scoring)** — Disruptiveness pick, repeat speaker, recognition misclick, and speech timing mistake categories; new Phase 4-specific Disruptiveness Key; Phase 4 now ends with a real debrief instead of a placeholder. Full spec in §8.11 (also consolidates §8.75/§8.8/§8.9/§8.10 into one current end-to-end picture, now that all stages are built and confirmed working).
    - New `votingDisruptivenessRank(motion)` → `[amendVal, seconds, orderVal]` (amendment status first). `disruptivenessRank()`'s `"voting"` branch now just calls it, replacing the v30-v39 `[orderVal, seconds, amendVal]` tuple; Phase 2/3 motions are never type `"voting"`, so their ranking is completely unaffected. Falls straight into the existing `compareDisruptiveness()`/`mostDisruptiveUnresolvedIdx()`/`p2.orderPicks` machinery Stage 1 already shared with Phase 2/3 — the "wrong disruptiveness pick" mistake category needed no new plumbing at all.
    - New Phase 4 Disruptiveness Key: `#key-popup` now holds two static `.key-rows` blocks (`index.html` v14) — `#key-rows-p23` (Phase 2/3's, content completely untouched) and `#key-rows-p4` (new: Voting Procedure tier on top with its 3 sub-rules in a new `.voting-explain`/`.voting-rule` format mirroring `.mod-explain`/`.mod-example` exactly, then Unmod/RR/Mod/Speaker's List in their existing order, no Adjourn/Suspend row). `initDisruptivenessKey()`'s `openKey()` picks which to show, fresh each open, from `state.p2.votingMode`.
    - New `checkAvoidableRepeatSpeaker(paper, kind, arr)`, called from `onDelegateClickForStage2()`'s completion branch: a no-op unless `processingIdx === 1` (paper 2). Each bloc's pool is shared between paper 1's role and paper 2's opposite role, so the sibling paper's matching array is always `kind === "for" ? sibling.againstSpeakers : sibling.forSpeakers`; flags a mistake when an unused pool member existed and the player picked 2 already-used delegates instead. `p2.stage2.repeatSpeakerMistakes`, capped at 2 by construction.
    - Recognition misclick + speech timing needed zero new tracking: Stage 3 already writes into the shared `p2.speeches.log` exactly like Phase 2's speeches do, and (v39) that log was never cleared between papers, so it already held all 8 speeches' entries by the time paper 2 concluded.
    - `finishPhase4()` rewritten from the v38 placeholder into a real debrief: Phase-2-style formula (uncapped, floor 0) summing the 4 categories above, `renderStarBlock("phase2-stars", ...)` + `buildMultilineSummary()` (same shared star-block Phase 2/3 already retitle/repopulate), new `renderPostMotionsScreen("phase4")` case wiring `#restart-btn` to "Adjourn & Restart" (replaces the v38 `"phase4done"` disabled case) — the true end of the built game for this pass.
    - style.css v26: `.key-swatch.voting` + `.voting-row .voting-explain`/`.voting-rule`, both Phase-4-key-only, additive.
- **v25 style.css bugfix (game.js unchanged from v39)** — Trailing punctuation (usually a lone ".") could wrap onto its own line at the end of a paragraph in the game's narrowest, most text-dense, center-aligned containers.
    - Root cause: `.speech-bubble` (240px max-width), `.chair-prompt-btn` (720px, center-aligned), `.dais-status`, and `.flavor-text` all wrap long sentences with plain `white-space: normal` / `word-wrap: break-word` and no orphan control, so a sentence whose last "word" — often just a trailing period — didn't fit on the current line dropped to a line by itself.
    - Fix: added `text-wrap: pretty` to all four. Purely additive and backwards-compatible — unsupported browsers ignore the declaration and wrap exactly as before; supporting ones (recent Chrome/Edge/Firefox) rebalance line breaks to avoid a short orphan on the paragraph's last line. No JS or markup changes.
- **v39 (bugfix)** — Paper 2's speakers panel opened with every name already struck through in the 2-for/2-against list, even though nobody had spoken yet (purely visual; the speech loop itself ran fine).
    - Root cause: `startSpeechesRound()` only builds a fresh `p2.speeches` object (empty `spokenSlots`) the first time it's ever called, by design — Phase 2's round1 → round2 transition needs `log`/`spokenSlots` to keep accumulating across one continuous `speakerOrder`. `beginStage3Speeches()` calls the same function once per paper, but slot indices 0-3 mean a different set of 4 people each time, so paper 2 inherited paper 1's `spokenSlots {0,1,2,3}`.
    - Fix: `beginStage3Speeches()` now explicitly resets `p2.speeches.spokenSlots` to a fresh `Set` every time it runs (`log` untouched, still accumulates). Details folded into §8.9's Recognition/Timer/Gavel Loop subsection.
    - style.css and index.html unchanged from v24/v13.
- **v38 (Phase 4 Stage 4)** — Amendment period + paper vote for both papers; Phase 4 now runs start to finish procedurally with no scoring yet. Full spec in §8.10.
    - `beginStage4()` (replaces the old dead-end `finishStage3Paper1()`) runs after each paper's 4 speeches conclude, for both the first- and second-processed paper via the same code path — nothing branches on which paper it is except `p2.stage4.friendly` (fixed by processing order: first paper always friendly, second always unfriendly), matching Stage 2/3's existing "paper 1"/"paper 2" convention. Skips the amendment section entirely to the paper vote when the passed motion has `amendment: false`.
    - Amendment announcement: narrative-only "I will now start the 30 second timer..." button (no real countdown; `AMENDMENT_PERIOD_SECONDS` shared with `buildVotingMotion()`'s existing spoken text). New `beginAmendmentAnnouncementAnimation()` slides the opposing bloc's leader (new `otherBlocForPaper()`) to a center point and back via plain `seat.style.left`/`.top` writes, reusing `.delegate-seat`'s existing 0.6s CSS transition verbatim — the same mechanism Phase 3's bloc-formation slide uses.
    - Submission + declaration: reads the amendment, then asks friendly/unfriendly. New shared `paperSponsors(paper)` helper (factored out of Stage 2's reading button) gets a matching "Friendly"/"Unfriendly" speech bubble.
    - Amendment vote (unfriendly only, 2/3 majority) and paper vote (always, simple majority): two self-contained favor/oppose vote loops (new `handleAmendmentCallFavor()`/`handleAmendmentCallOppose()` and `handlePaperCallFavor()`/`handlePaperCallOppose()`) — deliberately not the existing `handleCallFavor()`/`handleCallOppose()` machinery, since that reverse-engineers a rigged pass/fail outcome and can't force specific delegates onto specific sides. Every present delegate votes a genuine coin flip except forced roles (amendment: submitter favor, sponsors oppose; paper: sponsors favor). No abstentions either vote. The amendment's outcome has no effect on the paper vote; the paper vote's outcome doesn't branch the flow.
    - `advanceAfterPaperVote()` restarts the whole Stage 2 → 3 → 4 cycle for paper 2 via the same `enterStage2Paper(1)` entry point Stage 2 always used, then calls new `finishPhase4()` — a genuine dead end reusing `#post-motions-screen` (new `renderPostMotionsScreen("phase4done")` case, replaces the v34 `"phase4stage3"` case) once paper 2's vote resolves too.
    - style.css and index.html unchanged from v24/v13 — Stage 4 reuses every button/vote/animation class verbatim.
- **v37 (bugfix)** — Rapid double-click on the mod-correction/dilatory button during Phase 2 motion proposition could corrupt a motion's `min` field to `undefined`, soft-locking speaker selection once that motion passed.
    - Root cause: `handleDilatory()`/`handleModCorrection()` defer their actual `p2.stage` change 500ms behind a `setTimeout`, but the triggering `.chair-prompt-btn` stays live in the DOM that whole time (`renderMotionsDais()`, which would remove it, only runs once the timeout fires). A second click inside that window re-entered `handleModCorrection()` after the first click had already overwritten `del._pendingMotion` with its corrected motion (which has no `.correctedMin` field), so `generateCorrectedMotion()`'s `rMin` read back `undefined` — yielding a written motion like *"Belgium undefined 45 Regional"* and, once voted through, an `undefined`/`NaN` `speakerCount()` that stalled speaker selection.
    - Fix: new `p2.motionTransitioning` flag (reset by `initPhase2State()`), set the instant either handler is entered and cleared only inside its own `setTimeout` callback, so a second click during the 500ms window is now a no-op in both. Single-click timing/behavior unchanged.
    - style.css and index.html unchanged from v24/v13.
- **v36 (Stage 3 speaker-list highlighting + Phase 2 Round Robin skip)** — Two independent additions.
    - Stage 3's `#speakers-list` For:/Against: slots now highlight the current/active speaker and cross out finished ones, exactly like Phase 2's speech loop. Details in §8.9's Recognition/Timer/Gavel Loop subsection.
    - Phase 2 Round Robin: from the 4th speaker onward, a skip button (styled and positioned exactly like Phase 3's caucus fast-forward button) lets the player autocomplete the remaining speeches; not pressing it changes nothing. Full spec in §8's new Round Robin Skip subsection.
    - style.css and index.html unchanged from v24/v13 — both reuse existing CSS/markup verbatim.
- **v35 (paper-name bolding)** — Every mention of a paper's name in Stage 2/3 chair buttons and Stage 3 speeches is now bolded. Details folded into §8.8's Per-Paper Flow step 1 and §8.9's Content Lookup / Placeholder Substitution.
    - `stage2_reading`'s dais button wraps `${paper.name}` in `<strong>`, matching the sponsor-country bolding it already had.
    - `showSpeechBubble()` gained an `isHTML` param (default `false`); `beginSpeech()` passes `true` only for stage3 speeches, so `SPEECH_CONTENT`'s `<strong>` tags render instead of showing as literal text. Every other speech-bubble caller is unaffected.
    - `substituteStage3Line()`'s `{paperName}` substitution now wraps in `<strong>` too (unused by current content, kept consistent for forward-compat).
    - `SPEECH_CONTENT`: wrapped every literal in-line mention of a paper's own title (only the Carolina-role joke lines name a paper by its literal title; other roles were left alone).
    - style.css and index.html unchanged from v24/v13.
- **v34 (Phase 4 Stage 3)** — For/against speeches for paper 1 wired to authored content, amendments/vote/paper 2 still stubbed. Full spec in §8.9.
    - Speaking order has no new selection UI: it's the 4 delegates already picked in Stage 2, in fixed order `forSpeakers[0] → againstSpeakers[0] → forSpeakers[1] → againstSpeakers[1]`. `onDelegateClickForStage2()`'s completion branch now calls new `beginStage3Speeches()` instead of the old dead-end `finishStage2FirstPaper()` (removed).
    - Recognition/timer/gavel loop is a verbatim reuse of Phase 2's mod/RR speech infrastructure: `beginStage3Speeches()` sets `p2.speakerOrder` to the fixed order and `p2.speakersMotion` to `state.p2.stage2.motion`, then calls the existing `startSpeechesRound()`/`applyRecognitionHighlight()`. New `p2.stage = "stage3_speeches"` just routes to the existing `renderSpeechDais()`. `speechSecondsForMotion()` gained a `motion.type === "voting"` branch (`→ motion.seconds`) alongside its existing branches.
    - New `SPEECH_CONTENT` table (transcribed verbatim from `phase4_speech_content.md`), keyed `[topicBucket][paper.leader][side][role]`. `beginSpeech()` swaps in new `drawStage3SpeechLine()` (in place of the generic `drawSpeechLine()` pool) whenever `sp.roundKey === "stage3"`; it derives for/against from the slot's parity and looks up the line directly — keying by `paper.leader` is what makes the correct Power-Del (leading/dominant vs. non-leading/sloppy-pivot) and Dem-Boy (glazes-boss vs. empowered) variant fall out automatically, no extra role logic needed.
    - New `substituteStage3Line()` extends the existing `{country}`/`{boss}` placeholder convention with `{carolinaLeadCountry}` and `{paperName}`; `{boss}` is looked up fresh from both Stage 2 papers' blocs so it resolves correctly regardless of which role reads it.
    - `renderSpeakersList()` (called internally by the reused `beginSpeech()`/`endCurrentSpeech()`) now defers to `renderStage2SpeakersPanel()` during `stage3_speeches`, so the sidebar keeps showing Stage 2's paper-name + For:/Against: grouping instead of switching to the generic per-round list.
    - Stage exit is the same placeholder pattern the old `finishStage2FirstPaper()` used, just one step later: new `finishStage3Paper1()` + `renderPostMotionsScreen("phase4stage3")` (replaces the v33 `"phase4stage2"` case), disabled button now reads "Stage 4 (amendments + vote) not yet built." (bumped from 3, since these speeches now occupy the "Stage 3" slot).
    - No debrief scoring: `sp.log` keeps recording each speech's warning/gavel/misclick outcome via the untouched `endCurrentSpeech()` path, for a future debrief stage to read, but nothing in this pass computes stars from it.
    - style.css and index.html unchanged from v24/v13.
- **v33 (Phase 4 Stage 2: directive reading + for/against speaker selection, paper 1 only)** — Replaces the old Stage 1 dead end. Amendments, voting, and paper 2 are explicitly not part of this pass. Full spec, including forward-compat requirements and non-goals, in §8.8.
    - New `PAPER_NAMES` table (keyed by the same 4 topic buckets Phase 3's caucus dialogue uses) and `buildStage2Papers(motion)`, which builds two paper objects from Phase 3's blocs. Submission order is fixed (Bloc A = paper index 0, Bloc B = index 1); the motion's `order`/`reverse` field only determines processing order (`processingOrder`).
    - `startPhase4()` now stashes `state.p2.caucus` into `state.p2.priorCaucus` before `initPhase2State()` wipes it, mirroring `startPhase3()`'s `priorTopic` stash. `devSkipTo(4)` fakes a minimal caucus shell via `assignBlocs()` for dev-skip, since Stage 2 (unlike Stage 1 alone) needs real bloc data.
    - New per-paper flow (`stage2_reading` → `stage2_announcing_for` → `stage2_selecting_for` → `stage2_announcing_against` → `stage2_selecting_against`): golden "read the paper" button, gold dilatory-style "for"/"against" emphasis buttons, click-2-of-3 selection (slacker always excluded) mirroring the existing mod speaker-selection pattern. Click order is preserved as array order (`forSpeakers`/`againstSpeakers`) — a forward-compat requirement for a future stage that derives speech order from array position.
    - The motions agenda (`#agenda-list`) is left untouched through Stage 2, still showing the 3 motions with pass/fail styling exactly like Phase 2. New `renderStage2SpeakersPanel()` instead reuses the existing `#speakers-panel`/`#speakers-list` sidebar (the same one Phase 2's mod speeches populate): paper name in `#speakers-motion-label`, then progressively-filling "For:"/"Against:" groups, each explicitly numbered 1./2. per slot (a shared-CSS-counter-reset approach was tried first but didn't actually restart the count between groups, so numbering is written directly instead). Reuses the panel's existing `.just-filled` flash animation.
    - Stops after the first-processed paper (not necessarily Bloc A's) completes selection: reuses `#post-motions-screen`, `.star-result` hidden, new `renderPostMotionsScreen("phase4stage2")` case with a disabled "Stage 3 (amendments + vote) not yet built." button (replaces the old `"phase4stage1"` case).
    - Forward-compat: nothing in this pass mutates `delegate.personality`/`.boss`, `bloc.leader`, or a paper's `.bloc` reference — a future stage computes each speaker's rhetorical role from those fields on the fly.
    - style.css v24: new `.speakers-list li.speakers-subheader` / `.stage2-slot` / `.speakers-num` styles, plus a `white-space: nowrap` fix on the "Speakers List" header label so it doesn't wrap against longer paper names.
- **v32 (Phase 3 caucus fast-forward toggle)** — Separate from the Phase 4 Stage 1 work: a Phase 3 caucus feature addition. Full spec in §8.5's Fast-Forward Toggle subsection.
    - New icon-only ⏩ button (no text label) in the caucus dais, positioned to the left of the "UNMODERATED CAUCUS" / minutes label, caucus-wide (one `sp.ffActive` state, not per-bloc). Appears the instant the timer enters `pre` phase, toggles on click, disappears entirely once the timer hits 0:00 (`ffActive` explicitly reset to `false` at that transition too).
    - While active: `tickSpeech()` multiplies the currently-active rate (`preRate` or `warnRate`) by `CAUCUS_FF_MULTIPLIER` (3); dialogue turn-display durations run at 1/3 normal length.
    - Auto-revert: FF is forced off the instant displayed seconds crosses into `warn` phase (reusing the existing `<=` threshold check, so a 3×-sped tick can't skip the revert). Re-clickable afterward; re-enabling during `warn` behaves identically to `pre`-phase FF.
    - New `scheduleFFAwareStep()`/`rescaleActiveCaucusStep()` replace raw nested `setTimeout` calls in the dialogue engine so an in-flight bubble (including mid-overlap) rescales immediately on toggle instead of stuttering until its next scheduled turn. `deactivateBloc()` now also clears a paused bloc's step-tracking fields to prevent stale-data misreads on reactivation.
    - Hover pause/resume unchanged except: resuming plays at whatever FF state is currently active, never forced back to normal speed.
    - Gavel-down logic, warning thresholds, and debrief scoring untouched (all key off displayed seconds, not real time).
    - style.css v23: new `.caucus-ff-btn` states, same technique as `.gavel-btn`.
- **v31 (Phase 1 gray-out persistence bugfix + Phase 4 punctuation)**
    - **Bugfix:** a Phase 1 misclick ruling an actually-present (or P&V) delegate "absent" left `del.markedAs = "absent"` permanently set. Phase 2/3/4 room renders gray a seat out via `del.markedAs === "absent" || !del.present`, so the misclick kept that delegate visually marked absent for the rest of committee even though `del.present` (their real attendance flag, set once at committee generation and never mutated by roll call) was still `true`. New `reconcileMarkedAsAfterRollCall()`, called from `finishRollCall()`, resets `markedAs` back to the delegate's real expected ruling for any present delegate whose `markedAs` still says "absent." Truly absent delegates are unaffected either way (the `!del.present` half of that same check already grays them out correctly). Scoring is untouched: `computeAndShowScore()` reads only `state.rollResults`, never `markedAs`, so the misclick still costs a star in the Phase 1 debrief.
    - Phase 4 Stage 1's motion `spoken` text no longer ends in a trailing period, matching every other motion type (none of unmod/rr/mod's `spoken` templates end in punctuation).
    - style.css and index.html unchanged from v22/v13.
- **v30 (Phase 4 Stage 1: motion proposition + vote only)** — Partial phase; Stage 2 (the 2-for/2-against speech loop), amendment mechanics, and the final vote are explicitly not part of this pass. Full spec, including the non-goals list, in §8.75. Revised before ship: Q&A framing replaced with 2-for/2-against, motion count corrected from 4 to 3 (matching the standing 3-motion rule already used by Phase 2 and Phase 3).
    - New motion type `"voting"`: `{ order, seconds, amendment, spoken, written }`.
    - `startPhase4()` mirrors `startPhase3()`'s reuse pattern; `unmodMode`/`votingMode` are mutually exclusive, each explicitly cleared by the other's entry function.
    - `buildForcedVotingCombos()`: coverage-guaranteed distinct-combo assignment for the 3 raised delegates. Slot A (submitted) and Slot B (reverse, opposite amendment value from A) alone guarantee both orders and both amendment values are represented; Slot C is unconstrained.
    - `disruptivenessRank`/`compareDisruptiveness` extended for a 3-part `[order, seconds, amendment]` tiebreak; 2-element ranks (unmod/rr/mod) unaffected.
    - Voting outcome is rigged directly by motion content (`amendment: true` always passes first try, `amendment: false` always fails), not the usual fail-fail-pass retry pattern. Order-pick grading is unaffected.
    - Stage 1 exit is a genuine dead end: `showVotingStage1Placeholder()` reuses `#post-motions-screen`, hides `.star-result` entirely (no scoring yet), and sets `#restart-btn` to a disabled "Stage 2 (Q&A) not yet built." button (literal button copy retained from the original Stage 1 spec even though the mechanic is now framed as 2-for/2-against, not Q&A).
    - style.css v22: `.chair-prompt-btn` gained explicit wrap rules so the voting motion's spoken sentence (longest string in the game) grows the dais bar to 2+ lines instead of overflowing.
    - index.html v13: dev-panel "4 · Voting" button enabled.
- **v29 (speaker-selection soft-lock fix)** — Fixed a reported bug: a demboy/slacker proposer choosing "last" on a single-round mod could leave the player prompted for one fewer speaker than needed, permanently stranding a null `speakerOrder` slot and soft-locking the speech loop. Root cause: `round1Target`/`round2Target` were counters manually decremented in parallel with `speakerOrder`, so the two could desync. Fix: they're now fixed round sizes set once and never mutated again; "how many more are needed" is always derived fresh from counting actual filled slots in `speakerOrder` (new `round1FilledCount()`/`round2FilledCount()`), so it can't drift out of sync regardless of how or how many times a slot gets filled.
- **v28 (motions-close button restyled; dropped on-time 10-sec speech flash)**
    - The `ready_to_vote` stage's button (shared by Phase 2 and Phase 3's motions screen, and expected to carry into Phases 4-5) changed from blue "Move to vote on the motions →" to gold/italic "That is all the motions we will be accepting at this time." — dropping the `proceed` class puts it under the existing chair-dialogue button styling used elsewhere (e.g. the dilatory ruling prompt, the favor/oppose vote calls). Handler and voting flow unchanged.
    - `onGavelClick`'s on-time warn-phase flash ("The chair recognizes 10 seconds remaining.") no longer fires for speeches. The late-warning flash and the caucus's "one minute remaining" flash are unchanged.
- **v27 (glow/bubble fix + shorter caucus ramp)**
    - Speech bubbles no longer inherit a glowing delegate's drop-shadow. `renderCommitteeRoom` now wraps figure + placard in a `.seat-figure` div; `.speech-bubble` is appended as a sibling of it, not a descendant, so it sits outside any filter applied to `.seat-figure`. `.leader-guess` and `.caucus-clickable:hover` glows retargeted accordingly. (The same underlying quirk exists in Roll Call's `.active` and Phase 2's `.awaiting-recognition`; left as-is since it wasn't reported broken there.)
    - Confirmed already in place from v26: a leader guess made in the dimmed (unfocused) bloc reads less dim than its bloc-mates, via `.bloc-dimmed.leader-guess { opacity: 0.75; }`.
    - `CAUCUS_PRE_REAL_SEC` 75 → 55; `CAUCUS_WARN_REAL_SEC` unchanged at 15. Total caucus real-time window 90 sec → 70 sec. Note: this is now *less* than the ~75 to 76 seconds both full scripts need combined (see §8.5) — a deliberate tradeoff, not an oversight.
- **v26 (bloc focus indicator replaced)** — The v25 Carolina Blue `.bloc-focused` glow read as too strong/distracting in playtest. Replaced with `.bloc-dimmed`: the unfocused bloc's seats recede (opacity 0.55, `grayscale(0.4)`) instead of the focused one glowing. Nothing changes on the focused bloc itself, so this never competes with the gold leader-guess glow; a `.bloc-dimmed.leader-guess` override keeps a guess in the dimmed bloc legible.
- **v25 (caucus dialogue tuning)** — Playtest pass on the v24 scripted engine.
    - Normal turn cadence sped up: 3500ms visible / 500ms gap -> 2800ms / 400ms.
    - Cutoff overlap point moved earlier: 3000ms -> 1900ms into the cut-off line's display.
    - Removed the shift-left/shift-right positional offset on overlap bubbles; replaced with a z-index boost (`.overlap-front`) on the interrupting delegate's seat, cleared once the overlap resolves, so the incoming bubble always renders on top regardless of DOM order.
    - Added a whole-bloc Carolina Blue focus glow (`.bloc-focused`) on every seat in the hovered bloc, layered with (not overwritten by) the individual gold leader-guess glow via a combined CSS rule.
    - Total 90-second caucus window left unchanged; verified the new cadence fits both scripts comfortably within it.
- **v24 (scripted caucus dialogue)** — Replaced the weighted-random dialogue engine with authored scripted playback.
    - `CAUCUS_LINES` removed; new `CAUCUS_CONVOS` holds 8 authored ~12-turn scripts (4 topic buckets × 2 leader variants), transcribed from `unmod_dialogue.md`.
    - Each bloc plays exactly one script via `turnIdx`; no per-bloc no-reuse set, no weighted role odds.
    - Cutoff lines (ending in `,` or `...`) trigger an overlap turn: the next line appears alongside the current one, both visible briefly, pushed apart visually, before the older one clears.
    - Removed the "Lock focus" button entirely; focus is now purely hover-based (`activeIdx = hoveredIdx`), with a 150ms hover debounce plus a 200ms soft hover-in delay before a newly active bloc's first line appears.
    - Pausing a bloc (un-hovering) immediately hides any visible bubble(s) and preserves `turnIdx`; resuming always replays that line fresh, never mid-timer.
    - Leader-guess clicks, bloc assignment/animation, the caucus timer/gavel, and debrief scoring are unchanged.
- **v1–v6** — Title, briefing, roll call, seating, empty chairs, `DELEGATE_ART` architecture, "here" correction.
- **v7–v11 (motions era)** — Phase 2 motions loop, dais controls, agenda, dilatory rulings, voting, disruptiveness ranking, Key popup, guaranteed-error system.
- **v7–v10 (speaker sel)** — Post-vote Speaker Selection sub-phase.
- **v11 (speaker sel)** — Small mods (≤4 speakers) collapse to single round.
- **v12 (speaker sel)** — Single-round proposer-last target fix.
- **v13 (speeches)** — Full speech loop built.
- **v14 (speeches polish)** — Fixed-real-time timer scaling; recognition returned to seat-click; audio warm-up on Gavel In; checkmark removed.
- **v15 (bugfix)** — Removed `compactSpeakerOrder()` backstop.
- **v16 (audio + dialogue polish)** — `playThud()` fires at 6 additional UI moments; timer box fixed-size; four SPEECH_LINES rewrites.
- **v17 (audio timing fixes)** — Gavel In thud reordered before warm-up; warm-up loop `!a.paused` guard; correction thuds moved to appearance-time.
- **v18 (Round Robin auto-order + gavel spam window fix)** — RR speaker list auto-populates in clockwise seat order from proposer; treated as single-round in speeches. Gavel-down spam window resets on every click at/above min-clicks, capped at 20.
- **v19 (three-star scoring)** — Removed accuracy/pace/numeric scorecards. New Angry Birds-style star debrief. Added `p2.repeatPickCount`. Shared `renderStarBlock()` helper.
- **v20 (late warning penalty)** — Added `warning = "late"` (click at ≤8 displayed sec in speeches). Both `missed` and `late` cost -1 star.
- **v21 (multi-line mistake summary)** — Summary hook uses `innerHTML`; each mistake clause on its own line.
- **v22 (Phase 3 motion collection & voting)** — Reuses Phase 2 `#motions-screen` via `unmodMode` flag. `handleCallForMotions` picks 3 random present delegates and pre-assigns shuffled `[5,7,10]`. `generateMotion` forced-unmod path. No dilatory in Phase 3. `disruptivenessRank(unmod) = [3, min]`. `renderPostMotionsScreen(phase)` retitles/rewires the post-motions button.
- **v23 (Phase 3 caucus, current)** — Full unmoderated caucus built.
    - Committee generation: Dem-Boys paired 1:1 to Power-Dels.
    - Bloc assignment: coin-flip leader before slacker slot; absent slacker → Power-led bloc.
    - Layout: two 2×2 huddles (triangle if 3-delegate); ~600ms slide-in animation via CSS `left`/`top` transition.
    - Dialogue engine: one bubble per bloc at ~4 sec cadence; leader speaks first; role-weighted after opener; slacker silent; session-scoped no-reuse per bloc; topic-bucketed variants.
    - Focus model: hover previews, "Lock focus" button holds. Delegate clicks are leader guesses only, never focus locks.
    - Leader-guess UI: gold glow on guessed delegate; one guess per bloc; free to change until caucus ends.
    - Timer: `(N-1)` min → 75 real sec, last min → 15 real sec; total 90 sec regardless of motion length.
    - Gavel: same three-state button; caucus-specific labels ("One-Minute Warning") and splash texts.
    - Splash texts for each timing mistake: *"The one-minute warning was never given."*, *"Warning given late."*, *"Caucus ran over, no gavel-down."*
    - Scoring: `stars = max(0, 3 - blocMistakes - timingMistake)`; timing errors cap at -1 total.
    - Style rule: no em-dashes in any player-facing text.
    - Dev-panel Phase 3 skip fakes a Phase 2 topic so caucus dialogue has a bucket.

---

## 14. Open Questions & Deferred Decisions

- **Caucus 4-sec cadence tuning** — 3500ms visible + 500ms gap. Play-test whether bubbles feel too fast/slow.
- **Slacker silence** — currently 0% weight. If it reads as broken, add a single "Pass." or shrug line at ~3% weight.
- **Absent-slacker Power-bloc rule** — encoded as spec but should be reviewed with a play-tester who does not know the rule.
- **Late-warning threshold in caucus (48 sec)** — matches speech ratio (20% of warn window). Tune after play-testing.
- **Bloc leader-guess persistence into Phase 5** — needed once Phase 5 exists. Currently `bloc.guessIdx` is scored at Phase 3 debrief and then discarded.
- **Global session summary** — deferred until Phases 4 & 5 exist.
- **Round Robin total-speaker rule** — confirmed as "all present, clockwise from proposer" (v18). Play-test.
- **Crisis Break** — deferred.
- **Hand-drawn illustrations** — pending.
- **Additional gavel/audio variants** — deferred.
- **Keyboard shortcut for gavel** — reserved for tutorial pass.
- **Accessibility** — full ARIA / screen-reader pass deferred.

---

*End of specification.*
