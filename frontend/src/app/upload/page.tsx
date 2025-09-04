'use client';

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Footerbar } from "@/components/dashboard/footerbar";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { UploadQueue } from "@/components/upload/upload-queue";
import { useUploadStore } from '@/lib/stores/upload-store';
import { mamLayoutVariants } from '@/lib/design-system/components/layout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const uploads = useUploadStore((state) => state.uploads);
  
  // Calculate statistics
  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const failedUploads = uploads.filter(u => u.status === 'failed').length;
  const activeUploads = uploads.filter(u => ['uploading', 'processing'].includes(u.status)).length;
  const pendingUploads = uploads.filter(u => u.status === 'pending').length;
  
  // Calculate overall progress
  const completionPercentage = totalUploads > 0 ? Math.round((completedUploads / totalUploads) * 100) : 0;

  return (
    <div className={cn(
      mamLayoutVariants({ layout: 'responsive' }),
      'bg-background text-foreground'
    )}>
      {/* Top bar */}
      <div className="col-span-2 row-start-1 lg:col-span-2">
        <Topbar />
      </div>
      
      {/* Sidebar */}
      <div className="hidden lg:block row-span-2 row-start-2">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <main className="col-span-2 lg:col-start-2 row-start-2 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Upload Media</h1>
                <p className="text-muted-foreground">
                  Upload and manage your media assets with professional tools
                </p>
              </div>
            </div>
          </div>

          {/* Upload Statistics */}
          {totalUploads > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{totalUploads}</p>
                    </div>
                    <div className="p-2 rounded-full bg-gray-100">
                      <Upload className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-blue-600">{activeUploads}</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{completedUploads}</p>
                    </div>
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{failedUploads}</p>
                    </div>
                    <div className="p-2 rounded-full bg-red-100">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Overall Progress */}
          {totalUploads > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Upload Progress</CardTitle>
                  <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                    {completionPercentage}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={completionPercentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{completedUploads} of {totalUploads} completed</span>
                    {pendingUploads > 0 && (
                      <span>{pendingUploads} pending</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Dropzone */}
          <UploadDropzone />

          {/* Upload Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload Queue</h2>
              {activeUploads > 0 && (
                <Badge variant="secondary" className="animate-pulse">
                  {activeUploads} Uploading
                </Badge>
              )}
            </div>
            <UploadQueue />
          </div>

          {/* Help Section */}
          {totalUploads === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start Uploading</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Drag and drop your media files above or click to browse. 
                  We support video, audio, and image files up to 5GB each.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">MP4</Badge>
                  <Badge variant="outline">MOV</Badge>
                  <Badge variant="outline">MKV</Badge>
                  <Badge variant="outline">WebM</Badge>
                  <Badge variant="outline">MP3</Badge>
                  <Badge variant="outline">WAV</Badge>
                  <Badge variant="outline">M4A</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <div className="col-span-2 row-start-3 lg:col-span-2">
        <Footerbar />
      </div>
    </div>
  );
}
