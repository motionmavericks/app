# HLS Previews

Ladder (initial)
- 720p: ~2.5 Mbps, 2s segments, closed GOP, keyint aligned to segment.
- Low MP4 proxy for quick scrubbing.

Encoding (ffmpeg NVENC example)
```
ffmpeg -y -hwaccel cuda -i input.mov \
 -c:v h264_nvenc -preset p5 -vf scale=-2:720 -profile:v high -b:v 2500k -maxrate 3000k -bufsize 5000k \
 -g 48 -keyint_min 48 -sc_threshold 0 -r 24 \
 -c:a aac -b:a 128k -ac 2 \
 -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_filename seg-%04d.ts manifest.m3u8
```

Watermarking
- Burn‑in during encode or overlay at edge; separate templates for Shares.

Security
- Signed URLs for manifests/segments; no previews stored in masters.

Dynamic Keyframe Planning
- For input FPS `F`, use `g = keyint_min = round(2 * F)` to align to 2s segments.
- Examples: 23.976 → 48; 25 → 50; 29.97 → 60.
