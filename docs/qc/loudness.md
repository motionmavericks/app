# Loudness (EBU R128 / ITU‑R BS.1770)

Targets (streaming)
- Programme Loudness: −23 LUFS (or project‑specific streaming target; document deviations).
- True Peak: ≤ −1.0 dBTP for AAC encodes.

Workflow
- Measure on ingest/promotion; save LUFS, LRA, MaxTP in metadata.
- For previews, normalize to target and export metrics alongside renditions.

Tools
- `ffmpeg` loudnorm filter, `bs1770gain`, or Nugen/Youlean offline analysis.
