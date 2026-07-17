import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle2, XCircle, AlertCircle, Award, RotateCcw, Target, ChevronRight, Loader2, BookOpen, MessageSquare, Send, User } from 'lucide-react';
import { Video } from '../types';

interface AIVideoAnalyzerProps {
  video: Video;
}

interface KeyTakeaway {
  concept: string;
  details: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface AnalysisResult {
  summary: string;
  keyTakeaways: KeyTakeaway[];
  targetAudience: string;
  quiz: QuizQuestion[];
}

export default function AIVideoAnalyzer({ video }: AIVideoAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    // Attempt to load cached analysis for this video if it exists
    const cached = localStorage.getItem(`ai_analysis_${video.id}`);
    return cached ? JSON.parse(cached) : null;
  });

  // Active tab inside analysis results: 'summary' | 'concepts' | 'quiz' | 'chat'
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'quiz' | 'chat'>('summary');

  // Quiz interactive state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Chat interactive state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Clear state when active video changes
  useEffect(() => {
    const cached = localStorage.getItem(`ai_analysis_${video.id}`);
    if (cached) {
      setAnalysis(JSON.parse(cached));
    } else {
      setAnalysis(null);
    }
    setError(null);
    setLoading(false);
    setActiveTab('summary');
    resetQuiz();
    setChatMessages([]);
    setChatInput('');
    setChatLoading(false);
  }, [video.id]);

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const isArabicText = (text: string): boolean => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicPattern.test(text);
  };

  const isArabic = isArabicText(video.title) || isArabicText(video.description || '');

  // UI Strings mapping based on detected language
  const t = {
    header: isArabic ? '✨ المساعد الذكي للفيديو (AI)' : '✨ AI Video Assistant',
    description: isArabic 
      ? 'تحليل ذكي للفيديو وتوليد ملخص شامل، مفاهيم رئيسية، اختبار تفاعلي، ومحادثة فورية.' 
      : 'Deep video analysis including structured summaries, key concepts, interactive quizzes, and Q&A chat.',
    analyzeBtn: isArabic ? 'تحليل الفيديو بالذكاء الاصطناعي' : 'Analyze Video with AI',
    analyzing: isArabic ? 'جاري تحليل محتوى الفيديو بواسطة Gemini...' : 'Analyzing video content with Gemini...',
    tabSummary: isArabic ? 'الملخص والجمهور' : 'Summary & Audience',
    tabConcepts: isArabic ? 'المفاهيم التعليمية' : 'Key Concepts',
    tabQuiz: isArabic ? 'اختبار تفاعلي' : 'Interactive Quiz',
    tabChat: isArabic ? 'اسأل المساعد (محادثة)' : 'Video Q&A Chat',
    targetAudience: isArabic ? 'الجمهور المستهدف والفائدة' : 'Target Audience & Benefits',
    score: isArabic ? 'النتيجة' : 'Score',
    correct: isArabic ? 'إجابة صحيحة! 🎉' : 'Correct Answer! 🎉',
    incorrect: isArabic ? 'إجابة خاطئة!' : 'Incorrect Answer!',
    explanation: isArabic ? 'تفسير الإجابة:' : 'Explanation:',
    nextQuestion: isArabic ? 'السؤال التالي' : 'Next Question',
    retake: isArabic ? 'إعادة الاختبار' : 'Retake Quiz',
    congrats: isArabic ? 'اكتمل الاختبار! 🏆' : 'Quiz Completed! 🏆',
    congratsSub: isArabic 
      ? 'تهانينا! لقد أكملت الاختبار التفاعلي القصير حول هذا الفيديو بنجاح.' 
      : 'Congratulations! You have completed the short interactive quiz on this video.',
    placeholderPrompt: isArabic 
      ? 'اضغط على زر التحليل أعلاه لتوليد الملاحظات والاختبارات التفاعلية باستخدام الذكاء الاصطناعي.' 
      : 'Click the Analyze button above to generate structured educational takeaways and interactive quizzes using AI.',
    chatPlaceholder: isArabic ? 'اسأل أي شيء حول محتوى هذا الفيديو...' : 'Ask anything about this video...',
    chatSendBtn: isArabic ? 'إرسال' : 'Send',
    chatInitialMsg: isArabic 
      ? 'مرحباً! أنا مساعدك الذكي لمحتوى الفيديو. يمكنك سؤالي عن أي جزء في الفيديو أو طلب شرح تفصيلي للنقاط والمصطلحات المذكورة.'
      : 'Hello! I am your AI Video Assistant. Feel free to ask me anything about this video, request expansions on concepts, or clarify any details!',
    chatSuggestions: isArabic 
      ? ['لخص محتوى الفيديو في 3 نقاط رئيسية', 'ما هي الفائدة الأساسية التي يخرج بها المشاهد؟', 'اشرح لي المفاهيم المذكورة بأسلوب بسيط']
      : ['Summarize this video in 3 key bullet points', 'Who exactly is the target audience?', 'Can you explain the main concepts in simple terms?']
  };

  const handleSendChatMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMessage = { role: 'user' as const, text: textToSend };
    setChatMessages(prev => [...prev, userMessage]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      // Keep only last 10 messages for context size safety
      const historyToSend = chatMessages.slice(-10);

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
        let errorMsg = 'Chat server returned an error.';
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
        throw new Error('Invalid response from chat server.');
      }

      setChatMessages(prev => [...prev, { role: 'model', text: data.response }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: isArabic ? 'عذراً، حدث خطأ أثناء معالجة طلبك.' : 'Sorry, an error occurred while processing your request.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          category: video.category,
          channelName: video.channelName
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
        throw new Error('Invalid response from analysis server.');
      }

      setAnalysis(data);
      localStorage.setItem(`ai_analysis_${video.id}`, JSON.stringify(data));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (selectedOption !== null) return; // Answer already submitted
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === analysis?.quiz[currentQuestionIndex].answerIndex;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!analysis) return;
    setSelectedOption(null);
    if (currentQuestionIndex < analysis.quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div 
      id={`ai-analyzer-${video.id}`}
      className={`bg-white border border-gray-200 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm transition-all duration-300 ${isArabic ? 'rtl' : 'ltr'}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <h2 className="font-sans font-extrabold text-base md:text-lg text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
            <span>{t.header}</span>
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
            {t.description}
          </p>
        </div>

        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="cursor-pointer shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-95 border border-indigo-600"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{t.analyzeBtn}</span>
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-indigo-600 font-semibold animate-pulse font-sans">
            {t.analyzing}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">{isArabic ? 'خطأ في التحليل' : 'Analysis Failed'}</p>
            <p className="font-mono text-red-600 bg-red-100/50 p-1.5 rounded text-[11px] select-all overflow-x-auto whitespace-pre-wrap max-h-32">
              {error}
            </p>
            <button
              onClick={handleAnalyze}
              className="mt-2 text-[11px] font-bold underline text-red-800 hover:text-red-950 block"
            >
              {isArabic ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        </div>
      )}

      {/* Placeholder prompt when no analysis has run */}
      {!analysis && !loading && !error && (
        <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed font-sans">
            {t.placeholderPrompt}
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && !error && (
        <div className="space-y-5">
          {/* Tab Selection */}
          <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/60 p-1.5 rounded-xl gap-1">
            {(['summary', 'concepts', 'quiz', 'chat'] as const).map((tab) => {
              const label = tab === 'summary' 
                ? t.tabSummary 
                : tab === 'concepts' 
                ? t.tabConcepts 
                : tab === 'quiz' 
                ? t.tabQuiz 
                : t.tabChat;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                      : 'text-gray-500 hover:bg-white/40 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Summary & Target Audience */}
          {activeTab === 'summary' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Summary text */}
              <div className="space-y-2.5">
                <p className="text-sm text-gray-700 leading-relaxed font-sans bg-slate-50/50 p-4 border border-slate-100 rounded-xl whitespace-pre-wrap">
                  {analysis.summary}
                </p>
              </div>

              {/* Target audience */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span>{t.targetAudience}</span>
                </h4>
                <p className="text-xs text-indigo-850 leading-relaxed font-sans">
                  {analysis.targetAudience}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Key Concepts / Educational takeaways */}
          {activeTab === 'concepts' && (
            <div className="space-y-4 animate-fadeIn">
              {analysis.keyTakeaways.map((takeaway, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-100 transition-all flex items-start gap-3.5 shadow-sm"
                >
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-sm text-gray-900">{takeaway.concept}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">{takeaway.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Interactive Quiz */}
          {activeTab === 'quiz' && (
            <div className="space-y-4 animate-fadeIn">
              {!quizFinished ? (
                <div className="border border-gray-100 rounded-xl p-5 space-y-5 bg-slate-50/30">
                  {/* Progress/Question Index */}
                  <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                    <span>
                      {isArabic ? `السؤال ${currentQuestionIndex + 1} من ${analysis.quiz.length}` : `Question ${currentQuestionIndex + 1} of ${analysis.quiz.length}`}
                    </span>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold">
                      {t.score}: {quizScore}/{analysis.quiz.length}
                    </span>
                  </div>

                  {/* Question Title */}
                  <h3 className="font-sans font-extrabold text-sm md:text-base text-gray-900 leading-snug">
                    {analysis.quiz[currentQuestionIndex].question}
                  </h3>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.quiz[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrectAnswer = idx === analysis.quiz[currentQuestionIndex].answerIndex;
                      const hasSelectedAny = selectedOption !== null;

                      let btnStyle = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50';

                      if (hasSelectedAny) {
                        if (isCorrectAnswer) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-50 border-red-400 text-red-800 font-bold';
                        } else {
                          btnStyle = 'bg-white border-gray-100 text-gray-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasSelectedAny}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full text-start px-4 py-3 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 ${
                            !hasSelectedAny ? 'cursor-pointer active:scale-98' : 'cursor-default'
                          } ${btnStyle}`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono border ${
                            isSelected && isCorrectAnswer 
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : isSelected && !isCorrectAnswer
                              ? 'bg-red-600 text-white border-red-600'
                              : isCorrectAnswer && hasSelectedAny
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {hasSelectedAny && isCorrectAnswer && (
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 self-center" />
                          )}
                          {hasSelectedAny && isSelected && !isCorrectAnswer && (
                            <XCircle className="w-4.5 h-4.5 text-red-600 shrink-0 self-center" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {selectedOption !== null && (
                    <div className="bg-white border border-gray-200/60 p-4 rounded-xl space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {selectedOption === analysis.quiz[currentQuestionIndex].answerIndex ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            {t.correct}
                          </span>
                        ) : (
                          <span className="text-red-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            {t.incorrect}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans">
                        <span className="font-bold text-gray-700 mr-1">{t.explanation}</span>
                        {analysis.quiz[currentQuestionIndex].explanation}
                      </p>

                      {/* Next Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleNextQuestion}
                          className="cursor-pointer bg-[#0f0f0f] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <span>{t.nextQuestion}</span>
                          <ChevronRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Quiz Finish screen */
                <div className="border border-gray-100 rounded-xl p-8 text-center space-y-5 bg-indigo-50/20 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                    <Award className="w-9 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-base md:text-lg text-gray-900">
                      {t.congrats}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans">
                      {t.congratsSub}
                    </p>
                  </div>

                  <div className="bg-white border border-indigo-100 py-3 px-5 rounded-2xl inline-flex flex-col items-center shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 font-mono">{t.score}</span>
                    <span className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                      {quizScore} / {analysis.quiz.length}
                    </span>
                  </div>

                  <button
                    onClick={resetQuiz}
                    className="cursor-pointer w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.retake}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Interactive Video Chat */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Chat Message Box */}
              <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <div className="max-h-80 overflow-y-auto space-y-3 p-3 bg-white border border-gray-100 rounded-xl scrollbar-thin">
                  {/* Default Initial Assistant Message */}
                  <div className="flex gap-2.5 items-start justify-start max-w-[85%]">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="bg-indigo-50/45 text-indigo-950 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed font-sans shadow-xs border border-indigo-100/50">
                      {t.chatInitialMsg}
                    </div>
                  </div>

                  {/* Active messages list */}
                  {chatMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-2.5 items-start max-w-[85%] ${isUser ? (isArabic ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row-reverse') : ''}`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </span>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-sans shadow-xs border whitespace-pre-wrap ${
                          isUser 
                            ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none' 
                            : 'bg-indigo-50/45 text-indigo-950 border-indigo-100/50 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading Response State */}
                  {chatLoading && (
                    <div className="flex gap-2.5 items-start justify-start max-w-[85%] animate-pulse">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </span>
                      <div className="bg-gray-50 text-gray-500 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed font-sans border border-gray-100">
                        {isArabic ? 'جاري التفكير والكتابة...' : 'Thinking and typing...'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Suggestion Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {t.chatSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      disabled={chatLoading}
                      onClick={() => handleSendChatMessage(suggestion)}
                      className="cursor-pointer bg-white hover:bg-indigo-50 hover:text-indigo-700 text-[10px] md:text-xs text-gray-500 border border-gray-200 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-all active:scale-95 text-start font-medium leading-tight disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Input Text Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t.chatPlaceholder}
                    disabled={chatLoading}
                    className="flex-1 bg-white border border-gray-200 text-xs px-4 py-2.5 rounded-xl text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-bold p-2.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center shrink-0 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
