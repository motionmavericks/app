# Component Spec: Annotations

Purpose
- Drawn notes over video (box/arrow/freehand) tied to time ranges.

Model
- `shape { id, kind: 'box'|'arrow'|'pen', tIn, tOut, points[], color }`

Behaviors
- Create at paused frame; drag/resize; edit label; snap to frame.
- Render only when playhead within [tIn,tOut].

Performance
- Canvas renderer with offscreen buffers; throttle to requestAnimationFrame.

Acceptance
- Shapes persist; z-order deterministic; keyboard delete/undo redo hooks.
