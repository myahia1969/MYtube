import React from 'react';
import { Video } from '../types';
import { Play, X, Clock, Share2, RotateCcw, Download, Trash2, CheckCircle2 } from 'lucide-react';

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
  onChannelClick?: (channelId: string) => void;
  onShare?: (video: Video) => void;
  onWatchAgain?: () => void;
  language?: string;
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
  onChannelClick,
  onShare,
  onWatchAgain,
  language = 'en',
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
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-600 p-3 rounded-full text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Video Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded font-semibold tracking-wide border border-white/10">
          {video.duration}
        </span>

        {/* Download Status Badge (Bottom Left of Thumbnail) */}
        {isInDownloads && (
          <span className="absolute bottom-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-sans px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-md border border-emerald-500/20 z-10">
            <CheckCircle2 className="w-3 h-3 text-emerald-100" />
            <span>{language === 'ar' ? 'تم الحفظ 100%' : 'Saved 100%'}</span>
          </span>
        )}

        {/* Category Label */}
        <span className={`absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-red-600 text-[9px] font-mono px-2 py-0.5 rounded-full border border-gray-200 font-bold ${isInDownloads ? 'hidden' : ''}`}>
          {video.category}
        </span>

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
    </div>
  );
}
