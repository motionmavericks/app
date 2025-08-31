# ffmpeg Presets

MP4 (low)
```
ffmpeg -i input -c:v h264_nvenc -preset p5 -b:v 1200k -maxrate 1500k -bufsize 3000k -g 48 -keyint_min 48 -sc_threshold 0 -c:a aac -b:a 128k out.mp4
```

HLS 720p
```
ffmpeg -i input -c:v h264_nvenc -preset p5 -vf scale=-2:720 -b:v 2500k -maxrate 3000k -bufsize 5000k -g 48 -keyint_min 48 -sc_threshold 0 -c:a aac -b:a 128k -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_filename seg-%04d.ts manifest.m3u8
```

Notes
- Closed GOP, 2s segments; audio AAC‑LC 128–160 kbps; CFR.
- Set GOP to `round(2 * fps)`; example shows 24 fps (g=48).
