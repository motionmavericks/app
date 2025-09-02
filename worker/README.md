# Preview Worker Service

GPU-accelerated media processing worker for HLS and thumbnail generation.

## Purpose
Processes media files from masters bucket to generate HLS streams and thumbnails for preview.

## Key Features
- HLS adaptive streaming generation
- Thumbnail extraction
- GPU acceleration (NVENC) with CPU fallback
- Redis Streams consumer

## Environment Variables
See `.env.example` for complete list. Key variables:
```bash
REDIS_URL=             # Required - Redis/Valkey connection
WASABI_MASTERS_ACCESS_KEY=   # Read from masters
WASABI_PREVIEWS_ACCESS_KEY=  # Write to previews
PREVIEW_PRESET=720p    # Output quality
GPU_DEVICE=            # Optional GPU device
```

## Local Development
```bash
npm install
npm run dev  # Starts worker process
```

## Testing
```bash
npm run test      # Run tests (if available)
```

## Requirements
- FFmpeg with H.264 support
- Optional: NVIDIA GPU with NVENC for acceleration