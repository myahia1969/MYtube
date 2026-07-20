import React, { useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X, Move } from 'lucide-react';
import { Video } from '../types';
import { motion } from 'motion/react';

interface MiniPlayerProps {
  video: Video;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onExpand: () => void;
  onClose: () => void;
  language?: 'en' | 'ar';
}

export default function MiniPlayer({
  video,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onExpand,
  onClose,
  language = 'en',
}: MiniPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Synchronize playing / muted states with the HTML video element
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch((err) => console.log('Mini autoplay prevented:', err));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, video.videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className={`fixed bottom-24 right-6 md:right-8 w-72 sm:w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col backdrop-blur-md cursor-grab active:cursor-grabbing`}
      style={{ touchAction: 'none' }}
    >
      {/* Draggable Header */}
      <div className="bg-gray-50/90 dark:bg-zinc-900/90 px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
          <Move className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-wider font-sans">
            {language === 'ar' ? 'مشغل مصغر' : 'Mini Player'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand to watch page */}
          <button
            onClick={onExpand}
            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-[#0f0f0f] dark:hover:text-white transition-all cursor-pointer"
            title={language === 'ar' ? 'تكبير الشاشة' : 'Expand back'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {/* Close player */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-gray-400 hover:text-red-600 transition-all cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video View container */}
      <div className="relative aspect-video w-full bg-black group overflow-hidden">
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          playsInline
          autoPlay={isPlaying}
          muted={isMuted}
          onPlay={onTogglePlay}
          onPause={onTogglePlay}
        />

        {/* Video Overlay controls on hover / touch */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {/* Play / Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="p-2 bg-white/95 dark:bg-zinc-900/95 hover:scale-110 active:scale-95 text-gray-900 dark:text-white rounded-full shadow-lg transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Mute / Unmute button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="p-2 bg-white/95 dark:bg-zinc-900/95 hover:scale-110 active:scale-95 text-gray-900 dark:text-white rounded-full shadow-lg transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Details Footer */}
      <div 
        onClick={onExpand}
        className="p-3 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-zinc-900/40 cursor-pointer flex items-center gap-3 border-t border-gray-100 dark:border-zinc-800/40"
      >
        <img 
          src={video.thumbnailUrl} 
          alt="" 
          className="w-12 h-8 rounded-lg object-cover shrink-0 border border-gray-200/50"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-gray-900 dark:text-zinc-100 line-clamp-1 leading-tight">
            {video.title}
          </p>
          <p className="text-[9px] text-gray-500 dark:text-zinc-400 mt-0.5 font-sans font-medium">
            {video.channelName}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
