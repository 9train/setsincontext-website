# Session Modals Spec

## Purpose

This document is the source of truth for the **Start Session** and **View Session** modals in the website project.

Its job is to prevent drift.

These modals are part of the same product system and must continue to feel like matching siblings rather than separate one-off screens.

This spec exists to protect four things:

1. A calm, guided user experience.
2. Honest public/private session behavior.
3. Consistent visual and interaction design.
4. Tight scope boundaries between the website and the runtime engine.

---

## Product Intent

The session modals should feel:

- guided
- clean
- premium
- calm
- understandable to a non-technical user
- consistent with the broader “Sets In Context” product direction

They must **not** feel like:

- a debug panel
- a settings wall
- a technical dashboard
- mini documentation pages
- infrastructure control surfaces

The user should always know:

- what step they are on
- what decision they are making
- what to do next

---

## Scope

This spec covers:

- `StartSessionDialog.tsx`
- `ViewSessionDialog.tsx`
- the minimal shared styles needed in `styles.css`
- shared modal structure and copy rules
- behavior and honesty rules for public/private session access
- the correct use of progressive disclosure for advanced details

This spec does **not** cover:

- runtime engine changes
- host/viewer runtime pages
- websocket/server protocol changes
- broader documentation pages
- debugger UX outside of these session modals

---

## Core Anti-Drift Rules

These rules are non-negotiable.

### 1. One main task per step
A step should ask for **one category of decision**, not several unrelated things at once.

### 2. No dashboard walls
Do not reintroduce a dense split layout with a summary rail, technical preview wall, or a cluster of equally loud panels.

### 3. Advanced details stay secondary
Technical or infrastructure-related details may exist only behind a collapsed disclosure such as **Advanced details**.
They must never dominate the main path.

### 4. Public/private honesty must remain intact
Never simplify the UI by lying about behavior.

### 5. The website must not fake runtime behavior
The website should only present actions and states that match the real existing runtime/session logic.

### 6. Matching system, not matching-ish
Start Session and View Session must share the same design language, layout rhythm, and interaction model.

---

## Shared Modal System

Both session modals must use the same structural pattern.

### Header
Each modal should contain:

1. A small eyebrow label.
2. A main step title.
3. A compact step status label such as `Step 1 of 3`.
4. A subtle progress row such as `Type • Privacy • Ready` or `Join method • Details • Ready`.
5. A close button in the top-right.

### Body
The body must show:

- one visible step panel at a time
- one primary task per step
- generous spacing
- large, easy-to-scan selectable cards where applicable

The body must not show:

- side rails
- big technical preview boxes
- runtime walls
- summary dashboards
- repeated explanation panels

### Footer
The footer should behave consistently:

- Step 1: Close in header, no Back button, Next on the right
- Step 2: Back on the left, Next on the right
- Step 3: Back remains available, but the primary action belongs to the step itself

### Interaction Rules
Both modals must support:

- keyboard navigation
- clear focus states
- obvious selected states
- preserved data when navigating Back
- sensible disabled/enabled button behavior

---

## Shared Copy Rules

The main modal copy must be:

- plain English
- concise
- warm
- product-like
- non-technical

The main modal copy must not:

- read like documentation
- read like internal implementation notes
- read like server/runtime instructions
- explain infrastructure in the main flow
- use long paragraphs unless absolutely necessary

Avoid developer-facing wording in the main visible path, such as:

- runtime target
- resolve endpoint
- websocket sync
- deployment target
- server-enforced
- internal implementation notes

If such information must exist, it belongs only in **Advanced details**.

---

## Shared Visual Rules

The visual tone should be:

- spacious
- calm
- premium
- approachable

Preferred layout behavior:

- large decision cards
- one dominant action area
- clearly separated primary and secondary actions
- strong active card states
- simple review sections

Avoid:

- over-boxing everything
- too many competing surfaces
- summary walls
- crowded metadata grids
- panels that look equally important even when they are not

---

## Shared Behavior Rules

### Public behavior must stay accurate
If a public join or viewer path requires resolve-first behavior, keep that logic intact.
Do not replace real flows with speculative links just because it looks simpler.

### Private behavior must stay honest
If a private session requires an invite token or host-generated access path, the UI must clearly reflect that.
Do not imply that a room key alone is enough if it is not.

### Optional fields remain secondary
Optional user-facing fields such as viewer notes should remain visually secondary to the core session actions.

### State must survive step navigation
Back and Next navigation must preserve already-entered values.

---

# Start Session Wizard Spec

## Goal
The Start Session modal should help a host move from intention to action without confusion.

The modal should answer only:

1. Where is this session happening?
2. Is it private or public?
3. What should I do now?

## Step Structure

### Step 1 — Type
**Title:** `Where will this session be used?`

**Optional support line:**
`Choose the kind of setup you want to start.`

**Cards:**

1. **Local / Presentation**
   - Use this for OBS, a projector, your own screen, recording, or an in-person lesson.

2. **Remote / Shared room**
   - Use this when someone else will join from another browser.

**Rules:**

- show only the choice cards and minimal support copy
- do not show room key, session title, host link, viewer link, runtime page, or advanced technical details here

### Step 2 — Privacy
**Title:** `Who should be able to join?`

**Optional support line:**
`Choose how open this session should be.`

**Cards:**

1. **Private**
   - Only people with the invite can join.

2. **Public**
   - Anyone with the room key can join.

**Allowed helper note:**
`For private sessions, the viewer invite is revealed after the host opens the room.`

**Rules:**

- do not show room key or links here
- do not show infrastructure details here
- do not over-explain

### Step 3 — Ready
**Title:** `Your session is ready`

