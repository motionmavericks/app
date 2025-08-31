# Component Spec: Player

Purpose
- Frame-accurate VOD playback with HLS, captions, annotations, and comments.

Inputs
- `src` (signed HLS URL or MP4), `posters`, `captions[]`, `watermark` config.

Behaviors
- hls.js attach on mount; fallback to MP4; recover media errors.
- Timecode display (drop/non-drop), frame step (±1), seek with thumbnails.
- Emit `onTimeUpdate`, `onPlay`, `onPause`, `onSeek`.

Subcomponents
- Controls, Timeline (markers), Captions, Overlay (annotations), HUD (watermark).

Shortcuts
- J/K/L, arrows, M (mute), F (fullscreen), C (captions).

Acceptance
- plays HLS at 2s segments, closed GOP.
- captions togglable; annotations render; controls keyboard accessible.
