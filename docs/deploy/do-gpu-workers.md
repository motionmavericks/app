# DigitalOcean GPU Workers (On-Demand Transcoding)

Goal
- Fast, efficient previews using GPU; scale to zero when idle to reduce costs.

Until GPU Access Is Granted
- Run the preview worker on App Platform in CPU mode (no NVENC).
- Recommended settings in App Platform envs:
  - `PREVIEW_PRESET=480p` (or `PREVIEW_VARIANTS=480p`)
  - `HLS_SEGMENT_SEC=4`
  - Keep concurrency at 1 (current worker processes one job at a time).
- Expect slower build times; monitor Redis stream depth and CPU.

Pattern
- Queue-backed transcoding via Redis Streams (`previews:build`).
- Autoscaler monitors stream lag and manages GPU Droplets via `doctl` or API.
- Workers are stateless; ffmpeg with NVENC; write artifacts to Wasabi Previews.

Steps
- Create a GPU Droplet in region `syd1` with NVIDIA RTX 4000/6000 Ada or L40S (NVENC-capable). Install NVIDIA drivers + Container Toolkit.
- Build and run the `worker/` Docker image with GPU access; ensure FFmpeg supports `h264_nvenc`; fall back to `libx264` if NVENC not available.
- Set env from DO secrets: Redis URL, Wasabi creds/buckets, presets.
- Attach Droplet to VPC; restrict egress to Wasabi Previews endpoint.

Autoscaling Heuristics
- Scale up: if `XINFO STREAM previews:build` shows `length > N` or oldest pending age > threshold.
- Scale down: no messages for `T` minutes; terminate excess nodes.

Commands (examples)
- Create GPU droplet (example shape; adjust to desired GPU):
  `doctl compute droplet create gpu-worker --region syd1 --size g-gpu-rtx4000 --image docker-20-04 --vpc-uuid <vpc> --ssh-keys <key>`
- Install NVIDIA Container Toolkit per DO GPU docs; run worker container with `--gpus all`.
- Destroy: `doctl compute droplet delete <id>`

Notes
- Confirm GPU model supports NVENC (RTX Ada and L40S do). If using H100/A100, use CPU `libx264` or transcode to other target codecs.

Notes
- App Platform does not provide GPUs; use Droplets for GPU workloads.
- Prefer prebuilt ffmpeg with NVENC (e.g., `ffmpeg-nonfree`) or build from source in the image.
- Configure `QUEUE_CONCURRENCY` conservatively to avoid GPU oversubscription.
