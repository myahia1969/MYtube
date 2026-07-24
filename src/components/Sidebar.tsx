import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Tv, Heart, Upload, Database, Users, HelpCircle, History, Clock, 
  BarChart3, Keyboard, Zap, Download, Library, Trash2, Radio, MessageSquare, 
  X, Search, Compass, ChevronRight, Bookmark, Sparkles, Layers, Sliders
} from 'lucide-react';
import { Channel, VideoBookmark } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  subscribedChannels: Channel[];
  onChannelFilter: (channelId: string | null, shouldSetView?: boolean) => void;
  activeChannelFilter: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  language?: 'en' | 'ar';
  onHelpShortcutsClick?: () => void;
  bookmarks?: VideoBookmark[];
  onBookmarkClick?: (bookmark: VideoBookmark) => void;
  onDeleteBookmark?: (bookmarkId: string) => void;
}

export default function Sidebar({
  currentView,
  setView,
  subscribedChannels,
  onChannelFilter,
  activeChannelFilter,
  collapsed,
  mobileOpen,
  onCloseMobile,
  language = 'en',
  onHelpShortcutsClick,
  bookmarks = [],
  onBookmarkClick,
  onDeleteBookmark,
}: SidebarProps) {
  const isArabic = language === 'ar';
  const [filterQuery, setFilterQuery] = useState('');

  // Press ESC to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Helper button styling for menu items inside dropdown
  const getItemClass = (isActive: boolean) => {
    return `w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
      isActive
        ? 'bg-red-50 text-red-600 font-bold shadow-xs'
        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
    }`;
  };

  const matchesFilter = (textEn: string, textAr: string) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return textEn.toLowerCase().includes(q) || textAr.toLowerCase().includes(q);
  };

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* 1. Backdrop Mask Overlay */}
          <motion.div 
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />

          {/* 2. Floating Navigation Dropdown Menu Panel with Slide-in Transition */}
          <motion.div 
            key="sidebar-panel"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-[60px] start-3 sm:start-6 z-50 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100vh-75px)] flex flex-col select-none"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
        {/* Dropdown Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100/80 rounded-2xl text-red-600">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                <span>{isArabic ? 'قائمة التنقل المنسدلة' : 'Navigation Menu'}</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-mono">
                  {isArabic ? 'مساحة كاملة' : 'Full Screen'}
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {isArabic ? 'تصفح الأقسام والمكتبة بسهولة' : 'Quickly access feeds & playlists'}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors cursor-pointer"
            title={isArabic ? 'إغلاق القائمة' : 'Close Menu'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute start-3 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={isArabic ? 'ابحث في عناصر القائمة...' : 'Filter menu options...'}
              className="w-full bg-gray-100 hover:bg-gray-150 focus:bg-white text-xs text-gray-800 ps-8 pe-8 py-2 rounded-xl outline-none border border-transparent focus:border-red-500/30 transition-all placeholder:text-gray-400"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute end-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-none">
          
          {/* Main Navigation Section */}
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-1.5">
              {isArabic ? 'الرئيسية والمحتوى' : 'Main Content'}
            </h3>

            {matchesFilter('Home Feed', 'الرئيسية') && (
              <button
                onClick={() => {
                  setView('home');
                  onChannelFilter(null);
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'home' && !activeChannelFilter)}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{isArabic ? 'الرئيسية' : 'Home Feed'}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">feed</span>
              </button>
            )}

            {matchesFilter('Shorts Videos', 'فيديوهات قصيرة شورتس') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('shorts');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'shorts')}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isArabic ? 'فيديوهات قصيرة (Shorts)' : 'Shorts Videos'}</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                  {isArabic ? 'سريع' : 'short'}
                </span>
              </button>
            )}

            {matchesFilter('Live & Podcasts', 'البث المباشر والبودكاست') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('live');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'live')}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                  <span>{isArabic ? 'البث المباشر والبودكاست' : 'Live & Podcasts'}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              </button>
            )}

            {matchesFilter('Subscribers Chat', 'محادثات المشتركين') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('chat');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'chat')}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{isArabic ? 'محادثات المشتركين' : 'Subscribers Chat'}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">chat</span>
              </button>
            )}
          </div>

          {/* Library Section */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-1.5">
              {isArabic ? 'المكتبة والتفضيلات' : 'Library & Saved'}
            </h3>

            {matchesFilter('My Uploads', 'مرفوعاتي الفيديوهات الخاصة') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('uploads');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'uploads')}
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{isArabic ? 'فيديوهاتي المرفوعة' : 'My Uploads'}</span>
                </div>
              </button>
            )}

            {matchesFilter('Liked Videos', 'الفيديوهات المعجب بها') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('liked');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'liked')}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-pink-500 shrink-0" />
                  <span>{isArabic ? 'الفيديوهات المعجب بها' : 'Liked Videos'}</span>
                </div>
              </button>
            )}

            {matchesFilter('Watch History', 'سجل المشاهدة') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('history');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'history')}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{isArabic ? 'سجل المشاهدة' : 'Watch History'}</span>
                </div>
              </button>
            )}

            {matchesFilter('Watch Later', 'المشاهدة لاحقا') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('watch-later');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'watch-later')}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{isArabic ? 'المشاهدة لاحقًا' : 'Watch Later'}</span>
                </div>
              </button>
            )}

            {matchesFilter('Downloads Saved', 'التنزيلات والحفظ') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('downloads');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'downloads')}
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isArabic ? 'التنزيلات والحفظ' : 'Saved Offline'}</span>
                </div>
              </button>
            )}

            {matchesFilter('Custom Playlists', 'قوائم التشغيل') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('playlists');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'playlists')}
              >
                <div className="flex items-center gap-2.5">
                  <Library className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{isArabic ? 'قوائم التشغيل المخصصة' : 'Custom Playlists'}</span>
                </div>
              </button>
            )}
          </div>

          {/* Analytics & Dev Section */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-1.5">
              {isArabic ? 'الأدوات والمطور' : 'Tools & Developer'}
            </h3>

            {matchesFilter('Insights Analytics', 'لوحة الإحصائيات') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('analytics');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'analytics')}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>{isArabic ? 'لوحة الإحصائيات (AI Analytics)' : 'AI Analytics'}</span>
                </div>
              </button>
            )}

            {matchesFilter('Developer Supabase Console', 'مطور سوبابيز Console') && (
              <button
                onClick={() => {
                  onChannelFilter(null, false);
                  setView('dev-console');
                  onCloseMobile();
                }}
                className={getItemClass(currentView === 'dev-console')}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isArabic ? 'مطور Supabase' : 'Supabase Developer'}</span>
                </div>
              </button>
            )}
          </div>

          {/* Subscriptions Section */}
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                {isArabic ? 'الاشتراكات' : 'Subscriptions'}
              </h3>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono font-bold">
                {subscribedChannels.length}
              </span>
            </div>

            <div className="space-y-0.5 max-h-40 overflow-y-auto pe-1 scrollbar-none">
              {subscribedChannels.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 py-1.5 italic">
                  {isArabic ? 'لا توجد اشتراكات بعد.' : 'No subscriptions yet.'}
                </p>
              ) : (
                subscribedChannels
                  .filter(c => matchesFilter(c.name, c.name))
                  .map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        onChannelFilter(channel.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        activeChannelFilter === channel.id
                          ? 'bg-gray-100 text-black font-bold border-s-2 border-red-600'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={channel.avatarUrl}
                          alt={channel.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-gray-200"
                        />
                        <span className="truncate">{channel.name}</span>
                      </div>
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0"></span>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Bookmarks Section */}
          {bookmarks.length > 0 && (
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center justify-between px-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-indigo-500" />
                  <span>{isArabic ? 'العلامات المرجعية' : 'Bookmarks'}</span>
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold">
                  {bookmarks.length}
                </span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pe-1 scrollbar-none">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-indigo-50/50 transition-all cursor-pointer"
                  >
                    <div
                      onClick={() => {
                        if (onBookmarkClick) onBookmarkClick(bookmark);
                        onCloseMobile();
                      }}
                      className="flex-1 min-w-0 flex items-center gap-2"
                    >
                      <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md shrink-0">
                        {bookmark.timestampLabel}
                      </span>
                      <span className="truncate text-gray-700 font-sans group-hover:text-red-600">
                        {bookmark.videoTitle}
                      </span>
                    </div>

                    {onDeleteBookmark && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBookmark(bookmark.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-md transition-all cursor-pointer"
                        title={isArabic ? 'حذف العلامة' : 'Delete bookmark'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Dropdown Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/90 flex items-center justify-between gap-2">
          {onHelpShortcutsClick && (
            <button
              onClick={() => {
                onHelpShortcutsClick();
                onCloseMobile();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer border border-indigo-100"
            >
              <Keyboard className="w-3.5 h-3.5 shrink-0" />
              <span>{isArabic ? 'مفاتيح الاختصار' : 'Shortcuts'}</span>
            </button>
          )}

          <div className="text-[10px] font-mono text-gray-400 font-semibold px-2">
            MYTUBE 1.1
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
);
}
