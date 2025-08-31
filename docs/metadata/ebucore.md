# EBUCore Mapping

Goal
- Normalize technical/descriptive metadata using EBU Tech 3293 (EBUCore/EBUCorePlus).

Sources
- MediaInfo probe, acquisition data, user-entered fields, ingest manifest.

Key Fields
- essenceTech: codec, bitrate, resolution, frame rate, color primaries/transfer/matrix.
- timeline: timecode, duration, reel.
- rights: owner, usage, clearance dates.
- audio: channels, sample rate, LUFS/TP (R128).

Sample (JSON)
```json
{
  "ebucore:format": {"videoFormat": {"width": 1920, "height": 1080, "frameRate": "24"}},
  "ebucore:identifier": [{"typeLabel": "sha256", "value": "<version-sha>"}]
}
```
