# File Acceptance

Accepted Masters
- Video: mov (ProRes), mxf (OP1a), braw, r3d.
- Photo: arw, dng, gpr, tif.
- Audio: wav, aif.

Sidecars
- xmp, xml, srt/vtt, cube/luts.

Checks
- Compute SHA256; verify container integrity; optional virus scan (staging).

Ingest Manifest (YAML)
```yaml
client: cadbury
project: tour
shoot_date: 2024-11-03
files:
  - src: A001_C003_0101AB.braw
    sha256: <sha>
    collection: 01-footage
```
