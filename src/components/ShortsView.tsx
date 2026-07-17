import React, { useState, useEffect, useRef } from 'react';
import { 
  ThumbsUp, ThumbsDown, MessageSquare, Share2, CornerDownRight, 
  Send, Sparkles, AlertCircle, Play, Pause, Volume2, VolumeX, 
  ChevronUp, ChevronDown, CheckCircle2, UserPlus, UserCheck, X
} from 'lucide-react';
import { Video, Comment, Channel, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ShortsViewProps {
  videos: Video[];
  channels: Channel[];
  comments: Comment[];
  currentUser: User | null;
  onToggleLike: (videoId: string) => void;
  onToggleDislike: (videoId: string) => void;
  onAddComment: (videoId: string, content: string) => void;
  onToggleSubscribe: (channelId: string) => void;
  language: 'en' | 'ar';
}

export default function ShortsView({
  videos,
  channels,
  comments,
  currentUser,
  onToggleLike,
  onToggleDislike,
  onAddComment,
  onToggleSubscribe,
  language = 'en',
}: ShortsViewProps) {
  // Filter shorts videos only
  const shorts = videos.filter(v => v.category === 'Shorts' || (v as any).isShort);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentShort = shorts[currentIndex];

  // Auto-play the current video
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Auto-play might be blocked by browser policies until user interaction
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  // Adjust mute/unmute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, currentIndex]);

  // Handle keyboard shortcuts (Arrow Up/Down, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return; // Don't trigger when typing comments
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, shorts.length, showComments]);

  // Refresh AI Analysis when shifting shorts
  useEffect(() => {
    setAiAnalysisResult(null);
    setShowAIInsights(false);
  }, [currentIndex]);

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-gray-50 text-center p-8">
        <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="font-sans font-bold text-lg text-gray-900">
          {language === 'ar' ? 'لا توجد مقاطع شورتس حالياً' : 'No Shorts Available Yet'}
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          {language === 'ar' 
            ? 'اضغط على زر رفع الفيديو بالرأس وحدد خيار "مقطع شورتس قصير" لإضافة مقاطع فيديو رأسية مذهلة للمنصة!'
            : 'Click on the upload video button in the header and mark it as a Short to display engaging vertical videos here!'}
        </p>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    } else {
      // Loop back to start
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
    } else {
      // Loop back to end
      setCurrentIndex(shorts.length - 1);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(`${url}?view=shorts&id=${currentShort.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddShortComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(currentShort.id, commentInput.trim());
    setCommentInput('');
  };

  const handleRequestAIAnalysis = async () => {
    if (isAIAnalyzing || aiAnalysisResult) return;
    setIsAIAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentShort.title,
          description: currentShort.description,
          category: 'Shorts',
          channelName: currentShort.channelName,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights.');
      }

      const data = await response.json();
      setAiAnalysisResult(data);
    } catch (err) {
      console.error(err);
      // Fallback fallback is handled on the server, but safety guard here
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const cleanedUrl = url.trim();
    if (cleanedUrl.includes('/shorts/')) {
      const parts = cleanedUrl.split('/shorts/');
      if (parts[1]) {
        return parts[1].split(/[?#&]/)[0];
      }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanedUrl.match(regExp);
    if (match && match[2].length === 11) return match[2];
    if (cleanedUrl.length === 11) return cleanedUrl;
    return null;
  };

  const youtubeId = getYoutubeId(currentShort.videoUrl);
  const currentChannel = channels.find(c => c.id === currentShort.channelId);
  const isSubscribed = currentChannel?.isSubscribed;
  const shortComments = comments.filter(c => c.videoId === currentShort.id);

  return (
    <div className="flex justify-center items-center bg-gray-900 min-h-[calc(100vh-57px)] w-full py-4 px-2 md:py-8 relative overflow-hidden">
      {/* Dynamic blurred background to establish visual warmth */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl scale-125 transition-all duration-700 select-none pointer-events-none"
        style={{ backgroundImage: `url(${currentShort.thumbnailUrl})` }}
      />

      <div className="flex items-center gap-6 max-w-4xl w-full justify-center relative z-10 h-[80vh] md:h-[82vh]">
        
        {/* Navigation Arrow - Left (Desktop) */}
        <button 
          onClick={handlePrev}
          className="hidden md:flex bg-white/10 hover:bg-white/20 hover:scale-115 text-white p-3 rounded-full transition-all border border-white/5 shadow-2xl active:scale-90"
          title={language === 'ar' ? 'السابق' : 'Previous Short'}
        >
          <ChevronUp className="w-6 h-6 rotate-270 md:rotate-0" />
        </button>

        {/* Primary 9:16 vertical video player wrapper */}
        <div className="relative h-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center group select-none flex-1 max-w-[430px]">
          
          {youtubeId ? (
            /* YouTube embed option scaled in vertical frame */
            <div className="absolute inset-0 w-full h-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0`}
                title={currentShort.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full object-cover scale-[1.35]"
              />
              {/* Clicking transparent layer toggles sound or overlay */}
              <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={handleTogglePlay} />
            </div>
          ) : (
            /* Direct MP4/Web optimized loop player */
            <video
              ref={videoRef}
              src={currentShort.videoUrl}
              loop
              autoPlay
              muted={isMuted}
              playsInline
              onClick={handleTogglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />
          )}

          {/* Video state overlays (Play/Pause indicator, Audio controls) */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex gap-2">
              <button
                onClick={handleTogglePlay}
                className="bg-black/40 hover:bg-black/60 p-2.5 rounded-full text-white backdrop-blur-xs transition-all active:scale-90"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className="bg-black/40 hover:bg-black/60 p-2.5 rounded-full text-white backdrop-blur-xs transition-all active:scale-90"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Shorts label */}
            <span className="bg-red-600/90 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              SHORTS
            </span>
          </div>

          {/* Text Info Overlay (Channel details, Title, and Description) */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-16 flex flex-col gap-3 select-text text-white z-10">
            
            {/* Channel and Subscribe button */}
            <div className="flex items-center gap-3">
              <img 
                src={currentShort.channelAvatar} 
                alt={currentShort.channelName} 
                className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <p className="font-sans font-bold text-sm truncate flex items-center gap-1.5">
                  <span>{currentShort.channelName}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-white" />
                </p>
                <p className="text-[10px] text-zinc-300 font-sans">
                  {currentChannel 
                    ? `${(currentChannel.subscribersCount / 1000).toFixed(0)}K subscribers` 
                    : 'Verified Creator'}
                </p>
              </div>

              {/* Subscribe toggle button */}
              <button
                onClick={() => onToggleSubscribe(currentShort.channelId)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 shrink-0 ${
                  isSubscribed 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700' 
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'مشترك' : 'Subscribed'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'اشتراك' : 'Subscribe'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Video metadata description block */}
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-sm leading-snug text-white line-clamp-2">
                {currentShort.title}
              </h4>
              <p className="text-[11px] text-zinc-200 font-sans line-clamp-2 leading-relaxed font-light">
                {currentShort.description}
              </p>
            </div>

            {/* Linear Progress bar representing video duration progress */}
            {!youtubeId && (
              <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-red-500 transition-all duration-100" 
                  style={{ 
                    width: videoRef.current 
                      ? `${(videoRef.current.currentTime / videoRef.current.duration) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            )}
          </div>

          {/* Quick Double-tap like heart popup overlay */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-15"
              >
                <div className="bg-black/55 p-4 rounded-full backdrop-blur-xs text-white">
                  <Play className="w-10 h-10 fill-white translate-x-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Mobile Comment Drawer */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl h-[65%] z-30 shadow-2xl flex flex-col text-gray-900 border-t border-zinc-200"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150">
                  <span className="font-sans font-bold text-sm text-gray-900">
                    {language === 'ar' ? `التعليقات (${shortComments.length})` : `Comments (${shortComments.length})`}
                  </span>
                  <button 
                    onClick={() => setShowComments(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Comment list content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                  {shortComments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <MessageSquare className="w-8 h-8 mx-auto opacity-40 mb-2" />
                      <p className="text-xs italic">{language === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : 'No comments yet. Start the conversation!'}</p>
                    </div>
                  ) : (
                    shortComments.map(comment => (
                      <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                        <img 
                          src={comment.userAvatar} 
                          alt={comment.userName} 
                          className="w-7 h-7 rounded-full object-cover border shrink-0 mt-0.5" 
                        />
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex-1 space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                            <span className="font-bold text-gray-700">{comment.userName}</span>
                            <span>{comment.uploadedAt}</span>
                          </div>
                          <p className="text-gray-900 font-sans leading-relaxed text-[11px] whitespace-pre-line">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment input form footer */}
                <form onSubmit={handleAddShortComment} className="p-3 border-t border-gray-150 flex gap-2 bg-white">
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'إضافة تعليق علني...' : 'Add a public comment...'}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 focus:border-red-600 text-xs text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating AI Insight Panel */}
          <AnimatePresence>
            {showAIInsights && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute inset-y-0 right-0 w-[85%] bg-zinc-950/95 backdrop-blur-md h-full z-35 shadow-2xl flex flex-col text-white border-l border-white/10"
              >
                {/* AI Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span className="font-sans font-bold text-xs">MYtube AI Analyst</span>
                  </div>
                  <button 
                    onClick={() => setShowAIInsights(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* AI Insights content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none">
                  {!aiAnalysisResult && !isAIAnalyzing ? (
                    <div className="py-8 text-center space-y-4">
                      <div className="bg-indigo-500/10 p-4 rounded-full w-fit mx-auto border border-indigo-500/20">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                      </div>
                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <h4 className="font-sans font-bold text-sm">
                          {language === 'ar' ? 'تحليل ذكي فوري للشورتس' : 'Instant AI Shorts Analysis'}
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                          {language === 'ar' 
                            ? 'اضغط أدناه لإنشاء دراسة ذكية وتلخيص دقيق لأهداف هذا الفيديو القصير، واختبر معلوماتك بنقرة واحدة.' 
                            : 'Generate immediate key takeaways, interactive knowledge quizzes, and insights regarding this short.'}
                        </p>
                      </div>
                      <button
                        onClick={handleRequestAIAnalysis}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{language === 'ar' ? 'تشغيل المساعد الذكي' : 'Initialize AI Analyst'}</span>
                      </button>
                    </div>
                  ) : isAIAnalyzing ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-150"></div>
                        <div className="bg-indigo-600 p-4 rounded-full">
                          <Sparkles className="w-6 h-6 text-white animate-spin" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-200">{language === 'ar' ? 'جاري قراءة محتوى الشورتس...' : 'Transcribing Shorts content...'}</p>
                        <p className="text-[10px] text-zinc-400 font-mono animate-pulse">Running advanced Gemini fallback routines</p>
                      </div>
                    </div>
                  ) : (
                    /* Display full AI results */
                    <div className="space-y-4 text-xs">
                      {/* Summary */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                        <p className="font-bold text-indigo-400 flex items-center gap-1.5 font-sans">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{language === 'ar' ? 'ملخص الذكاء الاصطناعي' : 'AI Summary'}</span>
                        </p>
                        <p className="text-zinc-200 leading-relaxed font-light text-[11px]">{aiAnalysisResult.summary}</p>
                      </div>

                      {/* Key Takeaways */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                        <p className="font-bold text-indigo-400 flex items-center gap-1.5 font-sans">
                          <Sparkles className="w-4 h-4" />
                          <span>{language === 'ar' ? 'مفاهيم التعلم الرئيسية' : 'Core Takeaways'}</span>
                        </p>
                        <div className="space-y-2.5">
                          {aiAnalysisResult.keyTakeaways?.map((item: any, idx: number) => (
                            <div key={idx} className="border-l border-zinc-700 pl-2.5 py-0.5">
                              <p className="font-bold text-zinc-100">{item.concept}</p>
                              <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">{item.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quiz */}
                      {aiAnalysisResult.quiz && aiAnalysisResult.quiz.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                          <p className="font-bold text-emerald-400 flex items-center gap-1.5 font-sans">
                            <CornerDownRight className="w-4 h-4" />
                            <span>{language === 'ar' ? 'اختبر معلوماتك بالذكاء الاصطناعي' : 'AI Knowledge Quiz'}</span>
                          </p>
                          <div className="space-y-3">
                            <p className="font-bold text-zinc-200">{aiAnalysisResult.quiz[0].question}</p>
                            <div className="space-y-1.5">
                              {aiAnalysisResult.quiz[0].options.map((opt: string, oIdx: number) => {
                                const isCorrect = oIdx === aiAnalysisResult.quiz[0].answerIndex;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => alert(isCorrect 
                                      ? (language === 'ar' ? `إجابة صحيحة! التفسير: ${aiAnalysisResult.quiz[0].explanation}` : `Correct! ${aiAnalysisResult.quiz[0].explanation}`)
                                      : (language === 'ar' ? `إجابة خاطئة، حاول مرة أخرى!` : `Incorrect option, try again!`)
                                    )}
                                    className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-2.5 transition-colors text-[10px] text-zinc-300 font-sans cursor-pointer active:scale-98 block"
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Floating Side Action Controls (Likes, Comments, Share, AI Analyst, Next, Prev) */}
        <div className="flex flex-col gap-4 text-white shrink-0 z-20 items-center justify-end h-[60%] sm:h-auto select-none">
          
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggleLike(currentShort.id)}
              className={`p-3 rounded-full border shadow-lg transition-all active:scale-75 ${
                currentShort.likeStatus === 'like'
                  ? 'bg-pink-600 border-pink-500 text-white animate-bounce'
                  : 'bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-700 hover:text-pink-400 text-zinc-200'
              }`}
              title={language === 'ar' ? 'أعجبني' : 'Like'}
            >
              <ThumbsUp className="w-4.5 h-4.5 fill-current" />
            </button>
            <span className="text-[10px] font-bold text-zinc-300 font-mono">
              {currentShort.likes + (currentShort.likeStatus === 'like' ? 1 : 0)}
            </span>
          </div>

          {/* Dislike */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggleDislike(currentShort.id)}
              className={`p-3 rounded-full border shadow-lg transition-all active:scale-75 ${
                currentShort.likeStatus === 'dislike'
                  ? 'bg-zinc-900 border-zinc-700 text-red-500'
                  : 'bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-700 hover:text-red-400 text-zinc-200'
              }`}
              title={language === 'ar' ? 'لم يعجبني' : 'Dislike'}
            >
              <ThumbsDown className="w-4.5 h-4.5" />
            </button>
            <span className="text-[10px] font-bold text-zinc-300 font-mono">
              {currentShort.dislikes}
            </span>
          </div>

          {/* Comments */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowComments(prev => !prev)}
              className={`p-3 rounded-full border shadow-lg transition-all active:scale-75 ${
                showComments
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-700 hover:text-blue-400 text-zinc-200'
              }`}
              title={language === 'ar' ? 'التعليقات' : 'Comments'}
            >
              <MessageSquare className="w-4.5 h-4.5" />
            </button>
            <span className="text-[10px] font-bold text-zinc-300 font-mono">
              {shortComments.length}
            </span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShare}
              className={`p-3 rounded-full border shadow-lg transition-all active:scale-75 ${
                copied
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-700 hover:text-emerald-400 text-zinc-200'
              }`}
              title={language === 'ar' ? 'نسخ الرابط' : 'Copy Share URL'}
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>
            <span className="text-[10px] font-bold text-zinc-300 font-mono">
              {copied ? (language === 'ar' ? 'تم' : 'Copied!') : (language === 'ar' ? 'مشاركة' : 'Share')}
            </span>
          </div>

          {/* AI Insights Analyzer Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowAIInsights(prev => !prev)}
              className={`p-3 rounded-full border shadow-lg transition-all active:scale-75 ${
                showAIInsights
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-700 hover:text-indigo-400 text-zinc-200'
              }`}
              title={language === 'ar' ? 'التحليل الذكي للشورتس' : 'AI Shorts Analyst'}
            >
              <Sparkles className="w-4.5 h-4.5 animate-spin-slow text-indigo-400 fill-indigo-400" />
            </button>
            <span className="text-[10px] font-bold text-indigo-400 font-mono">
              AI
            </span>
          </div>

          {/* Mobile Arrows or helpers */}
          <div className="border-t border-zinc-700/60 my-2 pt-2 w-8 flex flex-col gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700 text-zinc-200 flex justify-center hover:text-white"
              title={language === 'ar' ? 'السابق' : 'Previous'}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700 text-zinc-200 flex justify-center hover:text-white"
              title={language === 'ar' ? 'التالي' : 'Next'}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Navigation Arrow - Right (Desktop) */}
        <button 
          onClick={handleNext}
          className="hidden md:flex bg-white/10 hover:bg-white/20 hover:scale-115 text-white p-3 rounded-full transition-all border border-white/5 shadow-2xl active:scale-90"
          title={language === 'ar' ? 'التالي' : 'Next Short'}
        >
          <ChevronDown className="w-6 h-6 rotate-270 md:rotate-0" />
        </button>

      </div>
    </div>
  );
}
