import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Bell, Menu, Sparkles, User, Database, Settings, Mic, Keyboard, Wifi, WifiOff, History, Trash2, CheckCircle2, Info, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { User as UserType, Video } from '../types';
import VirtualKeyboard from './VirtualKeyboard';

interface NavbarProps {
  currentUser: UserType | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onUploadClick: () => void;
  onLogoClick: () => void;
  onDevConsoleClick: () => void;
  currentView: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  language?: 'en' | 'ar';
  onWebSearchClick?: (query: string) => void;
  
  // Custom Alert History props
  alertHistory?: { id: string; message: string; type: 'success' | 'info' | 'error'; timestamp: number; isRead: boolean }[];
  onClearAlertHistory?: () => void;
  onMarkAlertsAsRead?: (id?: string) => void;
  onRemoveAlert?: (id: string) => void;
  onTriggerToast?: (message: string, type: 'success' | 'info' | 'error') => void;

  // New video select and view navigation
  onVideoSelect?: (video: Video) => void;
  setView?: (view: string) => void;
}

export default function Navbar({
  currentUser,
  searchQuery,
  setSearchQuery,
  onUploadClick,
  onLogoClick,
  onDevConsoleClick,
  currentView,
  onLoginClick,
  onLogoutClick,
  onMenuClick,
  onSettingsClick,
  onEditProfileClick,
  language = 'en',
  onWebSearchClick,
  alertHistory = [],
  onClearAlertHistory,
  onMarkAlertsAsRead,
  onRemoveAlert,
  onTriggerToast,
  onVideoSelect,
  setView,
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const isMounted = useRef(false);
  const onTriggerToastRef = useRef(onTriggerToast);
  const languageRef = useRef(language);

  // Keep refs in sync with the latest values synchronously during render
  onTriggerToastRef.current = onTriggerToast;
  languageRef.current = language;

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const currentLang = languageRef.current;
    if (isOnline) {
      onTriggerToastRef.current?.(
        currentLang === 'ar' ? 'تمت استعادة الاتصال بالإنترنت بنجاح! 📶' : 'Internet connection restored successfully! 📶',
        'success'
      );
    } else {
      onTriggerToastRef.current?.(
        currentLang === 'ar' ? 'انقطع الاتصال بالإنترنت. يرجى التحقق من الشبكة. ⚠️' : 'Internet connection lost. Please check your network. ⚠️',
        'error'
      );
    }
  }, [isOnline]);

  // Interactive Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlertHistory, setShowAlertHistory] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('mytube_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: '1',
        titleEn: 'Sara Al-Harbi uploaded a new video',
        titleAr: 'قامت سارة الحربي برفع فيديو جديد',
        descEn: 'Cloud Engineering: From Beginner to Pro 🚀',
        descAr: 'هندسة الحوسبة السحابية: من البداية للاحتراف 🚀',
        timeEn: '2 hours ago',
        timeAr: 'قبل ساعتين',
        isRead: false,
        type: 'upload',
      },
      {
        id: '2',
        titleEn: 'Omar Farooq liked your story',
        titleAr: 'قام عمر فاروق بالإعجاب بقصتك',
        descEn: 'Replied to your story with Fire reaction 🔥',
        descAr: 'رد على قصتك بردة الفعل النارية 🔥',
        timeEn: '5 hours ago',
        timeAr: 'قبل 5 ساعات',
        isRead: false,
        type: 'like',
      },
      {
        id: '3',
        titleEn: 'Milestone Achieved! 🎉',
        titleAr: 'تم تحقيق إنجاز جديد! 🎉',
        descEn: 'Your channel just reached 1,000 active subscribers!',
        descAr: 'وصلت قناتك للتو إلى 1,000 مشترك نشط!',
        timeEn: '1 day ago',
        timeAr: 'قبل يوم واحد',
        isRead: true,
        type: 'milestone',
      },
      {
        id: '4',
        titleEn: 'MYtube Premium active',
        titleAr: 'اشتراك MYtube المميز نشط',
        descEn: 'Enjoy ad-free streaming, visual story filters, and offline storage.',
        descAr: 'استمتع بالبث الخالي من الإعلانات، مرشحات القصص البصرية، ومساحة التخزين غير المتصلة.',
        timeEn: '3 days ago',
        timeAr: 'قبل 3 أيام',
        isRead: true,
        type: 'system',
      }
    ];
  });

  const [selectedNotifDetails, setSelectedNotifDetails] = useState<any | null>(null);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<any | null>(null);

  const playVideoContent = (title: string) => {
    if (!onVideoSelect) return;
    const targetVideo: Video = {
      id: 'vid-sara-cloud',
      title: title || 'Cloud Engineering: From Beginner to Pro 🚀',
      description: 'Learn everything about Cloud Computing, AWS, GCP, and Azure. Built for developers of all levels!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-38290-large.mp4',
      duration: '10:15',
      views: 1240,
      likes: 85,
      dislikes: 2,
      channelId: 'chan-sara-alharbi',
      channelName: 'Sara Al-Harbi',
      channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      category: 'Tech',
      uploadedAt: '2 hours ago',
      likeStatus: 'none'
    };
    onVideoSelect(targetVideo);
  };

  const playCommentedVideo = () => {
    if (!onVideoSelect) return;
    const targetVideo: Video = {
      id: 'vid-comment-tutorial',
      title: 'Advanced React 19 Patterns & Hooks 💻',
      description: 'Master the latest React 19 hooks and paradigms including Server Components, Actions, and use() hook!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-38290-large.mp4',
      duration: '14:20',
      views: 3105,
      likes: 245,
      dislikes: 5,
      channelId: 'chan-omar-farooq',
      channelName: 'Omar Farooq',
      channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      category: 'Coding',
      uploadedAt: '1 day ago',
      likeStatus: 'none'
    };
    onVideoSelect(targetVideo);
  };

  const handleOpenNotificationContent = (notif: any) => {
    handleMarkAsRead(notif.id);
    setSelectedNotifDetails(notif);
    setShowNotifications(false);

    // Associated content action depending on notification type
    if (notif.type === 'upload') {
      const title = language === 'ar' ? notif.descAr : notif.descEn;
      playVideoContent(title.replace(/[🚀📹]/g, '').trim());
      onTriggerToast?.(
        language === 'ar' ? 'جاري تشغيل الفيديو المرفوع 📹' : 'Playing uploaded video 📹',
        'success'
      );
    } else if (notif.type === 'comment') {
      playCommentedVideo();
      onTriggerToast?.(
        language === 'ar' ? 'عرض تعليقات الفيديو 💬' : 'Viewing video comment 💬',
        'info'
      );
    } else if (notif.type === 'story' || notif.type === 'trend') {
      setView?.('shorts');
      onTriggerToast?.(
        language === 'ar' ? 'الانتقال إلى القصص والفيديوهات القصيرة ⚡' : 'Navigating to Stories & Shorts ⚡',
        'success'
      );
    } else if (notif.type === 'subscribe') {
      setView?.('chat');
      onTriggerToast?.(
        language === 'ar' ? 'الانتقال إلى محادثات المشتركين 💬' : 'Navigating to Subscribers Chat 💬',
        'success'
      );
    } else if (notif.type === 'milestone') {
      setView?.('analytics');
      onTriggerToast?.(
        language === 'ar' ? 'الانتقال إلى لوحة معلومات القناة 📈' : 'Navigating to Channel Analytics 📈',
        'info'
      );
    } else if (notif.type === 'system') {
      onSettingsClick?.();
      onTriggerToast?.(
        language === 'ar' ? 'تم فتح إعدادات المنصة ⚙️' : 'Opened Platform Settings ⚙️',
        'success'
      );
    }
  };

  const handleOpenAlertContent = (item: any) => {
    onMarkAlertsAsRead?.(item.id);
    setSelectedAlertDetails(item);
    setShowAlertHistory(false);

    const msg = item.message.toLowerCase();
    
    // Check if message is related to downloads/folders
    if (
      msg.includes('download') || 
      msg.includes('تحميل') || 
      msg.includes('تنزيل') || 
      msg.includes('storage') || 
      msg.includes('folder') || 
      msg.includes('مجلد') || 
      msg.includes('clean') || 
      msg.includes('compress') || 
      msg.includes('حفظ')
    ) {
      setView?.('downloads');
      onTriggerToast?.(
        language === 'ar' ? 'الانتقال إلى صفحة التنزيلات والمجلدات 📁' : 'Navigating to Downloads & Folders 📁',
        'info'
      );
    } else if (msg.includes('playlist') || msg.includes('قائمة')) {
      setView?.('playlists');
      onTriggerToast?.(
        language === 'ar' ? 'الانتقال إلى قوائم التشغيل المخصصة 📚' : 'Navigating to Custom Playlists 📚',
        'info'
      );
    } else if (msg.includes('channel') || msg.includes('قناة') || msg.includes('subscribe') || msg.includes('اشتراك')) {
      setView?.('chat');
      onTriggerToast?.(
        language === 'ar' ? 'الانتقال إلى محادثة القناة 💬' : 'Navigating to Channel Chat 💬',
        'info'
      );
    } else if (msg.includes('profile') || msg.includes('تغيير') || msg.includes('تعديل') || msg.includes('saved') || msg.includes('حفظ') || msg.includes('success')) {
      onSettingsClick?.();
      onTriggerToast?.(
        language === 'ar' ? 'عرض إعدادات الحساب والملف الشخصي ⚙️' : 'Opening Settings & Profile Panel ⚙️',
        'success'
      );
    }
  };

  useEffect(() => {
    localStorage.setItem('mytube_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev: any) =>
      prev.map((n: any) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev: any) => prev.map((n: any) => ({ ...n, isRead: true })));
  };

  const handleClearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev: any) => prev.filter((n: any) => n.id !== id));
  };

  const handleSimulateNotification = () => {
    const randomTemplates = [
      {
        titleEn: 'New Subscriber Joined 🌟',
        titleAr: 'مشترك جديد انضم إليك 🌟',
        descEn: 'Yousef Ahmed subscribed to your channel.',
        descAr: 'اشترك يوسف أحمد في قناتك للتو.',
        type: 'subscribe',
      },
      {
        titleEn: 'Video Comment Added 💬',
        titleAr: 'تعليق جديد على الفيديو 💬',
        descEn: 'Layan Al-Shehri: "This is the best tutorial ever!"',
        descAr: 'ليان الشهري: "هذا أفضل شرح على الإطلاق!"',
        type: 'comment',
      },
      {
        titleEn: 'Trending Alert 📈',
        titleAr: 'تنبيه الشائع 📈',
        descEn: 'Your uploaded story is gaining popularity fast!',
        descAr: 'قصتك المرفوعة تكتسب شعبية كبيرة وبسرعة!',
        type: 'trend',
      },
      {
        titleEn: 'New Story Published ⚡',
        titleAr: 'قصة جديدة تم نشرها ⚡',
        descEn: 'Ali Hassan added a new story with Vivid filter.',
        descAr: 'أضاف علي حسن قصة جديدة مع فلتر مشروب Vivid.',
        type: 'story',
      },
    ];

    const template = randomTemplates[Math.floor(Math.random() * randomTemplates.length)];
    const newNotif = {
      id: String(Date.now()),
      titleEn: template.titleEn,
      titleAr: template.titleAr,
      descEn: template.descEn,
      descAr: template.descAr,
      timeEn: 'Just now',
      timeAr: 'الآن',
      isRead: false,
      type: template.type,
    };
    setNotifications((prev: any) => [newNotif, ...prev]);
  };

  const formatAlertTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) {
      return language === 'ar' ? 'الآن' : 'Just now';
    }
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
      return language === 'ar' ? `قبل ${mins} دقيقة` : `${mins}m ago`;
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return language === 'ar' ? `قبل ${hours} ساعة` : `${hours}h ago`;
    }
    return new Date(timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'ar' ? 'البحث الصوتي غير مدعوم في متصفحك.' : 'Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert(language === 'ar'
          ? 'تم رفض إذن الميكروفون أو تم حظره بواسطة المتصفح داخل الإطار (iframe).\n\n💡 الحل: يرجى الضغط على زر "فتح التطبيق في علامة تبويب جديدة" (مربع مع سهم للأعلى) في الشريط العلوي لتشغيل البحث الصوتي بكل حرية!'
          : 'Microphone permission denied or blocked inside the frame (iframe).\n\n💡 Tip: Please click the "Open in new tab" button in the top bar to run Voice Search with full microphone permissions!');
      } else {
        alert(language === 'ar'
          ? `عذرًا، حدث خطأ أثناء التعرف على الصوت: ${event.error}`
          : `Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      if (onWebSearchClick) {
        onWebSearchClick(transcript);
      }
    };

    recognition.start();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200 text-[#0f0f0f]">
      {/* Left side: Logo & Menu Toggle */}
      <div className="flex items-center gap-4">
        <button 
          id="sidebar-toggle"
          onClick={onMenuClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200/80 text-gray-700 hover:text-black rounded-2xl transition-all cursor-pointer font-medium text-xs border border-gray-200/80 active:scale-95 shadow-xs"
          title={language === 'ar' ? 'فتح قائمة التنقل المنسدلة' : 'Toggle Dropdown Navigation'}
        >
          <Menu className="w-4 h-4 text-red-600 shrink-0" />
          <span className="hidden sm:inline font-bold">
            {language === 'ar' ? 'القائمة' : 'Menu'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>

        <div 
          onClick={onLogoClick}
          className="flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform"
        >
          {/* Custom Visual TV/YouTube SVG Logo */}
          <div className="bg-red-600 p-1.5 rounded-xl flex items-center justify-center shadow-md shadow-red-600/10">
            <svg 
              className="w-5 h-5 text-white fill-current" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span className="font-sans font-bold tracking-tighter text-xl text-[#0f0f0f]">
            MYtube
            <span className="text-[10px] text-red-600 ml-1 bg-red-50 px-1.5 py-0.5 rounded font-mono border border-red-200">
              PREMIUM
            </span>
          </span>
        </div>
      </div>

      {/* Middle: Search bar with instant filters, voice search, and virtual keyboard */}
      <div className="flex-1 max-w-xl mx-4 relative hidden sm:block">
        <div className="relative flex items-center w-full">
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onWebSearchClick?.(searchQuery);
              }
            }}
            placeholder={language === 'ar' ? "ابحث عن صناع المحتوى، الفئات، الفيديوهات..." : "Search creators, categories, videos..."}
            className={`w-full bg-gray-50 border border-gray-300 focus:border-red-600 text-gray-900 py-2 rounded-full text-sm outline-none transition-all placeholder-gray-400 shadow-inner ${
              language === 'ar' ? 'pr-4 pl-28' : 'pl-4 pr-28'
            }`}
          />
          <div className={`absolute flex items-center gap-2.5 ${language === 'ar' ? 'left-3' : 'right-3'}`}>
            {/* Keyboard Button */}
            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`p-1.5 hover:bg-gray-150 rounded-full transition-all cursor-pointer ${
                showKeyboard ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-[#0f0f0f]'
              }`}
              title={language === 'ar' ? 'لوحة المفاتيح الافتراضية' : 'Virtual Keyboard'}
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Voice Search Mic Button */}
            <button
              onClick={handleVoiceSearch}
              className={`p-1.5 hover:bg-gray-150 rounded-full transition-all cursor-pointer ${
                isListening 
                  ? 'text-white bg-red-600 animate-pulse' 
                  : 'text-gray-400 hover:text-[#0f0f0f]'
              }`}
              title={language === 'ar' ? 'البحث بالصوت' : 'Voice Search'}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  onWebSearchClick?.(searchQuery);
                }
              }}
              className="p-1.5 hover:bg-gray-150 rounded-full text-red-600 hover:text-red-700 transition-colors cursor-pointer shrink-0"
              title={language === 'ar' ? 'البحث في الإنترنت' : 'Search Live Web'}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Virtual Keyboard Drawer */}
        {showKeyboard && (
          <div className="absolute top-full left-0 right-0 mt-2.5 z-50">
            <VirtualKeyboard
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              language={language}
              onClose={() => setShowKeyboard(false)}
            />
          </div>
        )}
      </div>

      {/* Right side: Actions, notifications, and profiles */}
      <div className="flex items-center gap-3">
        {/* Network Status Badge */}
        {!isOnline ? (
          <div 
            id="network-status-offline"
            className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-200 shadow-sm shrink-0"
            title={language === 'ar' ? 'غير متصل بالشبكة' : 'Offline Mode'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <WifiOff className="w-3 h-3 text-red-500" />
            <span>{language === 'ar' ? 'أوفلاين' : 'Offline'}</span>
          </div>
        ) : (
          <div 
            id="network-status-online"
            className="hidden md:flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-150 shrink-0"
            title={language === 'ar' ? 'متصل بالشبكة' : 'Online'}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>{language === 'ar' ? 'متصل' : 'Online'}</span>
          </div>
        )}

        {/* Developer Blueprint Link */}
        <button
          id="btn-dev-console"
          onClick={onDevConsoleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            currentView === 'dev-console'
              ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:text-black'
          }`}
          title="Supabase Schema & Project Setup"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Dev Schema</span>
        </button>

        {/* Full Control Settings Gear Button */}
        <button
          id="btn-settings-toggle"
          onClick={onSettingsClick}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-black transition-colors cursor-pointer"
          title="Full Control Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {currentUser ? (
          <>
            {/* Create / Upload Video */}
            <button
              id="btn-upload-video"
              onClick={onUploadClick}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-850 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Upload</span>
            </button>

            {/* Notifications Button with Dropdown */}
            <div className="relative">
              <button 
                id="btn-notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowAlertHistory(false); // close other menus
                  setShowProfileMenu(false);
                }}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors relative cursor-pointer ${
                  showNotifications ? 'bg-gray-100 text-[#0f0f0f]' : 'text-gray-500 hover:text-[#0f0f0f]'
                }`}
                title={language === 'ar' ? 'الإشعارات' : 'Notifications'}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 text-white rounded-full border border-white text-[9px] font-bold flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  className={`absolute mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 overflow-hidden ${
                    language === 'ar' ? 'left-[-40px] sm:left-[-100px]' : 'right-[-40px] sm:right-[-100px]'
                  }`}
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                >
                  {/* Notification Header */}
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-black text-sm text-gray-900">
                        {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} {language === 'ar' ? 'جديد' : 'new'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-red-650 hover:text-red-800 font-bold hover:underline transition-all cursor-pointer"
                        >
                          {language === 'ar' ? 'قراءة الكل' : 'Mark all as read'}
                        </button>
                      )}
                      <button
                        onClick={handleSimulateNotification}
                        className="text-[10px] text-indigo-650 hover:text-indigo-800 font-bold hover:underline transition-all cursor-pointer flex items-center gap-0.5"
                        title={language === 'ar' ? 'محاكاة إشعار جديد' : 'Simulate a notification'}
                      >
                        ⚡ {language === 'ar' ? 'محاكاة' : 'Simulate'}
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Bell className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                        <span className="text-xs font-semibold">
                          {language === 'ar' ? 'لا توجد إشعارات جديدة' : 'No notifications yet'}
                        </span>
                        <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed">
                          {language === 'ar' ? 'عندما يحدث نشاط جديد، سيظهر هنا!' : 'When new activity happens, it will show up here!'}
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            handleOpenNotificationContent(notif);
                          }}
                          className={`p-3 hover:bg-gray-50 transition-colors flex gap-3 relative cursor-pointer group ${
                            !notif.isRead ? 'bg-red-50/10' : ''
                          }`}
                        >
                          {/* Unread indicator dot */}
                          {!notif.isRead && (
                            <span className="absolute top-4 left-2.5 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                          )}

                          {/* Icon/Emoji */}
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200/50 text-base shadow-xs">
                            {notif.type === 'upload' ? '📹' :
                             notif.type === 'like' ? '🔥' :
                             notif.type === 'milestone' ? '🎉' :
                             notif.type === 'system' ? '💻' :
                             notif.type === 'subscribe' ? '🌟' :
                             notif.type === 'comment' ? '💬' :
                             notif.type === 'trend' ? '📈' :
                             notif.type === 'story' ? '⚡' : '🔔'}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-black text-gray-800 line-clamp-1">
                              {language === 'ar' ? notif.titleAr : notif.titleEn}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {language === 'ar' ? notif.descAr : notif.descEn}
                            </p>
                            <span className="text-[9px] text-gray-400 mt-1 block font-mono">
                              {language === 'ar' ? notif.timeAr : notif.timeEn}
                            </span>
                          </div>

                          {/* Action Hover Button */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleClearNotification(notif.id, e)}
                              className="p-1 hover:bg-gray-200 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title={language === 'ar' ? 'حذف' : 'Remove'}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Alert History Button with Dropdown */}
            <div className="relative">
              <button 
                id="btn-alert-history"
                onClick={() => {
                  setShowAlertHistory(!showAlertHistory);
                  setShowNotifications(false); // close other menus
                  setShowProfileMenu(false);
                }}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors relative cursor-pointer ${
                  showAlertHistory ? 'bg-gray-100 text-[#0f0f0f]' : 'text-gray-500 hover:text-[#0f0f0f]'
                }`}
                title={language === 'ar' ? 'سجل التنبيهات والتوست' : 'Alert & Toast History'}
              >
                <History className="w-4.5 h-4.5" />
                {alertHistory.filter(item => !item.isRead).length > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 bg-orange-500 text-white rounded-full border border-white text-[9px] font-bold flex items-center justify-center px-1">
                    {alertHistory.filter(item => !item.isRead).length}
                  </span>
                )}
              </button>

              {showAlertHistory && (
                <div 
                  className={`absolute mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 overflow-hidden ${
                    language === 'ar' ? 'left-[-40px] sm:left-[-150px]' : 'right-[-40px] sm:right-[-150px]'
                  }`}
                  style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                >
                  {/* Header */}
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-black text-sm text-gray-900">
                        {language === 'ar' ? 'سجل التنبيهات' : 'Alert History'}
                      </span>
                      {alertHistory.filter(item => !item.isRead).length > 0 && (
                        <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {alertHistory.filter(item => !item.isRead).length} {language === 'ar' ? 'جديد' : 'new'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {alertHistory.length > 0 && (
                        <>
                          <button
                            onClick={onMarkAlertsAsRead}
                            className="text-[10px] text-orange-650 hover:text-orange-850 font-bold hover:underline transition-all cursor-pointer"
                          >
                            {language === 'ar' ? 'قرأت الكل' : 'Mark all read'}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={onClearAlertHistory}
                            className="text-[10px] text-red-650 hover:text-red-800 font-bold hover:underline transition-all cursor-pointer"
                          >
                            {language === 'ar' ? 'مسح السجل' : 'Clear all'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                    {alertHistory.length === 0 ? (
                      <div className="py-8 px-4 text-center flex flex-col items-center justify-center text-gray-400 gap-2">
                        <History className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                        <span className="text-xs font-semibold">
                          {language === 'ar' ? 'السجل فارغ' : 'Your history is empty'}
                        </span>
                        <p className="text-[10px] text-gray-400 max-w-[220px] leading-relaxed">
                          {language === 'ar' ? 'عند حدوث إشعارات توست أو تنبيهات نظام، ستظهر هنا بالتفصيل.' : 'Whenever a toast pop-up or notification appears, you will find it recorded here.'}
                        </p>
                      </div>
                    ) : (
                      alertHistory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleOpenAlertContent(item);
                          }}
                          className={`p-3 hover:bg-gray-50/80 transition-colors flex gap-3 relative cursor-pointer group ${
                            !item.isRead ? 'bg-orange-50/10 border-l-2 border-orange-400' : ''
                          }`}
                        >
                          {/* Alert Icon depending on type */}
                          <div className="shrink-0 mt-0.5">
                            {item.type === 'success' && (
                              <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                            )}
                            {item.type === 'info' && (
                              <Info className="w-4.5 h-4.5 text-blue-500" />
                            )}
                            {item.type === 'error' && (
                              <AlertCircle className="w-4.5 h-4.5 text-red-500" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs text-gray-850 font-bold leading-relaxed break-words select-all">
                              {item.message}
                            </p>
                            <span className="text-[9px] text-gray-400 mt-1 block font-mono">
                              {formatAlertTime(item.timestamp)}
                            </span>
                          </div>

                          {/* Action Delete Button */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveAlert?.(item.id);
                              }}
                              className="p-1 hover:bg-gray-200 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title={language === 'ar' ? 'حذف من السجل' : 'Remove from history'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Demonstration simulation footer */}
                  <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 text-center">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide block mb-1.5">
                      {language === 'ar' ? '⚡ تجربة تنبيهات النظام:' : '⚡ Simulate toast alerts for testing:'}
                    </span>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onTriggerToast?.(language === 'ar' ? 'تم حفظ التغييرات بنجاح! 🎉' : 'Changes saved successfully! 🎉', 'success')}
                        className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-[9px] font-black cursor-pointer transition-colors"
                      >
                        {language === 'ar' ? 'نجاح' : 'Success'}
                      </button>
                      <button
                        onClick={() => onTriggerToast?.(language === 'ar' ? 'تنبيه: سعة التخزين ممتازة وجاهزة.' : 'Notice: Offline storage is fully optimized.', 'info')}
                        className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-[9px] font-black cursor-pointer transition-colors"
                      >
                        {language === 'ar' ? 'معلومة' : 'Info'}
                      </button>
                      <button
                        onClick={() => onTriggerToast?.(language === 'ar' ? 'فشل الاتصال: يرجى التحقق من الشبكة!' : 'Connection error: Please check your configuration!', 'error')}
                        className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-[9px] font-black cursor-pointer transition-colors"
                      >
                        {language === 'ar' ? 'خطأ' : 'Error'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Dropdown Menu */}
            <div className="relative">
              <button
                id="btn-profile-dropdown"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                  setShowAlertHistory(false);
                }}
                className="flex items-center justify-center p-0.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                title={currentUser.displayName}
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-sans font-medium text-sm text-gray-900 truncate">{currentUser.displayName}</p>
                    <p className="font-mono text-xs text-gray-400 truncate">{currentUser.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      onDevConsoleClick();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors flex items-center gap-2"
                  >
                    <Database className="w-4 h-4 text-red-500" />
                    Supabase Blueprint
                  </button>

                  <button
                    onClick={() => {
                      onEditProfileClick?.();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <User className="w-4 h-4 text-indigo-500" />
                    {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile / Avatar'}
                  </button>

                  <button
                    onClick={() => {
                      onLogoutClick();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700 transition-colors flex items-center gap-2 border-t border-gray-100 mt-1"
                  >
                    <User className="w-4 h-4" />
                    Logout / Disconnect Auth
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-900 px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-300 transition-all duration-200"
          >
            <User className="w-3.5 h-3.5 text-red-500" />
            Sign In / Register
          </button>
        )}
      </div>

      {/* 3. Notification Detail Modal */}
      {selectedNotifDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-150 animate-in fade-in zoom-in-95 duration-200"
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl shrink-0 border border-red-150">
                    {selectedNotifDetails.type === 'upload' ? '📹' :
                     selectedNotifDetails.type === 'like' ? '🔥' :
                     selectedNotifDetails.type === 'milestone' ? '🎉' :
                     selectedNotifDetails.type === 'system' ? '💻' :
                     selectedNotifDetails.type === 'subscribe' ? '🌟' :
                     selectedNotifDetails.type === 'comment' ? '💬' :
                     selectedNotifDetails.type === 'trend' ? '📈' :
                     selectedNotifDetails.type === 'story' ? '⚡' : '🔔'}
                  </div>
                  <div>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {selectedNotifDetails.type}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {language === 'ar' ? selectedNotifDetails.timeAr : selectedNotifDetails.timeEn}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotifDetails(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="font-sans font-black text-lg text-gray-950 leading-snug">
                  {language === 'ar' ? selectedNotifDetails.titleAr : selectedNotifDetails.titleEn}
                </h3>
                <p className="text-sm text-gray-650 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium">
                  {language === 'ar' ? selectedNotifDetails.descAr : selectedNotifDetails.descEn}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex flex-wrap gap-2 justify-end">
                {/* Custom Context Actions */}
                {(selectedNotifDetails.type === 'upload' || selectedNotifDetails.type === 'comment') && (
                  <button
                    onClick={() => {
                      if (selectedNotifDetails.type === 'upload') {
                        const title = language === 'ar' ? selectedNotifDetails.descAr : selectedNotifDetails.descEn;
                        playVideoContent(title.replace(/[🚀📹]/g, '').trim());
                      } else {
                        playCommentedVideo();
                      }
                      setSelectedNotifDetails(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 cursor-pointer text-center"
                  >
                    {selectedNotifDetails.type === 'upload'
                      ? (language === 'ar' ? 'تشغيل الفيديو 📹' : 'Play Video 📹')
                      : (language === 'ar' ? 'مشاهدة التعليق 💬' : 'View Comment 💬')}
                  </button>
                )}

                {(selectedNotifDetails.type === 'story' || selectedNotifDetails.type === 'trend') && (
                  <button
                    onClick={() => {
                      setView?.('shorts');
                      setSelectedNotifDetails(null);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 cursor-pointer text-center"
                  >
                    {language === 'ar' ? 'عرض القصص والقصيرة ⚡' : 'Go to Stories & Shorts ⚡'}
                  </button>
                )}

                {selectedNotifDetails.type === 'subscribe' && (
                  <button
                    onClick={() => {
                      setView?.('chat');
                      setSelectedNotifDetails(null);
                    }}
                    className="px-4 py-2 bg-rose-550 hover:bg-rose-650 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 cursor-pointer text-center"
                  >
                    {language === 'ar' ? 'الانتقال للدردشة 💬' : 'Go to Subscribers Chat 💬'}
                  </button>
                )}

                {selectedNotifDetails.type === 'milestone' && (
                  <button
                    onClick={() => {
                      setView?.('analytics');
                      setSelectedNotifDetails(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 cursor-pointer text-center"
                  >
                    {language === 'ar' ? 'لوحة معلومات القناة 📈' : 'Go to Analytics 📈'}
                  </button>
                )}

                {selectedNotifDetails.type === 'system' && (
                  <button
                    onClick={() => {
                      onSettingsClick?.();
                      setSelectedNotifDetails(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 cursor-pointer text-center"
                  >
                    {language === 'ar' ? 'فتح الإعدادات ⚙️' : 'Open Settings ⚙️'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedNotifDetails(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Alert/Toast Detail Modal */}
      {selectedAlertDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-150 animate-in fade-in zoom-in-95 duration-200"
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border ${
                    selectedAlertDetails.type === 'success' ? 'bg-green-50 border-green-150 text-green-600' :
                    selectedAlertDetails.type === 'error' ? 'bg-red-50 border-red-150 text-red-600' :
                    'bg-blue-50 border-blue-150 text-blue-600'
                  }`}>
                    {selectedAlertDetails.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {selectedAlertDetails.type === 'info' && <Info className="w-5 h-5" />}
                    {selectedAlertDetails.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      selectedAlertDetails.type === 'success' ? 'bg-green-100 text-green-800' :
                      selectedAlertDetails.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedAlertDetails.type === 'success' ? (language === 'ar' ? 'نجاح' : 'Success') :
                       selectedAlertDetails.type === 'error' ? (language === 'ar' ? 'خطأ' : 'Error') :
                       (language === 'ar' ? 'تنبيه' : 'Alert Info')}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {formatAlertTime(selectedAlertDetails.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlertDetails(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="font-sans font-black text-base text-gray-900 leading-snug">
                  {language === 'ar' ? 'تفاصيل التنبيه / تفاصيل النظام' : 'Alert / System Log Details'}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium break-words whitespace-pre-line select-all">
                  {selectedAlertDetails.message}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex gap-2 justify-end">
                {(() => {
                  const msg = selectedAlertDetails.message.toLowerCase();
                  const isDownload = msg.includes('download') || msg.includes('تحميل') || msg.includes('تنزيل') || msg.includes('storage') || msg.includes('folder') || msg.includes('مجلد') || msg.includes('clean') || msg.includes('compress') || msg.includes('حفظ');
                  const isPlaylist = msg.includes('playlist') || msg.includes('قائمة');
                  const isChat = msg.includes('channel') || msg.includes('قناة') || msg.includes('subscribe') || msg.includes('اشتراك');
                  const isProfile = msg.includes('profile') || msg.includes('تغيير') || msg.includes('تعديل') || msg.includes('saved') || msg.includes('حفظ') || msg.includes('success');

                  if (isDownload) {
                    return (
                      <button
                        onClick={() => {
                          setView?.('downloads');
                          setSelectedAlertDetails(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                      >
                        {language === 'ar' ? 'عرض التنزيلات 📁' : 'View Downloads 📁'}
                      </button>
                    );
                  }
                  if (isPlaylist) {
                    return (
                      <button
                        onClick={() => {
                          setView?.('playlists');
                          setSelectedAlertDetails(null);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                      >
                        {language === 'ar' ? 'عرض القوائم 📚' : 'View Playlists 📚'}
                      </button>
                    );
                  }
                  if (isChat) {
                    return (
                      <button
                        onClick={() => {
                          setView?.('chat');
                          setSelectedAlertDetails(null);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                      >
                        {language === 'ar' ? 'الدردشة 💬' : 'Go to Chat 💬'}
                      </button>
                    );
                  }
                  if (isProfile) {
                    return (
                      <button
                        onClick={() => {
                          onSettingsClick?.();
                          setSelectedAlertDetails(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                      >
                        {language === 'ar' ? 'الملف الشخصي ⚙️' : 'View Profile ⚙️'}
                      </button>
                    );
                  }
                  return null;
                })()}

                <button
                  onClick={() => {
                    onRemoveAlert?.(selectedAlertDetails.id);
                    setSelectedAlertDetails(null);
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                >
                  {language === 'ar' ? 'حذف من السجل' : 'Delete Log'}
                </button>

                <button
                  onClick={() => setSelectedAlertDetails(null)}
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
