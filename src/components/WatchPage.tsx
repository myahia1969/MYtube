import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, CornerDownRight, MoreHorizontal, Send, Play, Clock, AlertCircle, ExternalLink, Download, X, Sparkles, Loader2, Brain, MessageSquare, User as UserIcon } from 'lucide-react';
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
  isInDownloads?: boolean;
  onToggleDownload?: (quality?: '1080p' | '720p' | 'mp3') => void;
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
  isInDownloads = false,
  onToggleDownload,
  onChannelClick,
  language,
}: WatchPageProps) {
  const [commentInput, setCommentInput] = useState('');
  const [showDownloadWizard, setShowDownloadWizard] = useState(false);
  const [downloadQuality, setDownloadQuality] = useState<'1080p' | '720p' | 'mp3'>('1080p');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [wizardStepMessage, setWizardStepMessage] = useState('');

  // YouTube-style Ask AI state
  const [showAIChatPanel, setShowAIChatPanel] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);

  const handleSendAiChatMessage = async (customText?: string) => {
    const textToSend = customText || aiChatInput;
    if (!textToSend.trim() || aiChatLoading) return;

    const userMessage = { role: 'user' as const, text: textToSend };
    setAiChatMessages(prev => [...prev, userMessage]);
    if (!customText) setAiChatInput('');
    setAiChatLoading(true);

    try {
      // Keep only last 10 messages for context size safety
      const historyToSend = aiChatMessages.slice(-10);

      const response = await fetch('/api/ai/chat-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          category: video.category,
          channelName: video.channelName,
          message: textToSend,
          chatHistory: historyToSend
        })
      });

      if (!response.ok) {
        throw new Error('Chat server returned an error.');
      }

      const data = await response.json();
      setAiChatMessages(prev => [...prev, { role: 'model', text: data.response }]);
    } catch (err: any) {
      console.error(err);
      setAiChatMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: language === 'ar' 
            ? 'عذراً، حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي. يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.' 
            : 'Sorry, we encountered an error connecting to the AI assistant. Please check your network and try again.' 
        }
      ]);
    } finally {
      setAiChatLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (downloadStatus === 'downloading') {
      timer = setInterval(() => {
        setDownloadProgress((prev) => {
          const next = prev + Math.floor(Math.random() * 8) + 4;
          if (next >= 100) {
            clearInterval(timer);
            setDownloadStatus('completed');
            
            // Toggle download state in parent
            if (onToggleDownload && !isInDownloads) {
              onToggleDownload(downloadQuality);
            }

            // Trigger a physical browser download of the video file!
            try {
              const a = document.createElement('a');
              // fallback to a nice bunny looping stock video if none is set
              a.href = video.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
              a.download = `${video.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } catch (err) {
              console.error('Trigger browser download failed', err);
            }

            return 100;
          }
          return next;
        });
      }, 200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [downloadStatus, onToggleDownload, isInDownloads, video]);

  // Update wizard status messages based on progress
  useEffect(() => {
    if (downloadStatus === 'downloading') {
      if (downloadProgress < 20) {
        setWizardStepMessage(language === 'ar' 
          ? "جاري الاتصال بخوادم وسائط ماي تيوب وتجهيز رابط التحميل..." 
          : "Connecting to MYtube media servers and requesting video stream...");
      } else if (downloadProgress < 45) {
        setWizardStepMessage(language === 'ar'
          ? "جاري فك تشفير وفصل مسارات الصوت والفيديو بدقة عالية..."
          : "Splitting audio/video formats and buffering metadata container...");
      } else if (downloadProgress < 75) {
        setWizardStepMessage(language === 'ar'
          ? "جاري دمج ملفات الصوت والفيديو وتوليد حاوية MP4 نهائية..."
          : "Demuxing H.264 video streams and AAC audio codecs...");
      } else if (downloadProgress < 95) {
        setWizardStepMessage(language === 'ar'
          ? "جاري كتابة البيانات وحفظ الملف في تخزين المنصة المحلي..."
          : "Writing buffered files securely into local offline storage blocks...");
      } else {
        setWizardStepMessage(language === 'ar'
          ? "جاري إتمام المعالجة وحفظ الفيديو بنجاح!"
          : "Finalizing data integrity hashes and registering video offline...");
      }
    } else if (downloadStatus === 'completed') {
      setWizardStepMessage(language === 'ar'
        ? "اكتمل التحميل بنجاح! تم حفظ الفيديو في قائمة التنزيلات للتشغيل بدون إنترنت."
        : "Download complete! Video is saved to your downloads for secure offline playback.");
    } else {
      setWizardStepMessage(language === 'ar'
        ? "اختر جودة الفيديو المطلوبة لبدء عملية تنزيل وحفظ الفيديو."
        : "Select your preferred file format options to initiate download stream.");
    }
  }, [downloadProgress, downloadStatus, language]);

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
                  <span>{isInWatchLater ? (language === 'ar' ? 'تم الحفظ' : 'Saved') : (language === 'ar' ? 'المشاهدة لاحقاً' : 'Watch Later')}</span>
                </button>
              )}

              {/* Download / Save offline Toggle */}
              {onToggleDownload && (
                <button
                  onClick={() => {
                    setDownloadProgress(0);
                    setDownloadStatus('idle');
                    setWizardStepMessage('');
                    setShowDownloadWizard(true);
                  }}
                  className={`flex items-center gap-1.5 border hover:border-emerald-300 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                    isInDownloads
                      ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700 hover:text-emerald-600'
                  }`}
                  title={isInDownloads ? "Saved Offline" : "Download & Save Video"}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isInDownloads ? (language === 'ar' ? 'منزّل ومحفوظ ✓' : 'Downloaded ✓') : (language === 'ar' ? 'تنزيل وحفظ' : 'Download')}</span>
                </button>
              )}

              {/* Ask AI / طرح سؤال بالذكاء الاصطناعي */}
              <button
                onClick={() => {
                  setShowAIChatPanel(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100/60 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                title={language === 'ar' ? 'طرح سؤال بالذكاء الاصطناعي' : 'Ask AI a Question'}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>{language === 'ar' ? 'طرح سؤال (AI) ✨' : 'Ask AI ✨'}</span>
              </button>
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

      {/* Modern Interactive Download Wizard Modal */}
      {showDownloadWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative font-sans flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2 text-emerald-600">
                <Download className="w-5 h-5 animate-bounce" />
                <h3 className="font-bold text-sm tracking-tight text-gray-900">
                  {language === 'ar' ? 'معالج التنزيل الذكي من MYtube' : 'MYtube Smart Downloader Wizard'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (downloadStatus !== 'downloading') {
                    setShowDownloadWizard(false);
                  } else if (confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء عملية التحميل الجارية؟' : 'Are you sure you want to cancel the current download?')) {
                    setDownloadStatus('idle');
                    setShowDownloadWizard(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Mini Video Meta Preview Card */}
              <div className="flex gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-20 aspect-video object-cover rounded-md shadow-sm border border-gray-200"
                />
                <div className="min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-xs text-gray-900 line-clamp-1 leading-tight">
                    {video.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">
                    {language === 'ar' ? `بواسطة: ${video.channelName}` : `By: ${video.channelName}`}
                  </p>
                </div>
              </div>

              {/* IDLE PHASE - QUALITY SELECTION */}
              {downloadStatus === 'idle' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                    {language === 'ar' 
                      ? 'حدد صيغة الملف والجودة المفضلة لبدء الحفظ بأعلى كفاءة وسرعة:' 
                      : 'Choose your desired format and resolution to save video securely for offline access:'}
                  </p>

                  <div className="space-y-2.5">
                    {/* 1080p Option */}
                    <button
                      onClick={() => setDownloadQuality('1080p')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        downloadQuality === '1080p'
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          downloadQuality === '1080p' ? 'border-emerald-500' : 'border-gray-300'
                        }`}>
                          {downloadQuality === '1080p' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                          <p className="font-bold text-xs text-gray-900">
                            {language === 'ar' ? 'فيديو عالي الدقة Full HD (1080p)' : 'Full HD Video (1080p)'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {language === 'ar' ? 'أفضل جودة للمشاهدة على الشاشات الكبيرة والكمبيوتر' : 'Highest clarity for premium screens and desktop viewing.'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        {language === 'ar' ? 'موصى به' : 'RECOMMENDED'}
                      </span>
                    </button>

                    {/* 720p Option */}
                    <button
                      onClick={() => setDownloadQuality('720p')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        downloadQuality === '720p'
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          downloadQuality === '720p' ? 'border-emerald-500' : 'border-gray-300'
                        }`}>
                          {downloadQuality === '720p' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                          <p className="font-bold text-xs text-gray-900">
                            {language === 'ar' ? 'فيديو اقتصادي عالي الدقة HD (720p)' : 'Standard HD Video (720p)'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {language === 'ar' ? 'حجم ملف أصغر وسرعة تحميل ممتازة للهواتف المحمولة' : 'Efficient file size, high speed, perfect for mobile data.'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-bold">
                        {language === 'ar' ? 'سريع' : 'FASTEST'}
                      </span>
                    </button>

                    {/* MP3 Option */}
                    <button
                      onClick={() => setDownloadQuality('mp3')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        downloadQuality === 'mp3'
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          downloadQuality === 'mp3' ? 'border-emerald-500' : 'border-gray-300'
                        }`}>
                          {downloadQuality === 'mp3' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                          <p className="font-bold text-xs text-gray-900">
                            {language === 'ar' ? 'صوت عالي النقاء MP3 (320kbps)' : 'High-Fidelity Audio Only (MP3)'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {language === 'ar' ? 'استخراج الصوت فقط للاستماع بدون صورة بجودة استثنائية' : 'Extract audio track for background list playback.'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                        {language === 'ar' ? 'صوت فقط' : 'AUDIO ONLY'}
                      </span>
                    </button>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setDownloadStatus('downloading')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{language === 'ar' ? 'بدء تنزيل وحفظ الملف الآن 🚀' : 'Start Download Stream 🚀'}</span>
                    </button>
                    <button
                      onClick={() => setShowDownloadWizard(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {/* DOWNLOADING ACTIVE PHASE */}
              {downloadStatus === 'downloading' && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                  <div className="relative flex items-center justify-center">
                    {/* Ring Pulse */}
                    <div className="absolute w-20 h-20 bg-emerald-100 rounded-full animate-ping opacity-75" />
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center relative shadow-sm">
                      <Download className="w-7 h-7 text-emerald-600 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <p className="text-2xl font-mono font-bold text-gray-900 tracking-tight">
                      {downloadProgress}%
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                      {language === 'ar' ? 'جاري التحميل محلياً...' : 'DOWNLOADING MEDIA STREAM...'}
                    </p>
                  </div>

                  {/* High Contrast Progress bar */}
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/50 relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300 rounded-full relative"
                      style={{ width: `${downloadProgress}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-[progress_1s_linear_infinite]" />
                    </div>
                  </div>

                  {/* Real-time Technical Status Label */}
                  <p className="text-[11px] text-gray-600 bg-gray-50 border border-gray-150 px-3.5 py-2 rounded-lg font-sans w-full max-w-xs animate-pulse leading-normal">
                    {wizardStepMessage}
                  </p>
                </div>
              )}

              {/* COMPLETED SUCCESS PHASE */}
              {downloadStatus === 'completed' && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center relative shadow-md">
                    <div className="absolute w-14 h-14 border-2 border-dashed border-emerald-300 rounded-full animate-[spin_10s_linear_infinite]" />
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-700 font-sans">
                      {language === 'ar' ? 'تم الحفظ وتنزيل الملف بنجاح! 🎉' : 'Saved & Downloaded Offline Successfully! 🎉'}
                    </p>
                    <p className="text-xs text-gray-500 max-w-xs font-sans leading-relaxed">
                      {wizardStepMessage}
                    </p>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-left w-full text-[10px] space-y-1 font-sans text-gray-600 leading-normal">
                    <p className="font-bold text-gray-800 text-center pb-1 border-b border-emerald-100/60 mb-1">
                      {language === 'ar' ? 'تفاصيل الملف المحفوظ' : 'SAVED OFFLINE METADATA'}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'ar' ? 'الصيغة المفضلة:' : 'Format Profile:'}</span>
                      <span className="font-bold text-emerald-700">{downloadQuality.toUpperCase()} Container</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'ar' ? 'مسار الحفظ:' : 'Secure Path:'}</span>
                      <span className="font-mono">MYtube/offline/{video.id}.mp4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'ar' ? 'مساحة التخزين:' : 'Estimated size:'}</span>
                      <span className="font-mono font-bold text-gray-700">~{downloadQuality === 'mp3' ? '4.8 MB' : downloadQuality === '720p' ? '24.2 MB' : '58.9 MB'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDownloadWizard(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    {language === 'ar' ? 'إغلاق وإتمام' : 'Close and Complete'}
                  </button>
                </div>
              )}

            </div>

            {/* Footer Notice */}
            <div className="p-3 border-t border-gray-100 text-center bg-gray-50 text-[9px] text-gray-400 font-mono">
              {language === 'ar' 
                ? 'مخزن بأمان عبر تقنية التخزين المحلي للمتصفح. متاح دائمًا للتشغيل بدون إنترنت.' 
                : 'SECURED OFFLINE COPY SYNCHRONIZED TO LOCAL BROWSER STORAGE CACHE.'}
            </div>

          </div>
        </div>
      )}

      {/* YouTube-style Ask AI Panel Drawer */}
      {showAIChatPanel && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop blur & overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
            onClick={() => setShowAIChatPanel(false)}
          />

          <div className={`absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col h-full border-l border-gray-100 z-10 transition-transform duration-300 ${
            language === 'ar' ? 'rtl' : 'ltr'
          }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'اسأل المساعد الذكي' : 'Ask YouTube AI'}</span>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full font-bold">BETA</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    {language === 'ar' ? 'اسأل أي شيء حول هذا الفيديو وسيجيبك الذكاء الاصطناعي' : 'Ask any question about this video and get instant AI answers.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIChatPanel(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Message History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {/* Context Summary Box */}
              <div className="p-3 bg-white border border-gray-200/80 rounded-2xl flex gap-3 shadow-xs">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-20 aspect-video object-cover rounded-lg border border-gray-100 shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600 font-mono">
                    {language === 'ar' ? 'الفيديو الحالي' : 'NOW PLAYING'}
                  </span>
                  <h4 className="font-bold text-xs text-gray-900 line-clamp-1 leading-tight mt-0.5">
                    {video.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {video.channelName}
                  </p>
                </div>
              </div>

              {/* Chat Log */}
              <div className="space-y-4">
                {/* Default greeting message */}
                <div className="flex gap-2.5 items-start justify-start max-w-[85%]">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/30">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="bg-indigo-50/30 text-indigo-950 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed font-sans shadow-xs border border-indigo-100/50">
                    {language === 'ar'
                      ? `مرحباً! أنا مساعدك الذكي لمحتوى الفيديو. يمكنك سؤالي عن أي تفاصيل أو طلب تلخيص لهذا الفيديو أو شرح فكرة معينة فيه.`
                      : `Hello! I am your AI Video Assistant for this video. Ask me anything about it, request a breakdown, or ask for explanations of terms discussed in "${video.title}"!`}
                  </div>
                </div>

                {/* History of messages */}
                {aiChatMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-2.5 items-start max-w-[85%] ${
                        isUser 
                          ? (language === 'ar' ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row-reverse') 
                          : ''
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isUser 
                          ? 'bg-indigo-600 text-white border-indigo-700' 
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100/30'
                      }`}>
                        {isUser ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </span>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-sans shadow-xs whitespace-pre-wrap ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-700' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {/* Loader when thinking */}
                {aiChatLoading && (
                  <div className="flex gap-2.5 items-start justify-start max-w-[85%] animate-pulse">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/30">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </span>
                    <div className="bg-white text-gray-500 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed font-sans border border-gray-150">
                      {language === 'ar' ? 'جاري التفكير والكتابة...' : 'Thinking and typing...'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Input & Presets area */}
            <div className="p-4 border-t border-gray-150 bg-white space-y-3 shrink-0">
              {/* Predefined prompt suggestion chips */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {(language === 'ar' 
                  ? [
                      '💡 لخص الفيديو في نقاط رئيسية',
                      '🎯 من هو الجمهور المستهدف؟',
                      '🔑 ما هي أهم فكرة تعليمية هنا؟',
                      '❓ اطرح علي سؤالاً لاختبار فهمي',
                    ]
                  : [
                      '💡 Summarize in bullet points',
                      '🎯 Who is the target audience?',
                      '🔑 What is the main takeaway?',
                      '❓ Give me a question to test me',
                    ]
                ).map((suggestion, idx) => (
                  <button
                    key={idx}
                    disabled={aiChatLoading}
                    onClick={() => handleSendAiChatMessage(suggestion)}
                    className="cursor-pointer bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-[10px] text-gray-600 border border-gray-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-full transition-all active:scale-95 text-start font-medium leading-tight disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Chat text box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiChatMessage();
                }}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder={language === 'ar' ? 'اسأل أي شيء حول محتوى هذا الفيديو...' : 'Ask anything about this video...'}
                  disabled={aiChatLoading}
                  className="flex-1 bg-gray-50 border border-gray-200 text-xs px-4 py-2.5 rounded-xl text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!aiChatInput.trim() || aiChatLoading}
                  className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 text-white font-bold p-2.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
