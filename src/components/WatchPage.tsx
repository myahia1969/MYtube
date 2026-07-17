import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, CornerDownRight, MoreHorizontal, Send, Play, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { Video, Comment, Channel, User } from '../types';
import VideoPlayer from './VideoPlayer';
import AIVideoAnalyzer from './AIVideoAnalyzer';

interface WatchPageProps {
  video: Video;
  allVideos: Video[];
  comments: Comment[];
  currentUser: User | null;
  onVideoSelect: (video: Video) => void;
  onSubscribeToggle: (channelId: string) => void;
  onLikeToggle: (videoId: string, status: 'like' | 'dislike') => void;
  onAddComment: (videoId: string, content: string) => void;
  isSubscribed: (channelId: string) => boolean;
  getSubscriberCount: (channelId: string) => number;
  onProgressUpdate?: (progress: number) => void;
  onVideoEnded?: () => void;
  isInWatchLater?: boolean;
  onToggleWatchLater?: () => void;
  onChannelClick?: (channelId: string) => void;
  language: string;
}

export default function WatchPage({
  video,
  allVideos,
  comments,
  currentUser,
  onVideoSelect,
  onSubscribeToggle,
  onLikeToggle,
  onAddComment,
  isSubscribed,
  getSubscriberCount,
  onProgressUpdate,
  onVideoEnded,
  isInWatchLater = false,
  onToggleWatchLater,
  onChannelClick,
  language,
}: WatchPageProps) {
  const [commentInput, setCommentInput] = useState('');

  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const cleanedUrl = url.trim();
    if (cleanedUrl.includes('/shorts/')) {
      const parts = cleanedUrl.split('/shorts/');
      if (parts[1]) {
        const id = parts[1].split(/[?#&]/)[0];
        if (id.length === 11) return id;
      }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanedUrl.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    try {
      const parsed = new URL(cleanedUrl);
      const v = parsed.searchParams.get('v');
      if (v && v.length === 11) return v;
    } catch (e) {}
    if (cleanedUrl.length === 11) {
      return cleanedUrl;
    }
    return null;
  };
  const youtubeId = getYoutubeId(video.videoUrl);

  // Filter out the current active video from recommended lists
  const recommendedVideos = allVideos.filter((v) => v.id !== video.id);
  const videoComments = comments.filter((c) => c.videoId === video.id);

  // Scroll to top when video changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [video.id]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(video.id, commentInput);
    setCommentInput('');
  };

  const formatViews = (viewsNum: number) => {
    if (viewsNum >= 1000000) {
      return (viewsNum / 1000000).toFixed(1) + 'M views';
    }
    if (viewsNum >= 1000) {
      return (viewsNum / 1000).toFixed(0) + 'K views';
    }
    return viewsNum + ' views';
  };

  const formatSubscribers = (subsNum: number) => {
    if (subsNum >= 1000000) {
      return (subsNum / 1000000).toFixed(1) + 'M subscribers';
    }
    if (subsNum >= 1000) {
      return (subsNum / 1000).toFixed(1) + 'K subscribers';
    }
    return subsNum + ' subscribers';
  };

  const activeSubscribed = isSubscribed(video.channelId);
  const activeSubsCount = getSubscriberCount(video.channelId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#0f0f0f] p-4 max-w-7xl mx-auto w-full">
      
      {/* Left Columns: Player, Details, Comments */}
      <div className="lg:col-span-2 space-y-5">
        {/* Custom Video Player Component */}
        <VideoPlayer 
          videoUrl={video.videoUrl} 
          thumbnailUrl={video.thumbnailUrl} 
          onProgressUpdate={onProgressUpdate} 
          onVideoEnded={onVideoEnded}
        />

        {/* YouTube Playback Error Helper Banner */}
        {youtubeId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-sans font-bold text-amber-900 text-sm">
                  {language === 'ar' 
                    ? 'هل تواجه مشكلة في تشغيل الفيديو؟' 
                    : 'Having trouble playing this video?'}
                </p>
                <p className="text-xs text-amber-700 font-sans leading-relaxed">
                  {language === 'ar'
                    ? 'بعض صناع المحتوى على يوتيوب يمنعون تشغيل مقاطعهم خارج موقع يوتيوب لحماية حقوق الملكية. في حال تعذر التشغيل، يمكنك مشاهدته مباشرة بكبسة زر.'
                    : 'Some creators restrict their YouTube videos from being played on external websites. If this video doesn\'t load, you can watch it directly.'}
                </p>
              </div>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 whitespace-nowrap cursor-pointer hover:opacity-90"
            >
              <span>{language === 'ar' ? 'مشاهدة على يوتيوب ↗' : 'Watch on YouTube ↗'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Video Metadata Panel */}
        <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-gray-200">
          <h1 className="font-sans font-bold text-lg md:text-xl text-gray-900 leading-snug">
            {video.title}
          </h1>

          {/* Views and time */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-gray-500">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-gray-800 font-semibold">{formatViews(video.views + 1)}</span>
              <span>•</span>
              <span>{video.uploadedAt}</span>
              <span>•</span>
              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px] font-semibold">
                {video.category}
              </span>
            </div>

            {/* Like / Dislike / Share Actions */}
            <div className="flex items-center gap-2">
              {/* Likes Group */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden">
                <button
                  onClick={() => onLikeToggle(video.id, 'like')}
                  className={`flex items-center gap-1.5 px-4 py-2 hover:bg-gray-100 transition-colors ${
                    video.likeStatus === 'like' ? 'text-red-600 font-bold' : 'text-gray-600'
                  }`}
                  title="I like this"
                >
                  <ThumbsUp className={`w-4 h-4 ${video.likeStatus === 'like' ? 'fill-current' : ''}`} />
                  <span className="text-xs font-mono">{video.likes}</span>
                </button>
                <div className="w-[1px] h-5 bg-gray-300"></div>
                <button
                  onClick={() => onLikeToggle(video.id, 'dislike')}
                  className={`flex items-center gap-1.5 px-4 py-2 hover:bg-gray-100 transition-colors ${
                    video.likeStatus === 'dislike' ? 'text-gray-950 font-bold' : 'text-gray-400'
                  }`}
                  title="I dislike this"
                >
                  <ThumbsDown className={`w-4 h-4 ${video.likeStatus === 'dislike' ? 'fill-current' : ''}`} />
                  <span className="text-xs font-mono">{video.dislikes}</span>
                </button>
              </div>

              {/* Share */}
              <button
                onClick={() => alert(`Copied share link to clipboard: ${window.location.href}`)}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              {/* Watch Later Quick Toggle */}
              {onToggleWatchLater && (
                <button
                  onClick={onToggleWatchLater}
                  className={`flex items-center gap-1.5 border hover:border-gray-300 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                    isInWatchLater
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                  }`}
                  title={isInWatchLater ? "Remove from Watch Later" : "Save to Watch Later"}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isInWatchLater ? 'Saved' : 'Watch Later'}</span>
                </button>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Channel Author details + Video Description */}
          <div className="flex items-start gap-4">
            <img
              src={video.channelAvatar}
              alt={video.channelName}
              onClick={() => onChannelClick && onChannelClick(video.channelId)}
              className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
            />
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div 
                  onClick={() => onChannelClick && onChannelClick(video.channelId)}
                  className="cursor-pointer group"
                >
                  <h3 className="font-sans font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors flex items-center gap-1">
                    <span>{video.channelName}</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{formatSubscribers(activeSubsCount)}</p>
                </div>
                
                {/* Subscribe Button */}
                <button
                  onClick={() => onSubscribeToggle(video.channelId)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    activeSubscribed
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                  }`}
                >
                  {activeSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Collapsible description panel */}
              <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                {video.description}
              </div>
            </div>
          </div>
        </div>

        {/* AI Video Assistant & Analyzer */}
        <AIVideoAnalyzer video={video} />

        {/* Comments Section */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-5">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-bold text-sm text-gray-900">Comments</h3>
            <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-mono text-gray-600">
              {videoComments.length}
            </span>
          </div>

          {/* New comment input form */}
          {currentUser ? (
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Add a public comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm text-gray-900 rounded-full pl-4 pr-12 py-2 outline-none focus:border-red-600 transition-colors placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className={`absolute right-2 top-1.5 p-1 rounded-full transition-all ${
                    commentInput.trim() 
                      ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-500">
              Please sign in to join the discussion and post comments.
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {videoComments.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4 font-sans">
                No comments yet. Be the first to start the conversation!
              </p>
            ) : (
              videoComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-xs border-b border-gray-100 pb-3 last:border-none">
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{comment.userName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{comment.uploadedAt}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed font-sans">{comment.content}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-0.5">
                      <button className="hover:text-gray-700 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.likes}</span>
                      </button>
                      <span>•</span>
                      <button className="hover:text-gray-700">Reply</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Recommended Sidebar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-bold text-sm text-gray-900">Recommended Videos</h3>
          <span className="text-[10px] text-gray-400 font-mono">Next Up</span>
        </div>

        <div className="space-y-3 max-h-[85vh] overflow-y-auto pr-1">
          {recommendedVideos.map((recVideo) => (
            <div
              key={recVideo.id}
              onClick={() => onVideoSelect(recVideo)}
              className="flex gap-3 p-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer group transition-all"
            >
              {/* Thumbnail half */}
              <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <img
                  src={recVideo.thumbnailUrl}
                  alt={recVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 py-0.2 rounded font-semibold">
                  {recVideo.duration}
                </span>
              </div>

              {/* Info metadata half */}
              <div className="min-w-0 flex flex-col justify-center gap-0.5">
                <h4 className="font-sans font-semibold text-xs text-gray-900 line-clamp-2 leading-tight group-hover:text-black group-hover:underline decoration-red-600/40">
                  {recVideo.title}
                </h4>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{recVideo.channelName}</p>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono mt-0.5">
                  <span>{formatViews(recVideo.views)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
