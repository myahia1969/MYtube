import React, { useState, useEffect } from 'react';
import { 
  INITIAL_VIDEOS, INITIAL_COMMENTS, INITIAL_CHANNELS, CURRENT_USER 
} from './data';
import { Video, Comment, Channel, User, Category } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import WatchPage from './components/WatchPage';
import UploadModal from './components/UploadModal';
import DevConsole from './components/DevConsole';
import SettingsModal, { AppSettings } from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ShortcutsHelpModal from './components/ShortcutsHelpModal';
import ChannelProfileView from './components/ChannelProfileView';
import ShortsView from './components/ShortsView';
import { Sparkles, Terminal, LogIn, LogOut, ArrowUp, Zap, HelpCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

function formatTotalDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 secs';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts = [];
  if (h > 0) {
    parts.push(`${h} hr${h > 1 ? 's' : ''}`);
  }
  if (m > 0) {
    parts.push(`${m} min${m > 1 ? 's' : ''}`);
  }
  if (s > 0 || parts.length === 0) {
    parts.push(`${s} sec${s > 1 ? 's' : ''}`);
  }
  return parts.join(' ');
}

export default function App() {
  // Load initial states from localStorage if they exist, otherwise use initial seed datasets
  const [videos, setVideos] = useState<Video[]>(() => {
    const saved = localStorage.getItem('metatube_videos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Video[];
        const parsedIds = new Set(parsed.map(v => v.id));
        const missing = INITIAL_VIDEOS.filter(v => !parsedIds.has(v.id));
        return [...parsed, ...missing];
      } catch (e) {
        return INITIAL_VIDEOS;
      }
    }
    return INITIAL_VIDEOS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('metatube_comments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Comment[];
        const parsedIds = new Set(parsed.map(c => c.id));
        const missing = INITIAL_COMMENTS.filter(c => !parsedIds.has(c.id));
        return [...parsed, ...missing];
      } catch (e) {
        return INITIAL_COMMENTS;
      }
    }
    return INITIAL_COMMENTS;
  });

  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('metatube_channels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Channel[];
        const parsedIds = new Set(parsed.map(c => c.id));
        const missing = INITIAL_CHANNELS.filter(c => !parsedIds.has(c.id));
        return [...parsed, ...missing];
      } catch (e) {
        return INITIAL_CHANNELS;
      }
    }
    return INITIAL_CHANNELS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('metatube_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.loggedOut) return null;
        if (parsed.user) return parsed.user;
      } catch (e) {
        // fallback
      }
    }
    return CURRENT_USER;
  });

  const [history, setHistory] = useState<{ videoId: string; watchedAt: string; progress?: number }[]>(() => {
    const saved = localStorage.getItem('metatube_history');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'string') {
            return { videoId: item, watchedAt: new Date().toLocaleString() };
          }
          return item;
        });
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  const [watchLater, setWatchLater] = useState<string[]>(() => {
    const saved = localStorage.getItem('metatube_watch_later');
    return saved ? JSON.parse(saved) : [];
  });

  const [historySort, setHistorySort] = useState<'recent' | 'oldest' | 'progress'>('recent');

  // Navigation states
  const [currentView, setView] = useState<string>('home'); // 'home' | 'watch' | 'uploads' | 'liked' | 'dev-console' | 'history'
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelFilter, setActiveChannelFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  // Web search integration states
  const [webSearchVideos, setWebSearchVideos] = useState<Video[]>([]);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [webSearchError, setWebSearchError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'local' | 'web'>('local');

  // Automatically revert to local and clear search when query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMode('local');
      setWebSearchVideos([]);
      setWebSearchError(null);
    }
  }, [searchQuery]);

  const handleWebSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setSearchQuery(q);
    setSearchMode('web');
    setIsWebSearching(true);
    setWebSearchError(null);

    // Switch to home view to display search results
    if (currentView !== 'home') {
      setView('home');
    }
    // Reset secondary filters to ensure the search results are not hidden by active channels or categories
    setActiveChannelFilter(null);
    setSelectedCategory('All');

    try {
      const response = await fetch('/api/ai/search-internet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q,
          language: settings.language,
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to fetch live web search results.';
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
        throw new Error('Invalid response from search server.');
      }

      if (data.videos && Array.isArray(data.videos)) {
        setWebSearchVideos(data.videos);

        // Inject them into the main videos state so they can be played back, analyzed, and added to history
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newVideos = data.videos.filter((v: any) => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
      }
    } catch (err: any) {
      console.error(err);
      setWebSearchError(err.message || 'An error occurred during real-time web search.');
      triggerToast(
        settings.language === 'ar' ? 'عذرًا، فشل البحث في الإنترنت الحقيقي' : 'Real-time Web Search failed.',
        'error'
      );
    } finally {
      setIsWebSearching(false);
    }
  };
  
  // Collapsible and responsive sidebar state variables
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShortcutsHelpModal, setShowShortcutsHelpModal] = useState(false);

  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('metatube_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      playbackSpeed: 1.0,
      autoplayNext: true,
      accentColor: 'red',
      language: 'en'
    };
  });

  // Sync state changes with localStorage for persistent state cycles
  useEffect(() => {
    localStorage.setItem('metatube_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('metatube_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('metatube_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('metatube_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('metatube_user', JSON.stringify({ loggedOut: false, user: currentUser }));
    } else {
      localStorage.setItem('metatube_user', JSON.stringify({ loggedOut: true }));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('metatube_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('metatube_watch_later', JSON.stringify(watchLater));
  }, [watchLater]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Deep linking: parse video URL query parameter on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v') || params.get('video');
    if (videoId && videos.length > 0) {
      const matched = videos.find(v => v.id === videoId);
      if (matched) {
        // Delay slightly to ensure standard initialization has finished
        const timer = setTimeout(() => {
          handleVideoSelect(matched);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [videos]);

  const handleShare = (video: Video) => {
    const isArabic = settings.language === 'ar';
    const msg = isArabic 
      ? `تم نسخ رابط فيديو "${video.title}" إلى الحافظة بنجاح!` 
      : `Link to "${video.title}" copied to clipboard successfully!`;
    triggerToast(msg, 'success');
  };

  // Auth simulators
  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Video selectors
  const handleVideoSelect = (video: Video) => {
    setActiveVideo(video);
    setView('watch');

    // Track watched video ID (moving it to the front if it already exists, ensuring no duplicate visual rows)
    setHistory(prev => {
      const filtered = prev.filter(item => item.videoId !== video.id);
      return [{ videoId: video.id, watchedAt: new Date().toLocaleString() }, ...filtered];
    });
    
    // Increment view count dynamically on playback selection
    setVideos(prev => 
      prev.map(v => v.id === video.id ? { ...v, views: v.views + 1 } : v)
    );
  };

  const handleProgressUpdate = (progress: number) => {
    if (!activeVideo) return;
    setHistory(prev => {
      return prev.map(item => {
        if (item.videoId === activeVideo.id) {
          return { ...item, progress };
        }
        return item;
      });
    });
  };

  const handleRemoveFromHistory = (videoId: string) => {
    setHistory(prev => prev.filter(item => item.videoId !== videoId));
  };

  const handleToggleWatchLater = (videoId: string) => {
    setWatchLater(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId) 
        : [...prev, videoId]
    );
  };

  // Video autoplay transition handler
  const handleVideoEnded = () => {
    if (!activeVideo) return;
    const recommended = videos.filter(v => v.id !== activeVideo.id);
    if (recommended.length > 0) {
      handleVideoSelect(recommended[0]);
    }
  };

  // Reset all application data and restore seeds
  const handleResetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Upload video handler
  const handleUploadSuccess = (newVideo: Video) => {
    setVideos(prev => [newVideo, ...prev]);
    setView('home');
  };

  // Subscriptions toggles
  const handleSubscribeToggle = (channelId: string) => {
    setChannels(prev => 
      prev.map(c => {
        if (c.id === channelId) {
          const updatedSub = !c.isSubscribed;
          return {
            ...c,
            isSubscribed: updatedSub,
            subscribersCount: updatedSub ? c.subscribersCount + 1 : c.subscribersCount - 1
          };
        }
        return c;
      })
    );
  };

  const isSubscribed = (channelId: string) => {
    // If it's a current user's newly uploaded channel, it counts as false
    if (channelId === 'chan-current-mock') return false;
    const chan = channels.find(c => c.id === channelId);
    return chan ? !!chan.isSubscribed : false;
  };

  const getSubscriberCount = (channelId: string) => {
    if (channelId === 'chan-current-mock') return 1; // current developer profile subscriber
    const chan = channels.find(c => c.id === channelId);
    return chan ? chan.subscribersCount : 0;
  };

  // Likes updates
  const handleLikeToggle = (videoId: string, status: 'like' | 'dislike') => {
    setVideos(prev => 
      prev.map(v => {
        if (v.id === videoId) {
          const currentStatus = v.likeStatus;
          let updatedLikes = v.likes;
          let updatedDislikes = v.dislikes;
          let newStatus: 'like' | 'dislike' | 'none' = 'none';

          if (status === 'like') {
            if (currentStatus === 'like') {
              updatedLikes -= 1;
              newStatus = 'none';
            } else if (currentStatus === 'dislike') {
              updatedLikes += 1;
              updatedDislikes -= 1;
              newStatus = 'like';
            } else {
              updatedLikes += 1;
              newStatus = 'like';
            }
          } else {
            if (currentStatus === 'dislike') {
              updatedDislikes -= 1;
              newStatus = 'none';
            } else if (currentStatus === 'like') {
              updatedLikes -= 1;
              updatedDislikes += 1;
              newStatus = 'dislike';
            } else {
              updatedDislikes += 1;
              newStatus = 'dislike';
            }
          }

          const updatedVideo = {
            ...v,
            likes: updatedLikes,
            dislikes: updatedDislikes,
            likeStatus: newStatus
          };

          // Also sync watch page active state if it is currently playing
          if (activeVideo && activeVideo.id === videoId) {
            setActiveVideo(updatedVideo);
          }

          return updatedVideo;
        }
        return v;
      })
    );
  };

  // Comments addition
  const handleAddComment = (videoId: string, content: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      videoId,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      content,
      uploadedAt: 'Just now',
      likes: 0
    };

    setComments(prev => [newComment, ...prev]);
  };

  // Channel filter sidebar handlers
  const handleChannelFilter = (channelId: string | null, shouldSetView = true) => {
    setActiveChannelFilter(channelId);
    setSelectedCategory('All');
    if (channelId) {
      if (shouldSetView) setView('channel');
    } else {
      if (shouldSetView) setView('home');
    }
  };

  // Master Filter Formula for the Video Feed
  const getDisplayVideos = () => {
    if (searchQuery.trim() && searchMode === 'web' && currentView === 'home' && !activeChannelFilter) {
      return webSearchVideos;
    }

    if (currentView === 'history') {
      const historyVideos = history
        .map(item => videos.find(v => v.id === item.videoId))
        .filter((v): v is Video => !!v);

      if (searchQuery.trim()) {
        const matchText = searchQuery.toLowerCase();
        return historyVideos.filter(video => {
          const titleMatch = video.title.toLowerCase().includes(matchText);
          const descMatch = video.description.toLowerCase().includes(matchText);
          const channelMatch = video.channelName.toLowerCase().includes(matchText);
          const categoryMatch = video.category.toLowerCase().includes(matchText);
          return titleMatch || descMatch || channelMatch || categoryMatch;
        });
      }
      return historyVideos;
    }

    if (currentView === 'watch-later') {
      const watchLaterVideos = watchLater
        .map(id => videos.find(v => v.id === id))
        .filter((v): v is Video => !!v);

      if (searchQuery.trim()) {
        const matchText = searchQuery.toLowerCase();
        return watchLaterVideos.filter(video => {
          const titleMatch = video.title.toLowerCase().includes(matchText);
          const descMatch = video.description.toLowerCase().includes(matchText);
          const channelMatch = video.channelName.toLowerCase().includes(matchText);
          const categoryMatch = video.category.toLowerCase().includes(matchText);
          return titleMatch || descMatch || channelMatch || categoryMatch;
        });
      }
      return watchLaterVideos;
    }

    return videos.filter(video => {
      // 1. Exclude shorts from regular horizontal grids to preserve layout aesthetics
      if (currentView !== 'shorts' && (video.category === 'Shorts' || (video as any).isShort)) {
        return false;
      }

      // 2. Sidebar views segregation
      if (currentView === 'uploads') {
        return video.channelId === 'chan-current-mock';
      }
      if (currentView === 'liked') {
        return video.likeStatus === 'like';
      }

      // 2. Sidebar active Subscribed Channel selection filter
      if (activeChannelFilter && video.channelId !== activeChannelFilter) {
        return false;
      }

      // 3. Header category select chip
      if (selectedCategory !== 'All' && video.category !== selectedCategory) {
        return false;
      }

      // 4. Navbar active search query matching index
      if (searchQuery.trim()) {
        const matchText = searchQuery.toLowerCase();
        const titleMatch = video.title.toLowerCase().includes(matchText);
        const descMatch = video.description.toLowerCase().includes(matchText);
        const channelMatch = video.channelName.toLowerCase().includes(matchText);
        const categoryMatch = video.category.toLowerCase().includes(matchText);
        return titleMatch || descMatch || channelMatch || categoryMatch;
      }

      return true;
    });
  };

  const filteredVideos = getDisplayVideos();

  const subscribedChannels = channels.filter(c => c.isSubscribed);

  const ACCENT_COLORS = {
    red: '#dc2626',
    blue: '#2563eb',
    purple: '#9333ea',
    emerald: '#059669',
    slate: '#1e293b'
  };

  return (
    <div className="min-h-screen bg-gray-50 text-[#0f0f0f] font-sans flex flex-col antialiased">
      <style>{`
        :root {
          --primary-accent: ${ACCENT_COLORS[settings.accentColor] || '#dc2626'};
        }
        .text-red-600 { color: var(--primary-accent) !important; }
        .bg-red-600 { background-color: var(--primary-accent) !important; }
        .border-red-600 { border-color: var(--primary-accent) !important; }
        .hover\\:bg-red-700:hover { background-color: var(--primary-accent) !important; opacity: 0.9 !important; }
        .focus\\:border-red-600:focus { border-color: var(--primary-accent) !important; }
        .focus\\:ring-red-500:focus { --tw-ring-color: var(--primary-accent) !important; }
        .accent-red-600 { accent-color: var(--primary-accent) !important; }
      `}</style>
      
      {/* 1. Global Navbar */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onUploadClick={() => setShowUploadModal(true)}
        onLogoClick={() => {
          setView('home');
          setActiveChannelFilter(null);
          setSelectedCategory('All');
          setSearchQuery('');
        }}
        onDevConsoleClick={() => setView('dev-console')}
        currentView={currentView}
        onLoginClick={handleLogin}
        onLogoutClick={handleLogout}
        onMenuClick={() => {
          setSidebarCollapsed(prev => !prev);
          setMobileSidebarOpen(prev => !prev);
        }}
        onSettingsClick={() => setShowSettingsModal(true)}
        onEditProfileClick={() => {
          setShowAuthModal(true);
        }}
        language={settings.language}
        onWebSearchClick={handleWebSearch}
      />

      {/* Main Panel Wrapper */}
      <div className="flex flex-1 relative">
        
        {/* 2. Sidebar Collapsible navigation */}
        <Sidebar
          currentView={currentView}
          setView={setView}
          subscribedChannels={subscribedChannels}
          onChannelFilter={handleChannelFilter}
          activeChannelFilter={activeChannelFilter}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          language={settings.language}
          onHelpShortcutsClick={() => setShowShortcutsHelpModal(true)}
        />

        {/* 3. Render Views dynamically in the stage */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-57px)] bg-gray-50">
          {currentView === 'dev-console' ? (
            /* Developer SQL and Architecture console panel */
            <DevConsole />
          ) : currentView === 'shorts' ? (
            /* Immersive vertical Shorts Video player */
            <ShortsView
              videos={videos}
              channels={channels}
              comments={comments}
              currentUser={currentUser}
              onToggleLike={(id) => handleLikeToggle(id, 'like')}
              onToggleDislike={(id) => handleLikeToggle(id, 'dislike')}
              onAddComment={handleAddComment}
              onToggleSubscribe={handleSubscribeToggle}
              language={settings.language}
            />
          ) : currentView === 'analytics' ? (
            /* Advanced AI Analytics and Viewer Habits Portal */
            <AnalyticsDashboard
              history={history}
              videos={videos}
              channels={channels}
              language={settings.language}
            />
          ) : currentView === 'channel' && activeChannelFilter ? (
            /* Dedicated Visited Channel Profile View */
            <ChannelProfileView
              channelId={activeChannelFilter}
              channels={channels}
              videos={videos}
              language={settings.language}
              onSubscribeToggle={handleSubscribeToggle}
              onVideoClick={handleVideoSelect}
              onBackToHome={() => {
                setView('home');
                setActiveChannelFilter(null);
              }}
              onShare={handleShare}
            />
          ) : currentView === 'watch' && activeVideo ? (
            /* Immersive Custom Video Playback Page */
            <WatchPage
              video={activeVideo}
              allVideos={videos}
              comments={comments}
              currentUser={currentUser}
              onVideoSelect={handleVideoSelect}
              onSubscribeToggle={handleSubscribeToggle}
              onLikeToggle={handleLikeToggle}
              onAddComment={handleAddComment}
              isSubscribed={isSubscribed}
              getSubscriberCount={getSubscriberCount}
              onProgressUpdate={handleProgressUpdate}
              onVideoEnded={handleVideoEnded}
              isInWatchLater={watchLater.includes(activeVideo.id)}
              onToggleWatchLater={() => handleToggleWatchLater(activeVideo.id)}
              onChannelClick={(chanId) => {
                setActiveChannelFilter(chanId);
                setView('channel');
              }}
              language={settings.language}
            />
          ) : (
            /* Grid Feeds (Home, Liked, Uploads, Subscribed channels) */
            <div className="p-4 md:p-6 space-y-6">
              
              {/* Category Chips Selector (Only shown in non-watch/dev states) */}
              {!activeChannelFilter && currentView === 'home' && (
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none select-none">
                  {(['All', 'Coding', 'Tech', 'Design', 'Nature', 'Music', 'Gaming'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSearchMode('local');
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#0f0f0f] text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Real-time Internet Web Search Selector Overlay */}
              {searchQuery.trim() && currentView === 'home' && !activeChannelFilter && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="font-sans font-bold text-gray-900 text-sm md:text-base flex items-center justify-center md:justify-start gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                      {settings.language === 'ar' 
                        ? `نتائج البحث عن: "${searchQuery}"` 
                        : `Search results for: "${searchQuery}"`}
                    </p>
                    <p className="text-xs text-gray-500 font-sans max-w-xl">
                      {settings.language === 'ar'
                        ? 'اختر وضع البحث للتبديل بين الفيديوهات المحلية الافتراضية وجلب فيديوهات حقيقية ومحدثة مباشرة من شبكة الإنترنت بالذكاء الاصطناعي.'
                        : 'Choose search mode to toggle between standard local videos and fetching brand new live videos from the web using AI.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full md:w-auto shrink-0 justify-center">
                    <button
                      onClick={() => setSearchMode('local')}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        searchMode === 'local'
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {settings.language === 'ar' ? '🏠 فيديوهات المنصة' : '🏠 Platform Videos'}
                    </button>
                    <button
                      onClick={() => handleWebSearch(searchQuery)}
                      disabled={isWebSearching}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        searchMode === 'web'
                          ? 'bg-[#0f0f0f] text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      {isWebSearching 
                        ? (settings.language === 'ar' ? 'جاري البحث...' : 'Searching...')
                        : (settings.language === 'ar' ? '🌐 ويب حقيقي (AI)' : '🌐 Real Web (AI)')}
                    </button>
                  </div>
                </div>
              )}

              {/* Web Search Loading State */}
              {isWebSearching && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-white border border-gray-100 rounded-3xl shadow-sm animate-pulse">
                  <div className="relative flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
                    <Sparkles className="absolute w-5 h-5 text-yellow-500 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 px-4">
                    <p className="font-sans font-bold text-gray-800 text-sm md:text-base">
                      {settings.language === 'ar' 
                        ? 'جاري الاستعلام والاتصال بمحركات البحث...' 
                        : 'Querying search engines & fetching real videos...'}
                    </p>
                    <p className="text-xs text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
                      {settings.language === 'ar'
                        ? 'يقوم مساعد Gemini الذكي الآن بالبحث في شبكة الويب المفتوحة للعثور على فيديوهات حقيقية، وتحليل محتواها وتجهيز الروابط والبيانات بدقة.'
                        : 'Gemini is searching the live web for actual videos, translating details, and formatting streaming links.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Web Search Error State */}
              {webSearchError && !isWebSearching && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-red-50 border border-red-200 rounded-3xl">
                  <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <HelpCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="space-y-1 px-4">
                    <p className="font-sans font-bold text-red-950">
                      {settings.language === 'ar' ? 'عذرًا، حدث خطأ أثناء البحث في الإنترنت' : 'Error searching the web'}
                    </p>
                    <p className="text-xs text-red-700 font-sans max-w-md mx-auto">
                      {webSearchError}
                    </p>
                  </div>
                  <button
                    onClick={() => handleWebSearch(searchQuery)}
                    className="bg-red-600 hover:bg-red-750 text-white text-xs font-bold px-5 py-2 rounded-full transition-colors active:scale-95 cursor-pointer"
                  >
                    {settings.language === 'ar' ? 'إعادة المحاولة 🔄' : 'Retry Web Search 🔄'}
                  </button>
                </div>
              )}

              {/* Feed Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="space-y-1">
                  <h2 className="font-sans font-bold text-lg md:text-xl text-gray-900 tracking-tight capitalize flex items-center gap-2">
                    {currentView === 'home' && activeChannelFilter && (
                      <span className="text-gray-500">
                        {settings.language === 'ar' ? 'قناة ' : 'Videos from '}<span className="text-red-600 font-semibold">{channels.find(c => c.id === activeChannelFilter)?.name}</span>
                      </span>
                    )}
                    {currentView === 'home' && !activeChannelFilter && (
                      searchMode === 'web'
                        ? (settings.language === 'ar' ? 'نتائج الويب الحقيقية' : 'Real Web Results')
                        : (searchQuery.trim() 
                          ? (settings.language === 'ar' ? 'نتائج البحث المحلية' : 'Local Search Results')
                          : (settings.language === 'ar' ? 'الفيديوهات المقترحة' : 'Recommended Videos'))
                    )}
                    {currentView === 'uploads' && (settings.language === 'ar' ? 'مرفوعاتي الشخصية' : 'My Uploaded Videos')}
                    {currentView === 'liked' && (settings.language === 'ar' ? 'الفيديوهات المفضلة' : 'My Liked Feed')}
                    {currentView === 'history' && (settings.language === 'ar' ? 'سجل المشاهدة' : 'Watch History')}
                    {currentView === 'watch-later' && (settings.language === 'ar' ? 'المشاهدة لاحقًا' : 'Watch Later List')}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    {currentView === 'home' && !activeChannelFilter && (
                      searchMode === 'web'
                        ? (settings.language === 'ar' ? 'نتائج حية ومحدثة من الإنترنت تمت تصفيتها وتجهيزها بالكامل بواسطة الذكاء الاصطناعي.' : 'Live streaming content sourced from the open web, verified by Gemini AI.')
                        : (settings.language === 'ar' ? 'استكشف محتوى ترفيهي وتعليمي مميز من صناع المحتوى المفضلين لديك.' : 'Explore streaming media from modern creators.')
                    )}
                    {currentView === 'uploads' && (settings.language === 'ar' ? 'الفيديوهات التي قمت بنشرها وتخزينها خلال هذه الجلسة.' : 'Videos you published to MYtube during this session.')}
                    {currentView === 'liked' && (settings.language === 'ar' ? 'مجموعتك المنسقة والملهمة من مقاطع الفيديو التي نالت إعجابك.' : 'Your curated list of videos that inspired you.')}
                    {currentView === 'history' && (settings.language === 'ar' ? 'أعد مشاهدة وإدارة مقاطع الفيديو التي قمت بمتابعتها مسبقًا.' : 'Revisit and manage videos you watched previously.')}
                    {currentView === 'watch-later' && (settings.language === 'ar' ? 'مقاطع الفيديو التي قمت بحفظها لتستمتع بمشاهدتها في وقت لاحق.' : 'Saved videos to watch at your convenience.')}
                  </p>
                </div>

                {/* Instant indicators / Actions */}
                <div className="flex items-center gap-2.5">
                  {currentView === 'history' && history.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm text-xs text-gray-700">
                        <span className="font-medium text-gray-500 font-sans">Sort:</span>
                        <select
                          id="history-sort-select"
                          value={historySort}
                          onChange={(e) => setHistorySort(e.target.value as any)}
                          className="bg-transparent font-semibold focus:outline-none cursor-pointer pr-1 font-sans text-gray-800"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="oldest">Oldest First</option>
                          <option value="progress">Progress Remaining</option>
                        </select>
                      </div>

                      <button
                        id="clear-history-btn"
                        onClick={() => {
                          if (confirm('Are you sure you want to clear your watch history?')) {
                            setHistory([]);
                          }
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-1.5 rounded-full transition-colors active:scale-95 border border-red-200 cursor-pointer"
                      >
                        Clear Watch History
                      </button>
                    </div>
                  )}
                  {currentView === 'watch-later' && watchLater.length > 0 && (
                    <button
                      id="clear-watch-later-btn"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear your Watch Later list?')) {
                          setWatchLater([]);
                        }
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-1.5 rounded-full transition-colors active:scale-95 border border-red-200 cursor-pointer"
                    >
                      Clear Watch Later
                    </button>
                  )}
                  <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    <span>LOCAL PLAYBACK: {filteredVideos.length} STREAMABLE</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Video Grid */}
              {filteredVideos.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-full text-gray-400">
                    <HelpCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-sans font-bold text-gray-700">
                      {settings.language === 'ar' ? (
                        currentView === 'history'
                          ? 'سجل المشاهدة فارغ'
                          : currentView === 'watch-later'
                          ? 'قائمة المشاهدة لاحقاً فارغة'
                          : currentView === 'liked'
                          ? 'لا توجد فيديوهات معجب بها بعد'
                          : currentView === 'uploads'
                          ? 'قائمة المرفوعات فارغة'
                          : 'لم يتم العثور على أي فيديوهات مطابقة'
                      ) : (
                        currentView === 'history' 
                          ? 'Your watch history is empty' 
                          : currentView === 'watch-later'
                          ? 'Your Watch Later list is empty'
                          : currentView === 'liked'
                          ? 'No liked videos yet'
                          : currentView === 'uploads'
                          ? 'No uploaded videos yet'
                          : 'No videos matched your filters'
                      )}
                    </p>
                    <p className="text-xs text-gray-500 font-sans max-w-sm">
                      {settings.language === 'ar' ? (
                        currentView === 'history'
                          ? 'اختر وشاهد أي فيديو من الصفحة الرئيسية للبدء في تجميع سجل المشاهدة الخاص بك.'
                          : currentView === 'watch-later'
                          ? 'اضغط على أيقونة الساعة (🕒) على أي فيديو لحفظه لمشاهدته في وقت لاحق.'
                          : currentView === 'liked'
                          ? 'اضغط على زر الإعجاب (👍) أثناء مشاهدة أي فيديو ليظهر في هذه القائمة.'
                          : currentView === 'uploads'
                          ? 'اضغط على زر "رفع فيديو" 📤 في الشريط العلوي لنشر فيديوهاتك على المنصة.'
                          : 'حاول إعادة تعيين كلمات البحث، أو اختيار تصنيف آخر، أو رفع ملف فيديو جديد.'
                      ) : (
                        currentView === 'history' 
                          ? 'Select and play recommended videos on the home feed to build up your watch history.' 
                          : currentView === 'watch-later'
                          ? 'Click the clock icon overlay on any video card to save videos for later.'
                          : currentView === 'liked'
                          ? 'Click the like button (👍) on any video to add it to this list.'
                          : currentView === 'uploads'
                          ? 'Click the "Upload" button 📤 in the top bar to publish your own videos on the platform.'
                          : 'Try resetting active search terms, choosing another category chip, or uploading a new file.'
                      )}
                    </p>
                  </div>
                  {currentView !== 'home' && (
                    <button
                      onClick={() => {
                        setView('home');
                        setActiveChannelFilter(null);
                        setSelectedCategory('All');
                        setSearchQuery('');
                      }}
                      className="bg-red-600 hover:bg-red-750 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors active:scale-95 cursor-pointer"
                    >
                      {settings.language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home Feed'}
                    </button>
                  )}
                </div>
              ) : currentView === 'history' ? (
                <div className="space-y-10" id="grouped-watch-history-container">
                  {(() => {
                    const groups = {
                      'Today': [] as Video[],
                      'Yesterday': [] as Video[],
                      'Last Week': [] as Video[],
                      'Older': [] as Video[]
                    };

                    filteredVideos.forEach(video => {
                      const historyItem = history.find(item => item.videoId === video.id);
                      const watchedAtStr = historyItem?.watchedAt || '';
                      
                      let label: 'Today' | 'Yesterday' | 'Last Week' | 'Older' = 'Older';
                      try {
                        const watchedDate = new Date(watchedAtStr);
                        if (!isNaN(watchedDate.getTime())) {
                          const now = new Date();
                          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                          const watchedDay = new Date(watchedDate.getFullYear(), watchedDate.getMonth(), watchedDate.getDate());
                          
                          const diffTime = today.getTime() - watchedDay.getTime();
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays <= 0) {
                            label = 'Today';
                          } else if (diffDays === 1) {
                            label = 'Yesterday';
                          } else if (diffDays < 7) {
                            label = 'Last Week';
                          } else {
                            label = 'Older';
                          }
                        }
                      } catch (e) {
                        // fallback
                      }
                      
                      groups[label].push(video);
                    });

                    return (Object.keys(groups) as ('Today' | 'Yesterday' | 'Last Week' | 'Older')[]).map(key => {
                      const groupVideos = [...groups[key]].sort((a, b) => {
                        const itemA = history.find(h => h.videoId === a.id);
                        const itemB = history.find(h => h.videoId === b.id);
                        if (!itemA) return 1;
                        if (!itemB) return -1;

                        if (historySort === 'recent') {
                          const timeA = new Date(itemA.watchedAt).getTime();
                          const timeB = new Date(itemB.watchedAt).getTime();
                          return timeB - timeA;
                        }
                        if (historySort === 'oldest') {
                          const timeA = new Date(itemA.watchedAt).getTime();
                          const timeB = new Date(itemB.watchedAt).getTime();
                          return timeA - timeB;
                        }
                        if (historySort === 'progress') {
                          const progA = itemA.progress !== undefined ? itemA.progress : 0;
                          const progB = itemB.progress !== undefined ? itemB.progress : 0;
                          const remA = 1 - progA;
                          const remB = 1 - progB;

                          // Prioritize active partial progress (0 < progress < 1)
                          const isPartialA = progA > 0 && progA < 1;
                          const isPartialB = progB > 0 && progB < 1;

                          if (isPartialA && !isPartialB) return -1;
                          if (!isPartialA && isPartialB) return 1;

                          // Sort by remaining progress descending (most remaining content first)
                          return remB - remA;
                        }
                        return 0;
                      });
                      if (groupVideos.length === 0) return null;

                      const totalSeconds = groupVideos.reduce((sum, video) => {
                        return sum + parseDurationToSeconds(video.duration);
                      }, 0);
                      const totalDurationFormatted = formatTotalDuration(totalSeconds);

                      return (
                        <motion.div
                          key={`${key}-${historySort}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="space-y-4"
                          id={`history-group-${key.toLowerCase().replace(' ', '-')}`}
                        >
                          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                            <h3 className="font-sans font-bold text-base text-gray-800 tracking-tight">
                              {key}
                            </h3>
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {groupVideos.length} {groupVideos.length === 1 ? 'video' : 'videos'}
                            </span>
                            <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              <span>Total Watch Time: {totalDurationFormatted}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groupVideos.map((video) => {
                              const historyItem = history.find(item => item.videoId === video.id);
                              return (
                                <VideoCard
                                  key={video.id}
                                  video={video}
                                  onClick={() => handleVideoSelect(video)}
                                  watchedAt={historyItem?.watchedAt}
                                  progress={historyItem?.progress}
                                  onRemove={() => handleRemoveFromHistory(video.id)}
                                  isInWatchLater={watchLater.includes(video.id)}
                                  onToggleWatchLater={() => handleToggleWatchLater(video.id)}
                                  onChannelClick={(chanId) => {
                                    setActiveChannelFilter(chanId);
                                    setView('channel');
                                  }}
                                  onShare={handleShare}
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredVideos.map((video) => {
                    const historyItem = history.find(item => item.videoId === video.id);
                    return (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoSelect(video)}
                        watchedAt={currentView === 'history' ? historyItem?.watchedAt : undefined}
                        progress={historyItem?.progress}
                        onRemove={
                          currentView === 'history' 
                            ? () => handleRemoveFromHistory(video.id) 
                            : currentView === 'watch-later'
                            ? () => handleToggleWatchLater(video.id)
                            : undefined
                        }
                        isInWatchLater={watchLater.includes(video.id)}
                        onToggleWatchLater={() => handleToggleWatchLater(video.id)}
                        onChannelClick={(chanId) => {
                          setActiveChannelFilter(chanId);
                          setView('channel');
                        }}
                        onShare={handleShare}
                      />
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </main>

      </div>

      {/* 4. Video Upload System Overlay Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* 5. Full Control Settings Modal Overlay */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          onResetAllData={handleResetAllData}
        />
      )}

      {/* 6. Authentic & Interactive Google, Facebook, or Email Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          currentUser={currentUser}
          language={settings.language}
        />
      )}

      {/* 7. Video Player Keyboard Shortcuts Help Modal */}
      {showShortcutsHelpModal && (
        <ShortcutsHelpModal
          onClose={() => setShowShortcutsHelpModal(false)}
          language={settings.language}
        />
      )}

      {/* 8. Dynamic Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 z-50 flex items-center gap-2.5 px-4.5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold ${
              settings.language === 'ar' ? 'left-6 flex-row-reverse' : 'right-6'
            } ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 animate-spin-slow" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
