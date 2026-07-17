import React from 'react';
import { Home, Tv, Heart, Upload, Database, Users, HelpCircle, History, Clock, BarChart3, Keyboard, Zap } from 'lucide-react';
import { Channel } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  subscribedChannels: Channel[];
  onChannelFilter: (channelId: string | null) => void;
  activeChannelFilter: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  language?: 'en' | 'ar';
  onHelpShortcutsClick?: () => void;
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
}: SidebarProps) {
  
  // Custom button layout and text styling based on collapse state
  const buttonClass = (isActive: boolean) => {
    if (collapsed) {
      return `w-full flex flex-col items-center justify-center py-3 rounded-xl transition-all text-center gap-1.5 cursor-pointer ${
        isActive
          ? 'bg-red-50 text-red-600 font-bold'
          : 'hover:bg-gray-100 text-gray-500 hover:text-black'
      }`;
    }
    return `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
      isActive
        ? 'bg-gray-100 text-[#0f0f0f] font-semibold'
        : 'hover:bg-gray-50 hover:text-[#0f0f0f] text-gray-500'
    }`;
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col justify-between ${collapsed ? 'p-2' : 'p-4'}`}>
      <div className="space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-mono">
              Navigation
            </h3>
          )}
          
          <button
            id="nav-home"
            onClick={() => {
              setView('home');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'home' && !activeChannelFilter)}
            title="Home Feed"
          >
            <Home className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-red-600 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? 'Home' : 'Home Feed'}
            </span>
          </button>

          <button
            id="nav-shorts"
            onClick={() => {
              setView('shorts');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'shorts')}
            title={language === 'ar' ? 'فيديوهات قصيرة' : 'Shorts Videos'}
          >
            <Zap className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-amber-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? (language === 'ar' ? 'شورتس' : 'Shorts') : (language === 'ar' ? 'فيديوهات قصيرة' : 'Shorts Videos')}
            </span>
          </button>

          <button
            id="nav-uploads"
            onClick={() => {
              setView('uploads');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'uploads')}
            title="My Uploads"
          >
            <Upload className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-blue-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? 'Uploads' : 'My Uploads'}
            </span>
          </button>

          <button
            id="nav-liked"
            onClick={() => {
              setView('liked');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'liked')}
            title="Liked Videos"
          >
            <Heart className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-pink-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? 'Liked' : 'Liked Videos'}
            </span>
          </button>

          <button
            id="nav-history"
            onClick={() => {
              setView('history');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'history')}
            title="Watch History"
          >
            <History className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-orange-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? 'History' : 'Watch History'}
            </span>
          </button>

          <button
            id="nav-watch-later"
            onClick={() => {
              setView('watch-later');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'watch-later')}
            title="Watch Later List"
          >
            <Clock className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-indigo-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? 'Later' : 'Watch Later'}
            </span>
          </button>

          <button
            id="nav-analytics"
            onClick={() => {
              setView('analytics');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'analytics')}
            title="Insights & Analytics"
          >
            <BarChart3 className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-violet-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? (language === 'ar' ? 'تحليل' : 'Insights') : (language === 'ar' ? 'لوحة الإحصائيات' : 'AI Analytics')}
            </span>
          </button>

          <button
            id="nav-dev"
            onClick={() => {
              setView('dev-console');
              onChannelFilter(null);
              onCloseMobile();
            }}
            className={buttonClass(currentView === 'dev-console')}
            title="Supabase Schema & Project Setup"
          >
            <Database className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} text-emerald-500 shrink-0`} />
            <span className={collapsed ? 'text-[9px] scale-95 leading-tight font-medium' : 'truncate'}>
              {collapsed ? 'Dev' : 'Supabase Developer'}
            </span>
          </button>
        </div>

        {/* Dynamic Subscriptions List - Hidden or Compact when Collapsed */}
        <div className="space-y-2">
          {!collapsed ? (
            <div className="flex items-center justify-between px-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                Subscriptions
              </h3>
              <span className="text-[10px] bg-gray-150 text-gray-600 px-1.5 py-0.5 rounded font-mono border border-gray-200">
                {subscribedChannels.length}
              </span>
            </div>
          ) : (
            <div className="border-t border-gray-100 my-2 pt-2 text-center">
              <span className="text-[9px] font-mono text-gray-400 font-bold">SUBS</span>
            </div>
          )}

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1 scrollbar-none">
            {subscribedChannels.length === 0 ? (
              !collapsed && (
                <p className="text-xs text-gray-400 px-3 py-2 italic font-sans">
                  No subscriptions yet. Subscribe to channels in the watch feed!
                </p>
              )
            ) : (
              subscribedChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setView('home');
                    onChannelFilter(channel.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex ${
                    collapsed ? 'flex-col items-center justify-center p-2' : 'items-center gap-3 px-3 py-2'
                  } rounded-xl text-xs font-medium transition-all truncate cursor-pointer ${
                    activeChannelFilter === channel.id
                      ? 'bg-gray-100 text-[#0f0f0f] font-semibold border-l-2 border-red-600'
                      : 'hover:bg-gray-50 hover:text-[#0f0f0f] text-gray-500'
                  }`}
                  title={channel.name}
                >
                  <img
                    src={channel.avatarUrl}
                    alt={channel.name}
                    className={`rounded-full object-cover border border-gray-200 shrink-0 ${
                      collapsed ? 'w-7 h-7' : 'w-5 h-5'
                    }`}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{channel.name}</span>
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    </>
                  )}
                  {collapsed && (
                    <span className="text-[8px] truncate max-w-full text-center mt-1 scale-90 text-gray-500 font-sans leading-none">
                      {channel.name.split(' ')[0]}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer system details */}
      <div className="pt-4 border-t border-gray-150 space-y-2">
        {onHelpShortcutsClick && (
          <button
            onClick={onHelpShortcutsClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/75 hover:bg-indigo-100/80 border border-indigo-100/80 transition-all cursor-pointer active:scale-95 ${
              collapsed ? 'justify-center p-2' : 'justify-start'
            }`}
            title={language === 'ar' ? 'مفاتيح الاختصار للمشغل' : 'Player Keyboard Shortcuts'}
          >
            <Keyboard className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="truncate">{language === 'ar' ? 'مفاتيح الاختصار' : 'Keyboard Shortcuts'}</span>
            )}
          </button>
        )}

        {collapsed ? (
          <div className="text-center font-mono text-[9px] text-gray-400 font-semibold">
            MYT
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <Tv className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
              MYTUBE CLONE v1.1
            </p>
            <p className="text-[10px] text-gray-400 font-sans mt-1 leading-normal">
              Fully customized play settings, progress memory, and watch history removal.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile view sliding drawer overlay backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* 2. Responsive Aside Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 text-gray-700 select-none transition-all duration-300 z-40 
          ${collapsed ? 'w-20' : 'w-64'} 
          ${mobileOpen 
            ? 'fixed inset-y-0 left-0 top-[57px] flex h-[calc(100vh-57px)] w-64 shadow-2xl animate-slide-in' 
            : 'hidden md:flex h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto shrink-0 flex-col'
          }
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
