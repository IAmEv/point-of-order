# Point of Order — Design Specification

**A UNCMUNC Chair Simulator**

---

## 0. Current Versions (Source of Truth)

- `game.js` — **v28**
- `style.css` — **v21**
- `index.html` — **v12**

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

---

## 5. Game Structure

| # | Phase | Duration | Teaches | Status |
|---|---|---|---|---|
| 0 | Title & Committee Briefing | ~15 sec | Framing, randomized committee context | ✅ Built |
| 1 | Roll Call | ~1–2 min | Alphabetical calling, present/P&V/absent distinction, the "here" correction | ✅ Built |
| 2 | Points & Motions → Vote → Speaker Selection → Speeches | ~5–8 min | Motion formats, dilatory rulings, disruptiveness ordering, voting, speaker-list construction, repeat-speaker discipline, speech timing and gavel discipline | ✅ Built |
| 3 | Unmoderated Caucus (Motion Collection → Vote → Caucus) | ~3–4 min | Same motion/vote loop for unmods only; caucus-time management; **bloc leadership assessment**; warning + gavel timing on a compressed clock | ✅ Built (v23) |
| 4 | Voting Procedure | TBD | Draft resolution flow, Q&A vs. 2-for/2-against, amendment period, final vote | ⬜ Not started |
| — | Debrief | ~30 sec | Star summary across all phases | 🚧 Per-phase debriefs built; global debrief planned |

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

*(Unchanged. See prior versions.)*

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

Renders into `#phase2-stars` / `#phase2-summary` (reused). Post-motions title becomes "Caucus Concluded", flavor line reads *"The N minute unmoderated caucus concludes."* Button reads "Adjourn & Restart" and reloads the page.

---

## 9. Dev Mode

Panel is a yellow sticky note fixed top-right on the briefing screen when `DEV_MODE = true`. Phase-skip buttons:
- 1 · Roll Call (starts fresh Phase 1)
- 2 · Moderated Caucus (auto-marks Phase 1 correctly, jumps to Phase 2)
- 3 · Unmod (auto-marks Phase 1, fakes a Phase 2 topic, jumps directly to Phase 3 motion collection)
- 4 · Voting (disabled)
- 5 · Debrief (disabled)

---

## 10. Phases 4–5, Planned

*(Unchanged.)*

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
- `p2`, Phase 2 & 3 substate:
  - Phase 2 fields: motions, selection, speech loop state, `repeatPickCount`
  - Phase 3 fields (v23): `unmodMode`, `priorTopic`, `caucus: { blocs[2], motion, topicBucket, hoveredIdx, lockedIdx, activeIdx }`
  - `speeches`, shared speech-loop object; `caucusMode` flag flips it into caucus behavior

### Timer Engine
Single `setInterval` at 50ms drives both the speech clock and the caucus clock. Per-instance rates (`sp.preRate`, `sp.warnRate`) are set from either `beginSpeech()` (speeches) or `setupCaucusTimer()` (caucus). Thresholds (`sp.warnThreshold`, `sp.lateThreshold`) also configurable per instance.

### Caucus Dialogue Engine (v24)
Per-bloc `setTimeout` chain drives scripted playback from `CAUCUS_CONVOS`. `activateBloc(i)` starts the chain (after a 200ms soft hover-in delay); `deactivateBloc(i)` cancels timers and clears any visible bubble(s), immediately, preserving `turnIdx`. Only the `activeIdx` bloc runs. `displayTurn` shows a line; `scheduleLifecycle` drives normal vs. cutoff-overlap timing per turn (see §8.5). No line selection, no randomness, no per-bloc no-reuse set; each bloc plays its one assigned script start to finish.

### Asset Swap
See §4. `DELEGATE_ART`, `GAVEL_ART`, `GAVEL_SOUND` are the sole points of change when assets are added.

### Star Rendering
`renderStarBlock(containerId, stars, summaryHTML)` injects three SVG stars and sets neighbor `#*-summary` innerHTML (v21). Callers use `buildMultilineSummary(clauses, fallback)`. Phase 3 reuses `#phase2-stars` / `#phase2-summary` on the shared `#post-motions-screen`.

### Post-Motions Button
`renderPostMotionsScreen(phase)` (v23) rewires `#restart-btn` at runtime:
- `phase === "phase2"`: text "Proceed to Unmods →", handler `startPhase3()`.
- `phase === "phase3"`: text "Adjourn & Restart", handler reloads the page.

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

- **v28 (motions-close button restyled; dropped on-time 10-sec speech flash, current)**
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
