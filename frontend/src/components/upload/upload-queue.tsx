"use client";

import { useEffect } from 'react';
import { useUploadStore, UploadItem as UploadItemType } from '@/lib/stores/upload-store';
import { useResumableUpload } from '@/lib/hooks/use-resumable-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'uploading':
    case 'processing':
      return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    case 'paused':
      return <Pause className="w-4 h-4 text-yellow-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'uploading':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
}

interface UploadItemProps {
  upload: UploadItemType;
  onRetry: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
}

function UploadItem({ upload, onRetry, onPause, onResume, onRemove }: UploadItemProps) {
  const canRetry = upload.status === 'failed';
  const canPause = upload.status === 'uploading';
  const canResume = upload.status === 'paused';
  const canRemove = ['completed', 'failed', 'pending', 'paused'].includes(upload.status);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(upload.status)}
              <span className="font-medium text-sm truncate" title={upload.file.name}>
                {upload.file.name}
              </span>
              <Badge variant="secondary" className={getStatusColor(upload.status)}>
                {upload.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>{formatFileSize(upload.file.size)}</span>
              {upload.file.type && (
                <span className="uppercase">{upload.file.type.split('/')[1]}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {canRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(upload.id)}
                title="Retry upload"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            {canPause && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPause(upload.id)}
                title="Pause upload"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
            {canResume && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResume(upload.id)}
                title="Resume upload"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            {canRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(upload.id)}
                title="Remove from queue"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {['uploading', 'processing'].includes(upload.status) && (
          <div className="mb-2">
            <Progress value={upload.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{upload.progress}%</span>
              <span>
                {upload.status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {upload.status === 'failed' && upload.error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {upload.error}
          </div>
        )}

        {/* Success Actions */}
        {upload.status === 'completed' && upload.playHref && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(upload.playHref, '_blank');
              }}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Player
            </Button>
            {upload.assetId && (
              <span className="text-xs text-gray-500">
                Asset ID: {upload.assetId}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UploadQueue() {
  const { 
    uploads, 
    removeUpload, 
    retryUpload, 
    pauseUpload, 
    resumeUpload,
    clearCompleted,
    clearAll
  } = useUploadStore();
  
  const { startUpload } = useResumableUpload();

  // Auto-start pending uploads
  useEffect(() => {
    const pendingUploads = uploads.filter(u => u.status === 'pending');
    const activeUploads = uploads.filter(u => u.status === 'uploading').length;
    
    // Start next upload if we have capacity (max 2 concurrent)
    if (pendingUploads.length > 0 && activeUploads < 2) {
      const nextUpload = pendingUploads[0];
      startUpload(nextUpload);
    }
  }, [uploads, startUpload]);

  const handleRetry = (id: string) => {
    retryUpload(id);
    toast.info("Upload queued for retry");
  };

  const handlePause = (id: string) => {
    pauseUpload(id);
    toast.info("Upload paused");
  };

  const handleResume = (id: string) => {
    resumeUpload(id);
    toast.info("Upload resumed");
  };

  const handleRemove = (id: string) => {
    removeUpload(id);
    toast.info("Upload removed from queue");
  };

  const handleClearCompleted = () => {
    clearCompleted();
    toast.info("Completed uploads cleared");
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all uploads? Active uploads will be cancelled.')) {
      clearAll();
      toast.info("All uploads cleared");
    }
  };

  if (uploads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No uploads in queue</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const failedCount = uploads.filter(u => u.status === 'failed').length;
  const activeCount = uploads.filter(u => ['uploading', 'processing'].includes(u.status)).length;

  return (
    <div className="space-y-4">
      {/* Queue Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-medium">Upload Queue ({uploads.length})</h3>
              <div className="flex items-center gap-3 text-sm">
                {activeCount > 0 && (
                  <span className="text-blue-600">{activeCount} active</span>
                )}
                {completedCount > 0 && (
                  <span className="text-green-600">{completedCount} completed</span>
                )}
                {failedCount > 0 && (
                  <span className="text-red-600">{failedCount} failed</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCompleted}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Clear Completed
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Upload Items */}
      <div className="space-y-0">
        {uploads.map((upload) => (
          <UploadItem
            key={upload.id}
            upload={upload}
            onRetry={handleRetry}
            onPause={handlePause}
            onResume={handleResume}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}