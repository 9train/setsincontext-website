# Port Back Plan

## Goal

Use this prototype as a design and interaction reference for the real DJ app without replacing the current architecture, transport pipeline, or mapping engine.

## Recommended Approach

1. Treat this lab as a visual and product-direction sandbox only.
2. Extract portable ideas into small production tickets instead of attempting a wholesale UI transplant.
3. Rebuild approved pieces inside the real app using its existing state, routing, and data boundaries.

## Safe Port-Back Layers

### 1. Design Tokens

- Port color roles, radius scale, panel elevations, status-pill treatments, and spacing rhythm as tokens first.
- Keep theme presets as named UI modes, not as hard-coded page-level styles.

### 2. Presentation Patterns

- Port the viewer overlay concepts:
  - last-action card
  - pad-mode display
  - deck/status chips
  - OBS-friendly framing
- These are mostly presentational and can sit on top of existing live state.

### 3. Debugger Information Hierarchy

- Port the structure of the inspector:
  - raw MIDI
  - normalized target
  - resolved board target
  - deck/mode context
  - official vs draft source
  - event log
- Keep the production data flow unchanged; only reshape how it is displayed.

### 4. Learn-Mode Safety Model

- Port the interaction rule that new mappings save as draft first.
- Require explicit review and apply steps before official mappings change.
- This is a product decision and workflow improvement, not just a visual treatment.

## Suggested Integration Sequence

1. Introduce shared visual tokens and status components.
2. Refactor the existing viewer into clearer presentation layers.
3. Re-skin the debugger with the calmer inspector hierarchy.
4. Add a draft-review mapping workflow for calibration/learn mode.
5. Add replay concepts only after the live host/viewer/debug loop is stable.

## Architecture Guardrails

- Do not import this prototype directly into production.
- Do not copy mock component structure blindly if it conflicts with current app boundaries.
- Keep production WebMIDI, session transport, and mapping resolution logic as the source of truth.
- Prefer adapter components that consume existing production data and render the new UI patterns.

## What To Rebuild, Not Reuse

- Rebuild all visual components in the production repo.
- Recreate tokens and component APIs natively in the real app.
- Replace mock data with selectors or hooks from the existing production state model.

## What This Prototype Is Best For

- Aligning product direction before deeper engineering work.
- Testing teaching-first messaging with users.
- Reviewing hierarchy and calmness of debugger UX.
- Deciding which viewer overlays are most useful for students, coaches, and streams.