**Optional support line:**
`Review the details, then open the host page to begin.`

**Primary details section:**

- Session title
- Host / DJ display name
- Room key

**Behavior rules:**

- these values should be editable or clearly editable in place
- room key regeneration belongs here, not on earlier steps
- values must persist when navigating back and forward

**Action section:**

Primary host action:
- **Open host page**

Secondary host action:
- **Copy host link**

**Viewer access section:**

If **public**:
- show **Copy viewer link**
- small plain-language line is allowed

If **private**:
- do not present the viewer link as ready unless that is really true
- clearly state that the host must open the session first to reveal the private viewer invite
- a disabled viewer button, placeholder block, or plain explanatory text is acceptable, as long as it is honest

**Advanced details:**

- allowed only behind a collapsed disclosure
- hidden by default
- may contain runtime-related details if still needed
- must not dominate the step

## Start Session Acceptance Criteria

1. The modal is a strict 3-step wizard.
2. Step 1 asks only Local vs Remote.
3. Step 2 asks only Private vs Public.
4. Step 3 is a clean ready state.
5. Step 3 includes session title, host name, and room key.
6. Room key regeneration lives on the final step.
7. Back navigation preserves state.
8. The old dense summary/dashboard feel is absent.
9. Private session behavior remains fully honest.
10. No runtime-engine scope creep is introduced.

---

# View Session Wizard Spec

## Goal
The View Session modal should help a viewer understand how to join and then complete that join with minimal confusion.

The modal should answer only:

1. How are you joining?
2. What information do you need?
3. Are you ready to join?

## Step Structure

### Step 1 — Join Method
**Title:** `How are you joining?`

**Optional support line:**
`Choose the kind of access you were given.`

**Cards:**

1. **Public room key**
   - Use this if the host gave you a room key for the session.

2. **Private invite**
   - Use this if the host sent you a private viewer invite.

**Allowed helper note:**
`Private sessions cannot be joined with only the room key.`

**Rules:**

- do not show room key or invite fields yet
- do not show runtime technical details
- keep the method choice visually simple

### Step 2 — Details
**Title:** `Enter your details`

**Optional support line:**
`Keep this step simple and only ask for what is needed.`

This step changes based on selected join method.

#### Public room key path
**Primary required field:**
- Room key

**Optional fields:**
- Viewer name
- Viewer email

**Rules:**

- optional fields should be visually secondary
- preserve current behavior for these values
- if current logic keeps these values website-only, do not start sending them during resolution
- keep room-key joining resolve-first and honest

#### Private invite path
**Preferred primary field:**
- Private invite link

**Optional fields:**
- Viewer name
- Viewer email

**Rules:**

- do not imply that a private room key alone is enough
- if full invite-paste support exists, use it
- if invite-paste support is not in scope, stay honest and clearly tell the user they need the private invite from the host

### Step 3 — Ready
**Title:** `Ready to join`

**Optional support line:**
`Review the details, then join the session.`

**Primary summary section:**

For **public room key**:
- Join method
- Room key
- Viewer name if provided
- Viewer email if provided

For **private invite**:
- Join method
- simple invite summary or truncated representation if appropriate
- Viewer name if provided
- Viewer email if provided

**Primary action:**
- **Join session**

**Behavior rules:**

For **public room key**:
- keep the real resolve-first flow
- only open the viewer after successful resolution
- stay in the modal on failure
- show clean human-readable error messages

For **private invite**:
- use the real invite-link path if supported
- do not pretend a room-key fallback will work if it will not
- invalid or incomplete input should surface clear user-facing error text

**Advanced details:**

- allowed only behind a collapsed disclosure
- hidden by default
- may contain target/runtime details if still needed
- must not dominate the step

## View Session Acceptance Criteria

1. The modal is a strict 3-step wizard.
2. Step 1 asks only Public room key vs Private invite.
3. Step 2 asks only for the needed data for the chosen method.
4. Step 3 is a clean ready state.
5. Public room-key joining remains resolve-first.
6. Private sessions are not misleadingly presented as joinable by room key alone.
7. Optional viewer notes preserve their current behavior.
8. The old dense technical layout is absent.
9. The modal still feels like the same product system as Start Session.
10. No runtime-engine scope creep is introduced.

---

## Shared Advanced Details Rule

Advanced details are allowed only if all of the following remain true:

- they are collapsed by default
- they do not visually compete with the main flow
- they contain only information that still has real value
- they do not become a hiding place for poor UX decisions

If a technical detail is not useful to a normal user in the modal, it should be removed instead of moved.

---

## Engineering Guidance

These modal changes should preferably stay within:

- `src/StartSessionDialog.tsx`
- `src/ViewSessionDialog.tsx`
- `src/styles.css`

Only touch helper/session-link logic when absolutely necessary to preserve truthful behavior.

Do not broaden into:

- runtime engine files
- session server logic
- host/viewer runtime page implementation

Use simple readable step state, such as:

- numeric step index, or
- named step keys

Prefer readable render helpers over giant nested conditional blocks.

---

## Change Protocol For Future Edits

Whenever either modal is edited in the future:

1. Audit the current implementation first.
2. Check this spec before proposing layout or copy changes.
3. Preserve honesty rules for public/private behavior.
4. Preserve the shared Start/View system relationship.
5. Avoid adding new fields or panels unless they clearly belong to a single step.
6. Keep advanced details collapsed and secondary.
7. Run relevant build/tests after changes.

If a proposed change conflicts with this spec, update the spec deliberately instead of silently drifting away from it in code.

---

## One-Sentence North Star

The session modals should feel like a calm, guided product experience that helps people start or join a session without ever making the product less honest.
