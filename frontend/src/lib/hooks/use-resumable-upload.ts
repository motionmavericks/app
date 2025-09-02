import { useCallback } from 'react';
import { useUploadStore, UploadItem } from '@/lib/stores/upload-store';
import { presign, API_BASE } from '@/lib/api';

function sanitizeName(name: string): string {
  // Remove any path separators and restrict to safe chars
  const base = name.split(/[/\\]/).pop() || "file";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_");
  return cleaned.length > 128 ? cleaned.slice(-128) : cleaned || "file";
}

const ALLOWED_MIME = [
  "video/mp4",
  "video/quicktime", 
  "video/x-matroska",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/m4a",
  "video/avi",
  "video/mov",
];

export function useResumableUpload() {
  const updateUpload = useUploadStore((state) => state.updateUpload);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (file.type && !ALLOWED_MIME.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Supported formats: MP4, MOV, MKV, WebM, MP3, WAV, M4A, AVI`;
    }

    // Check file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      return `File too large: ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB. Maximum size is 5GB`;
    }

    return null;
  }, []);

  const startUpload = useCallback(async (uploadItem: UploadItem) => {
    try {
      // Validate file
      const validationError = validateFile(uploadItem.file);
      if (validationError) {
        updateUpload(uploadItem.id, {
          status: 'failed',
          error: validationError,
        });
        return;
      }

      updateUpload(uploadItem.id, { status: 'uploading', progress: 0 });

      // Generate staging key
      const safeName = sanitizeName(uploadItem.file.name || "upload");
      const stagingKey = `staging/${crypto.randomUUID()}/${safeName}`;

      // Get presigned URL for direct upload
      const { url } = await presign({ 
        key: stagingKey, 
        contentType: uploadItem.file.type || "application/octet-stream" 
      });

      // Use XMLHttpRequest for progress tracking and resumable uploads
      const xhr = new XMLHttpRequest();
      
      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          updateUpload(uploadItem.id, { progress });
        }
      });

      // Handle completion
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            updateUpload(uploadItem.id, {
              status: 'processing',
              progress: 100,
              stagingKey,
            });

            // Promote to masters
            const promoteRes = await fetch(`${API_BASE}/api/promote`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ stagingKey }),
            });

            if (!promoteRes.ok) {
              const errorText = await promoteRes.text();
              throw new Error(`Promotion failed: ${promoteRes.status} ${errorText}`);
            }

            const result = await promoteRes.json();
            const previewPrefix = `previews/${stagingKey.replace(/^staging\//, '')}`;
            const playHref = result.assetId 
              ? `/assets/${result.assetId}` 
              : `/play?p=${encodeURIComponent(previewPrefix)}`;

            updateUpload(uploadItem.id, {
              status: 'completed',
              masterKey: result.masterKey,
              assetId: result.assetId,
              jobId: result.jobId,
              playHref,
            });

          } catch (error) {
            console.error('Promotion error:', error);
            updateUpload(uploadItem.id, {
              status: 'failed',
              error: error instanceof Error ? error.message : 'Promotion failed',
            });
          }
        } else {
          updateUpload(uploadItem.id, {
            status: 'failed',
            error: `Upload failed: ${xhr.status} ${xhr.statusText}`,
          });
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        updateUpload(uploadItem.id, {
          status: 'failed',
          error: 'Network error during upload',
        });
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        updateUpload(uploadItem.id, {
          status: 'paused',
          error: 'Upload was cancelled',
        });
      });

      // Open the request and send
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', uploadItem.file.type || 'application/octet-stream');
      
      // Store xhr instance for pause/resume functionality
      updateUpload(uploadItem.id, { 
        tusUpload: { abort: () => xhr.abort() } 
      });
      
      xhr.send(uploadItem.file);

    } catch (error) {
      console.error('Upload start error:', error);
      updateUpload(uploadItem.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start upload',
      });
    }
  }, [updateUpload, validateFile]);

  return {
    startUpload,
    validateFile,
  };
}