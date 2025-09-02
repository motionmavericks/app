"use client";

import { UploadDropzone } from '@/components/upload/upload-dropzone';
import { UploadQueue } from '@/components/upload/upload-queue';

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Media Upload</h1>
        <p className="text-gray-600">
          Upload your video and audio files with drag-and-drop support, batch processing, and real-time progress tracking.
        </p>
      </div>

      <div className="space-y-6">
        <UploadDropzone />
        <UploadQueue />
      </div>
    </div>
  );
}
