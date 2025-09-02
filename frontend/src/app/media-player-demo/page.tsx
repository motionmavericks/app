'use client';

import { useState } from 'react';
import { MediaPlayer } from '@/components/mam/MediaPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MediaPlayerDemo() {
  const [selectedDemo, setSelectedDemo] = useState('hls');

  // Sample video sources for demonstration
  const demoSources = {
    hls: {
      src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'video' as const,
      title: 'HLS Demo Video',
      description: 'Adaptive streaming with quality selection',
    },
    mp4: {
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video' as const,
      title: 'MP4 Demo Video',
      description: 'Standard MP4 playback',
    },
    audio: {
      src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      type: 'audio' as const,
      title: 'Audio Demo',
      description: 'Audio playback with visualizer',
    },
  };

  const sampleAnnotations = [
    {
      id: '1',
      time: 10,
      text: 'Opening scene introduction',
      author: 'Editor',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      time: 30,
      text: 'Character development moment',
      author: 'Director',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      time: 60,
      text: 'Key plot point revealed',
      author: 'Script Supervisor',
      createdAt: new Date().toISOString(),
    },
  ];

  const currentDemo = demoSources[selectedDemo as keyof typeof demoSources];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhanced Media Player Demo</h1>
        <p className="text-muted-foreground">
          Professional video player with HLS streaming, frame-accurate scrubbing, and keyboard shortcuts
        </p>
      </div>

      {/* Demo Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Demo</h2>
        <div className="flex gap-3">
          {Object.entries(demoSources).map(([key, demo]) => (
            <Button
              key={key}
              variant={selectedDemo === key ? 'default' : 'outline'}
              onClick={() => setSelectedDemo(key)}
            >
              {demo.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Media Player */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{currentDemo.title}</CardTitle>
                <CardDescription>{currentDemo.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedDemo === 'hls' && <Badge>HLS</Badge>}
                {currentDemo.type === 'video' && <Badge variant="secondary">Video</Badge>}
                {currentDemo.type === 'audio' && <Badge variant="secondary">Audio</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video">
              <MediaPlayer
                src={currentDemo.src}
                type={currentDemo.type}
                title={currentDemo.title}
                annotations={sampleAnnotations}
                className="w-full h-full"
                onTimeUpdate={(time) => console.log('Time update:', time)}
                onPlayStateChange={(playing) => console.log('Play state:', playing)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">HLS Streaming</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Adaptive bitrate streaming</li>
              <li>• Quality selection menu</li>
              <li>• Buffer progress indicators</li>
              <li>• Automatic quality switching</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frame-Accurate Scrubbing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Precise timeline navigation</li>
              <li>• Thumbnail preview on hover</li>
              <li>• Frame-by-frame stepping</li>
              <li>• Annotation markers</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Space/K: Play/Pause</li>
              <li>• J/L: Rewind/Forward 10s</li>
              <li>• ←/→: Seek 5s</li>
              <li>• ↑/↓: Volume control</li>
              <li>• M: Mute/Unmute</li>
              <li>• F: Fullscreen</li>
              <li>• 1-9: Jump to percentage</li>
              <li>• ,/.: Frame stepping</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Professional Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Playback speed control</li>
              <li>• Volume slider with mute</li>
              <li>• Fullscreen with overlay</li>
              <li>• Time display and duration</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MAM Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Annotation overlays</li>
              <li>• Metadata support</li>
              <li>• Error handling</li>
              <li>• Loading states</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accessibility</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keyboard navigation</li>
              <li>• Screen reader support</li>
              <li>• Focus indicators</li>
              <li>• Tooltip guidance</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
            <CardDescription>
              How to use the enhanced media player in your MAM application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <h4>Basic Usage</h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { MediaPlayer } from '@/components/mam/MediaPlayer';

<MediaPlayer
  src="https://example.com/video.m3u8"
  type="video"
  title="My Video"
  annotations={annotations}
  thumbnailsUrl="https://example.com/thumbnails.vtt"
  onTimeUpdate={(time) => console.log(time)}
  onPlayStateChange={(playing) => console.log(playing)}
/>`}
              </pre>

              <h4>Props</h4>
              <ul>
                <li><strong>src</strong>: Video/audio source URL (supports HLS .m3u8, MP4, WebM)</li>
                <li><strong>type</strong>: Media type (&apos;video&apos; | &apos;audio&apos;)</li>
                <li><strong>title</strong>: Display title for the media</li>
                <li><strong>annotations</strong>: Array of annotation objects with time markers</li>
                <li><strong>thumbnailsUrl</strong>: WebVTT file URL for thumbnail previews</li>
                <li><strong>autoplay</strong>: Auto-start playback (default: false)</li>
                <li><strong>muted</strong>: Start muted (default: false)</li>
              </ul>

              <h4>Features Demonstrated</h4>
              <ul>
                <li>Try the keyboard shortcuts listed above</li>
                <li>Click the keyboard icon for a shortcuts reference</li>
                <li>Drag the progress bar for frame-accurate scrubbing</li>
                <li>Use the quality selector (HLS videos only)</li>
                <li>Adjust playback speed and volume</li>
                <li>Enter fullscreen mode for immersive viewing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}