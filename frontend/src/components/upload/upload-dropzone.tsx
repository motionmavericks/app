"use client";

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useUploadStore } from '@/lib/stores/upload-store';
import { useResumableUpload } from '@/lib/hooks/use-resumable-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileVideo, FileAudio, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-matroska': ['.mkv'],
  'video/webm': ['.webm'],
  'video/avi': ['.avi'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/m4a': ['.m4a'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_FILES = 10;

export function UploadDropzone() {
  const addFiles = useUploadStore((state) => state.addFiles);
  const uploads = useUploadStore((state) => state.uploads);
  const { validateFile } = useResumableUpload();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejection) => {
        const { file, errors } = rejection;
        const errorMessages = errors.map((e) => {
          switch (e.code) {
            case 'file-too-large':
              return `File too large: ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB (max 5GB)`;
            case 'file-invalid-type':
              return `Unsupported file type: ${file.type || 'unknown'}`;
            case 'too-many-files':
              return `Too many files selected. Maximum ${MAX_FILES} files allowed.`;
            default:
              return e.message;
          }
        }).join(', ');
        
        toast.error(`${file.name}: ${errorMessages}`);
      });
    }

    // Validate accepted files
    const validFiles: File[] = [];
    const invalidFiles: { file: File; error: string }[] = [];

    acceptedFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        invalidFiles.push({ file, error });
      } else {
        validFiles.push(file);
      }
    });

    // Show errors for invalid files
    invalidFiles.forEach(({ file, error }) => {
      toast.error(`${file.name}: ${error}`);
    });

    // Add valid files to queue
    if (validFiles.length > 0) {
      addFiles(validFiles);
      toast.success(
        `Added ${validFiles.length} file${validFiles.length === 1 ? '' : 's'} to upload queue`
      );
    }
  }, [addFiles, validateFile]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    multiple: true,
  });

  const activeUploads = uploads.filter(u => ['uploading', 'processing'].includes(u.status));
  const isUploading = activeUploads.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-primary/5",
            isDragAccept && "border-green-500 bg-green-50",
            isDragReject && "border-red-500 bg-red-50",
            isDragActive && "border-primary bg-primary/10"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              "p-4 rounded-full",
              isDragAccept ? "bg-green-100 text-green-600" :
              isDragReject ? "bg-red-100 text-red-600" :
              "bg-gray-100 text-gray-600"
            )}>
              {isDragReject ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragActive ? (
                  isDragReject ? "Some files are not supported" : "Drop files here"
                ) : (
                  "Drag & drop media files here"
                )}
              </h3>
              
              <p className="text-sm text-gray-600">
                Or click to browse and select files
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileVideo className="w-3 h-3" />
                Video
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileAudio className="w-3 h-3" />
                Audio
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <p>
                <strong>Supported formats:</strong> MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A
              </p>
              <p>
                <strong>Max file size:</strong> 5GB per file | <strong>Max files:</strong> {MAX_FILES} files
              </p>
            </div>

            {/* Manual File Selection Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // The input click will be handled by the dropzone
              }}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>

          {/* Upload Status Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm font-medium">
                  {activeUploads.length} upload{activeUploads.length === 1 ? '' : 's'} in progress
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}