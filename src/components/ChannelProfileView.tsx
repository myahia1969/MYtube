import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, Tv, Users, Calendar, BarChart3, 
  Sparkles, Loader2, Play, Info, Heart, ArrowRight, Award, MessageSquare 
} from 'lucide-react';
import { Channel, Video } from '../types';
import { motion } from 'motion/react';
import VideoCard from './VideoCard';

interface ChannelProfileViewProps {
  channelId: string;
  channels: Channel[];
  videos: Video[];
  language?: 'en' | 'ar';
  onSubscribeToggle: (channelId: string) => void;
  onVideoClick: (video: Video) => void;
  onBackToHome: () => void;
}

interface AIChannelInsights {
  focus: string;
  about: string;
  achievements: string[];
  aiVerdict: string;
}

export default function ChannelProfileView({
  channelId,
  channels,
  videos,
  language = 'en',
  onSubscribeToggle,
  onVideoClick,
  onBackToHome,
}: ChannelProfileViewProps) {
  const isArabic = language === 'ar';
  
  const [activeTab, setActiveTab] = useState<'videos' | 'ai-insights' | 'about'>('videos');
  const [insights, setInsights] = useState<AIChannelInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [errorInsights, setErrorInsights] = useState<string | null>(null);

  const channel = channels.find(c => c.id === channelId) || {
    id: channelId,
    name: isArabic ? 'قناة غير معروفة' : 'Unknown Channel',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    subscribersCount: 0,
    isSubscribed: false,
  };

  // Get all videos published by this channel
  const channelVideos = videos.filter(v => v.channelId === channelId);

  // Define dynamic backdrop gradient based on channel name length
  const colors = [
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-blue-600 via-indigo-600 to-violet-600',
    'from-emerald-500 via-teal-600 to-indigo-600',
    'from-rose-500 via-orange-500 to-yellow-500',
    'from-fuchsia-600 via-purple-600 to-pink-600'
  ];
  const colorIndex = Math.abs(channel.name.length) % colors.length;
  const gradientClass = colors[colorIndex];

  // Fetch AI insights from backend API
  const handleLoadAIInsights = async (force = false) => {
    if (insights && !force) return;
    setLoadingInsights(true);
    setErrorInsights(null);

    const videoTitles = channelVideos.slice(0, 8).map(v => v.title);

    try {
      const response = await fetch('/api/ai/channel-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelName: channel.name,
          videoTitles,
          language
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error generating insights.');
      }
      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setErrorInsights(err.message || (isArabic ? 'فشل تحميل تحليلات الذكاء الاصطناعي.' : 'Failed to generate channel AI analysis.'));
    } finally {
      setLoadingInsights(false);
    }
  };

  // Load insights if tab is selected
  useEffect(() => {
    if (activeTab === 'ai-insights') {
      handleLoadAIInsights();
    }
  }, [activeTab, channelId]);

  // Reset tab and insights when switching channels
  useEffect(() => {
    setActiveTab('videos');
    setInsights(null);
    setErrorInsights(null);
  }, [channelId]);

  // Translations
  const t = {
    back: isArabic ? 'العودة للرئيسية' : 'Back to Home',
    subscribers: isArabic ? 'مشترك' : 'subscribers',
    subscribe: isArabic ? 'اشترك الآن' : 'Subscribe',
    subscribed: isArabic ? 'تم الاشتراك' : 'Subscribed',
    tabVideos: isArabic ? 'الفيديوهات' : 'Videos',
    tabAI: isArabic ? 'ملف تحليل الذكاء الاصطناعي' : 'AI Analysis Profile',
    tabAbout: isArabic ? 'لمحة عن القناة' : 'About Channel',
    noVideos: isArabic ? 'لا توجد فيديوهات منشورة حالياً.' : 'No uploaded videos currently published.',
    joinDate: isArabic ? 'تاريخ التأسيس' : 'Joined Date',
    mockDate: isArabic ? '١٢ مارس ٢٠٢٤' : 'March 12, 2024',
    channelStats: isArabic ? 'إحصائيات النشاط' : 'Activity Stats',
    totalUploads: isArabic ? 'إجمالي الفيديوهات' : 'Total Uploads',
    totalLikes: isArabic ? 'التقييمات الإيجابية للمحتوى' : 'Positive Likes Received',
    aiVerdictHeader: isArabic ? 'حكم وتقييم الذكاء الاصطناعي' : 'AI Value Verdict',
    focusHeader: isArabic ? 'التخصص الرئيسي للقناة:' : 'Primary Content Focus:',
    achievementsHeader: isArabic ? 'أبرز مخرجات التعلم المقترحة:' : 'Expected Learning Outcomes:',
    aboutHeader: isArabic ? 'نبذة عن رسالة القناة:' : 'Creator Mission & Values:',
    loadInsightsBtn: isArabic ? 'تحليل القناة مجدداً' : 'Re-analyze Channel',
    generatingText: isArabic ? 'يقوم نموذج Gemini بتحليل لغة ومواضيع المحتوى لتوليد البورتريه الإبداعي...' : 'Gemini is evaluating content topics and tone to compile the creator portrait...',
  };

  // Calculate sum of likes across all channel videos
  const channelLikesCount = channelVideos.reduce((sum, v) => sum + v.likes, 0);

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-6xl mx-auto ${isArabic ? 'rtl text-right' : 'ltr text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <button
        onClick={onBackToHome}
        className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full shadow-3xs transition-all active:scale-95"
      >
        <ArrowLeft className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
        <span>{t.back}</span>
      </button>

      {/* Hero Cover Banner Card */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Banner */}
        <div className={`h-36 md:h-48 bg-gradient-to-r ${gradientClass} relative`}>
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          <div className="absolute bottom-3 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[10px] text-white font-mono uppercase tracking-wider font-bold">
            {channelVideos.length} {isArabic ? 'فيديو' : 'videos'}
          </div>
        </div>

        {/* Channel Details Section */}
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <img
              src={channel.avatarUrl}
              alt={channel.name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-white -mt-12 md:-mt-16 shadow-lg bg-gray-100 relative z-10"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-sans font-black text-lg md:text-xl text-gray-950 tracking-tight leading-none">
                  {channel.name}
                </h2>
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-current shrink-0" title="Verified Creator" />
              </div>
              <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {channel.subscribersCount.toLocaleString()} {t.subscribers}
                </span>
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            <button
              onClick={() => onSubscribeToggle(channel.id)}
              className={`cursor-pointer px-6 py-2.5 rounded-full text-xs font-extrabold transition-all duration-200 active:scale-95 shadow-sm border ${
                channel.isSubscribed
                  ? 'bg-gray-100 hover:bg-gray-200/80 text-gray-800 border-gray-250'
                  : 'bg-red-600 hover:bg-red-700 text-white border-transparent'
              }`}
            >
              {channel.isSubscribed ? t.subscribed : t.subscribe}
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('videos')}
            className={`cursor-pointer flex-1 py-3 text-xs font-bold font-sans text-center transition-colors border-b-2 ${
              activeTab === 'videos'
                ? 'border-red-600 text-red-600 font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {t.tabVideos}
          </button>
          <button
            onClick={() => setActiveTab('ai-insights')}
            className={`cursor-pointer flex-1 py-3 text-xs font-bold font-sans text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'ai-insights'
                ? 'border-violet-600 text-violet-600 font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            {t.tabAI}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`cursor-pointer flex-1 py-3 text-xs font-bold font-sans text-center transition-colors border-b-2 ${
              activeTab === 'about'
                ? 'border-gray-900 text-gray-900 font-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {t.tabAbout}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            {channelVideos.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-2">
                <p className="text-xs text-gray-400 italic">{t.noVideos}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {channelVideos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => onVideoClick(video)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai-insights' && (
          <div className="bg-white border border-violet-100 rounded-3xl p-5 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/10 rounded-full blur-2xl -mr-6 -mt-6"></div>

            {loadingInsights && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                <p className="text-xs font-semibold text-gray-600 font-sans animate-pulse max-w-sm leading-relaxed">
                  {t.generatingText}
                </p>
              </div>
            )}

            {errorInsights && !loadingInsights && (
              <div className="bg-red-50 border border-red-150 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-red-700 font-medium">{errorInsights}</p>
                <button
                  onClick={() => handleLoadAIInsights(true)}
                  className="cursor-pointer text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <span>Retry</span>
                  <ArrowRight className={`w-3 h-3 ${isArabic ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

            {insights && !loadingInsights && (
              <div className="space-y-6 md:space-y-8 animate-fadeIn">
                {/* Intro Focus Badge Banner */}
                <div className="bg-violet-50 border border-violet-100/70 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-violet-500 font-mono block">
                    {t.focusHeader}
                  </span>
                  <h4 className="font-sans font-black text-lg md:text-xl text-violet-950 flex items-center gap-2">
                    <Sparkles className="w-5.5 h-5.5 text-yellow-500" />
                    {insights.focus}
                  </h4>
                  <p className="text-xs text-violet-900 font-sans leading-relaxed pt-1">
                    {insights.about}
                  </p>
                </div>

                {/* Left/Right Two columns for Outcomes and Verdict */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Outcomes column */}
                  <div className="space-y-3">
                    <h5 className="font-sans font-extrabold text-xs text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                      <Award className="w-4 h-4 text-indigo-500" />
                      <span>{t.achievementsHeader}</span>
                    </h5>
                    <div className="space-y-2">
                      {insights.achievements.map((achievement, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-50 border border-gray-150 p-3 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-md bg-white border border-gray-200 text-indigo-600 flex items-center justify-center font-mono text-[10px] font-extrabold shadow-3xs">
                            {idx + 1}
                          </span>
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verdict Column */}
                  <div className="bg-emerald-50/50 border border-emerald-100/80 p-5 rounded-2xl space-y-3 self-start">
                    <h5 className="font-sans font-extrabold text-xs text-emerald-950 flex items-center gap-1.5 border-b border-emerald-100/60 pb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t.aiVerdictHeader}</span>
                    </h5>
                    <p className="text-xs text-emerald-900 leading-relaxed font-sans italic font-medium">
                      "{insights.aiVerdict}"
                    </p>
                  </div>
                </div>

                {/* Re-analyze Action */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleLoadAIInsights(true)}
                    className="cursor-pointer text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1.5"
                  >
                    <span>{t.loadInsightsBtn}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mission Panel */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm md:col-span-2 space-y-3">
              <h4 className="font-sans font-black text-sm text-gray-900 flex items-center gap-1.5">
                <Info className="w-4.5 h-4.5 text-gray-500" />
                <span>{t.aboutHeader}</span>
              </h4>
              <p className="text-xs text-gray-600 font-sans leading-relaxed">
                {isArabic 
                  ? `أهلاً بك في القناة الرسمية للمبدع ${channel.name}. نحن مكرسون تماماً لإنتاج ونشر مقاطع فيديو ومنشورات معرفية عالية الجودة تهدف لتمكين المجتمع العلمي والمهني العربي بأساليب مبسطة وشروحات ممتازة.`
                  : `Welcome to the official channel of ${channel.name}. We are dedicated to providing clear, informative, and engaging educational content that inspires learning and triggers meaningful discussions in the developer community.`}
              </p>
            </div>

            {/* Metadata Panel */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
              <h4 className="font-sans font-black text-sm text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <BarChart3 className="w-4.5 h-4.5 text-gray-500" />
                <span>{t.channelStats}</span>
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-sans">{t.totalUploads}</span>
                  <span className="font-mono font-bold text-gray-800 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                    {channelVideos.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-sans">{t.totalLikes}</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                    +{channelLikesCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-sans">{t.joinDate}</span>
                  <span className="font-sans font-bold text-gray-800">
                    {t.mockDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
