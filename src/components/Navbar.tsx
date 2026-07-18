import React, { useState, useEffect } from 'react';
import { Search, Upload, Bell, Menu, Sparkles, User, Database, Settings, Mic, Keyboard, Wifi, WifiOff } from 'lucide-react';
import { User as UserType } from '../types';
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
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

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
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#0f0f0f] cursor-pointer"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
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

            {/* Notifications mock */}
            <button 
              id="btn-notifications"
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-[#0f0f0f] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Avatar Dropdown Menu */}
            <div className="relative">
              <button
                id="btn-profile-dropdown"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
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
    </header>
  );
}
