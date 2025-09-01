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

GPU Regions & Sizes (DigitalOcean)
- GPU droplets are available in `nyc2` and `tor1` (subject to provider updates).
- Example size slugs:
  - `gpu-l40sx1-48gb` (L40S)
  - `gpu-6000adax1-48gb`, `gpu-4000adax1-20gb` (RTX Ada)
  - `gpu-h100x1-80gb`, `gpu-h200x1-141gb`, `gpu-h200x8-1128gb` (H100/H200)

Latency Note
- Wasabi buckets here are in `ap-southeast-2`. Running GPUs in `nyc2`/`tor1` increases round-trip times and egress costs. If this materially impacts SLAs, consider an alternative GPU provider in APAC (e.g., AWS g5/g6 in ap-southeast-2) or relocating buckets.

Steps
- Create a GPU Droplet in `nyc2` or `tor1` using the NVIDIA AI/ML Ready image.
- Option A: Run Node worker directly (system ffmpeg with NVENC); Option B: use Docker with NVIDIA container toolkit.
- Set env from DO secrets: Redis URL, Wasabi creds/buckets, presets.
- Attach Droplet to VPC; restrict egress to Wasabi Previews endpoint.

Programmatic Provisioning
- Script: `scripts/provision_gpu_worker.sh` — provisions a GPU droplet with cloud-init to install Node and ffmpeg, fetch the repo, build `worker/`, and run as systemd service.
- Defaults: `REGION=tor1`, `SIZE=gpu-l40sx1-48gb`, `IMAGE_ID=191457505 (NVIDIA AI/ML Ready)`.
- Example:
  - `REGION=nyc2 SIZE=gpu-4000adax1-20gb NAME=mm-gpu-worker-nyc bash scripts/provision_gpu_worker.sh`

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
