# Frontend Service

Next.js 15 application for media upload and playback.

## Purpose
Web interface for uploading media files to cloud storage and playing back HLS streams.

## Key Features
- Media upload with presigned URLs
- HLS video playback  
- Asset management interface
- Responsive design with Tailwind CSS

## Environment Variables
```bash
NEXT_PUBLIC_API_BASE=http://localhost:3000  # Backend API URL
NEXT_PUBLIC_EDGE_BASE=http://localhost:8080  # Edge service URL
```

## Local Development
```bash
npm install
npm run dev  # Starts on http://localhost:3001
```

## Testing
```bash
npm run lint
npm run typecheck
npm run build  # Production build test
```

## Production Build
```bash
npm run build
npm run start
```