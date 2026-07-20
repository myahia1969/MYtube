import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Video } from '../types';
import { Play, X, Clock, Share2, RotateCcw, Download, Trash2, CheckCircle2, GripVertical } from 'lucide-react';

interface VideoCardProps {
  key?: string;
  video: Video;
  onClick: () => void;
  watchedAt?: string;
  progress?: number;
  onRemove?: () => void;
  onDelete?: () => void;
  isInWatchLater?: boolean;
  onToggleWatchLater?: () => void;
  isInDownloads?: boolean;
  onToggleDownload?: () => void;
  downloadQuality?: '1080p' | '720p' | 'mp3';
  onChannelClick?: (channelId: string) => void;
  onShare?: (video: Video) => void;
  onWatchAgain?: () => void;
  language?: string;
  folderName?: string;
  onAssignFolder?: (folderName: string) => void;
  availableFolders?: string[];
}

export default function VideoCard({ 
  video, 
  onClick, 
  watchedAt, 
  progress, 
  onRemove,
  onDelete,
  isInWatchLater = false,
  onToggleWatchLater,
  isInDownloads = false,
  onToggleDownload,
  downloadQuality,
  onChannelClick,
  onShare,
  onWatchAgain,
  language = 'en',
  folderName,
  onAssignFolder,
  availableFolders = [],
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get YouTube ID
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
    return null;
  };

  // Helper to check if URL is a direct video format
  const isDirectVideo = (url: string) => {
    if (!url) return false;
    const clean = url.trim();
    return !!(clean.match(/\.(mp4|webm|ogg|mov|m4v|m3u8)(?:\?|$)/i) || clean.startsWith('blob:') || clean.startsWith('data:video'));
  };

  const youtubeId = getYoutubeId(video.videoUrl);
  const isDirect = isDirectVideo(video.videoUrl);

  // Auto-preview on hover after a slight delay (500ms) to ensure comfortable UX
  useEffect(() => {
    if (isHovered) {
      hoverTimerRef.current = setTimeout(() => {
        setIsPreviewActive(true);
      }, 500);
    } else {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setIsPreviewActive(false);
    }
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [isHovered]);

  // Utility to format large numbers to scannable formats
  const formatViews = (viewsNum: number) => {
    if (viewsNum >= 1000000) {
      return (viewsNum / 1000000).toFixed(1) + 'M views';
    }
    if (viewsNum >= 1000) {
      return (viewsNum / 1000).toFixed(0) + 'K views';
    }
    return viewsNum + ' views';
  };

  // framer-motion animation variants
  const cardVariants = {
    initial: { 
      y: 0, 
      scale: 1,
      boxShadow: "0 0px 0px rgba(0, 0, 0, 0)"
    },
    hover: { 
      y: -4, 
      scale: 1.015, 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)"
    },
    tap: { 
      scale: 0.985 
    }
  };

  const thumbnailVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 }
  };

  return (
    <motion.div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      className="group flex flex-col gap-3.5 bg-white rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-100/55 p-2 border border-transparent hover:border-gray-200 select-none"
      draggable={isInDownloads}
      onDragStart={(e) => {
        if (isInDownloads) {
          e.dataTransfer.setData('text/plain', video.id);
          e.dataTransfer.effectAllowed = 'move';
          e.currentTarget.style.opacity = '0.4';
        }
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      {/* Video Thumbnail container with Aspect Ratio */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200/60">
        <motion.img
          src={video.thumbnailUrl}
          alt={video.title}
          variants={thumbnailVariants}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover Video Preview Player */}
        {isPreviewActive && downloadQuality !== 'mp3' && (
          <div className="absolute inset-0 w-full h-full bg-black z-0 pointer-events-none">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&start=0&end=3&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`}
                title="Video Preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute inset-0 w-full h-full object-cover scale-[1.35] pointer-events-none"
              />
            ) : (
              <video
                src={isDirect ? video.videoUrl : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                autoPlay
                muted
                loop
                playsInline
                onTimeUpdate={(e) => {
                  if (e.currentTarget.currentTime >= 3) {
                    e.currentTarget.currentTime = 0;
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}
            {/* Live Preview Indicator */}
            <div className="absolute bottom-2 left-2 bg-red-600/90 backdrop-blur-xs text-white text-[8px] uppercase font-sans tracking-widest font-black px-1.5 py-0.5 rounded-md border border-red-500/30 shadow-sm animate-pulse z-20">
              {language === 'ar' ? 'معاينة' : 'Preview'}
            </div>
          </div>
        )}

        {/* Hover Audio Waveform Visualizer for MP3 Mode */}
        {isPreviewActive && downloadQuality === 'mp3' && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 flex flex-col items-center justify-center p-3 overflow-hidden select-none z-10">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes dance-wave-1 {
                0%, 100% { height: 10px; }
                50% { height: 42px; }
              }
              @keyframes dance-wave-2 {
                0%, 100% { height: 6px; }
                50% { height: 32px; }
              }
              @keyframes dance-wave-3 {
                0%, 100% { height: 14px; }
                50% { height: 50px; }
              }
              @keyframes dance-wave-4 {
                0%, 100% { height: 5px; }
                50% { height: 26px; }
              }
              .wave-bar-1 { animation: dance-wave-1 0.8s ease-in-out infinite; }
              .wave-bar-2 { animation: dance-wave-2 0.6s ease-in-out infinite; }
              .wave-bar-3 { animation: dance-wave-3 1.1s ease-in-out infinite; }
              .wave-bar-4 { animation: dance-wave-4 0.5s ease-in-out infinite; }
            `}} />

            {/* Glowing spinning orbits */}
            <div className="absolute w-20 h-20 rounded-full border border-indigo-500/20 border-t-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute w-24 h-24 rounded-full border border-purple-500/10 border-b-purple-500 animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />

            {/* Multi-column dancing waveform spectrum */}
            <div className="flex items-end justify-center gap-[4px] h-14 w-full max-w-[140px] z-10">
              <div className="w-[3.5px] bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full wave-bar-1" style={{ animationDelay: '0.1s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-purple-500 to-pink-400 rounded-full wave-bar-2" style={{ animationDelay: '0.3s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-pink-500 to-rose-400 rounded-full wave-bar-3" style={{ animationDelay: '0s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-rose-500 to-indigo-400 rounded-full wave-bar-4" style={{ animationDelay: '0.5s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full wave-bar-2" style={{ animationDelay: '0.2s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-purple-500 to-pink-400 rounded-full wave-bar-1" style={{ animationDelay: '0.4s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-pink-500 to-rose-400 rounded-full wave-bar-3" style={{ animationDelay: '0.15s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-rose-500 to-indigo-400 rounded-full wave-bar-4" style={{ animationDelay: '0.35s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full wave-bar-2" style={{ animationDelay: '0.05s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-purple-500 to-pink-400 rounded-full wave-bar-1" style={{ animationDelay: '0.25s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-pink-500 to-rose-400 rounded-full wave-bar-3" style={{ animationDelay: '0.45s' }} />
              <div className="w-[3.5px] bg-gradient-to-t from-rose-500 to-indigo-400 rounded-full wave-bar-4" style={{ animationDelay: '0.12s' }} />
            </div>

            {/* Glowing Text Info */}
            <div className="mt-2.5 text-[9px] tracking-widest font-black uppercase font-sans text-indigo-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] z-10 animate-pulse">
              {language === 'ar' ? 'معاينة الصوت النشط' : 'Playing Audio Preview'}
            </div>
          </div>
        )}

        {/* Static/Ambient MP3 Mode Overlay (when not hovered) */}
        {downloadQuality === 'mp3' && !isPreviewActive && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-3 z-5">
            {/* Pulsing vinyl plate design */}
            <div className="relative w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/30 group-hover:scale-110 transition-all duration-300">
              <div className="flex items-end gap-[2px] h-4">
                <div className="w-0.5 bg-white rounded-full h-2 animate-bounce" style={{ animationDuration: '1s' }} />
                <div className="w-0.5 bg-white rounded-full h-4 animate-bounce" style={{ animationDuration: '0.7s', animationDelay: '0.15s' }} />
                <div className="w-0.5 bg-white rounded-full h-3 animate-bounce" style={{ animationDuration: '0.9s', animationDelay: '0.3s' }} />
                <div className="w-0.5 bg-white rounded-full h-1 animate-bounce" style={{ animationDuration: '0.5s', animationDelay: '0.45s' }} />
              </div>
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-indigo-400 shadow-sm font-sans">
                MP3
              </span>
            </div>
            <span className="mt-2.5 text-[10px] font-black tracking-wider uppercase font-sans text-indigo-200 bg-black/50 px-2.5 py-0.5 rounded-full border border-indigo-500/20 backdrop-blur-md">
              {language === 'ar' ? 'ملف صوتي MP3' : 'MP3 Audio'}
            </span>
          </div>
        )}

        {/* Download Sync Progress Bar (100% Offline Ready) */}
        {isInDownloads && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500/30 z-10">
            <div 
              className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              style={{ width: '100%' }}
            />
          </div>
        )}
        
        {/* Play Icon Overlay on Hover */}
        {!isPreviewActive && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-red-600 p-3 rounded-full text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Play className="w-5 h-5 fill-current" />
            </div>
          </div>
        )}

        {/* Video Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded font-semibold tracking-wide border border-white/10 flex items-center gap-1 z-10">
          {downloadQuality === 'mp3' && <span className="text-indigo-400">🎵</span>}
          <span>{video.duration}</span>
        </span>

        {/* Download Status Badge (Bottom Left of Thumbnail) */}
        {isInDownloads && (
          <span className="absolute bottom-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-sans px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-md border border-emerald-500/20 z-10">
            <CheckCircle2 className="w-3 h-3 text-emerald-100" />
            <span>
              {downloadQuality === 'mp3' 
                ? (language === 'ar' ? 'صوت MP3 محفوط' : 'MP3 Saved 100%') 
                : (language === 'ar' ? 'تم الحفظ 100%' : 'Saved 100%')}
            </span>
          </span>
        )}

        {/* Category Label */}
        <span className={`absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-red-600 text-[9px] font-mono px-2 py-0.5 rounded-full border border-gray-200 font-bold ${isInDownloads ? 'hidden' : ''}`}>
          {video.category}
        </span>

        {/* Drag to Move Overlay Indicator for Offline Downloads */}
        {isInDownloads && (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-black/75 backdrop-blur-md text-white text-[9px] font-sans px-2 py-0.5 rounded-full shadow-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none pointer-events-none">
            <GripVertical className="w-2.5 h-2.5 text-gray-300" />
            <span>{language === 'ar' ? 'اسحب للنقل' : 'Drag to Move'}</span>
          </div>
        )}

        {/* Action Buttons Tray (Top-Right) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {/* Share Quick-Action Clipboard Copy Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const shareUrl = `${window.location.origin}?v=${video.id}`;
              navigator.clipboard.writeText(shareUrl).then(() => {
                if (onShare) {
                  onShare(video);
                } else {
                  alert('Copied link: ' + shareUrl);
                }
              });
            }}
            className="p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border bg-black/70 hover:bg-red-600 border-white/10 text-white hover:scale-105 active:scale-95 cursor-pointer"
            title={language === 'ar' ? 'مشاركة الفيديو' : 'Share Video'}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Download & Save Video Quick Button */}
          {onToggleDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDownload();
              }}
              className={`p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border hover:scale-105 active:scale-95 cursor-pointer ${
                isInDownloads 
                  ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700' 
                  : 'bg-black/70 hover:bg-black/90 border-white/10 text-white hover:text-emerald-500'
              }`}
              title={isInDownloads 
                ? (language === 'ar' ? "إزالة من التنزيلات" : "Remove from Saved Downloads") 
                : (language === 'ar' ? "تنزيل وحفظ الفيديو" : "Download & Save Video")
              }
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Watch Later Quick-Action Toggle Button */}
          {onToggleWatchLater && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchLater();
              }}
              className={`p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border hover:scale-105 active:scale-95 cursor-pointer ${
                isInWatchLater 
                  ? 'bg-red-600 border-red-500 text-white hover:bg-red-700' 
                  : 'bg-black/70 hover:bg-black/90 border-white/10 text-white hover:text-red-500'
              }`}
              title={isInWatchLater ? "Remove from Watch Later" : "Save to Watch Later"}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Individual Video History/Saved Removal Button (Quick Delete for downloads) */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={`p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border hover:scale-105 active:scale-95 cursor-pointer ${
                isInDownloads 
                  ? 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                  : 'bg-black/70 hover:bg-red-600 border-white/10 text-white'
              }`}
              title={isInDownloads 
                ? (language === 'ar' ? 'حذف من التنزيلات' : 'Delete from Downloads') 
                : (language === 'ar' ? 'إزالة' : 'Remove')
              }
            >
              {isInDownloads ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
            </button>
          )}

          {/* Permanent Video Deletion Quick Button (Owned Videos) */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border bg-red-600 hover:bg-red-700 border-red-500 text-white hover:scale-105 active:scale-95 cursor-pointer z-20"
              title={language === 'ar' ? 'حذف الفيديو نهائياً' : 'Delete Video Permanently'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Watch Progress Bar overlay */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-gray-200/50">
            <div 
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Meta Info: Title, Avatar, Stats */}
      <div className="flex gap-3 px-1">
        {/* Channel Avatar */}
        <img
          src={video.channelAvatar}
          alt={video.channelName}
          onClick={(e) => {
            if (onChannelClick) {
              e.stopPropagation();
              onChannelClick(video.channelId);
            }
          }}
          className={`w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 group-hover:border-gray-400 transition-colors ${
            onChannelClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
          }`}
        />

        {/* Video metadata */}
        <div className="flex flex-col gap-1 min-w-0">
          <h4 className="font-sans font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-black group-hover:underline decoration-red-600/50 underline-offset-4 transition-all">
            {video.title}
          </h4>
          
          <div className="flex flex-col mt-0.5">
            <span 
              onClick={(e) => {
                if (onChannelClick) {
                  e.stopPropagation();
                  onChannelClick(video.channelId);
                }
              }}
              className={`text-xs text-gray-500 hover:text-red-600 hover:underline transition-colors truncate ${
                onChannelClick ? 'cursor-pointer font-semibold' : ''
              }`}
            >
              {video.channelName}
            </span>
            
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-sans mt-0.5">
              <span>{formatViews(video.views)}</span>
              <span className="text-[9px]">•</span>
              <span>{video.uploadedAt}</span>
            </div>

            {watchedAt && (
              <div className="mt-1.5 flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-md px-1.5 py-0.5 text-[10px] font-medium w-fit">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                </span>
                <span>Watched {watchedAt}</span>
              </div>
            )}

            {isInDownloads && (
              <div className="mt-1.5 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md px-1.5 py-0.5 text-[10px] font-semibold w-fit shadow-xs">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>{language === 'ar' ? 'جاهز للمشاهدة بدون اتصال (100%)' : 'Ready Offline (100% Saved)'}</span>
              </div>
            )}

            {isInDownloads && onAssignFolder && (
              <div className="mt-1.5 flex items-center gap-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-[10px] font-medium w-fit shadow-2xs">
                <span className="text-[10px] shrink-0">📁</span>
                <select
                  value={folderName || ''}
                  onChange={(e) => {
                    onAssignFolder(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent text-gray-700 dark:text-zinc-200 focus:outline-none cursor-pointer max-w-[125px] font-semibold text-[10px]"
                >
                  <option value="" className="text-gray-900 dark:text-zinc-100">
                    {language === 'ar' ? 'بدون مجلد' : 'No Folder'}
                  </option>
                  {availableFolders.map((f) => (
                    <option key={f} value={f} className="text-gray-900 dark:text-zinc-100">
                      {f}
                    </option>
                  ))}
                  <option value="__new__" className="text-red-600 dark:text-red-400 font-bold">
                    {language === 'ar' ? '+ مجلد جديد...' : '+ New Folder...'}
                  </option>
                </select>
              </div>
            )}

            {isInDownloads && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemove) {
                    onRemove();
                  } else if (onToggleDownload) {
                    onToggleDownload();
                  }
                }}
                className="mt-2 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 hover:border-red-300 rounded-lg py-1 px-3 text-[11px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer w-full"
                title={language === 'ar' ? 'حذف من الفيديوهات المحفوظة' : 'Remove saved content'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'حذف التنزيل 🗑' : 'Delete Download 🗑'}</span>
              </button>
            )}

            {onWatchAgain && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWatchAgain();
                }}
                className="mt-2 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 hover:border-red-300 rounded-lg py-1 px-3 text-[11px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer w-full"
                title={language === 'ar' ? 'أعد مشاهدة الفيديو من البداية' : 'Re-play video from the beginning'}
              >
                <RotateCcw className="w-3.5 h-3.5 animate-spin-once" />
                <span>{language === 'ar' ? 'مشاهدة مجدداً' : 'Watch Again'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sleek Progress Bar at the very bottom of the card */}
      {progress !== undefined && progress > 0 && (
        <div className="mt-auto pt-2 border-t border-gray-100/80 w-full px-1">
          <div className="flex justify-between items-center mb-1 text-[10px] font-medium font-sans">
            <span className="text-gray-400">{language === 'ar' ? 'تمت مشاهدة' : 'Watched'}</span>
            <span className="text-red-600 font-bold">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-red-600 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
