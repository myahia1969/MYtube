import React, { useState } from 'react';
import { BarChart3, Clock, Tv, Heart, Users, Sparkles, Loader2, ArrowRight, BrainCircuit, Target, Lightbulb } from 'lucide-react';
import { Video, Channel } from '../types';

interface AnalyticsDashboardProps {
  history: { videoId: string; watchedAt: string; progress?: number }[];
  videos: Video[];
  channels: Channel[];
  language?: 'en' | 'ar';
}

interface AIInsights {
  persona: string;
  description: string;
  strengths: string[];
  recommendations: { topic: string; reason: string }[];
}

export default function AnalyticsDashboard({
  history,
  videos,
  channels,
  language = 'en',
}: AnalyticsDashboardProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Calculate General Metrics
  const totalWatched = history.length;
  
  // Total watch progress time in seconds
  const totalSeconds = history.reduce((acc, item) => acc + (item.progress || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const displayWatchTime = language === 'ar'
    ? `${totalMinutes} دقيقة و ${Math.floor(totalSeconds % 60)} ثانية`
    : `${totalMinutes} min ${Math.floor(totalSeconds % 60)} sec`;

  const likedCount = videos.filter(v => v.likeStatus === 'like').length;
  const subscribedCount = channels.filter(c => c.isSubscribed).length;

  // 2. Calculate Category Frequencies
  const categoryCounts: { [key: string]: number } = {};
  history.forEach(item => {
    const video = videos.find(v => v.id === item.videoId);
    if (video) {
      categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
    }
  });

  const categoriesData = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalWatched > 0 ? Math.round((count / totalWatched) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Translations object
  const t = {
    title: language === 'ar' ? 'لوحة الإحصائيات الذكية' : 'AI Analytics Dashboard',
    subtitle: language === 'ar' ? 'متابعة تفصيلية لأنماط المشاهدة واهتماماتك العلمية مدعومة بالذكاء الاصطناعي.' : 'Track your viewing habits and gain learning cognitive insights powered by AI.',
    metricWatched: language === 'ar' ? 'الفيديوهات المشاهدة' : 'Videos Watched',
    metricTime: language === 'ar' ? 'إجمالي وقت التعلم' : 'Total Learn Time',
    metricLiked: language === 'ar' ? 'المقاطع المفضلة' : 'Liked Videos',
    metricSubscribed: language === 'ar' ? 'القنوات المشترك بها' : 'Channels Subscribed',
    categoriesHeader: language === 'ar' ? 'اهتمامات الفئات' : 'Category Interests',
    categoriesDesc: language === 'ar' ? 'توزيع مشاهداتك بناءً على تخصص الفيديوهات.' : 'Distribution of your watched videos based on categories.',
    noData: language === 'ar' ? 'لا توجد بيانات كافية لعرض الإحصائيات. ابدأ بمشاهدة بعض الفيديوهات أولاً!' : 'Not enough watch history to display analytics. Watch some videos first!',
    aiSectionHeader: language === 'ar' ? 'بوابة التحليل النفسي والتعليمي (AI Portrait)' : 'AI Learning Persona & Portrait',
    aiSectionDesc: language === 'ar' ? 'يقوم نموذج Gemini بتحليل تاريخ مشاهداتك لتوليد بورتريه تعليمي وتوصيات مخصصة لك.' : 'Gemini analyzes your complete watch history to compile a unique interest profile and study recommendations.',
    generateBtn: language === 'ar' ? 'تحليل اهتماماتي وتوليد البورتريه' : 'Generate AI Learning Profile',
    regenerateBtn: language === 'ar' ? 'إعادة تحليل البيانات' : 'Re-analyze My Habits',
    analyzingText: language === 'ar' ? 'جاري قراءة تفضيلاتك وتوليد بورتريه الذكاء الاصطناعي...' : 'Mapping your viewing patterns and generating insights...',
    personaLabel: language === 'ar' ? 'شخصية التعلم الخاصة بك:' : 'Your Learning Persona:',
    strengthsLabel: language === 'ar' ? 'نقاط القوة التعليمية:' : 'Learning Strengths:',
    recsLabel: language === 'ar' ? 'مواضيع مقترحة للتطوير الذاتي:' : 'Suggested Directions for Growth:',
  };

  const handleGenerateInsights = async () => {
    if (totalWatched === 0) {
      setError(language === 'ar' ? 'يرجى مشاهدة بعض مقاطع الفيديو أولاً لتتمكن ميزة الذكاء الاصطناعي من تحليل عاداتك.' : 'Please watch some videos first so the AI can analyze your habits.');
      return;
    }

    setLoading(true);
    setError(null);

    // Get simple watch list (titles and categories)
    const watchedVideos = history
      .map(item => {
        const video = videos.find(v => v.id === item.videoId);
        return video ? { title: video.title, category: video.category } : null;
      })
      .filter((v): v is { title: string; category: string } => !!v);

    try {
      const response = await fetch('/api/ai/viewer-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          watchedVideos,
          language
        })
      });

      if (!response.ok) {
        let errorMsg = 'Server returned an error.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } else {
            errorMsg = await response.text() || errorMsg;
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response from insights server.');
      }

      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ غير متوقع أثناء توليد التحليلات.' : 'An error occurred while generating insights.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-5 md:p-8 space-y-8 max-w-6xl mx-auto ${language === 'ar' ? 'rtl text-right' : 'ltr text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="space-y-1.5 border-b border-gray-200 pb-4">
        <h1 className="font-sans font-black text-2xl text-gray-900 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-violet-600" />
          <span>{t.title}</span>
        </h1>
        <p className="text-xs text-gray-500 font-sans">{t.subtitle}</p>
      </div>

      {totalWatched === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {t.noData}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 4 Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Watched Count */}
              <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center gap-4 hover:border-violet-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">{t.metricWatched}</p>
                  <p className="text-xl font-extrabold text-gray-950 font-mono leading-none">{totalWatched}</p>
                </div>
              </div>

              {/* Card 2: Learn Time */}
              <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center gap-4 hover:border-violet-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">{t.metricTime}</p>
                  <p className="text-xs font-bold text-gray-950 font-sans leading-tight">{displayWatchTime}</p>
                </div>
              </div>

              {/* Card 3: Liked Count */}
              <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center gap-4 hover:border-violet-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">{t.metricLiked}</p>
                  <p className="text-xl font-extrabold text-gray-950 font-mono leading-none">{likedCount}</p>
                </div>
              </div>

              {/* Card 4: Subscriptions */}
              <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center gap-4 hover:border-violet-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">{t.metricSubscribed}</p>
                  <p className="text-xl font-extrabold text-gray-950 font-mono leading-none">{subscribedCount}</p>
                </div>
              </div>
            </div>

            {/* AI Learning Portrait Card */}
            <div className="bg-white border border-violet-100 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden space-y-5">
              {/* Decorative subtle ambient glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/15 rounded-full blur-2xl -mr-6 -mt-6"></div>
              
              <div className="space-y-1.5 relative">
                <h3 className="font-sans font-black text-base text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <span>{t.aiSectionHeader}</span>
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">{t.aiSectionDesc}</p>
              </div>

              {/* Error messages */}
              {error && (
                <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Persona State Container */}
              {!insights && !loading && (
                <div className="py-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 animate-pulse" />
                  </div>
                  <button
                    onClick={handleGenerateInsights}
                    className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                  >
                    <span>{t.generateBtn}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* Loading Insights State */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3.5">
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                  <p className="text-xs font-semibold text-gray-600 font-sans animate-pulse">{t.analyzingText}</p>
                </div>
              )}

              {/* Insights Received Screen */}
              {insights && !loading && (
                <div className="space-y-5 animate-fadeIn relative">
                  {/* Persona Title Badge Banner */}
                  <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-500 font-mono block">{t.personaLabel}</span>
                    <h4 className="font-sans font-extrabold text-lg text-violet-950 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      {insights.persona}
                    </h4>
                    <p className="text-xs text-violet-900 leading-relaxed font-sans">{insights.description}</p>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-2">
                    <h5 className="font-sans font-bold text-xs text-gray-800 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span>{t.strengthsLabel}</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {insights.strengths.map((strength, idx) => (
                        <span 
                          key={idx} 
                          className="bg-emerald-50 text-emerald-800 border border-emerald-100/60 px-3 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h5 className="font-sans font-bold text-xs text-gray-800 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span>{t.recsLabel}</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {insights.recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-slate-50 border border-gray-150 p-3.5 rounded-2xl space-y-1.5">
                          <h6 className="font-sans font-bold text-xs text-gray-900">{rec.topic}</h6>
                          <p className="text-[11px] text-gray-500 leading-relaxed font-sans">{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recalculate button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleGenerateInsights}
                      className="cursor-pointer text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1.5"
                    >
                      <span>{t.regenerateBtn}</span>
                      <ArrowRight className={`w-3 h-3 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Categories Column */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="font-sans font-black text-base text-gray-900">{t.categoriesHeader}</h3>
                <p className="text-[11px] text-gray-500 font-sans leading-normal">{t.categoriesDesc}</p>
              </div>

              <div className="space-y-3.5 pt-1.5">
                {categoriesData.length === 0 ? (
                  <p className="text-xs text-gray-400 italic font-sans">{language === 'ar' ? 'لم تظهر أي فئات بعد.' : 'No categories recorded yet.'}</p>
                ) : (
                  categoriesData.map((data, idx) => (
                    <div key={data.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="font-bold text-gray-800">{data.name}</span>
                        <span className="font-mono text-gray-400 font-bold bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                          {data.count} ({data.percentage}%)
                        </span>
                      </div>
                      {/* Custom Horizontal Progress Bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-150">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0 
                              ? 'bg-violet-600' 
                              : idx === 1 
                              ? 'bg-indigo-500' 
                              : idx === 2 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
