import React from 'react';
import { Video } from '../types';
import { Play, X, Clock, Share2 } from 'lucide-react';

interface VideoCardProps {
  key?: string;
  video: Video;
  onClick: () => void;
  watchedAt?: string;
  progress?: number;
  onRemove?: () => void;
  isInWatchLater?: boolean;
  onToggleWatchLater?: () => void;
  onChannelClick?: (channelId: string) => void;
  onShare?: (video: Video) => void;
}

export default function VideoCard({ 
  video, 
  onClick, 
  watchedAt, 
  progress, 
  onRemove,
  isInWatchLater = false,
  onToggleWatchLater,
  onChannelClick,
  onShare,
}: VideoCardProps) {
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

  return (
    <div 
      onClick={onClick}
      className="group flex flex-col gap-3.5 bg-white rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-50 p-2 transition-all duration-300 hover:shadow-md border border-transparent hover:border-gray-200"
    >
      {/* Video Thumbnail container with Aspect Ratio */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200/60">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        {/* Play Icon Overlay on Hover */}
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-600 p-3 rounded-full text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Video Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded font-semibold tracking-wide border border-white/10">
          {video.duration}
        </span>

        {/* Category Label */}
        <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-red-600 text-[9px] font-mono px-2 py-0.5 rounded-full border border-gray-200 font-bold">
          {video.category}
        </span>

        {/* Individual Video History Removal Button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2.5 right-2.5 z-10 bg-black/70 hover:bg-red-600 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors shadow-md border border-white/10 group-hover:scale-105 active:scale-95 cursor-pointer"
            title="Remove from Watch History"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Watch Later Quick-Action Toggle Button */}
        {onToggleWatchLater && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchLater();
            }}
            className={`absolute top-2.5 z-10 p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border group-hover:scale-105 active:scale-95 cursor-pointer ${
              onRemove ? 'right-10' : 'right-2.5'
            } ${
              isInWatchLater 
                ? 'bg-red-600 border-red-500 text-white' 
                : 'bg-black/70 hover:bg-black/90 border-white/10 text-white hover:text-red-500'
            }`}
            title={isInWatchLater ? "Remove from Watch Later" : "Save to Watch Later"}
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        )}

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
          className={`absolute top-2.5 z-10 p-1.5 rounded-full transition-all shadow-md backdrop-blur-sm border bg-black/70 hover:bg-red-600 border-white/10 text-white group-hover:scale-105 active:scale-95 cursor-pointer ${
            onRemove && onToggleWatchLater
              ? 'right-[70px]'
              : (onRemove || onToggleWatchLater)
              ? 'right-10'
              : 'right-2.5'
          }`}
          title="Share Video"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

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
          </div>
        </div>
      </div>
    </div>
  );
}
