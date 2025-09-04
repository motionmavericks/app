"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAsset, getPreviewStatus, previewEvents, signPreview } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download, 
  Share2, 
  Edit3,
  MoreVertical,
  Clock,
  Calendar,
  User,
  FileText,
  Tag,
  ExternalLink,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  flexVariants,
  stackVariants,
  containerVariants,
  layouts 
} from '@/lib/design-system/components/layout';
import { mamButtonPresets } from '@/lib/design-system/components/button';
import { cn } from '@/lib/utils';
import { formatFileSize, formatDuration, formatRelativeTime } from '@/lib/utils/format';
import { CommentsPanel } from '@/components/mam/CommentsPanel';
import { AssetShareDialog } from '@/components/mam/AssetShareDialog';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface AssetData {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  staging_key?: string;
  master_key?: string;
  preview_url?: string;
  thumbnail_url?: string;
  size?: number;
  duration?: string;
  dimensions?: { width: number; height: number };
  tags?: string[];
  creator?: string;
  copyright?: string;
  created_at?: string;
  updated_at?: string;
  ready?: boolean;
  versions?: Array<{
    preview_prefix?: string;
    master_key?: string;
  }>;
}

export default function AssetPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [status, setStatus] = useState<string>("Loading...");
  const [prefix, setPrefix] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prefer central client for consistency
        const data = await getAsset(id);
        setAsset(data);
        
        const latest = data.versions?.[0];
        const pref = latest?.preview_prefix || (latest?.master_key ? `previews/${latest.master_key.replace(/^masters\//, '')}` : null);
        setPrefix(pref);
        
        if (!pref) { 
          setStatus("No preview available yet"); 
          setLoading(false);
          return; 
        }

        setStatus("Preparing preview...");
        
        // Prefer SSE, fall back to polling
        let ready = data.ready === true;
        if (!ready && typeof window !== 'undefined' && 'EventSource' in window) {
          ready = await new Promise<boolean>((resolve) => {
            const es = previewEvents(pref, (isReady) => {
              if (isReady) {
                es?.close();
                resolve(true);
              }
            });
            // Timeout after 30s
            setTimeout(() => { es?.close(); resolve(false); }, 30000);
          });
        }
        
        if (!ready) {
          setStatus("Checking preview availability...");
          for (let i = 0; i < 15 && !ready; i++) {
            const st = await getPreviewStatus(pref);
            if (st.ready) { ready = true; break; }
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        
        if (!ready) { 
          setStatus("Preview not ready yet"); 
          setLoading(false);
          return; 
        }

        const signed = await signPreview({ preview_prefix: pref });
        
        const v = videoRef.current;
        if (!v) {
          setStatus("Video player not available");
          setLoading(false);
          return;
        }
        
        setStatus("Ready to play");
        
        // Setup video event listeners
        v.addEventListener('loadedmetadata', () => {
          setDuration(v.duration);
        });
        
        v.addEventListener('timeupdate', () => {
          setCurrentTime(v.currentTime);
        });
        
        v.addEventListener('play', () => setIsPlaying(true));
        v.addEventListener('pause', () => setIsPlaying(false));
        
        // Load video
        if (v.canPlayType('application/vnd.apple.mpegurl')) { 
          v.src = signed.url;
        } else {
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(signed.url);
            hls.attachMedia(v);
          } else { 
            setStatus("HLS not supported in this browser");
            setLoading(false);
            return;
          }
        }
        
        setLoading(false);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Failed to load asset: ${msg}`);
        setStatus(`Error: ${msg}`);
        setLoading(false);
      }
    };

    loadAsset();
  }, [id, apiBase]);
  
  // Video control functions
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    
    if (isPlaying) {
      v.pause();
    } else {
      v.play();
    }
  };
  
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };
  
  const handleSeek = (progress: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    
    v.currentTime = (progress / 100) * duration;
  };
  
  const handleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    
    if (v.requestFullscreen) {
      v.requestFullscreen();
    }
  };
  
  const getStatusColor = (status?: string) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'draft': return 'secondary';
      case 'review': return 'warning';
      case 'approved': return 'success';
      case 'published': return 'primary';
      case 'archived': return 'muted';
      default: return 'secondary';
    }
  };
  
  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'video': return '🎬';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📁';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        containerVariants({ size: 'xl', padding: 'lg' }),
        'py-8'
      )}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="aspect-video bg-muted rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        containerVariants({ size: 'xl', padding: 'lg' }),
        'py-8'
      )}>
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-semibold">Error Loading Asset</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      containerVariants({ size: 'xl', padding: 'lg' }),
      'py-8 space-y-8'
    )}>
      {/* Header */}
      <div className={cn(
        flexVariants({ justify: 'between', align: 'start' }),
        'gap-6'
      )}>
        <div className={cn(
          stackVariants({ gap: 'sm', align: 'start' }),
          'flex-1 min-w-0'
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2 mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
          
          <div className={cn(
            flexVariants({ align: 'center', gap: 'md' }),
            'flex-wrap'
          )}>
            <div className="text-2xl">{getTypeIcon(asset?.type)}</div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {asset?.title || asset?.staging_key || `Asset ${id}`}
              </h1>
              <div className={cn(
                flexVariants({ align: 'center', gap: 'sm' }),
                'mt-1 text-muted-foreground'
              )}>
                <span className="text-sm">ID: {id}</span>
                {asset?.status && (
                  <>
                    <span>•</span>
                    <Badge variant={getStatusColor(asset.status) as "default" | "secondary" | "destructive" | "outline"}>
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {asset?.description && (
            <p className="text-muted-foreground max-w-2xl">
              {asset.description}
            </p>
          )}
        </div>
        
        <div className={cn(
          flexVariants({ align: 'center', gap: 'sm' }),
          'shrink-0'
        )}>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            className={cn(mamButtonPresets.edit, 'h-9')}
            onClick={() => router.push(`/assets/${id}/metadata`)}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Metadata
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef} 
                  className="w-full aspect-video"
                  poster={asset?.thumbnail_url}
                />
                
                {/* Custom Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    {duration > 0 && (
                      <Progress 
                        value={(currentTime / duration) * 100} 
                        className="h-1 cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const progress = ((e.clientX - rect.left) / rect.width) * 100;
                          handleSeek(progress);
                        }}
                      />
                    )}
                    
                    {/* Controls */}
                    <div className={cn(
                      flexVariants({ justify: 'between', align: 'center' })
                    )}>
                      <div className={cn(
                        flexVariants({ align: 'center', gap: 'sm' })
                      )}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={togglePlay}
                          className="text-white hover:bg-white/20 h-8 w-8 p-0"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20 h-8 w-8 p-0"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <span className="text-white text-sm font-medium">
                          {formatDuration(currentTime)} / {formatDuration(duration)}
                        </span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleFullscreen}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Status Overlay */}
                {status !== "Ready to play" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white space-y-2">
                      {status.includes("Error") ? (
                        <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                      ) : (
                        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
                      )}
                      <p className="text-sm font-medium">{status}</p>
                      {prefix && (
                        <p className="text-xs text-gray-300">{prefix}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          {asset && (
            <CommentsPanel assetId={asset.id} currentTime={currentTime} onSeek={(sec) => { const v = videoRef.current; if (v) { v.currentTime = sec; v.focus(); } }} />
          )}
        </div>

        {/* Asset Details Sidebar */}
        <div className="space-y-6">
          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Asset Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset?.size && (
                <div className={cn(
                  flexVariants({ justify: 'between', align: 'center' })
                )}>
                  <span className="text-sm text-muted-foreground">File Size</span>
                  <span className="text-sm font-medium">{formatFileSize(asset.size)}</span>
                </div>
              )}
              
              {asset?.dimensions && (
                <div className={cn(
                  flexVariants({ justify: 'between', align: 'center' })
                )}>
                  <span className="text-sm text-muted-foreground">Dimensions</span>
                  <span className="text-sm font-medium">
                    {asset.dimensions.width} × {asset.dimensions.height}
                  </span>
                </div>
              )}
              
              {asset?.duration && (
                <div className={cn(
                  flexVariants({ justify: 'between', align: 'center' })
                )}>
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{asset.duration}</span>
                </div>
              )}
              
              <Separator />
              
              {asset?.creator && (
                <div className={cn(
                  flexVariants({ align: 'center', gap: 'sm' })
                )}>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{asset.creator}</p>
                    <p className="text-xs text-muted-foreground">Creator</p>
                  </div>
                </div>
              )}
              
              {asset?.created_at && (
                <div className={cn(
                  flexVariants({ align: 'center', gap: 'sm' })
                )}>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatRelativeTime(asset.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                </div>
              )}
              
              {asset?.updated_at && (
                <div className={cn(
                  flexVariants({ align: 'center', gap: 'sm' })
                )}>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatRelativeTime(asset.updated_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">Modified</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {asset?.tags && asset.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Copyright */}
          {asset?.copyright && (
            <Card>
              <CardHeader>
                <CardTitle>Copyright</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {asset.copyright}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <AssetShareDialog open={shareOpen} onOpenChange={setShareOpen} assetId={id} />
    </div>
  );
}
