import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Radio, Users, MessageSquare, Send, Zap, Mic, MicOff, Video, VideoOff, 
  Settings, Play, Square, Award, Volume2, HelpCircle, User, Star, Plus, 
  Trash2, ThumbsUp, ArrowRight, Share2, Heart, ShieldAlert, Sparkles, AlertCircle, Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveHubProps {
  language?: 'en' | 'ar';
  currentUser?: {
    displayName: string;
    email: string;
    avatarUrl: string;
  } | null;
  onTriggerToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

// Live Stream template definitions
interface LiveStream {
  id: string;
  title: string;
  titleAr: string;
  streamer: string;
  streamerAvatar: string;
  category: string;
  categoryAr: string;
  viewers: number;
  tags: string[];
  tagsAr: string[];
  backdropType: 'tech' | 'gaming' | 'lofi' | 'cyber';
  likes: number;
}

// Live Podcast template definitions
interface LivePodcast {
  id: string;
  title: string;
  titleAr: string;
  host: string;
  hostAvatar: string;
  topic: string;
  topicAr: string;
  listeners: number;
  guests: { name: string; avatar: string; role: string; roleAr: string; isMuted: boolean }[];
}

const MOCK_LIVE_STREAMS: LiveStream[] = [
  {
    id: 'live-1',
    title: 'Building a Fullstack App with React, Tailwind, and Node.js 💻',
    titleAr: 'بناء تطبيق كامل باستخدام React و Tailwind و Node.js 💻',
    streamer: 'Omar Farooq',
    streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    category: 'Software Engineering',
    categoryAr: 'هندسة البرمجيات',
    viewers: 1420,
    tags: ['coding', 'webdev', 'typescript'],
    tagsAr: ['برمجة', 'ويب', 'تايب_سكربت'],
    backdropType: 'tech',
    likes: 340,
  },
  {
    id: 'live-2',
    title: 'Cyberpunk 2077 - Next-Gen Raytracing Max Settings Speedrun! 🎮',
    titleAr: 'سايبر بانك 2077 - تجربة تتبع الأشعة بأعلى إعدادات مع لعب سريع! 🎮',
    streamer: 'Yousef Esports',
    streamerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    category: 'Gaming',
    categoryAr: 'الألعاب',
    viewers: 2850,
    tags: ['gaming', 'cyberpunk', 'raytracing'],
    tagsAr: ['ألعاب', 'سايبربانك', 'جرافيكس'],
    backdropType: 'gaming',
    likes: 710,
  },
  {
    id: 'live-3',
    title: 'Lofi Ambient Beats for Deep Focus, Work, and Coding 🎧',
    titleAr: 'موسيقى لوفاي هادئة للتركيز العميق والعمل والبرمجة 🎧',
    streamer: 'Cosmic Tunes',
    streamerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    category: 'Music',
    categoryAr: 'موسيقى',
    viewers: 940,
    tags: ['lofi', 'focus', 'chill'],
    tagsAr: ['لوفاي', 'تركيز', 'استرخاء'],
    backdropType: 'lofi',
    likes: 420,
  }
];

const MOCK_LIVE_PODCASTS: LivePodcast[] = [
  {
    id: 'pod-1',
    title: 'AI Revolution: How Generative AI is Changing Work & Education',
    titleAr: 'ثورة الذكاء الاصطناعي: كيف يغير الذكاء الاصطناعي التوليدي العمل والتعليم',
    host: 'Dr. Sarah Al-Harbi',
    hostAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    topic: 'Artificial Intelligence',
    topicAr: 'الذكاء الاصطناعي',
    listeners: 650,
    guests: [
      { name: 'Eng. Khalid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', role: 'AI Researcher', roleAr: 'باحث ذكاء اصطناعي', isMuted: false },
      { name: 'Dr. Layan', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', role: 'EdTech Expert', roleAr: 'خبيرة تقنيات التعليم', isMuted: true }
    ]
  },
  {
    id: 'pod-2',
    title: 'The Saudi Startup Ecosystem: Venture Capital & Scaleups in 2026',
    titleAr: 'بيئة الشركات الناشئة في السعودية: رأس المال الجريء والتوسع في 2026',
    host: 'Ahmad Al-Mansoori',
    hostAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    topic: 'Business & Finance',
    topicAr: 'الأعمال والتمويل',
    listeners: 430,
    guests: [
      { name: 'Sara VC', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', role: 'Partner @ Riyadh VC', roleAr: 'شريكة في الرياض VC', isMuted: false }
    ]
  }
];

const CHAT_TEMPLATES = [
  { user: 'Rayan 🚀', msgEn: 'Amazing project! Love the architecture.', msgAr: 'مشروع رائع جداً! أعجبتني البنية البرمجية.' },
  { user: 'Hassan Dev', msgEn: 'Is this using Tailwind v4?', msgAr: 'هل تستخدم الإصدار الرابع من Tailwind؟' },
  { user: 'Sara 💡', msgEn: 'Yes, and it performs beautifully.', msgAr: 'نعم، والأداء ممتاز ومذهل.' },
  { user: 'Aisha Tech', msgEn: 'The low latency is super impressive on this broadcast!', msgAr: 'البث سريع وبدون أي تأخير يذكر!' },
  { user: 'Sultan Gaming', msgEn: 'Epic stream! Best stream on the hub.', msgAr: 'بث أسطوري! أفضل بث في المنصة.' }
];

export default function LiveHubView({ 
  language = 'en', 
  currentUser, 
  onTriggerToast 
}: LiveHubProps) {
  const [activeTab, setActiveTab] = useState<'streams' | 'podcasts' | 'studio'>('streams');
  
  // Streams view states
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [streamComments, setStreamComments] = useState<{ id: string; user: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Podcast view states
  const [selectedPodcast, setSelectedPodcast] = useState<LivePodcast | null>(null);
  const [podcastListeners, setPodcastListeners] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [userGuestRole, setUserGuestRole] = useState<'listener' | 'requesting' | 'guest'>('listener');
  const [podcastComments, setPodcastComments] = useState<{ id: string; user: string; text: string; time: string }[]>([]);
  const [podcastInput, setPodcastInput] = useState('');
  
  // Q&A States for Podcast
  const [podcastQuestions, setPodcastQuestions] = useState<{ id: string; user: string; avatar: string; question: string; votes: number; isAnswered: boolean }[]>([
    { id: 'q-1', user: 'Tareq', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', question: language === 'ar' ? 'ما هي اللغات البرمجية الأكثر طلباً للذكاء الاصطناعي؟' : 'What are the most in-demand programming languages for AI?', votes: 12, isAnswered: true },
    { id: 'q-2', user: 'Layan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', question: language === 'ar' ? 'كيف يمكن تفادي الأخطاء الأخلاقية في النماذج اللغوية الكبيرة؟' : 'How can we mitigate ethical issues in LLMs?', votes: 24, isAnswered: false }
  ]);
  const [questionInput, setQuestionInput] = useState('');

  // Live Studio (Go Live) States
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [studioTitle, setStudioTitle] = useState('');
  const [studioCategory, setStudioCategory] = useState('Software Engineering');
  const [studioBackdrop, setStudioBackdrop] = useState<'tech' | 'gaming' | 'lofi' | 'cyber'>('tech');
  const [studioViewers, setStudioViewers] = useState(0);
  const [studioLikes, setStudioLikes] = useState(0);
  const [studioCameraActive, setStudioCameraActive] = useState(true);
  const [studioMicActive, setStudioMicActive] = useState(true);
  const [studioStreamComments, setStudioStreamComments] = useState<{ id: string; user: string; text: string; time: string }[]>([]);
  const [studioInput, setStudioInput] = useState('');
  const [broadcastSeconds, setBroadcastSeconds] = useState(0);

  // Interval references for simulation
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const podcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const studioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper trigger
  const triggerLocalToast = (msg: string, type: 'success' | 'info' | 'error') => {
    if (onTriggerToast) {
      onTriggerToast(msg, type);
    } else {
      console.log(`Toast [${type}]: ${msg}`);
    }
  };

  // Stream simulation effects
  useEffect(() => {
    if (selectedStream) {
      setViewerCount(selectedStream.viewers);
      setLikesCount(selectedStream.likes);
      
      // Initialize some comments
      setStreamComments([
        { id: '1', user: 'Sarah 🌟', text: language === 'ar' ? 'مرحباً بالجميع!' : 'Hello everyone!', time: '12:04' },
        { id: '2', user: 'Dev Ahmed', text: language === 'ar' ? 'بث مميز جداً ومحتوى مفيد' : 'Excellent stream, highly informative content', time: '12:05' }
      ]);

      // Set simulation interval
      streamIntervalRef.current = setInterval(() => {
        // Fluctuating viewers & likes
        setViewerCount(prev => prev + Math.floor(Math.random() * 21) - 10);
        setLikesCount(prev => prev + (Math.random() > 0.6 ? 1 : 0));

        // Random simulated comment
        if (Math.random() > 0.4) {
          const randTemplate = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          setStreamComments(prev => [
            ...prev,
            {
              id: `comment_${Date.now()}`,
              user: randTemplate.user,
              text: language === 'ar' ? randTemplate.msgAr : randTemplate.msgEn,
              time: timeStr
            }
          ].slice(-50)); // limit chat buffer to last 50
        }
      }, 4000);
    }

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [selectedStream, language]);

  // Podcast simulation effects
  useEffect(() => {
    if (selectedPodcast) {
      setPodcastListeners(selectedPodcast.listeners);
      setPodcastComments([
        { id: '1', user: 'Sami', text: language === 'ar' ? 'الموضوع غاية في الأهمية' : 'This topic is extremely vital', time: '14:22' }
      ]);

      podcastIntervalRef.current = setInterval(() => {
        // Fluctuating listeners
        setPodcastListeners(prev => prev + Math.floor(Math.random() * 11) - 5);

        // Simulated listener comment
        if (Math.random() > 0.5) {
          const commentsAr = ['مداخلات رائعة', 'شكراً للدكتورة على الشرح', 'سؤال ذكي جداً', 'اتفق تماماً مع هذا الرأي'];
          const commentsEn = ['Incredible insights', 'Thanks to the hosts!', 'Smart question', 'I completely agree with this view'];
          const users = ['Faisal', 'Amina', 'Yaser', 'Eman'];
          
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          setPodcastComments(prev => [
            ...prev,
            {
              id: `comment_${Date.now()}`,
              user: users[Math.floor(Math.random() * users.length)],
              text: language === 'ar' ? commentsAr[Math.floor(Math.random() * commentsAr.length)] : commentsEn[Math.floor(Math.random() * commentsEn.length)],
              time: timeStr
            }
          ].slice(-50));
        }
      }, 5000);
    }

    return () => {
      if (podcastIntervalRef.current) clearInterval(podcastIntervalRef.current);
    };
  }, [selectedPodcast, language]);

  // Broadcast Timer and simulations for active Go Live session
  useEffect(() => {
    if (isBroadcasting) {
      setStudioViewers(12);
      setStudioLikes(5);
      setBroadcastSeconds(0);
      setStudioStreamComments([
        { id: 'init-1', user: 'System Bot 🤖', text: language === 'ar' ? 'بدأ بثك المباشر الآن بنجاح! شارك الرابط مع أصدقائك.' : 'Your live broadcast started successfully! Share with friends.', time: '00:00' }
      ]);

      // Timer
      broadcastTimerRef.current = setInterval(() => {
        setBroadcastSeconds(prev => prev + 1);
      }, 1000);

      // Simulation of viewers, likes and comments
      studioIntervalRef.current = setInterval(() => {
        setStudioViewers(prev => {
          const increase = Math.floor(Math.random() * 4) + 1; // steady viral gain
          return prev + increase;
        });

        setStudioLikes(prev => prev + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0));

        // Simulated user reaction
        if (Math.random() > 0.6) {
          const templates = [
            { user: 'Nasser Dev', en: 'Great stream setup! Sound quality is pristine.', ar: 'إعدادات بث رائعة! جودة الصوت نقية وممتازة.' },
            { user: 'Waleed 👾', en: 'What frameworks are you going to use?', ar: 'ما هي حزم العمل البرمجية التي ستستخدمها؟' },
            { user: 'Asma Tech', en: 'Congrats on going live! Following!', ar: 'مبارك إطلاق البث! قمت بمتابعتك الآن!' },
          ];
          const chosen = templates[Math.floor(Math.random() * templates.length)];
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          setStudioStreamComments(prev => [
            ...prev,
            {
              id: `st_${Date.now()}`,
              user: chosen.user,
              text: language === 'ar' ? chosen.ar : chosen.en,
              time: timeStr
            }
          ]);
        }
      }, 3500);
    }

    return () => {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
      if (studioIntervalRef.current) clearInterval(studioIntervalRef.current);
    };
  }, [isBroadcasting, language]);

  // Handle stream comment submission
  const handleSendStreamComment = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const userDisplay = currentUser?.displayName || (language === 'ar' ? 'مستخدم مجهول' : 'Anonymous User');

    setStreamComments(prev => [
      ...prev,
      {
        id: `user_com_${Date.now()}`,
        user: `${userDisplay} (You)`,
        text: chatInput.trim(),
        time: timeStr
      }
    ]);
    setChatInput('');
  };

  // Handle podcast comment submission
  const handleSendPodcastComment = () => {
    if (!podcastInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const userDisplay = currentUser?.displayName || (language === 'ar' ? 'مستخدم مجهول' : 'Anonymous User');

    setPodcastComments(prev => [
      ...prev,
      {
        id: `user_pod_com_${Date.now()}`,
        user: `${userDisplay} (You)`,
        text: podcastInput.trim(),
        time: timeStr
      }
    ]);
    setPodcastInput('');
  };

  // Handle Q&A Question submission
  const handleAddQuestion = () => {
    if (!questionInput.trim()) return;
    const userDisplay = currentUser?.displayName || (language === 'ar' ? 'مستمع مجهول' : 'Anonymous Listener');
    const avatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    setPodcastQuestions(prev => [
      ...prev,
      {
        id: `question_${Date.now()}`,
        user: userDisplay,
        avatar,
        question: questionInput.trim(),
        votes: 1,
        isAnswered: false
      }
    ]);
    setQuestionInput('');
    triggerLocalToast(
      language === 'ar' ? 'تم تقديم سؤالك للمضيف بنجاح! 💬' : 'Your question was submitted successfully! 💬',
      'success'
    );
  };

  const handleVoteQuestion = (id: string) => {
    setPodcastQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, votes: q.votes + 1 } : q)
    );
    triggerLocalToast(
      language === 'ar' ? 'تم التصويت للسؤال.' : 'Question upvoted.',
      'info'
    );
  };

  // Broadcast Studio action handlers
  const handleStartBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioTitle.trim()) {
      triggerLocalToast(
        language === 'ar' ? 'يرجى كتابة عنوان للبث المباشر أولاً!' : 'Please enter a stream title first!',
        'error'
      );
      return;
    }
    setIsBroadcasting(true);
    triggerLocalToast(
      language === 'ar' ? 'أنت على الهواء مباشرة الآن! 🔴' : 'You are now LIVE! 🔴',
      'success'
    );
  };

  const handleStopBroadcast = () => {
    setIsBroadcasting(false);
    setStudioTitle('');
    triggerLocalToast(
      language === 'ar' ? 'تم إنهاء البث بنجاح. شكراً لمتابعيك!' : 'Broadcast ended successfully. Thank you!',
      'info'
    );
  };

  const handleSendStudioComment = () => {
    if (!studioInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const userDisplay = currentUser?.displayName || (language === 'ar' ? 'المضيف' : 'Host');

    setStudioStreamComments(prev => [
      ...prev,
      {
        id: `studio_user_${Date.now()}`,
        user: `${userDisplay} ★`,
        text: studioInput.trim(),
        time: timeStr
      }
    ]);
    setStudioInput('');
  };

  const triggerAlertSim = (type: 'sub' | 'superchat') => {
    const alertMsgAr = type === 'sub' 
      ? '🎉 مشترك جديد انضم الآن للبث!' 
      : '💵 دعم مالي خارق (سوبر شات) بقيمة 50 ريال من يوسف!';
    const alertMsgEn = type === 'sub' 
      ? '🎉 New Subscriber has just subscribed live!' 
      : '💵 Super Chat of $20.00 from Joseph!';
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setStudioStreamComments(prev => [
      ...prev,
      {
        id: `alert_${Date.now()}`,
        user: '⚠️ ALERT',
        text: language === 'ar' ? alertMsgAr : alertMsgEn,
        time: timeStr
      }
    ]);

    triggerLocalToast(
      language === 'ar' ? 'تم إرسال تنبيه البث التفاعلي!' : 'Interactive stream alert triggered!',
      'success'
    );
  };

  // Helper formats
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="live-hub-root" className="max-w-7xl mx-auto w-full p-4 md:p-6 text-gray-900 font-sans">
      
      {/* Visual Header Grid & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest font-mono">
              {language === 'ar' ? 'المحتوى الحي والمباشر' : 'Live Interactive Hub'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            {language === 'ar' ? 'بث مباشر وبودكاست تفاعلي 📡' : 'Live Streams & Audio Podcasts 📡'}
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            {language === 'ar' 
              ? 'تفاعل مع البث المباشر المفضل لديك، شارك في البودكاست الصوتي، أو ابدأ بثك الخاص كصانع محتوى محترف.' 
              : 'Interact with active live streams, listen to premium live audio podcasts, or host your own broadcast in real-time.'}
          </p>
        </div>

        {/* Unified App Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-full md:w-auto self-stretch md:self-auto shrink-0 select-none">
          <button
            onClick={() => {
              setActiveTab('streams');
              setSelectedStream(null);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'streams' 
                ? 'bg-white text-red-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'البث المباشر' : 'Live Streams'}</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('podcasts');
              setSelectedPodcast(null);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'podcasts' 
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'البودكاست المباشر' : 'Live Podcasts'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('studio');
              setSelectedStream(null);
              setSelectedPodcast(null);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'studio' 
                ? 'bg-red-600 text-white shadow-md shadow-red-500/10' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'استوديو البث' : 'Go Live Studio'}</span>
          </button>
        </div>
      </div>

      {/* RENDER STREAMS TAB */}
      {activeTab === 'streams' && !selectedStream && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {language === 'ar' ? 'قنوات تبث الآن' : 'Active Live Streams'}
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              {MOCK_LIVE_STREAMS.length} {language === 'ar' ? 'بث نشط' : 'live now'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_LIVE_STREAMS.map((stream) => (
              <div 
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-red-400 cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col active:scale-[0.99]"
              >
                {/* Thumbnail Simulation */}
                <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
                  
                  {/* Backdrop animation depending on type */}
                  {stream.backdropType === 'tech' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black opacity-90 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin flex items-center justify-center" />
                      <span className="text-[10px] font-mono text-indigo-400 mt-2 font-black tracking-wider uppercase">VIRTUAL CODING BOX</span>
                    </div>
                  )}

                  {stream.backdropType === 'gaming' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-zinc-900 to-zinc-950 opacity-90 flex flex-col items-center justify-center">
                      <div className="flex gap-1.5 items-end justify-center h-10 w-24">
                        <div className="w-2.5 bg-red-500 rounded-t-xs animate-pulse" style={{ height: '35%', animationDelay: '0.1s' }} />
                        <div className="w-2.5 bg-red-500 rounded-t-xs animate-pulse" style={{ height: '75%', animationDelay: '0.3s' }} />
                        <div className="w-2.5 bg-red-500 rounded-t-xs animate-pulse" style={{ height: '50%', animationDelay: '0.5s' }} />
                        <div className="w-2.5 bg-red-500 rounded-t-xs animate-pulse" style={{ height: '90%', animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-[10px] font-mono text-red-400 mt-2 font-black tracking-wider uppercase">ULTRA GAMEPLAY ENGINE</span>
                    </div>
                  )}

                  {stream.backdropType === 'lofi' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-zinc-900 to-slate-900 opacity-90 flex flex-col items-center justify-center">
                      <div className="relative w-12 h-12 bg-amber-500/20 rounded-full border border-amber-500/40 flex items-center justify-center animate-bounce">
                        <Headphones className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-mono text-amber-500 mt-2 font-black tracking-wider uppercase">DEEP FOCUS LOFI</span>
                    </div>
                  )}

                  {/* Overlays */}
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1 font-mono uppercase shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span>{language === 'ar' ? 'مباشر' : 'LIVE'}</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                    <Users className="w-3 h-3 text-red-500" />
                    <span>{stream.viewers.toLocaleString()}</span>
                  </div>

                  {/* Play icon display on hover */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <div className="bg-red-600 p-3 rounded-full text-white shadow-lg shadow-red-600/30">
                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-red-600 line-clamp-2 leading-snug">
                      {language === 'ar' ? stream.titleAr : stream.title}
                    </h3>

                    {/* Streamer details */}
                    <div className="flex items-center gap-2 mt-3">
                      <img 
                        src={stream.streamerAvatar} 
                        alt={stream.streamer}
                        className="w-6 h-6 rounded-full object-cover border border-gray-200" 
                      />
                      <span className="text-xs text-gray-700 font-bold">{stream.streamer}</span>
                      <span className="text-gray-300 text-xs">•</span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {language === 'ar' ? stream.categoryAr : stream.category}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(language === 'ar' ? stream.tagsAr : stream.tags).map((tag, i) => (
                      <span key={i} className="text-[9px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SELECTED STREAM STAGE AND LIVE CHAT */}
      {activeTab === 'streams' && selectedStream && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Stream Player & Video Stage */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Visual Stream Stage Player */}
            <div className="relative aspect-video bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col justify-between p-4">
              
              {/* Complex Animation Particles depending on BackdropType */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
                
                {/* Tech/Matrix code-like or neural sparks */}
                {selectedStream.backdropType === 'tech' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="font-mono text-[10px] text-indigo-500 space-y-1 select-none w-full p-6 leading-relaxed">
                      <p className="animate-pulse">{'>> [CLIENT CONNECTED] STABLE_INGEST_TCP_PORT_3000'}</p>
                      <p className="opacity-75">{'>> SYSTEM COMPILER LOADED: SUCCESS'}</p>
                      <p className="opacity-50">{'>> RENDER_STAGE: COMPILING REACT CHASSIS...'}</p>
                    </div>
                    {/* Pulsing glow circle */}
                    <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
                  </div>
                )}

                {/* Lofi slow pulsing aura */}
                {selectedStream.backdropType === 'lofi' && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-zinc-900 to-purple-950/20 flex items-center justify-center">
                    <div className="w-56 h-56 rounded-full bg-amber-500/5 animate-pulse blur-2xl" style={{ animationDuration: '6s' }} />
                    <div className="w-36 h-36 rounded-full bg-purple-500/5 animate-pulse blur-xl" style={{ animationDuration: '4s' }} />
                  </div>
                )}

                {/* Gaming high-contrast frequency meter */}
                {selectedStream.backdropType === 'gaming' && (
                  <div className="absolute inset-0 flex items-end justify-center px-12 pb-6 opacity-30">
                    <div className="flex gap-2 items-end justify-between w-full h-24">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1.5 bg-rose-500 rounded-t-xs animate-bounce" 
                          style={{ 
                            height: `${Math.floor(Math.random() * 80) + 20}%`,
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: `${0.6 + Math.random() * 0.5}s`
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Player Header Overlay */}
              <div className="z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span>{language === 'ar' ? 'مباشر' : 'LIVE'}</span>
                  </span>
                  
                  <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono backdrop-blur-xs">
                    <Users className="w-3 h-3 text-red-500" />
                    <span>{viewerCount.toLocaleString()} {language === 'ar' ? 'مشاهد' : 'viewers'}</span>
                  </span>
                </div>

                <button 
                  onClick={() => setSelectedStream(null)}
                  className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-all cursor-pointer backdrop-blur-xs"
                  title={language === 'ar' ? 'إغلاق البث' : 'Close Broadcast'}
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Big Interactive Play/Pause Simulation Area */}
              <div className="z-20 flex-1 flex items-center justify-center">
                <div className="bg-red-600/10 p-5 rounded-full border border-red-500/20 backdrop-blur-xs animate-pulse">
                  <Tv className="w-12 h-12 text-red-500" />
                </div>
              </div>

              {/* Player Controls Overlay */}
              <div className="z-20 flex items-center justify-between bg-black/40 p-2 rounded-2xl backdrop-blur-xs border border-white/5">
                <div className="flex items-center gap-3">
                  <button className="text-white hover:text-red-500 transition-all cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-gray-300">
                    {language === 'ar' ? 'تأخير البث: 1.2 ثانية' : 'Latency: 1.2s'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    1080p 60fps (STABLE)
                  </span>
                </div>
              </div>

            </div>

            {/* Stream Metadata & Actions */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                    {language === 'ar' ? selectedStream.titleAr : selectedStream.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold">
                      {language === 'ar' ? 'الفئة:' : 'Category:'}
                    </span>
                    <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">
                      {language === 'ar' ? selectedStream.categoryAr : selectedStream.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                  <button 
                    onClick={() => {
                      setLikesCount(prev => prev + 1);
                      triggerLocalToast(language === 'ar' ? 'أعجبك هذا البث!' : 'You liked this broadcast!', 'success');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100/70 text-rose-600 font-bold text-xs rounded-full transition-all active:scale-95 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{likesCount}</span>
                  </button>

                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      triggerLocalToast(language === 'ar' ? 'تم نسخ رابط البث التفاعلي!' : 'Interactive stream link copied!', 'success');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-full transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مشاركة' : 'Share'}</span>
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Streamer details panel */}
              <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedStream.streamerAvatar} 
                    alt={selectedStream.streamer}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{selectedStream.streamer}</h4>
                    <p className="text-[10px] text-gray-500 font-sans">
                      {language === 'ar' ? 'صانع محتوى مباشر معتمد لدى MYtube' : 'Verified MYtube Live Partner'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => triggerLocalToast(language === 'ar' ? 'تم الاشتراك بالقناة وتنبيهات البث!' : 'Subscribed to channel and stream alerts!', 'success')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {language === 'ar' ? 'اشتراك' : 'Subscribe'}
                </button>
              </div>

            </div>

          </div>

          {/* Real-time Interactive Live Chat Side-panel */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg flex flex-col h-[480px] lg:h-auto self-stretch overflow-hidden">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-500 animate-pulse" />
                <h3 className="font-sans font-bold text-sm text-gray-900">
                  {language === 'ar' ? 'المحادثة الفورية للبث' : 'Live Broadcast Chat'}
                </h3>
              </div>
              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-150">
                {language === 'ar' ? 'تفاعل مباشر' : 'Interactive'}
              </span>
            </div>

            {/* Chats buffer */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col-reverse max-h-[350px] lg:max-h-[380px] custom-scrollbar">
              {streamComments.slice().reverse().map((com) => {
                const isAlert = com.user === '⚠️ ALERT';
                return (
                  <div 
                    key={com.id} 
                    className={`text-xs space-y-0.5 animate-fadeIn ${
                      isAlert 
                        ? 'bg-amber-50 p-2.5 rounded-xl border border-amber-200/50' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`font-sans font-extrabold ${
                        isAlert 
                          ? 'text-amber-700' 
                          : com.user.includes('(You)') 
                          ? 'text-indigo-600' 
                          : 'text-red-600'
                      }`}>
                        {com.user}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">{com.time}</span>
                    </div>
                    <p className={`font-sans ${isAlert ? 'text-gray-800 font-medium' : 'text-gray-700'}`}>
                      {com.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Chat Input form */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendStreamComment();
                }}
                placeholder={language === 'ar' ? 'اكتب رسالتك وتفاعل مع البث...' : 'Say something in live chat...'}
                className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-400"
              />
              <button 
                onClick={handleSendStreamComment}
                className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                title={language === 'ar' ? 'إرسال' : 'Send'}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RENDER LIVE PODCASTS TAB */}
      {activeTab === 'podcasts' && !selectedPodcast && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              {language === 'ar' ? 'بودكاست صوتي مباشر الآن' : 'Live Audio Podcasts Now'}
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              {MOCK_LIVE_PODCASTS.length} {language === 'ar' ? 'بث بودكاست' : 'active podcasts'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_LIVE_PODCASTS.map((pod) => (
              <div 
                key={pod.id}
                onClick={() => setSelectedPodcast(pod)}
                className="group bg-white rounded-3xl p-5 border border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                        {language === 'ar' ? 'صوتي مباشر' : 'AUDIO LIVE'}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {language === 'ar' ? pod.topicAr : pod.topic}
                      </span>
                    </div>

                    <h3 className="font-sans font-extrabold text-sm text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {language === 'ar' ? pod.titleAr : pod.title}
                    </h3>
                  </div>

                  {/* Circular Cover art rotating disc representation */}
                  <div className="relative w-16 h-16 shrink-0 bg-indigo-950 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-all">
                    <div className="absolute inset-2 border-2 border-dashed border-indigo-400/30 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
                    <img 
                      src={pod.hostAvatar} 
                      alt={pod.host} 
                      className="w-10 h-10 rounded-full object-cover border border-white/20 z-10" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={pod.hostAvatar} 
                      alt={pod.host} 
                      className="w-5 h-5 rounded-full object-cover border border-gray-200" 
                    />
                    <span className="text-xs text-gray-700 font-bold">{pod.host}</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{pod.listeners.toLocaleString()} {language === 'ar' ? 'مستمع' : 'listening'}</span>
                    </div>

                    <div className="flex -space-x-1.5 rtl:space-x-reverse">
                      {pod.guests.map((g, idx) => (
                        <img 
                          key={idx}
                          src={g.avatar} 
                          alt={g.name} 
                          className="w-5 h-5 rounded-full object-cover border border-white ring-1 ring-gray-200" 
                          title={`${g.name} - ${language === 'ar' ? g.roleAr : g.role}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* SELECTED LIVE PODCAST INTERACTIVE PANEL */}
      {activeTab === 'podcasts' && selectedPodcast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Audio Stage: Rotating Disc & Guest Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Cover Art Board & Sound Waves */}
            <div className="bg-indigo-950 p-6 md:p-8 rounded-3xl border border-indigo-900 flex flex-col md:flex-row items-center justify-around gap-6 relative overflow-hidden shadow-2xl">
              
              {/* Backglow element */}
              <div className="absolute w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl -top-10 -left-10" />

              {/* Main rotating disc with sound frequency elements */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="w-40 h-40 rounded-full bg-zinc-950 border-4 border-indigo-500/30 flex items-center justify-center relative shadow-2xl">
                  {/* Rotating Vinyl dashes */}
                  <div className="absolute inset-1 border border-indigo-400/20 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                  <div className="absolute inset-4 border border-dashed border-indigo-400/40 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
                  
                  {/* Avatar Center */}
                  <img 
                    src={selectedPodcast.hostAvatar} 
                    alt={selectedPodcast.host} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-zinc-900 z-10 animate-pulse" 
                  />
                </div>

                {/* Blinking Live Indicator on top of Cover */}
                <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-black font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-indigo-400">
                  <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                  {language === 'ar' ? 'صوت مباشر' : 'AUDIO'}
                </div>
              </div>

              {/* Podcast detail list + Sound waves */}
              <div className="text-center md:text-left space-y-4 max-w-sm">
                <div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full font-mono border border-indigo-500/30">
                    {language === 'ar' ? selectedPodcast.topicAr : selectedPodcast.topic}
                  </span>
                  <h2 className="text-lg md:text-xl font-extrabold text-white mt-3 leading-snug">
                    {language === 'ar' ? selectedPodcast.titleAr : selectedPodcast.title}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1.5">
                    {language === 'ar' ? 'المضيف:' : 'Host:'} <span className="font-bold text-white">{selectedPodcast.host}</span>
                  </p>
                </div>

                {/* Pure CSS/SVG Audio waves */}
                <div className="flex items-center justify-center md:justify-start gap-1 h-8">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-indigo-400 rounded-full animate-pulse" 
                      style={{ 
                        height: `${Math.floor(Math.random() * 25) + 5}px`, 
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.4 + Math.random() * 0.4}s` 
                      }} 
                    />
                  ))}
                </div>

                {/* Listener Counter */}
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-mono">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">{podcastListeners.toLocaleString()}</span>
                    <span>{language === 'ar' ? 'مستمع نشط' : 'active listeners'}</span>
                  </div>

                  <button 
                    onClick={() => setSelectedPodcast(null)}
                    className="text-xs text-indigo-300 hover:text-white font-bold hover:underline transition-all cursor-pointer"
                  >
                    [{language === 'ar' ? 'مغادرة الغرفة' : 'Leave Room'}]
                  </button>
                </div>
              </div>

            </div>

            {/* Speaker & Guest Panel (Grid of co-hosts) */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ar' ? 'منصة المتحدثين الحالية' : 'Speaker & Panel Grid'}</span>
                </h3>

                {/* User speaker request action */}
                {userGuestRole === 'listener' && (
                  <button 
                    onClick={() => {
                      setUserGuestRole('requesting');
                      triggerLocalToast(
                        language === 'ar' ? 'تم تقديم طلب التحدث بنجاح! يرجى انتظار موافقة المضيف.' : 'Speak request submitted! Waiting for host approval.',
                        'success'
                      );
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    {language === 'ar' ? 'طلب التحدث 🙋‍♂️' : 'Request to Speak 🙋‍♂️'}
                  </button>
                )}

                {userGuestRole === 'requesting' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md border border-amber-200 animate-pulse">
                      {language === 'ar' ? 'بانتظار المضيف...' : 'Requested...'}
                    </span>
                    <button 
                      onClick={() => {
                        setUserGuestRole('guest');
                        triggerLocalToast(
                          language === 'ar' ? 'أنت الآن متحدث على المنصة! 🎙️' : 'You are now a speaker! 🎙️',
                          'success'
                        );
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-2 py-1 rounded-md cursor-pointer"
                    >
                      {language === 'ar' ? 'محاكاة موافقة' : 'Simulate Approve'}
                    </button>
                  </div>
                )}

                {userGuestRole === 'guest' && (
                  <button 
                    onClick={() => {
                      setUserGuestRole('listener');
                      triggerLocalToast(
                        language === 'ar' ? 'عدت مستمعاً الآن.' : 'Returned to listener mode.',
                        'info'
                      );
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                  >
                    {language === 'ar' ? 'مغادرة المنصة' : 'Mute & Go to Listeners'}
                  </button>
                )}
              </div>

              {/* Panelists layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                {/* Host */}
                <div className="bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-2xl flex flex-col items-center text-center space-y-2 relative">
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                    {language === 'ar' ? 'المضيف' : 'Host'}
                  </div>
                  <img src={selectedPodcast.hostAvatar} alt={selectedPodcast.host} className="w-12 h-12 rounded-full object-cover border border-indigo-200 ring-2 ring-indigo-500/20" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{selectedPodcast.host}</h4>
                    <p className="text-[9px] text-indigo-600 font-bold font-sans">Organizer</p>
                  </div>
                </div>

                {/* Guests */}
                {selectedPodcast.guests.map((guest, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex flex-col items-center text-center space-y-2 relative">
                    <div className="absolute top-2 right-2 bg-gray-200 text-gray-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      {language === 'ar' ? 'متحدث' : 'Speaker'}
                    </div>
                    <img src={guest.avatar} alt={guest.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{guest.name}</h4>
                      <p className="text-[9px] text-gray-500 truncate max-w-[100px]">{language === 'ar' ? guest.roleAr : guest.role}</p>
                    </div>
                    {/* Mute icon */}
                    <div className="absolute bottom-2 right-2 p-1 bg-white/80 rounded-full border border-gray-150">
                      {guest.isMuted ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-emerald-500 animate-pulse" />}
                    </div>
                  </div>
                ))}

                {/* User if Speaker */}
                {userGuestRole === 'guest' && (
                  <div className="bg-indigo-50 border-2 border-indigo-400 p-3 rounded-2xl flex flex-col items-center text-center space-y-2 relative animate-fadeIn">
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      {language === 'ar' ? 'أنت' : 'You'}
                    </div>
                    <img 
                      src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt="You" 
                      className="w-12 h-12 rounded-full object-cover border border-indigo-300" 
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{currentUser?.displayName || 'Host Guest'}</h4>
                      <p className="text-[9px] text-indigo-600 font-bold">Interactive Guest</p>
                    </div>

                    {/* Interactive User Mute status button */}
                    <button 
                      onClick={() => {
                        setIsMuted(!isMuted);
                        triggerLocalToast(
                          isMuted ? (language === 'ar' ? 'تم تفعيل الميكروفون' : 'Mic active') : (language === 'ar' ? 'تم كتم الصوت' : 'Mic muted'),
                          'info'
                        );
                      }}
                      className="absolute bottom-2 right-2 p-1 bg-white rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer active:scale-95"
                    >
                      {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />}
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Side Panels: Live chat & Listener Questions (Q&A) */}
          <div className="space-y-6">
            
            {/* Real-time Listeners Q&A / Q&A Box */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <h3 className="font-sans font-black text-sm text-gray-900">
                    {language === 'ar' ? 'أسئلة المستمعين (Q&A)' : 'Listener Questions'}
                  </h3>
                </div>
                <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-full">
                  {podcastQuestions.length} {language === 'ar' ? 'سؤال' : 'total'}
                </span>
              </div>

              {/* Submit Question Box */}
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddQuestion();
                  }}
                  placeholder={language === 'ar' ? 'اطرح سؤالاً على المتحدثين...' : 'Ask co-hosts a question...'}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400"
                />
                <button 
                  onClick={handleAddQuestion}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  title={language === 'ar' ? 'تقديم السؤال' : 'Submit'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Questions Feed list */}
              <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                {podcastQuestions
                  .slice()
                  .sort((a, b) => b.votes - a.votes)
                  .map((q) => (
                    <div 
                      key={q.id} 
                      className={`p-3 border rounded-2xl text-xs space-y-2 transition-all ${
                        q.isAnswered 
                          ? 'bg-emerald-50/40 border-emerald-100/60' 
                          : 'bg-gray-50 border-gray-150 hover:bg-gray-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img src={q.avatar} alt={q.user} className="w-5 h-5 rounded-full object-cover border border-gray-200" />
                          <span className="font-bold text-gray-800">{q.user}</span>
                        </div>
                        {q.isAnswered ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                            {language === 'ar' ? 'تمت الإجابة' : 'Answered Live'}
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleVoteQuestion(q.id)}
                            className="flex items-center gap-1 text-[9px] font-mono font-bold bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md cursor-pointer active:scale-95"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{q.votes}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 font-sans leading-relaxed">{q.question}</p>
                    </div>
                  ))}
              </div>

            </div>

            {/* Live Chat Panel */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg flex flex-col h-[280px] overflow-hidden">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <span className="font-sans font-bold text-xs text-gray-900">
                  {language === 'ar' ? 'محادثة الغرفة الصوتية' : 'Podcast Chatroom'}
                </span>
              </div>

              {/* Chat list */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 flex flex-col-reverse custom-scrollbar text-xs">
                {podcastComments.slice().reverse().map((com) => (
                  <div key={com.id} className="space-y-0.5 animate-fadeIn">
                    <span className="font-bold text-indigo-600 mr-1.5">{com.user}</span>
                    <span className="text-[10px] text-gray-400 font-mono mr-1">{com.time}</span>
                    <p className="text-gray-700">{com.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-200 bg-gray-50/50 flex gap-1.5">
                <input 
                  type="text"
                  value={podcastInput}
                  onChange={(e) => setPodcastInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendPodcastComment();
                  }}
                  placeholder={language === 'ar' ? 'أرسل تفاعلاً...' : 'React to chat...'}
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                />
                <button 
                  onClick={handleSendPodcastComment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* RENDER GO LIVE STUDIO */}
      {activeTab === 'studio' && (
        <div className="animate-fadeIn">
          {!isBroadcasting ? (
            
            /* Studio Setup Page */
            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xl">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                  <Video className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="font-sans font-black text-xl text-gray-950">
                  {language === 'ar' ? 'تجهيز وإعداد البث المباشر' : 'Broadcast Studio Setup'}
                </h2>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {language === 'ar' 
                    ? 'قم بتأكيد إعدادات البث، واكتب العنوان المناسب لجذب المشاهدين قبل البدء.' 
                    : 'Configure your broadcast, title, and backdrop preset before broadcasting.'}
                </p>
              </div>

              <form onSubmit={handleStartBroadcast} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 font-sans block">
                    {language === 'ar' ? 'عنوان البث المباشر *' : 'Live Stream Title *'}
                  </label>
                  <input 
                    type="text"
                    value={studioTitle}
                    onChange={(e) => setStudioTitle(e.target.value)}
                    required
                    placeholder={language === 'ar' ? 'مثال: شرح بناء تطبيقات ويب تفاعلية خطوة بخطوة' : 'e.g. Live Q&A and coding session'}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-red-500 font-sans font-medium"
                  />
                </div>

                {/* Grid Category & Backdrop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      {language === 'ar' ? 'فئة البث' : 'Stream Category'}
                    </label>
                    <select
                      value={studioCategory}
                      onChange={(e) => setStudioCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-red-500 font-sans font-semibold text-gray-800"
                    >
                      <option value="Software Engineering">{language === 'ar' ? 'هندسة برمجيات' : 'Software Engineering'}</option>
                      <option value="Gaming">{language === 'ar' ? 'ألعاب' : 'Gaming'}</option>
                      <option value="Lofi Music">{language === 'ar' ? 'موسيقى هادئة' : 'Lofi Music'}</option>
                      <option value="EduTech">{language === 'ar' ? 'تعليم تقني' : 'EduTech'}</option>
                    </select>
                  </div>

                  {/* Backdrop Aesthetic Preset */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      {language === 'ar' ? 'تأثير الخلفية البصرية' : 'Backdrop Preset Visual'}
                    </label>
                    <select
                      value={studioBackdrop}
                      onChange={(e) => setStudioBackdrop(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-red-500 font-sans font-semibold text-gray-800"
                    >
                      <option value="tech">{language === 'ar' ? 'تأثير مصفوفة الويب البرمجية' : 'Tech Ingest Matrix'}</option>
                      <option value="gaming">{language === 'ar' ? 'ألعاب حركية ومؤشرات' : 'Gaming Active HUD'}</option>
                      <option value="lofi">{language === 'ar' ? 'لوفاي مريح وهادي' : 'Lofi Cozy Room'}</option>
                      <option value="cyber">{language === 'ar' ? 'ألوان نيون سيبربانك' : 'Cyber Neon Horizon'}</option>
                    </select>
                  </div>

                </div>

                {/* Device settings preview */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-700">
                      {language === 'ar' ? 'الحالة والمنافذ الافتراضية' : 'Default Devices status'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setStudioCameraActive(!studioCameraActive)}
                      className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                        studioCameraActive 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                      title="Toggle Camera"
                    >
                      {studioCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    </button>

                    <button 
                      type="button"
                      onClick={() => setStudioMicActive(!studioMicActive)}
                      className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                        studioMicActive 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                      title="Toggle Mic"
                    >
                      {studioMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Action button */}
                <button 
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-red-600/10 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'البدء والبث المباشر الآن! 🔴' : 'Go LIVE Now! 🔴'}</span>
                </button>

              </form>
            </div>
          ) : (
            
            /* Broadcaster Stage (You are LIVE!) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Broadcaster Monitor Area */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Simulated Camera Feed / Broadcast Monitor */}
                <div className="relative aspect-video bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col justify-between p-5">
                  
                  {/* Visual stage effects based on studioBackdrop */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    
                    {/* Simulated Camera preview with grid layout */}
                    {studioCameraActive ? (
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-zinc-900 to-indigo-950 opacity-90 flex flex-col items-center justify-center">
                        {/* Audio Wave Sound Bars on Screen */}
                        <div className="absolute bottom-16 left-6 right-6 flex items-end justify-between h-12 opacity-40">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="w-1 bg-red-500 rounded-t-xs animate-bounce" 
                              style={{ 
                                height: `${Math.floor(Math.random() * 90) + 10}%`,
                                animationDelay: `${i * 0.04}s`,
                                animationDuration: '0.5s'
                              }} 
                            />
                          ))}
                        </div>
                        
                        <div className="relative p-6 border-2 border-dashed border-red-500/20 rounded-full animate-pulse">
                          <Video className="w-16 h-16 text-red-500" />
                        </div>
                        <span className="text-[10px] font-mono text-gray-300 mt-2 font-bold select-none uppercase tracking-widest">
                          {language === 'ar' ? 'معاينة البث المباشر للكاميرا' : 'LIVE Broadcaster feed preview'}
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-center">
                        <VideoOff className="w-12 h-12 text-zinc-600 mb-2 animate-pulse" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                          {language === 'ar' ? 'تغذية الكاميرا متوقفة' : 'Camera Feed Muted'}
                        </span>
                      </div>
                    )}

                    {/* Camera grid overlay */}
                    <div className="absolute inset-0 border border-white/5 grid grid-cols-3 grid-rows-3 opacity-20">
                      <div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" />
                      <div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" />
                      <div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" />
                    </div>
                  </div>

                  {/* Header Overlay */}
                  <div className="z-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md font-mono animate-pulse">
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        {language === 'ar' ? 'مباشر الآن' : 'ON AIR'}
                      </span>

                      <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono backdrop-blur-xs">
                        {formatTime(broadcastSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 font-mono backdrop-blur-xs">
                        <Users className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        <span>{studioViewers.toLocaleString()}</span>
                      </span>

                      <button 
                        onClick={handleStopBroadcast}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-md shadow-red-600/10"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>{language === 'ar' ? 'إنهاء البث' : 'End Stream'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom HUD elements */}
                  <div className="z-20 flex items-center justify-between bg-black/50 p-3 rounded-2xl border border-white/5 backdrop-blur-xs">
                    <div className="flex items-center gap-4 text-xs text-gray-300 font-mono">
                      <div className="flex items-center gap-1 text-red-400">
                        <Heart className="w-4 h-4 fill-current" />
                        <span>{studioLikes}</span>
                      </div>
                      <div className="hidden md:block">
                        {language === 'ar' ? 'جودة الخرج: 1080p' : 'Output resolution: 1080p'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button 
                        onClick={() => setStudioCameraActive(!studioCameraActive)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          studioCameraActive ? 'bg-red-50 border-red-200 text-red-600' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                        title="Toggle Camera Preview"
                      >
                        {studioCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      </button>

                      <button 
                        onClick={() => setStudioMicActive(!studioMicActive)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          studioMicActive ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                        title="Toggle Mic Audio"
                      >
                        {studioMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Streamer studio helper tools */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-4">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-gray-950">
                      {language === 'ar' ? 'لوحة أدوات تفاعل البث الفورية ⚡' : 'Interactive Broadcast Engagement Center ⚡'}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {language === 'ar' 
                        ? 'انقر لمحاكاة تفاعلات وتنبيهات بصرية على بثك ليرى المشاهدين رسومات الرنين والدعم!' 
                        : 'Trigger mock alerts inside your live studio to test alerts and engage with virtual audiences.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <button 
                      onClick={() => triggerAlertSim('sub')}
                      className="p-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'ar' ? 'تنبيه مشترك جديد 🎉' : 'Simulate Subscriber Alert'}</span>
                    </button>

                    <button 
                      onClick={() => triggerAlertSim('superchat')}
                      className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Star className="w-4 h-4" />
                      <span>{language === 'ar' ? 'تنبيه سوبر شات 💵' : 'Simulate Super Chat Alert'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Real-time Studio Live Chat Monitor */}
              <div className="bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-xl flex flex-col h-[420px] lg:h-auto self-stretch overflow-hidden">
                
                {/* Chat header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-sans font-black text-xs text-gray-100">
                      {language === 'ar' ? 'مراقب محادثة البث' : 'Studio Chat Monitor'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-red-400 font-extrabold uppercase border border-red-500/30 px-1.5 py-0.5 rounded">
                    {language === 'ar' ? 'المشرف' : 'Moderator'}
                  </span>
                </div>

                {/* Ingest box messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col-reverse custom-scrollbar text-xs">
                  {studioStreamComments.slice().reverse().map((com) => {
                    const isSystem = com.user === 'System Bot 🤖';
                    const isAlert = com.user === '⚠️ ALERT';
                    return (
                      <div 
                        key={com.id} 
                        className={`space-y-0.5 animate-fadeIn p-2 rounded-xl border ${
                          isAlert 
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-200' 
                            : isSystem 
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' 
                            : 'bg-zinc-900/60 border-zinc-800/30 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-mono font-black ${
                            isAlert 
                              ? 'text-amber-400' 
                              : isSystem 
                              ? 'text-indigo-400' 
                              : 'text-zinc-200'
                          }`}>
                            {com.user}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">{com.time}</span>
                        </div>
                        <p className="font-sans text-gray-200 mt-1">{com.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Input Ingest panel */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 flex gap-2">
                  <input 
                    type="text"
                    value={studioInput}
                    onChange={(e) => setStudioInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendStudioComment();
                    }}
                    placeholder={language === 'ar' ? 'تفاعل كصاحب البث...' : 'Reply as host...'}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-white"
                  />
                  <button 
                    onClick={handleSendStudioComment}
                    className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
