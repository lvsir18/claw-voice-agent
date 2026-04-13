# Task Execution Guardrails

## Why Recent Work Drifted

The recent turns went wrong for three concrete reasons:

1. Multiple change types were mixed in one lane.
   Infrastructure, debugging, UI redesign, LAN access, auth, ASR, and TTS were all advanced in overlapping turns.

2. "Rollback" was not treated as a strict restore operation.
   Changes kept evolving around the rollback request instead of restoring the last accepted UI baseline first.

3. No explicit accepted baseline was frozen before visual iterations.
   Without a named baseline, later UI edits drifted into reinterpretation instead of reversible change.

## Operating Rules

1. One active objective at a time.
   Every new request must be classified as one of:
   - functionality
   - infrastructure
   - UI/visual
   - rollback
   - documentation

2. Rollback means exact restore.
   When the user asks to "go back" or "use the previous one", do not improve, reinterpret, or partially keep visual edits.
   First restore the last accepted baseline.
   Only after restoration may new changes be proposed.

3. Separate functional and visual work.
   Do not mix UI redesign with auth, networking, model, ASR, or TTS changes in the same edit pass unless the user explicitly requests both in one batch.

4. Freeze a visual baseline before redesign.
   Before non-trivial UI work, record:
   - current accepted version
   - intended scope
   - what must not change

5. Prefer minimal deltas after stabilization.
   Once a feature is working, later changes should target one surface only:
   - layout
   - copy
   - color/style
   - interaction

6. Verification must match the changed surface.
   - infrastructure: service/process/endpoint checks
   - UI: render/structure checks
   - rollback: confirm restored structure, not just successful deploy

## Immediate Behavior Change

For the rest of this workspace session:

- I will not combine rollback with redesign.
- I will explicitly name the active objective before substantial edits.
- If the task is UI-only, I will keep functionality untouched unless a bug blocks the UI.
