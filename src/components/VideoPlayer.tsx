import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Settings, Activity, Clock, Repeat
} from 'lucide-react';
import { useVideoKeyboardShortcuts } from '../hooks/useVideoKeyboardShortcuts';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  onProgressUpdate?: (progress: number) => void;
  onVideoEnded?: () => void;
}

export default function VideoPlayer({ videoUrl, thumbnailUrl, onProgressUpdate, onVideoEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdatedPercentRef = useRef<number>(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Load settings and apply default playback speed on mount / load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('metatube_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playbackSpeed) {
          setPlaybackSpeed(parsed.playbackSpeed);
          if (videoRef.current) {
            videoRef.current.playbackRate = parsed.playbackSpeed;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [videoUrl]);

  // Auto-hide controls when mouse is inactive
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, currentTime]);

  // Report progress changes to parent container
  useEffect(() => {
    if (onProgressUpdate && duration > 0) {
      const percent = Math.floor((currentTime / duration) * 100);
      if (percent !== lastUpdatedPercentRef.current) {
        lastUpdatedPercentRef.current = percent;
        onProgressUpdate(currentTime / duration);
      }
    }
  }, [currentTime, duration, onProgressUpdate]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekValue = parseFloat(e.target.value);
      videoRef.current.currentTime = seekValue;
      setCurrentTime(seekValue);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const vol = parseFloat(e.target.value);
      setVolume(vol);
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const mutedState = !isMuted;
    setIsMuted(mutedState);
    videoRef.current.muted = mutedState;
    if (!mutedState && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.log('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Keyboard shortcut listener using custom hook
  useVideoKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onToggleMute: toggleMute,
    onToggleFullscreen: toggleFullscreen,
    onSeekForward: () => {
      if (videoRef.current) videoRef.current.currentTime += 5;
    },
    onSeekBackward: () => {
      if (videoRef.current) videoRef.current.currentTime -= 5;
    },
    onVolumeUp: () => {
      setVolume(prev => {
        const nextVol = Math.min(prev + 0.1, 1);
        if (videoRef.current) videoRef.current.volume = nextVol;
        return nextVol;
      });
    },
    onVolumeDown: () => {
      setVolume(prev => {
        const nextVol = Math.max(prev - 0.1, 0);
        if (videoRef.current) videoRef.current.volume = nextVol;
        return nextVol;
      });
    }
  });

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const cleanedUrl = url.trim();
    
    // 1. Check for Shorts format
    if (cleanedUrl.includes('/shorts/')) {
      const parts = cleanedUrl.split('/shorts/');
      if (parts[1]) {
        const id = parts[1].split(/[?#&]/)[0];
        if (id.length === 11) return id;
      }
    }
    
    // 2. Check for standard YouTube URL regex matching watch?v=, embed/, etc.
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanedUrl.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    
    // 3. Check for URL parameters directly
    try {
      const parsed = new URL(cleanedUrl);
      const v = parsed.searchParams.get('v');
      if (v && v.length === 11) return v;
    } catch (e) {
      // Ignore URL parse errors for relative or incomplete paths
    }
    
    // 4. Fallback if the url itself is just the 11 character ID
    if (cleanedUrl.length === 11) {
      return cleanedUrl;
    }
    
    return null;
  };

  const getSourceInfo = (url: string) => {
    if (!url) return { type: 'generic' as const };
    const clean = url.trim();

    // 1. YouTube
    const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = clean.match(ytReg);
    if (ytMatch && ytMatch[2].length === 11) {
      return { 
        type: 'youtube' as const, 
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[2]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1${isLooping ? `&loop=1&playlist=${ytMatch[2]}` : ''}` 
      };
    }
    if (clean.includes('/shorts/')) {
      const parts = clean.split('/shorts/');
      if (parts[1]) {
        const id = parts[1].split(/[?#&]/)[0];
        if (id.length === 11) {
          return { 
            type: 'youtube' as const, 
            embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1${isLooping ? `&loop=1&playlist=${id}` : ''}` 
          };
        }
      }
    }

    // 2. Vimeo
    const vimeoReg = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = clean.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo' as const,
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&badge=0&byline=0&portrait=0&title=0${isLooping ? '&loop=1' : ''}`
      };
    }

    // 3. DailyMotion
    const dmReg = /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const dmMatch = clean.match(dmReg);
    if (dmMatch && dmMatch[1]) {
      return {
        type: 'dailymotion' as const,
        embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`
      };
    }

    // 4. TikTok
    const tiktokReg = /tiktok\.com\/@.*?\/video\/([0-9]+)/;
    const tiktokMatch = clean.match(tiktokReg);
    if (tiktokMatch && tiktokMatch[1]) {
      return {
        type: 'tiktok' as const,
        embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
      };
    }

    // 5. Twitch
    const twitchReg = /twitch\.tv\/videos\/([0-9]+)/;
    const twitchMatch = clean.match(twitchReg);
    if (twitchMatch && twitchMatch[1]) {
      const parentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return {
        type: 'twitch' as const,
        embedUrl: `https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${parentHost}&autoplay=true&muted=false`
      };
    }

    // 6. SoundCloud
    if (clean.includes('soundcloud.com')) {
      return {
        type: 'soundcloud' as const,
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`
      };
    }

    // 7. Facebook
    if (clean.includes('facebook.com') || clean.includes('fb.watch')) {
      return {
        type: 'facebook' as const,
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=0&autoplay=1`
      };
    }

    // 8. Instagram
    if (clean.includes('instagram.com')) {
      const match = clean.match(/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      const id = match ? match[1] : '';
      return {
        type: 'instagram' as const,
        embedUrl: id ? `https://www.instagram.com/p/${id}/embed` : clean
      };
    }

    // 9. Twitter / X
    if (clean.includes('twitter.com') || clean.includes('x.com')) {
      return {
        type: 'twitter' as const,
        embedUrl: clean
      };
    }

    // 10. Direct Video and Audio files
    const isDirect = clean.match(/\.(mp4|webm|ogg|mov|m4v|m3u8|mp3|wav|aac|m4a|flac)(?:\?|$)/i) || 
                     clean.startsWith('blob:') || 
                     clean.startsWith('data:video') || 
                     clean.startsWith('data:audio');
    if (isDirect) {
      return { type: 'direct' as const };
    }

    // 11. Generic website
    return { 
      type: 'generic' as const, 
      embedUrl: clean, 
      label: 'External Web Media' 
    };
  };

  const [appLanguage, setAppLanguage] = useState<'ar' | 'en'>('en');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('metatube_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.language) {
          setAppLanguage(parsed.language);
        }
      }
    } catch (e) {}
  }, []);

  const source = getSourceInfo(videoUrl);

  // If we can play via iframe embed (YouTube, Vimeo, Dailymotion, TikTok, Twitch, SoundCloud, Facebook, Instagram, Twitter, etc.)
  if (source.type !== 'direct' && source.embedUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-900">
        <iframe
          src={source.embedUrl}
          title="Video Player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-forms"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative group w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-900 group"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={isLooping ? undefined : onVideoEnded}
        loop={isLooping}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Play/Pause Large Floating Button Indicator on status toggle */}
      <div 
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none"
      >
        {!isPlaying && (
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-full border border-zinc-700/50 shadow-2xl pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200">
            <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
          </div>
        )}
      </div>

      {/* Control Overlay (bottom-aligned) */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek timeline bar */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700 hover:h-2 rounded-lg appearance-none cursor-pointer accent-red-600 transition-all"
            style={{
              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${
                (currentTime / (duration || 100)) * 100
              }%, #3f3f46 ${(currentTime / (duration || 100)) * 100}%, #3f3f46 100%)`,
            }}
          />
        </div>

        {/* Buttons tray */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1 hover:bg-zinc-800/60 rounded text-zinc-100 transition-all duration-200"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-1 hover:bg-zinc-800/60 rounded text-zinc-100 transition-colors"
                title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 transition-all duration-300 ease-out"
                style={{
                  background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${
                    (isMuted ? 0 : volume) * 100
                  }%, #3f3f46 ${(isMuted ? 0 : volume) * 100}%, #3f3f46 100%)`,
                }}
              />
            </div>

            {/* Time Indicators */}
            <div className="text-xs font-mono text-zinc-300">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-zinc-500">/</span>
              <span className="text-zinc-500">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Loop Toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded transition-all duration-200 border flex items-center justify-center gap-1 ${
                isLooping 
                  ? 'bg-red-600 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
              }`}
              title={isLooping ? (appLanguage === 'ar' ? 'إلغاء التكرار' : 'Disable Loop') : (appLanguage === 'ar' ? 'تكرار الفيديو' : 'Enable Loop')}
            >
              <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-semibold select-none">
                {appLanguage === 'ar' ? 'تكرار' : 'Loop'}
              </span>
            </button>

            {/* Playback speed selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                className="text-xs font-semibold px-2 py-1 rounded bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Speed"
              >
                {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-zinc-900 border border-zinc-800 rounded-lg py-1 w-24 shadow-xl z-20">
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changePlaybackSpeed(speed)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        playbackSpeed === speed 
                          ? 'bg-red-600/10 text-red-500 font-semibold' 
                          : 'text-zinc-400 hover:bg-zinc-850 hover:text-white'
                      }`}
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Simulated Quality selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Simulated Streaming Quality"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{quality}</span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-8 right-0 bg-zinc-900 border border-zinc-800 rounded-lg py-1 w-28 shadow-xl z-20">
                  {['1080p (HD)', '720p', '480p', 'Auto'].map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuality(q.split(' ')[0]);
                        setShowQualityMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        quality === q.split(' ')[0] 
                          ? 'bg-red-600/10 text-red-500 font-semibold' 
                          : 'text-zinc-400 hover:bg-zinc-850 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-zinc-800/60 rounded text-zinc-100 transition-colors"
              title="Fullscreen (f)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
