import React, { useState, useEffect } from 'react';
import { 
  INITIAL_VIDEOS, INITIAL_COMMENTS, INITIAL_CHANNELS, CURRENT_USER 
} from './data';
import { Video, Comment, Channel, User, Category, Playlist, VideoBookmark } from './types';
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
import PlaylistsView from './components/PlaylistsView';
import LiveHubView from './components/LiveHubView';
import ChatHubView from './components/ChatHubView';
import ConfirmModal from './components/ConfirmModal';
import StoriesSection from './components/StoriesSection';
import MiniPlayer from './components/MiniPlayer';
import { Sparkles, Terminal, LogIn, LogOut, ArrowUp, Zap, HelpCircle, Clock, HardDrive, Trash2, Sliders, AlertTriangle, TrendingDown, RefreshCw, CheckCircle2, Search, X, Download, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
        // Keep all videos saved by the user (including uploads, search results, etc.)
        return parsed;
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
        // Keep all comments saved by the user
        return parsed;
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
        return parsed;
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
        if (parsed.user) {
          // If the user customized their account or profile details, preserve them
          return parsed.user;
        }
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

  const [downloads, setDownloads] = useState<string[]>(() => {
    const saved = localStorage.getItem('metatube_downloads');
    return saved ? JSON.parse(saved) : [];
  });

  const [downloadsMetadata, setDownloadsMetadata] = useState<Record<string, { downloadedAt: string; sizeMb: number; quality: '1080p' | '720p' | 'mp3' }>>(() => {
    const saved = localStorage.getItem('metatube_downloads_metadata');
    let metadata = saved ? JSON.parse(saved) : {};
    
    // Auto-generate metadata for any existing downloads that don't have it
    // Assign some as "old" (e.g. 10 days ago) so they are immediately testable in the UI!
    try {
      const savedDownloads = localStorage.getItem('metatube_downloads');
      const dlArray: string[] = savedDownloads ? JSON.parse(savedDownloads) : [];
      
      let updated = false;
      dlArray.forEach((id, index) => {
        if (!metadata[id]) {
          const daysAgo = index % 2 === 0 ? 10 : 0;
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          
          const qualities: ('1080p' | '720p' | 'mp3')[] = ['1080p', '720p', 'mp3'];
          const qual = qualities[index % qualities.length];
          const sizes = { '1080p': 58.9, '720p': 24.2, 'mp3': 4.8 };
          
          metadata[id] = {
            downloadedAt: date.toISOString(),
            sizeMb: sizes[qual],
            quality: qual
          };
          updated = true;
        }
      });
      
      if (updated) {
        localStorage.setItem('metatube_downloads_metadata', JSON.stringify(metadata));
      }
    } catch (e) {
      console.error('Error backfilling downloads metadata', e);
    }
    
    return metadata;
  });

  const [cleanupThresholdDays, setCleanupThresholdDays] = useState<number>(() => {
    const saved = localStorage.getItem('metatube_downloads_threshold');
    return saved ? parseInt(saved, 10) : 7;
  });

  const [compressingVideoId, setCompressingVideoId] = useState<string | null>(null);
  const [compressingTarget, setCompressingTarget] = useState<'720p' | 'mp3' | null>(null);

  const startCompressionSimulation = (videoId: string, target: '720p' | 'mp3') => {
    setCompressingVideoId(videoId);
    setCompressingTarget(target);
    setTimeout(() => {
      handleCompressDownload(videoId, target);
      setCompressingVideoId(null);
      setCompressingTarget(null);
    }, 1200);
  };

  // Playlist Management States
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('metatube_playlists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'tech-favorites',
        name: 'Cool Technology Highlights',
        description: 'Fascinating tech walkthroughs and review streams.',
        videoIds: [],
        createdAt: new Date().toISOString()
      },
      {
        id: 'nature-essentials',
        name: 'Atmospheric Nature & Travel',
        description: 'Breathtaking sceneries and relaxing ambient landscapes.',
        videoIds: [],
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [historySort, setHistorySort] = useState<'recent' | 'oldest' | 'progress'>('recent');
  const [downloadsSort, setDownloadsSort] = useState<'date' | 'size' | 'quality'>('date');
  const [downloadsGroupMode, setDownloadsGroupMode] = useState<'none' | 'category' | 'folder'>(() => {
    const saved = localStorage.getItem('metatube_downloads_group_mode');
    return (saved as 'none' | 'category' | 'folder') || 'none';
  });
  const [downloadsFolders, setDownloadsFolders] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('metatube_downloads_folders');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderVideoId, setNewFolderVideoId] = useState<string | null>(null);
  const [newFolderInput, setNewFolderInput] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('metatube_downloads_group_mode', downloadsGroupMode);
  }, [downloadsGroupMode]);

  useEffect(() => {
    localStorage.setItem('metatube_downloads_folders', JSON.stringify(downloadsFolders));
  }, [downloadsFolders]);

  const [draggedOverGroup, setDraggedOverGroup] = useState<string | null>(null);

  // Auto-Cleanup Scheduling states
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('metatube_autocleanup_enabled');
    return saved === 'true';
  });
  const [autoCleanupSchedule, setAutoCleanupSchedule] = useState<'daily' | 'weekly' | 'monthly'>(() => {
    const saved = localStorage.getItem('metatube_autocleanup_schedule');
    return (saved as 'daily' | 'weekly' | 'monthly') || 'weekly';
  });
  const [lastAutoCleanupRun, setLastAutoCleanupRun] = useState<string>(() => {
    return localStorage.getItem('metatube_autocleanup_last_run') || '';
  });

  useEffect(() => {
    localStorage.setItem('metatube_autocleanup_enabled', String(autoCleanupEnabled));
  }, [autoCleanupEnabled]);

  useEffect(() => {
    localStorage.setItem('metatube_autocleanup_schedule', autoCleanupSchedule);
  }, [autoCleanupSchedule]);

  useEffect(() => {
    localStorage.setItem('metatube_autocleanup_last_run', lastAutoCleanupRun);
  }, [lastAutoCleanupRun]);

  // Background Auto-Cleanup scheduler check
  useEffect(() => {
    if (!autoCleanupEnabled) return;

    const checkAndRunCleanup = () => {
      const now = new Date();
      let runCleanup = false;

      if (!lastAutoCleanupRun) {
        runCleanup = true;
      } else {
        const lastRunDate = new Date(lastAutoCleanupRun);
        const diffMs = now.getTime() - lastRunDate.getTime();
        const diffDays = diffMs / (24 * 60 * 60 * 1000);

        if (autoCleanupSchedule === 'daily' && diffDays >= 1) {
          runCleanup = true;
        } else if (autoCleanupSchedule === 'weekly' && diffDays >= 7) {
          runCleanup = true;
        } else if (autoCleanupSchedule === 'monthly' && diffDays >= 30) {
          runCleanup = true;
        }
      }

      if (runCleanup) {
        const thresholdMs = cleanupThresholdDays * 24 * 60 * 60 * 1000;
        let cleanedCount = 0;
        let savedSpace = 0;

        setDownloads(prev => {
          const toKeep: string[] = [];
          const toRemove: string[] = [];

          prev.forEach(id => {
            const meta = downloadsMetadata[id];
            if (meta) {
              const downloadDate = new Date(meta.downloadedAt);
              if (now.getTime() - downloadDate.getTime() > thresholdMs) {
                toRemove.push(id);
                cleanedCount++;
                savedSpace += meta.sizeMb;
              } else {
                toKeep.push(id);
              }
            } else {
              toKeep.push(id);
            }
          });

          if (cleanedCount > 0) {
            setDownloadsMetadata(meta => {
              const newMeta = { ...meta };
              toRemove.forEach(id => {
                delete newMeta[id];
              });
              return newMeta;
            });

            triggerToast(
              settings.language === 'ar'
                ? `[تنظيف تلقائي جدولي] تم بنجاح حذف ${cleanedCount} ملفات قديمة لتوفير ${savedSpace.toFixed(1)} ميجابايت!`
                : `[Auto-Cleanup Schedule] Successfully deleted ${cleanedCount} old downloads, reclaiming ${savedSpace.toFixed(1)} MB!`,
              'info'
            );
            return toKeep;
          } else {
            return prev;
          }
        });

        setLastAutoCleanupRun(now.toISOString());
      }
    };

    // Run check immediately on mount or config change
    checkAndRunCleanup();
  }, [autoCleanupEnabled, autoCleanupSchedule, lastAutoCleanupRun, cleanupThresholdDays, downloadsMetadata]);

  // Navigation states
  const [currentView, setView] = useState<string>('home'); // 'home' | 'watch' | 'uploads' | 'liked' | 'dev-console' | 'history'
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isMiniPlayerClosed, setIsMiniPlayerClosed] = useState<boolean>(false);

  // Video bookmarks state & seeking controls
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>(() => {
    const saved = localStorage.getItem('metatube_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('metatube_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  const handleAddBookmark = (videoId: string, timestamp: number, note: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const mins = Math.floor(timestamp / 60);
    const secs = Math.floor(timestamp % 60);
    const timestampLabel = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const newBookmark: VideoBookmark = {
      id: `bookmark_${Date.now()}`,
      videoId,
      videoTitle: video.title,
      thumbnailUrl: video.thumbnailUrl,
      timestamp,
      timestampLabel,
      note: note.trim() || (settings.language === 'ar' ? 'علامة مرجعية' : 'Bookmark'),
      createdAt: new Date().toISOString()
    };

    setBookmarks(prev => [newBookmark, ...prev]);
    triggerToast(
      settings.language === 'ar'
        ? 'تمت إضافة علامة مرجعية بنجاح! 🔖'
        : 'Bookmark added successfully! 🔖',
      'success'
    );
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    triggerToast(
      settings.language === 'ar'
        ? 'تم حذف العلامة المرجعية.'
        : 'Bookmark deleted.',
      'info'
    );
  };

  const handleBookmarkClick = (bookmark: VideoBookmark) => {
    const video = videos.find(v => v.id === bookmark.videoId);
    if (video) {
      handleVideoSelect(video);
      setSeekToTime(bookmark.timestamp);
      setMobileSidebarOpen(false);
    } else {
      triggerToast(
        settings.language === 'ar'
          ? 'تعذر العثور على الفيديو.'
          : 'Could not find the associated video.',
        'error'
      );
    }
  };
  const [miniPlayerMuted, setMiniPlayerMuted] = useState<boolean>(true);
  const [miniPlayerPlaying, setMiniPlayerPlaying] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineSearchQuery, setOfflineSearchQuery] = useState('');
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

  // Custom premium confirm modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const askConfirmation = (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => {
    setConfirmModalState({
      isOpen: true,
      title: options.title,
      message: options.message,
      onConfirm: () => {
        options.onConfirm();
        setConfirmModalState(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: options.confirmText,
      cancelText: options.cancelText,
    });
  };

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

  useEffect(() => {
    localStorage.setItem('metatube_downloads', JSON.stringify(downloads));
  }, [downloads]);

  useEffect(() => {
    localStorage.setItem('metatube_downloads_metadata', JSON.stringify(downloadsMetadata));
  }, [downloadsMetadata]);

  useEffect(() => {
    localStorage.setItem('metatube_downloads_threshold', String(cleanupThresholdDays));
  }, [cleanupThresholdDays]);

  useEffect(() => {
    localStorage.setItem('metatube_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Alert History Item interface
  interface AlertHistoryItem {
    id: string;
    message: string;
    type: 'success' | 'info' | 'error';
    timestamp: number;
    isRead: boolean;
  }

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>(() => {
    const saved = localStorage.getItem('metatube_alert_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    
    const newAlert: AlertHistoryItem = {
      id: String(Date.now() + Math.random()),
      message,
      type,
      timestamp: Date.now(),
      isRead: false
    };

    setAlertHistory(prev => {
      const updated = [newAlert, ...prev].slice(0, 50);
      localStorage.setItem('metatube_alert_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAssignVideoToFolder = (videoId: string, folderName: string) => {
    if (folderName === '__new__') {
      setNewFolderVideoId(videoId);
      setNewFolderInput('');
      setShowNewFolderModal(true);
    } else {
      setDownloadsFolders(prev => {
        const updated = { ...prev };
        if (!folderName) {
          delete updated[videoId];
        } else {
          updated[videoId] = folderName;
        }
        return updated;
      });
      triggerToast(
        settings.language === 'ar' 
          ? `تم تحديث المجلد بنجاح! 📁` 
          : `Folder updated successfully! 📁`,
        'success'
      );
    }
  };

  const handleAssignVideoToCategory = (videoId: string, categoryName: string) => {
    setVideos(prev => {
      const updated = prev.map(v => {
        if (v.id === videoId) {
          return { ...v, category: categoryName };
        }
        return v;
      });
      localStorage.setItem('metatube_videos', JSON.stringify(updated));
      return updated;
    });
    triggerToast(
      settings.language === 'ar' 
        ? `تم تحديث التصنيف بنجاح! 📁` 
        : `Category updated successfully! 📁`,
      'success'
    );
  };

  const handleCreateNewFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed) {
      triggerToast(
        settings.language === 'ar' ? 'يرجى كتابة اسم مجلد صالح!' : 'Please enter a valid folder name!',
        'error'
      );
      return;
    }

    if (newFolderVideoId) {
      setDownloadsFolders(prev => ({
        ...prev,
        [newFolderVideoId]: trimmed
      }));
      triggerToast(
        settings.language === 'ar' 
          ? `تم إنشاء مجلد "${trimmed}" بنجاح! 📁` 
          : `Folder "${trimmed}" created! 📁`,
        'success'
      );
    }
    setShowNewFolderModal(false);
    setNewFolderVideoId(null);
    setNewFolderInput('');
  };

  const handleClearAlertHistory = () => {
    setAlertHistory([]);
    localStorage.removeItem('metatube_alert_history');
  };

  const handleMarkAlertsAsRead = (id?: string) => {
    setAlertHistory(prev => {
      const updated = prev.map(item => {
        if (id) {
          return item.id === id ? { ...item, isRead: true } : item;
        }
        return { ...item, isRead: true };
      });
      localStorage.setItem('metatube_alert_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveAlert = (id: string) => {
    setAlertHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('metatube_alert_history', JSON.stringify(updated));
      return updated;
    });
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
    setIsMiniPlayerClosed(false);
    setMiniPlayerPlaying(true);

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

  const handleWatchAgain = (video: Video) => {
    setHistory(prev => {
      return prev.map(item => {
        if (item.videoId === video.id) {
          return { ...item, progress: 0, watchedAt: new Date().toLocaleString() };
        }
        return item;
      });
    });
    handleVideoSelect(video);
  };

  const handleToggleWatchLater = (videoId: string) => {
    setWatchLater(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId) 
        : [...prev, videoId]
    );
  };

  const handleToggleDownload = (videoId: string, silent = false, quality?: '1080p' | '720p' | 'mp3') => {
    setDownloads(prev => {
      const isDownloaded = prev.includes(videoId);
      if (isDownloaded) {
        if (!silent) {
          triggerToast(
            settings.language === 'ar'
              ? 'تم حذف الفيديو من التنزيلات'
              : 'Removed video from offline downloads',
            'info'
          );
        }
        setDownloadsMetadata(meta => {
          const newMeta = { ...meta };
          delete newMeta[videoId];
          return newMeta;
        });
        return prev.filter(id => id !== videoId);
      } else {
        if (!silent) {
          triggerToast(
            settings.language === 'ar'
              ? 'تم حفظ الفيديو في التنزيلات بنجاح!'
              : 'Video saved to offline downloads successfully!',
            'success'
          );
        }
        const qual = quality || '1080p';
        const sizes = { '1080p': 58.9, '720p': 24.2, 'mp3': 4.8 };
        setDownloadsMetadata(meta => ({
          ...meta,
          [videoId]: {
            downloadedAt: new Date().toISOString(),
            sizeMb: sizes[qual] || 58.9,
            quality: qual
          }
        }));
        return [...prev, videoId];
      }
    });
  };

  // Storage optimization & cleanup utility handlers
  const handleCompressDownload = (videoId: string, targetQuality: '720p' | 'mp3') => {
    const sizes = { '720p': 24.2, 'mp3': 4.8 };
    const qualityLabel = targetQuality === 'mp3' ? 'MP3 Audio' : 'HD 720p';
    
    setDownloadsMetadata(prev => {
      if (!prev[videoId]) return prev;
      const currentSize = prev[videoId].sizeMb;
      const savedSize = currentSize - sizes[targetQuality];
      
      triggerToast(
        settings.language === 'ar'
          ? `تم ضغط الفيديو بنجاح إلى ${qualityLabel} وتوفير ${savedSize.toFixed(1)} ميجابايت!`
          : `Compressed to ${qualityLabel}! Saved ${savedSize.toFixed(1)} MB of storage space!`,
        'success'
      );
      
      return {
        ...prev,
        [videoId]: {
          ...prev[videoId],
          quality: targetQuality,
          sizeMb: sizes[targetQuality]
        }
      };
    });
  };

  const handleSimulateOldDownload = (videoId: string, daysAgo = 10) => {
    setDownloadsMetadata(prev => {
      if (!prev[videoId]) return prev;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      triggerToast(
        settings.language === 'ar'
          ? `تم تعديل تاريخ تنزيل الفيديو ليكون قبل ${daysAgo} أيام لتسهيل تجربة ميزة التنظيف!`
          : `Simulated download date to ${daysAgo} days ago for testing cleanup alerts!`,
        'info'
      );
      
      return {
        ...prev,
        [videoId]: {
          ...prev[videoId],
          downloadedAt: date.toISOString()
        }
      };
    });
  };

  const handleCleanupOldDownloads = () => {
    const now = new Date();
    const thresholdMs = cleanupThresholdDays * 24 * 60 * 60 * 1000;
    
    let cleanedCount = 0;
    let savedSpace = 0;
    
    setDownloads(prev => {
      const toKeep: string[] = [];
      const toRemove: string[] = [];
      
      prev.forEach(id => {
        const meta = downloadsMetadata[id];
        if (meta) {
          const downloadDate = new Date(meta.downloadedAt);
          if (now.getTime() - downloadDate.getTime() > thresholdMs) {
            toRemove.push(id);
            cleanedCount++;
            savedSpace += meta.sizeMb;
          } else {
            toKeep.push(id);
          }
        } else {
          toKeep.push(id);
        }
      });
      
      if (cleanedCount > 0) {
        setDownloadsMetadata(meta => {
          const newMeta = { ...meta };
          toRemove.forEach(id => {
            delete newMeta[id];
          });
          return newMeta;
        });
        
        triggerToast(
          settings.language === 'ar'
            ? `تم بنجاح تنظيف ${cleanedCount} فيديوهات قديمة وتوفير ${savedSpace.toFixed(1)} ميجابايت!`
            : `Successfully cleared ${cleanedCount} old downloads, saving ${savedSpace.toFixed(1)} MB!`,
          'success'
        );
        return toKeep;
      } else {
        triggerToast(
          settings.language === 'ar'
            ? 'لم يتم العثور على أي فيديوهات قديمة لتنظيفها!'
            : 'No old downloads matched the current filter!',
          'info'
        );
        return prev;
      }
    });
  };

  const handleTriggerManualAutoCleanupCheck = () => {
    const now = new Date();
    const thresholdMs = cleanupThresholdDays * 24 * 60 * 60 * 1000;
    
    let cleanedCount = 0;
    let savedSpace = 0;
    
    setDownloads(prev => {
      const toKeep: string[] = [];
      const toRemove: string[] = [];
      
      prev.forEach(id => {
        const meta = downloadsMetadata[id];
        if (meta) {
          const downloadDate = new Date(meta.downloadedAt);
          if (now.getTime() - downloadDate.getTime() > thresholdMs) {
            toRemove.push(id);
            cleanedCount++;
            savedSpace += meta.sizeMb;
          } else {
            toKeep.push(id);
          }
        } else {
          toKeep.push(id);
        }
      });
      
      if (cleanedCount > 0) {
        setDownloadsMetadata(meta => {
          const newMeta = { ...meta };
          toRemove.forEach(id => {
            delete newMeta[id];
          });
          return newMeta;
        });
        
        triggerToast(
          settings.language === 'ar'
            ? `[تنظيف يدوي فوري] تم العثور على ${cleanedCount} ملفات قديمة وحذفها بنجاح لتوفير ${savedSpace.toFixed(1)} ميجابايت!`
            : `[Manual Auto-Cleanup Check] Found and deleted ${cleanedCount} old downloads, reclaiming ${savedSpace.toFixed(1)} MB!`,
          'success'
        );
        return toKeep;
      } else {
        triggerToast(
          settings.language === 'ar'
            ? 'فحص التنظيف التلقائي: لم يتم العثور على أي ملفات تجاوزت مدة الاحتفاظ المحددة.'
            : 'Auto-Cleanup Check: No downloads exceed the current retention threshold.',
          'info'
        );
        return prev;
      }
    });

    setLastAutoCleanupRun(now.toISOString());
  };

  const simulateAutoCleanupTime = (days: number) => {
    const fakePastDate = new Date();
    fakePastDate.setDate(fakePastDate.getDate() - days);
    setLastAutoCleanupRun(fakePastDate.toISOString());
    triggerToast(
      settings.language === 'ar'
        ? `تم محاكاة مرور ${days} أيام على آخر فحص تنظيف بنجاح!`
        : `Successfully simulated ${days} days passing since the last automated check!`,
      'success'
    );
  };

  const handleExportToCSV = () => {
    if (downloads.length === 0) {
      triggerToast(
        settings.language === 'ar'
          ? 'لا توجد تنزيلات لتصديرها!'
          : 'No downloads available to export!',
        'error'
      );
      return;
    }

    const headers = [
      'Video ID',
      'Title',
      'Category',
      'Duration',
      'Quality',
      'Size (MB)',
      'Downloaded At',
      'Folder'
    ];

    const rows = downloads.map(id => {
      const video = videos.find(v => v.id === id);
      const meta = downloadsMetadata[id];
      const folder = downloadsFolders[id] || '';
      
      const title = video ? video.title : 'Unknown Title';
      const category = video ? video.category : 'Unknown Category';
      const duration = video ? video.duration : '00:00';
      const quality = meta ? meta.quality : 'N/A';
      const sizeMb = meta ? meta.sizeMb.toFixed(1) : '0.0';
      const downloadedAt = meta ? new Date(meta.downloadedAt).toISOString() : 'N/A';

      // Escape quotes in CSV fields
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;

      return [
        escape(id),
        escape(title),
        escape(category),
        escape(duration),
        escape(quality),
        escape(sizeMb),
        escape(downloadedAt),
        escape(folder)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create UTF-8 BOM so Excel opens non-ASCII characters correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `metatube_downloads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast(
      settings.language === 'ar'
        ? 'تم تصدير ملف CSV بنجاح! 📊'
        : 'CSV exported successfully! 📊',
      'success'
    );
  };

  // Playlist actions
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      videoIds: [],
      createdAt: new Date().toISOString()
    };
    
    setPlaylists(prev => [newPlaylist, ...prev]);
    triggerToast(
      settings.language === 'ar'
        ? `تم إنشاء قائمة التشغيل "${name}" بنجاح!`
        : `Playlist "${name}" created successfully!`,
      'success'
    );
  };

  const handleUpdatePlaylist = (id: string, name: string, description: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, name, description };
      }
      return p;
    }));
    
    triggerToast(
      settings.language === 'ar'
        ? 'تم تحديث قائمة التشغيل!'
        : 'Playlist updated successfully!',
      'success'
    );
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    triggerToast(
      settings.language === 'ar'
        ? 'تم حذف قائمة التشغيل!'
        : 'Playlist deleted!',
      'info'
    );
  };

  const handleToggleVideoInPlaylist = (playlistId: string, videoId: string) => {
    let status: 'added' | 'removed' = 'added';
    
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const exists = p.videoIds.includes(videoId);
        const updatedVideoIds = exists
          ? p.videoIds.filter(id => id !== videoId)
          : [...p.videoIds, videoId];
        
        status = exists ? 'removed' : 'added';
        return { ...p, videoIds: updatedVideoIds };
      }
      return p;
    }));

    if (status === 'added') {
      triggerToast(
        settings.language === 'ar'
          ? 'تمت إضافة الفيديو إلى قائمة التشغيل!'
          : 'Added video to playlist!',
        'success'
      );
    } else {
      triggerToast(
        settings.language === 'ar'
          ? 'تمت إزالة الفيديو من قائمة التشغيل!'
          : 'Removed video from playlist!',
        'info'
      );
    }
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
    const isArabic = settings.language === 'ar';
    askConfirmation({
      title: isArabic ? 'إعادة ضبط المصنع' : 'Restore Factory Settings',
      message: isArabic 
        ? 'هل أنت متأكد من رغبتك في إعادة ضبط جميع الإعدادات وحذف كل الفيديوهات المرفوعة والتعليقات؟ سيتم إعادة تحميل الصفحة.' 
        : 'Are you sure you want to restore factory settings? This will clear all custom uploads, comments, and history. The page will reload.',
      onConfirm: () => {
        localStorage.clear();
        window.location.reload();
      },
      confirmText: isArabic ? 'إعادة ضبط' : 'Restore Settings',
      cancelText: isArabic ? 'إلغاء' : 'Cancel'
    });
  };

  // Upload video handler
  const handleUploadSuccess = (newVideo: Video) => {
    setVideos(prev => [newVideo, ...prev]);
    setView('home');
  };

  // Delete video handler
  const handleDeleteVideo = (videoId: string) => {
    const isArabic = settings.language === 'ar';
    const confirmTitle = isArabic ? 'تأكيد حذف الفيديو' : 'Confirm Video Deletion';
    const confirmMessage = isArabic 
      ? 'هل أنت متأكد من رغبتك في حذف هذا الفيديو نهائياً من قناتك؟' 
      : 'Are you sure you want to permanently delete this video from your channel?';
    
    askConfirmation({
      title: confirmTitle,
      message: confirmMessage,
      onConfirm: () => {
        // 1. Delete from videos state
        setVideos(prev => prev.filter(v => v.id !== videoId));
        
        // 2. Delete from history state
        setHistory(prev => prev.filter(h => h.videoId !== videoId));
        
        // 3. Delete from watch later state
        setWatchLater(prev => prev.filter(id => id !== videoId));
        
        // 4. Delete from downloads state
        setDownloads(prev => prev.filter(id => id !== videoId));
        
        // 5. Delete from playlists state
        setPlaylists(prev => prev.map(p => ({
          ...p,
          videoIds: p.videoIds.filter(id => id !== videoId)
        })));

        // 6. If currently watching this video, clear it or go back to home
        if (activeVideo && activeVideo.id === videoId) {
          setActiveVideo(null);
          setView('home');
        }

        triggerToast(
          isArabic 
            ? 'تم حذف الفيديو بنجاح من قناتك!' 
            : 'Video deleted successfully from your channel!',
          'success'
        );
      },
      confirmText: isArabic ? 'نعم، احذف نهائياً' : 'Yes, delete permanently',
      cancelText: isArabic ? 'إلغاء' : 'Cancel'
    });
  };

  // Subscriptions toggles
  const handleSubscribeToggle = (channelId: string) => {
    const isOwnChannel = currentUser && (
      channelId === currentUser.username ||
      channelId === 'user_channel' ||
      channelId === 'chan-current-mock' ||
      channelId === 'usr-current'
    );
    
    if (isOwnChannel) {
      triggerToast(
        settings.language === 'ar'
          ? 'لا يمكنك الاشتراك في قناتك الخاصة!'
          : 'You cannot subscribe to your own channel!',
        'error'
      );
      return;
    }

    setChannels(prev => {
      const exists = prev.some(c => c.id === channelId);
      if (exists) {
        return prev.map(c => {
          if (c.id === channelId) {
            const updatedSub = !c.isSubscribed;
            triggerToast(
              settings.language === 'ar'
                ? (updatedSub ? 'تم الاشتراك في القناة بنجاح! 🎉' : 'تم إلغاء الاشتراك في القناة.')
                : (updatedSub ? 'Subscribed to channel! 🎉' : 'Unsubscribed from channel.'),
              'success'
            );
            return {
              ...c,
              isSubscribed: updatedSub,
              subscribersCount: updatedSub ? c.subscribersCount + 1 : Math.max(0, c.subscribersCount - 1)
            };
          }
          return c;
        });
      } else {
        // Retrieve info from matching videos
        const videoWithChannel = videos.find(v => v.channelId === channelId) || (activeVideo && activeVideo.channelId === channelId ? activeVideo : null);
        const name = videoWithChannel?.channelName || (settings.language === 'ar' ? 'قناة جديدة' : 'New Channel');
        const avatarUrl = videoWithChannel?.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
        
        const newChannel: Channel = {
          id: channelId,
          name,
          avatarUrl,
          subscribersCount: 1451,
          isSubscribed: true
        };
        
        triggerToast(
          settings.language === 'ar' ? 'تم الاشتراك في القناة بنجاح! 🎉' : 'Subscribed to channel! 🎉',
          'success'
        );
        return [...prev, newChannel];
      }
    });
  };

  const isSubscribed = (channelId: string) => {
    const isOwnChannel = currentUser && (
      channelId === currentUser.username ||
      channelId === 'user_channel' ||
      channelId === 'chan-current-mock' ||
      channelId === 'usr-current'
    );
    if (isOwnChannel) return false;
    
    const chan = channels.find(c => c.id === channelId);
    return chan ? !!chan.isSubscribed : false;
  };

  const getSubscriberCount = (channelId: string) => {
    const isOwnChannel = currentUser && (
      channelId === currentUser.username ||
      channelId === 'user_channel' ||
      channelId === 'chan-current-mock' ||
      channelId === 'usr-current'
    );
    if (isOwnChannel) return 2450;

    const chan = channels.find(c => c.id === channelId);
    return chan ? chan.subscribersCount : 1450;
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
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (searchQuery.trim() && currentView === 'home' && !activeChannelFilter) {
      const isWebSearchNoResults = searchMode === 'web' && webSearchVideos.length === 0;
      if (isOffline || isWebSearchNoResults) {
        // Fallback: search and filter downloaded videos specifically
        const downloadedVideos = downloads
          .map(id => videos.find(v => v.id === id))
          .filter((v): v is Video => !!v);

        const matchText = searchQuery.toLowerCase();
        return downloadedVideos.filter(video => {
          const titleMatch = video.title.toLowerCase().includes(matchText);
          const descMatch = video.description.toLowerCase().includes(matchText);
          const channelMatch = video.channelName.toLowerCase().includes(matchText);
          const categoryMatch = video.category.toLowerCase().includes(matchText);
          return titleMatch || descMatch || channelMatch || categoryMatch;
        });
      }

      if (searchMode === 'web') {
        return webSearchVideos;
      }
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

    if (currentView === 'downloads') {
      const downloadedVideos = downloads
        .map(id => videos.find(v => v.id === id))
        .filter((v): v is Video => !!v);

      const activeQuery = offlineSearchQuery.trim() ? offlineSearchQuery : searchQuery;

      let result = downloadedVideos;
      if (activeQuery.trim()) {
        const matchText = activeQuery.toLowerCase();
        result = downloadedVideos.filter(video => {
          const titleMatch = video.title.toLowerCase().includes(matchText);
          const descMatch = video.description.toLowerCase().includes(matchText);
          const channelMatch = video.channelName.toLowerCase().includes(matchText);
          const categoryMatch = video.category.toLowerCase().includes(matchText);
          return titleMatch || descMatch || channelMatch || categoryMatch;
        });
      }

      // Sort result based on downloadsSort
      if (downloadsSort === 'date') {
        result = [...result].sort((a, b) => {
          const metaA = downloadsMetadata[a.id] || { downloadedAt: '1970-01-01T00:00:00.000Z' };
          const metaB = downloadsMetadata[b.id] || { downloadedAt: '1970-01-01T00:00:00.000Z' };
          return new Date(metaB.downloadedAt).getTime() - new Date(metaA.downloadedAt).getTime();
        });
      } else if (downloadsSort === 'size') {
        result = [...result].sort((a, b) => {
          const metaA = downloadsMetadata[a.id] || { sizeMb: 0 };
          const metaB = downloadsMetadata[b.id] || { sizeMb: 0 };
          return metaB.sizeMb - metaA.sizeMb;
        });
      } else if (downloadsSort === 'quality') {
        const priority = { '1080p': 3, '720p': 2, 'mp3': 1 };
        result = [...result].sort((a, b) => {
          const metaA = downloadsMetadata[a.id] || { quality: '720p' };
          const metaB = downloadsMetadata[b.id] || { quality: '720p' };
          return (priority[metaB.quality] || 0) - (priority[metaA.quality] || 0);
        });
      }

      return result;
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

  // Dynamic offline storage calculations
  const now = new Date();
  const thresholdMs = cleanupThresholdDays * 24 * 60 * 60 * 1000;
  const oldDownloadedIds = downloads.filter(id => {
    const meta = downloadsMetadata[id];
    if (!meta) return false;
    const downloadDate = new Date(meta.downloadedAt);
    return (now.getTime() - downloadDate.getTime()) > thresholdMs;
  });
  const oldSpaceMb = oldDownloadedIds.reduce((sum, id) => sum + (downloadsMetadata[id]?.sizeMb || 0), 0);
  const totalSpaceMb = downloads.reduce((sum, id) => sum + (downloadsMetadata[id]?.sizeMb || 58.9), 0);

  // Space usage calculations per video quality category
  const space1080p = downloads.reduce((sum, id) => {
    const m = downloadsMetadata[id] || { sizeMb: 58.9, quality: '1080p' };
    return sum + ((m.quality || '1080p') === '1080p' ? (m.sizeMb || 58.9) : 0);
  }, 0);

  const space720p = downloads.reduce((sum, id) => {
    const m = downloadsMetadata[id] || { sizeMb: 58.9, quality: '1080p' };
    return sum + (m.quality === '720p' ? (m.sizeMb || 0) : 0);
  }, 0);

  const spaceMp3 = downloads.reduce((sum, id) => {
    const m = downloadsMetadata[id] || { sizeMb: 58.9, quality: '1080p' };
    return sum + (m.quality === 'mp3' ? (m.sizeMb || 0) : 0);
  }, 0);

  const count1080p = downloads.filter(id => (downloadsMetadata[id]?.quality || '1080p') === '1080p').length;
  const count720p = downloads.filter(id => downloadsMetadata[id]?.quality === '720p').length;
  const countMp3 = downloads.filter(id => downloadsMetadata[id]?.quality === 'mp3').length;

  const qualityChartData = [
    { id: '1080p', name: settings.language === 'ar' ? 'فيديو 1080p Full HD' : '1080p Full HD', value: Number(space1080p.toFixed(1)), color: '#2563eb', count: count1080p },
    { id: '720p', name: settings.language === 'ar' ? 'فيديو 720p HD' : '720p HD Ready', value: Number(space720p.toFixed(1)), color: '#10b981', count: count720p },
    { id: 'mp3', name: settings.language === 'ar' ? 'صوت MP3 Audio' : 'MP3 Audio Only', value: Number(spaceMp3.toFixed(1)), color: '#a855f7', count: countMp3 }
  ].filter(item => item.value > 0);

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
        alertHistory={alertHistory}
        onClearAlertHistory={handleClearAlertHistory}
        onMarkAlertsAsRead={handleMarkAlertsAsRead}
        onRemoveAlert={handleRemoveAlert}
        onTriggerToast={triggerToast}
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
          bookmarks={bookmarks}
          onBookmarkClick={handleBookmarkClick}
          onDeleteBookmark={handleDeleteBookmark}
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
              currentUser={currentUser}
              onDeleteVideo={handleDeleteVideo}
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
              isInDownloads={downloads.includes(activeVideo.id)}
              onToggleDownload={() => handleToggleDownload(activeVideo.id)}
              onChannelClick={(chanId) => {
                setActiveChannelFilter(chanId);
                setView('channel');
              }}
              language={settings.language}
              bookmarks={bookmarks}
              onAddBookmark={handleAddBookmark}
              onDeleteBookmark={handleDeleteBookmark}
              seekToTime={seekToTime}
              onSeekComplete={() => setSeekToTime(null)}
            />
          ) : currentView === 'playlists' ? (
            /* Custom user playlists management view */
            <div className="p-4 md:p-6">
              <PlaylistsView
                playlists={playlists}
                onCreatePlaylist={handleCreatePlaylist}
                onUpdatePlaylist={handleUpdatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onToggleVideoInPlaylist={handleToggleVideoInPlaylist}
                allVideos={videos}
                watchLater={watchLater}
                downloads={downloads}
                onVideoSelect={handleVideoSelect}
                language={settings.language === 'ar' ? 'ar' : 'en'}
                askConfirmation={askConfirmation}
              />
            </div>
          ) : currentView === 'live' ? (
            /* Custom Live Streams & Podcasts Hub View */
            <LiveHubView
              language={settings.language === 'ar' ? 'ar' : 'en'}
              currentUser={currentUser}
              onTriggerToast={triggerToast}
            />
          ) : currentView === 'chat' ? (
            /* Custom Chat Hub View for Subscribers & Accounts */
            <ChatHubView
              language={settings.language === 'ar' ? 'ar' : 'en'}
              currentUser={currentUser}
              onTriggerToast={triggerToast}
            />
          ) : (
            /* Grid Feeds (Home, Liked, Uploads, Subscribed channels) */
            <div className="p-4 md:p-6 space-y-6">

              {/* Snapchat-like Stories Feed (Daily Stories) */}
              {!activeChannelFilter && currentView === 'home' && (
                <StoriesSection language={settings.language === 'ar' ? 'ar' : 'en'} currentUser={currentUser} />
              )}
              
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
                    {currentView === 'downloads' && (settings.language === 'ar' ? 'التنزيلات والفيديوهات المحفوظة' : 'Offline Downloads & Saved Videos')}
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
                    {currentView === 'downloads' && (settings.language === 'ar' ? 'استعرض الفيديوهات المحملة محلياً أو المحفوظة للمشاهدة بدون اتصال بالإنترنت.' : 'Browse videos downloaded or saved locally for offline viewing.')}
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
                          const isArabic = settings.language === 'ar';
                          askConfirmation({
                            title: isArabic ? 'مسح سجل المشاهدة' : 'Clear Watch History',
                            message: isArabic 
                              ? 'هل أنت متأكد من رغبتك في مسح سجل المشاهدة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.' 
                              : 'Are you sure you want to clear your entire watch history? This action cannot be undone.',
                            onConfirm: () => {
                              setHistory([]);
                            },
                            confirmText: isArabic ? 'نعم، امسح السجل' : 'Yes, clear history',
                            cancelText: isArabic ? 'إلغاء' : 'Cancel'
                          });
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
                        const isArabic = settings.language === 'ar';
                        askConfirmation({
                          title: isArabic ? 'مسح قائمة المشاهدة لاحقاً' : 'Clear Watch Later',
                          message: isArabic 
                            ? 'هل أنت متأكد من رغبتك في تفريغ قائمة المشاهدة لاحقاً بالكامل؟' 
                            : 'Are you sure you want to empty your Watch Later list?',
                          onConfirm: () => {
                            setWatchLater([]);
                          },
                          confirmText: isArabic ? 'نعم، قم بالتفريغ' : 'Yes, empty list',
                          cancelText: isArabic ? 'إلغاء' : 'Cancel'
                        });
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-1.5 rounded-full transition-colors active:scale-95 border border-red-200 cursor-pointer"
                    >
                      Clear Watch Later
                    </button>
                  )}
                  {currentView === 'downloads' && (
                    <>
                      {/* Group By Selector */}
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm text-xs text-gray-700">
                        <span className="font-semibold text-gray-500 font-sans">
                          {settings.language === 'ar' ? 'تجميع حسب:' : 'Group By:'}
                        </span>
                        <select
                          id="downloads-group-select"
                          value={downloadsGroupMode}
                          onChange={(e) => setDownloadsGroupMode(e.target.value as any)}
                          className="bg-transparent font-bold focus:outline-none cursor-pointer pr-1 font-sans text-gray-800"
                        >
                          <option value="none">{settings.language === 'ar' ? 'بدون تجميع (سرد)' : 'None (Flat List)'}</option>
                          <option value="category">{settings.language === 'ar' ? 'تصنيف الفيديو' : 'Video Category'}</option>
                          <option value="folder">{settings.language === 'ar' ? 'مجلدات مخصصة' : 'Custom Folders'}</option>
                        </select>
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm text-xs text-gray-700">
                        <span className="font-semibold text-gray-500 font-sans">
                          {settings.language === 'ar' ? 'ترتيب:' : 'Sort:'}
                        </span>
                        <select
                          id="downloads-sort-select"
                          value={downloadsSort}
                          onChange={(e) => setDownloadsSort(e.target.value as any)}
                          className="bg-transparent font-bold focus:outline-none cursor-pointer pr-1 font-sans text-gray-800"
                        >
                          <option value="date">{settings.language === 'ar' ? 'تاريخ التنزيل' : 'Date Downloaded'}</option>
                          <option value="size">{settings.language === 'ar' ? 'حجم الملف' : 'File Size'}</option>
                          <option value="quality">{settings.language === 'ar' ? 'الجودة (1080p/720p/MP3)' : 'Quality (1080p/720p/MP3)'}</option>
                        </select>
                      </div>

                      {/* Search Bar */}
                      <div className="relative min-w-[200px] sm:min-w-[260px] md:min-w-[300px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          id="offline-search-input"
                          type="text"
                          value={offlineSearchQuery}
                          onChange={(e) => setOfflineSearchQuery(e.target.value)}
                          placeholder={settings.language === 'ar' ? 'بحث في التنزيلات المحفوظة...' : 'Search offline downloads...'}
                          className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-xs"
                        />
                        {offlineSearchQuery && (
                          <button
                            onClick={() => setOfflineSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {currentView === 'downloads' && downloads.length > 0 && (
                    <button
                      id="clear-downloads-btn"
                      onClick={() => {
                        const isArabic = settings.language === 'ar';
                        askConfirmation({
                          title: isArabic ? 'مسح التنزيلات' : 'Clear Downloads',
                          message: isArabic
                            ? 'هل أنت متأكد من رغبتك في حذف جميع الفيديوهات من قائمة التنزيلات؟'
                            : 'Are you sure you want to clear your downloads list?',
                          onConfirm: () => {
                            setDownloads([]);
                          },
                          confirmText: isArabic ? 'نعم، امسح الكل' : 'Yes, clear all',
                          cancelText: isArabic ? 'إلغاء' : 'Cancel'
                        });
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-1.5 rounded-full transition-colors active:scale-95 border border-red-200 cursor-pointer whitespace-nowrap"
                    >
                      {settings.language === 'ar' ? 'حذف جميع التنزيلات 🗑️' : 'Clear All Downloads 🗑️'}
                    </button>
                  )}
                  <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    <span>LOCAL PLAYBACK: {filteredVideos.length} STREAMABLE</span>
                  </div>
                </div>
              </div>

              {/* Storage & Space Optimization Dashboard */}
              {currentView === 'downloads' && downloads.length > 0 && (
                <div className="mb-8 p-5 bg-white border border-gray-200 rounded-3xl shadow-xs space-y-5 font-sans">
                  {/* Dashboard Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-1.5">
                          {settings.language === 'ar' ? 'تحسين مساحة التخزين المحلية' : 'Local Storage Space & Optimization'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {settings.language === 'ar'
                            ? 'إدارة التنزيلات غير المتصلة بالإنترنت وتحسين مساحة التخزين في متصفحك.'
                            : 'Manage offline downloads and reclaim space from cached video assets.'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Compact stats overview */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-1.5">
                        <span className="font-sans font-medium text-gray-400">
                          {settings.language === 'ar' ? 'إجمالي المساحة المستخدمة:' : 'Total Space Used:'}
                        </span>
                        <span className="font-bold text-gray-900">{totalSpaceMb.toFixed(1)} MB</span>
                      </div>

                      <button
                        id="export-csv-btn"
                        onClick={handleExportToCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border border-green-200/60 rounded-lg text-xs font-sans font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                        title="Export current offline downloaded videos metadata to CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                        <span>
                          {settings.language === 'ar' ? 'تصدير إلى CSV 📊' : 'Export to CSV'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Folders Management Panel */}
                  {downloadsGroupMode === 'folder' && (
                    <div className="bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 p-4 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📁</span>
                            {settings.language === 'ar' ? 'إدارة المجلدات المخصصة والمواضيع' : 'Custom Folders & Topics Manager'}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                            {settings.language === 'ar'
                              ? 'قم بإنشاء وتسمية مجلدات مخصصة لتصنيف الفيديوهات المحفوظة والتحكم بها بسهولة.'
                              : 'Create and organize custom folders to keep your saved videos categorized by topic.'}
                          </p>
                        </div>
                        
                        {/* Inline folder creation */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={settings.language === 'ar' ? 'اسم مجلد جديد...' : 'New folder name...'}
                            value={newFolderInput}
                            onChange={(e) => setNewFolderInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmed = newFolderInput.trim();
                                if (trimmed) {
                                  setDownloadsFolders(prev => ({ ...prev, [`folder_${Date.now()}`]: trimmed }));
                                  setNewFolderInput('');
                                  triggerToast(
                                    settings.language === 'ar' ? `تم إنشاء المجلد "${trimmed}" بنجاح! 📁` : `Folder "${trimmed}" created! 📁`,
                                    'success'
                                  );
                                }
                              }
                            }}
                            className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 w-44"
                          />
                          <button
                            onClick={() => {
                              const trimmed = newFolderInput.trim();
                              if (trimmed) {
                                setDownloadsFolders(prev => ({ ...prev, [`folder_${Date.now()}`]: trimmed }));
                                setNewFolderInput('');
                                triggerToast(
                                  settings.language === 'ar' ? `تم إنشاء المجلد "${trimmed}" بنجاح! 📁` : `Folder "${trimmed}" created! 📁`,
                                  'success'
                                );
                              } else {
                                triggerToast(
                                  settings.language === 'ar' ? 'يرجى كتابة اسم مجلد صالح!' : 'Please enter a valid folder name!',
                                  'error'
                                );
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            {settings.language === 'ar' ? 'إضافة مجلد' : 'Add Folder'}
                          </button>
                        </div>
                      </div>

                      {/* Display active custom folders list as tags with clear buttons */}
                      {(() => {
                        const existingFolders = Object.values(downloadsFolders).filter((v, i, self) => v && self.indexOf(v) === i);
                        if (existingFolders.length === 0) {
                          return (
                            <p className="text-[11px] text-gray-400 italic">
                              {settings.language === 'ar' ? 'لا توجد مجلدات نشطة بعد. أضف مجلداً أعلاه أو قم بتصنيف أي فيديو مباشرة!' : 'No folders created yet. Add a folder above or classify any video card directly!'}
                            </p>
                          );
                        }
                        return (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {existingFolders.map(folder => (
                              <div key={folder} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/60 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs">
                                <span>📁 {folder}</span>
                                <button
                                  onClick={() => {
                                    askConfirmation({
                                      title: settings.language === 'ar' ? 'حذف المجلد' : 'Delete Folder',
                                      message: settings.language === 'ar'
                                        ? `هل أنت متأكد من رغبتك في حذف مجلد "${folder}"؟ سيتم إلغاء تصنيف جميع الفيديوهات الموجودة فيه.`
                                        : `Are you sure you want to delete the folder "${folder}"? This will unassign all videos inside it.`,
                                      onConfirm: () => {
                                        setDownloadsFolders(prev => {
                                          const updated = { ...prev };
                                          Object.keys(updated).forEach(k => {
                                            if (updated[k] === folder) {
                                              delete updated[k];
                                            }
                                          });
                                          return updated;
                                        });
                                        triggerToast(
                                          settings.language === 'ar' ? 'تم حذف المجلد بنجاح' : 'Folder deleted successfully',
                                          'info'
                                        );
                                      },
                                      confirmText: settings.language === 'ar' ? 'نعم، احذفه' : 'Yes, delete',
                                      cancelText: settings.language === 'ar' ? 'إلغاء' : 'Cancel'
                                    });
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer text-xs font-bold leading-none"
                                  title={settings.language === 'ar' ? 'حذف المجلد' : 'Delete Folder'}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Organizing tip */}
                  {downloadsGroupMode !== 'none' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50/80 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-2xl px-4 py-3 text-xs text-red-800 dark:text-red-300 flex items-center gap-2.5 shadow-3xs"
                    >
                      <span className="text-base shrink-0">💡</span>
                      <p className="leading-relaxed">
                        {settings.language === 'ar'
                          ? 'تنظيم سريع وسلس: يمكنك الآن سحب أي بطاقة فيديو وإفلاتها مباشرة فوق اسم المجلد/التصنيف لتغيير ترتيبه وتصنيفه فوراً!'
                          : 'Pro Tip: You can organize your library by dragging any video card and dropping it directly onto a folder/category group!'}
                      </p>
                    </motion.div>
                  )}

                  {/* Grid Layout containing quality chart and sandbox optimizer tools */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left side: Pie Chart visualization (5 cols) */}
                    <div className="lg:col-span-5 bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                        {settings.language === 'ar' ? 'توزيع جودة الملفات والمساحة' : 'Storage Quality Distribution'}
                      </h4>
                      <p className="text-[11px] text-gray-500 mb-4">
                        {settings.language === 'ar'
                          ? 'النسبة المئوية ومساحة التخزين المستهلكة من قبل كل جودة ملف.'
                          : 'Proportional space used by different video quality categories.'}
                      </p>

                      {/* Donut Chart container */}
                      <div className="relative h-[220px] w-full flex items-center justify-center bg-white rounded-2xl border border-gray-100 p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={qualityChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {qualityChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => [`${value} MB`, settings.language === 'ar' ? 'الحجم' : 'Size']}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'sans-serif', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Donut Center Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                            {settings.language === 'ar' ? 'مستغل' : 'Used'}
                          </span>
                          <span className="text-sm font-mono font-bold text-gray-900 mt-0.5">
                            {totalSpaceMb.toFixed(1)} MB
                          </span>
                          <span className="text-[8px] text-gray-500 font-medium">
                            {downloads.length} {settings.language === 'ar' ? 'ملفات' : 'Files'}
                          </span>
                        </div>
                      </div>

                      {/* Detail list table */}
                      <div className="mt-4 space-y-2 bg-white border border-gray-100 p-3.5 rounded-2xl">
                        {[
                          { 
                            id: '1080p',
                            name: settings.language === 'ar' ? 'فيديو 1080p Full HD' : '1080p Full HD', 
                            value: space1080p, 
                            color: '#2563eb', 
                            count: count1080p 
                          },
                          { 
                            id: '720p',
                            name: settings.language === 'ar' ? 'فيديو 720p HD' : '720p HD Ready', 
                            value: space720p, 
                            color: '#10b981', 
                            count: count720p 
                          },
                          { 
                            id: 'mp3',
                            name: settings.language === 'ar' ? 'صوت MP3 Audio' : 'MP3 Audio Only', 
                            value: spaceMp3, 
                            color: '#a855f7', 
                            count: countMp3 
                          }
                        ].map((entry) => {
                          const pct = totalSpaceMb > 0 ? ((entry.value / totalSpaceMb) * 100).toFixed(0) : '0';
                          return (
                            <div key={entry.id} className="flex items-center justify-between text-[11px] border-b border-gray-100/60 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="font-semibold text-gray-700">{entry.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono">({entry.count})</span>
                              </div>
                              <div className="text-right font-mono text-gray-900 font-medium flex items-center gap-1.5">
                                <span>{entry.value.toFixed(1)} MB</span>
                                <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-100 px-1 py-0.5 rounded font-semibold">{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Auto-Cleanup Schedule Card */}
                      <div className="mt-5 space-y-4 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/60 p-4 rounded-2xl shadow-xs">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🧹</span>
                            {settings.language === 'ar' ? 'جدولة التنظيف التلقائي' : 'Auto-Cleanup Scheduler'}
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {settings.language === 'ar'
                              ? 'حافظ على سعة التخزين نظيفة تلقائياً عن طريق إزالة الملفات القديمة دورياً.'
                              : 'Keep local sandbox storage lean by automatically purging expired downloads on a recurring cycle.'}
                          </p>
                        </div>

                        {/* Enable Toggle Switch */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/40">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">
                              {settings.language === 'ar' ? 'تفعيل التنظيف الذاتي' : 'Enable Automated Purging'}
                            </span>
                            <p className="text-[9px] text-gray-400">
                              {autoCleanupEnabled 
                                ? (settings.language === 'ar' ? 'الجدولة نشطة وستعمل في الخلفية' : 'Background scheduler is ACTIVE') 
                                : (settings.language === 'ar' ? 'معطل (يتطلب تنظيفاً يدوياً)' : 'Scheduler is currently DISABLED')}
                            </p>
                          </div>
                          <button
                            id="autocleanup-toggle"
                            onClick={() => {
                              setAutoCleanupEnabled(!autoCleanupEnabled);
                              triggerToast(
                                settings.language === 'ar'
                                  ? (!autoCleanupEnabled ? 'تم تفعيل جدولة التنظيف التلقائي! 🧹' : 'تم تعطيل التنظيف التلقائي.')
                                  : (!autoCleanupEnabled ? 'Auto-cleanup schedule activated! 🧹' : 'Auto-cleanup scheduler disabled.'),
                                'info'
                              );
                            }}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              autoCleanupEnabled ? 'bg-red-600' : 'bg-gray-200 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                autoCleanupEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Scheduler Settings (always visible or expandable for rich interaction) */}
                        <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-zinc-850">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase dark:text-zinc-400">
                                {settings.language === 'ar' ? 'دورة التنظيف:' : 'Purge Cycle:'}
                              </label>
                              <select
                                id="autocleanup-schedule-select"
                                value={autoCleanupSchedule}
                                onChange={(e) => {
                                  setAutoCleanupSchedule(e.target.value as any);
                                  triggerToast(
                                    settings.language === 'ar'
                                      ? `تم تغيير الدورة إلى: ${e.target.value === 'daily' ? 'يومي' : e.target.value === 'weekly' ? 'أسبوعي' : 'شهري'}`
                                      : `Cleanup frequency updated to ${e.target.value}!`,
                                    'success'
                                  );
                                }}
                                disabled={!autoCleanupEnabled}
                                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-800 dark:text-zinc-200 focus:outline-none disabled:opacity-50 font-sans"
                              >
                                <option value="daily">{settings.language === 'ar' ? '🔄 يومياً' : '🔄 Daily'}</option>
                                <option value="weekly">{settings.language === 'ar' ? '📅 أسبوعياً' : '📅 Weekly'}</option>
                                <option value="monthly">{settings.language === 'ar' ? '📆 شهرياً' : '📆 Monthly'}</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase dark:text-zinc-400">
                                {settings.language === 'ar' ? 'مدة الاحتفاظ القصوى:' : 'Max Age Limit:'}
                              </label>
                              <select
                                id="autocleanup-threshold-select"
                                value={cleanupThresholdDays}
                                onChange={(e) => {
                                  setCleanupThresholdDays(parseInt(e.target.value, 10));
                                  triggerToast(
                                    settings.language === 'ar'
                                      ? `تم تعيين مدة الاحتفاظ إلى ${e.target.value} أيام`
                                      : `Retention threshold updated to ${e.target.value} days!`,
                                    'success'
                                  );
                                }}
                                disabled={!autoCleanupEnabled}
                                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-800 dark:text-zinc-200 focus:outline-none disabled:opacity-50 font-sans"
                              >
                                <option value="1">1 {settings.language === 'ar' ? 'يوم واحد' : 'Day'}</option>
                                <option value="3">3 {settings.language === 'ar' ? 'أيام' : 'Days'}</option>
                                <option value="7">7 {settings.language === 'ar' ? 'أيام (أسبوع)' : 'Days (1w)'}</option>
                                <option value="14">14 {settings.language === 'ar' ? 'يوماً (أسبوعين)' : 'Days (2w)'}</option>
                                <option value="30">30 {settings.language === 'ar' ? 'يوماً (شهر)' : 'Days (1m)'}</option>
                              </select>
                            </div>
                          </div>

                          {/* Last run indicator */}
                          <div className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-zinc-950/20 px-2.5 py-1.5 rounded-lg border border-slate-100/40 dark:border-zinc-850">
                            <span className="text-gray-500 dark:text-zinc-400 font-medium">
                              {settings.language === 'ar' ? 'آخر تشغيل للجدولة:' : 'Last Scheduler Check:'}
                            </span>
                            <span className="font-mono text-gray-900 dark:text-zinc-200 font-bold">
                              {lastAutoCleanupRun 
                                ? new Date(lastAutoCleanupRun).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date(lastAutoCleanupRun).toLocaleDateString()
                                : (settings.language === 'ar' ? 'لم يتم التشغيل بعد' : 'Never Run')}
                            </span>
                          </div>

                          {/* Simulation & Tester Playground Sandbox Controls */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-red-500 font-sans">
                                {settings.language === 'ar' ? 'محاكاة بيئة التطوير (Sandbox)' : 'Dev Simulation Tools'}
                              </span>
                              <span className="text-[8px] bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase select-none">
                                Tester
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                id="autocleanup-check-btn"
                                onClick={handleTriggerManualAutoCleanupCheck}
                                className="py-2 px-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750/80 border border-gray-200 dark:border-zinc-700/60 rounded-xl text-[10px] font-bold text-gray-800 dark:text-zinc-200 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 shadow-2xs"
                                title="Instantly trigger a manual run to test retention purging"
                              >
                                <span>🔍</span>
                                {settings.language === 'ar' ? 'تشغيل الفحص الآن' : 'Run Check Now'}
                              </button>

                              <button
                                id="autocleanup-sim-btn"
                                onClick={() => simulateAutoCleanupTime(autoCleanupSchedule === 'weekly' ? 7 : autoCleanupSchedule === 'monthly' ? 30 : 1)}
                                className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-[10px] font-bold text-amber-800 dark:text-amber-400 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 shadow-2xs"
                                title="Trick the system into thinking the schedule interval has expired to fire background cleanup"
                              >
                                <span>⏳</span>
                                {settings.language === 'ar' 
                                  ? `محاكاة مرور ${autoCleanupSchedule === 'weekly' ? '٧' : autoCleanupSchedule === 'monthly' ? '٣٠' : '١'} أيام`
                                  : `Simulate ${autoCleanupSchedule === 'weekly' ? '7d' : autoCleanupSchedule === 'monthly' ? '30d' : '1d'} Passing`}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Alerts and Files list (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Recommendations / Alert Banner */}
                      <AnimatePresence mode="wait">
                        {oldDownloadedIds.length > 0 ? (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-amber-900">
                                  {settings.language === 'ar'
                                    ? `موجه التوفير: تم العثور على ${oldDownloadedIds.length} تنزيلات قديمة!`
                                    : `Cleanup Alert: ${oldDownloadedIds.length} old downloads detected!`}
                                </p>
                                <p className="text-xs text-amber-700">
                                  {settings.language === 'ar'
                                    ? `هذه الفيديوهات تم تنزيلها منذ أكثر من ${cleanupThresholdDays} أيام وتشغل مساحة قدرها ${oldSpaceMb.toFixed(1)} ميجابايت من التخزين المؤقت المحلي.`
                                    : `These files were saved more than ${cleanupThresholdDays} days ago and occupy ${oldSpaceMb.toFixed(1)} MB. Optimizing them will free up cache space.`}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleCleanupOldDownloads}
                              className="self-start sm:self-center bg-amber-600 hover:bg-amber-750 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-sm shadow-amber-600/10 hover:shadow-amber-600/20 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {settings.language === 'ar' ? 'تنظيف الفيديوهات القديمة تلقائياً' : 'Auto-Purge Old Downloads'}
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center gap-3 text-emerald-800"
                          >
                            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-emerald-900">
                                {settings.language === 'ar' ? 'مساحة التخزين الخاصة بك ممتازة!' : 'Storage Status: Excellent!'}
                              </p>
                              <p className="text-xs text-emerald-700">
                                {settings.language === 'ar'
                                  ? `جميع تنزيلاتك المحفوظة حديثة ومحدثة (خلال أقل من ${cleanupThresholdDays} أيام).`
                                  : `No old or stale offline downloads found exceeding your ${cleanupThresholdDays}-day retention threshold.`}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Sandboxed File-by-File Optimization Playground */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                            <Sliders className="w-3.5 h-3.5 text-gray-500" />
                            {settings.language === 'ar' ? 'تفاصيل الملفات وأدوات التحسين والمحاكاة' : 'Offline Files & Sandbox Optimization'}
                          </h4>
                          <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-sans font-semibold">
                            {settings.language === 'ar' ? 'مساحة التخزين النشطة' : 'Local Sandbox Storage'}
                          </span>
                        </div>

                        <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto bg-white">
                          {[...downloads].sort((idA, idB) => {
                            const a = videos.find(v => v.id === idA);
                            const b = videos.find(v => v.id === idB);
                            if (!a || !b) return 0;
                            
                            if (downloadsSort === 'date') {
                              const metaA = downloadsMetadata[idA] || { downloadedAt: '1970-01-01T00:00:00.000Z' };
                              const metaB = downloadsMetadata[idB] || { downloadedAt: '1970-01-01T00:00:00.000Z' };
                              return new Date(metaB.downloadedAt).getTime() - new Date(metaA.downloadedAt).getTime();
                            } else if (downloadsSort === 'size') {
                              const metaA = downloadsMetadata[idA] || { sizeMb: 0 };
                              const metaB = downloadsMetadata[idB] || { sizeMb: 0 };
                              return metaB.sizeMb - metaA.sizeMb;
                            } else if (downloadsSort === 'quality') {
                              const metaA = downloadsMetadata[idA] || { quality: '720p' };
                              const metaB = downloadsMetadata[idB] || { quality: '720p' };
                              const priority = { '1080p': 3, '720p': 2, 'mp3': 1 };
                              return (priority[metaB.quality] || 0) - (priority[metaA.quality] || 0);
                            }
                            return 0;
                          }).map(id => {
                            const video = videos.find(v => v.id === id);
                            if (!video) return null;
                            const meta = downloadsMetadata[id] || { downloadedAt: new Date().toISOString(), sizeMb: 58.9, quality: '1080p' };
                            const downloadDate = new Date(meta.downloadedAt);
                            const daysOld = Math.floor((now.getTime() - downloadDate.getTime()) / (1000 * 60 * 60 * 24));
                            const isOld = daysOld > cleanupThresholdDays;
                            const isCurrentlyCompressing = compressingVideoId === id;

                            return (
                              <div key={id} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                                {/* Video Title and Metadata */}
                                <div className="space-y-1 max-w-md flex-1">
                                  <p className="font-sans font-bold text-gray-900 text-xs md:text-sm line-clamp-1">{video.title}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs">
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                                      isOld ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {isOld 
                                        ? (settings.language === 'ar' ? `${daysOld} أيام (قديم ⚠️)` : `${daysOld} days old (Stale ⚠️)`)
                                        : (settings.language === 'ar' ? `${daysOld} أيام (حديث)` : `${daysOld} days old (New)`)}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500 font-mono">
                                      {settings.language === 'ar' ? 'تاريخ التنزيل:' : 'Saved:'} {downloadDate.toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500 font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[10px]">
                                      {meta.quality.toUpperCase()} • {meta.sizeMb.toFixed(1)} MB
                                    </span>
                                  </div>
                                </div>

                                {/* Optimizer Actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {isCurrentlyCompressing ? (
                                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50/60 px-3 py-1.5 rounded-xl border border-red-100 animate-pulse">
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>
                                        {settings.language === 'ar'
                                          ? `جاري تحويل الملف إلى ${compressingTarget === 'mp3' ? 'صوت MP3' : 'فيديو HD'}...`
                                          : `Converting to ${compressingTarget?.toUpperCase()}...`}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Test/Simulation shortcut: make old */}
                                      {!isOld && (
                                        <button
                                          onClick={() => handleSimulateOldDownload(id, 10)}
                                          className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                                          title="Simulate this download being 10 days old to test the cleanup filter"
                                        >
                                          {settings.language === 'ar' ? '🕒 محاكاة تاريخ قديم' : '🕒 Age to 10d'}
                                        </button>
                                      )}

                                      {/* Compress option if quality is 1080p */}
                                      {meta.quality === '1080p' && (
                                        <button
                                          onClick={() => startCompressionSimulation(id, '720p')}
                                          className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                                        >
                                          {settings.language === 'ar' ? '🗜️ ضغط لـ 720p' : '🗜️ Compress to 720p'}
                                        </button>
                                      )}

                                      {/* Extract MP3 Option */}
                                      {meta.quality !== 'mp3' && (
                                        <button
                                          onClick={() => startCompressionSimulation(id, 'mp3')}
                                          className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
                                        >
                                          {settings.language === 'ar' ? '🎵 استخراج MP3' : '🎵 Extract MP3'}
                                        </button>
                                      )}

                                      {/* Quick Delete Option per downloaded item */}
                                      <button
                                        onClick={() => handleToggleDownload(id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-100 transition-all cursor-pointer"
                                        title="Delete Download"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                          : currentView === 'downloads'
                          ? (downloads.length === 0 ? 'قائمة التنزيلات فارغة 📥' : 'لم يتم العثور على أي فيديوهات مطابقة في التنزيلات 🔍')
                          : currentView === 'home'
                          ? 'الشاشة الرئيسية خالية من الفيديوهات 📺'
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
                          : currentView === 'downloads'
                          ? (downloads.length === 0 ? 'Your downloads folder is empty 📥' : 'No downloaded videos matched your search query 🔍')
                          : currentView === 'home'
                          ? 'Home screen is empty of videos 📺'
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
                          : currentView === 'downloads'
                          ? (downloads.length === 0
                            ? 'اضغط على زر "تنزيل" 📥 أثناء تشغيل أي فيديو أو من بطاقة الفيديو لحفظه والاستمتاع به.'
                            : 'حاول إدخال كلمات بحث مختلفة أو مسح حقل البحث لاستعادة جميع الفيديوهات المنزلة.')
                          : currentView === 'home'
                          ? 'استخدم شريط البحث في الأعلى لاستكشاف فيديوهات حية من الويب أو قم برفع فيديوهات جديدة لتبدأ ظهورها هنا.'
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
                          : currentView === 'downloads'
                          ? (downloads.length === 0
                            ? 'Click the "Download" button 📥 on any video player or video card to save it for offline view.'
                            : 'Try typing different keywords or clear your offline search query to see all downloaded videos.')
                          : currentView === 'home'
                          ? 'Use the search bar above to discover live web videos, or upload your own videos to see them here.'
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
                              const isOwnVideo = currentUser && (
                                video.channelId === currentUser.username ||
                                video.channelId === 'user_channel' ||
                                video.channelId === 'chan-current-mock' ||
                                video.channelId === 'usr-current'
                              );
                              return (
                                <VideoCard
                                  key={video.id}
                                  video={video}
                                  onClick={() => handleVideoSelect(video)}
                                  watchedAt={historyItem?.watchedAt}
                                  progress={historyItem?.progress}
                                  onRemove={() => handleRemoveFromHistory(video.id)}
                                  onDelete={isOwnVideo ? () => handleDeleteVideo(video.id) : undefined}
                                  isInWatchLater={watchLater.includes(video.id)}
                                  onToggleWatchLater={() => handleToggleWatchLater(video.id)}
                                  isInDownloads={downloads.includes(video.id)}
                                  onToggleDownload={() => handleToggleDownload(video.id)}
                                  downloadQuality={downloadsMetadata[video.id]?.quality}
                                  onChannelClick={(chanId) => {
                                    setActiveChannelFilter(chanId);
                                    setView('channel');
                                  }}
                                  onShare={handleShare}
                                  onWatchAgain={() => handleWatchAgain(video)}
                                  language={settings.language}
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : currentView === 'downloads' && downloadsGroupMode !== 'none' ? (
                <div className="space-y-10" id="grouped-downloads-container">
                  {(() => {
                    const groups: Record<string, Video[]> = {};
                    
                    filteredVideos.forEach(video => {
                      let key = '';
                      if (downloadsGroupMode === 'category') {
                        key = video.category || (settings.language === 'ar' ? 'غير مصنف' : 'Uncategorized');
                      } else {
                        key = downloadsFolders[video.id] || (settings.language === 'ar' ? 'غير مصنف' : 'Unassigned Assets');
                      }
                      
                      if (!groups[key]) {
                        groups[key] = [];
                      }
                      groups[key].push(video);
                    });

                    const groupKeys = Object.keys(groups);
                    if (groupKeys.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-400">
                          {settings.language === 'ar' ? 'لا توجد تنزيلات لعرضها' : 'No downloads to display'}
                        </div>
                      );
                    }

                    return groupKeys.map(groupKey => {
                      const groupVideos = groups[groupKey];
                      const groupSizeMb = groupVideos.reduce((sum, v) => sum + (downloadsMetadata[v.id]?.sizeMb || 58.9), 0);
                      
                      return (
                        <motion.div
                          key={groupKey}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            scale: draggedOverGroup === groupKey ? 1.015 : 1
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className={`space-y-4 p-5 rounded-2xl border transition-all duration-200 shadow-xs animate-fade-in ${
                            draggedOverGroup === groupKey
                              ? 'bg-red-500/10 border-red-500/40 dark:bg-red-500/5 dark:border-red-500/30 ring-2 ring-red-500/20 shadow-md'
                              : 'bg-gray-50/40 border-gray-150 dark:bg-zinc-900/10 dark:border-zinc-800/40'
                          }`}
                          id={`download-group-${groupKey.toLowerCase().replace(' ', '-')}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setDraggedOverGroup(groupKey);
                          }}
                          onDragLeave={() => {
                            if (draggedOverGroup === groupKey) {
                              setDraggedOverGroup(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDraggedOverGroup(null);
                            const videoId = e.dataTransfer.getData('text/plain');
                            if (!videoId) return;

                            if (downloadsGroupMode === 'category') {
                              handleAssignVideoToCategory(videoId, groupKey);
                            } else if (downloadsGroupMode === 'folder') {
                              const isUnassigned = groupKey === (settings.language === 'ar' ? 'غير مصنف' : 'Unassigned Assets');
                              handleAssignVideoToFolder(videoId, isUnassigned ? '' : groupKey);
                            }
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-zinc-800/80">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">📁</span>
                              <h3 className="font-sans font-bold text-base text-gray-800 dark:text-zinc-100 tracking-tight">
                                {groupKey}
                              </h3>
                              <span className="font-mono text-xs text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/60 px-2.5 py-0.5 rounded-full shadow-2xs font-semibold">
                                {groupVideos.length} {groupVideos.length === 1 ? (settings.language === 'ar' ? 'فيديو' : 'video') : (settings.language === 'ar' ? 'فيديوهات' : 'videos')}
                              </span>
                              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 px-2.5 py-0.5 rounded-full shadow-2xs font-bold">
                                {groupSizeMb.toFixed(1)} MB
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groupVideos.map((video) => {
                              return (
                                <VideoCard
                                  key={video.id}
                                  video={video}
                                  onClick={() => handleVideoSelect(video)}
                                  onRemove={() => handleToggleDownload(video.id)}
                                  isInWatchLater={watchLater.includes(video.id)}
                                  onToggleWatchLater={() => handleToggleWatchLater(video.id)}
                                  isInDownloads={downloads.includes(video.id)}
                                  onToggleDownload={() => handleToggleDownload(video.id)}
                                  downloadQuality={downloadsMetadata[video.id]?.quality}
                                  onChannelClick={(chanId) => {
                                    setActiveChannelFilter(chanId);
                                    setView('channel');
                                  }}
                                  onShare={handleShare}
                                  language={settings.language}
                                  folderName={downloadsFolders[video.id]}
                                  availableFolders={(Object.values(downloadsFolders) as string[]).filter((v, i, self) => v && self.indexOf(v) === i)}
                                  onAssignFolder={(folder) => handleAssignVideoToFolder(video.id, folder)}
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
                    const isOwnVideo = currentUser && (
                      video.channelId === currentUser.username ||
                      video.channelId === 'user_channel' ||
                      video.channelId === 'chan-current-mock' ||
                      video.channelId === 'usr-current'
                    );
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
                            : currentView === 'downloads'
                            ? () => handleToggleDownload(video.id)
                            : undefined
                        }
                        onDelete={isOwnVideo ? () => handleDeleteVideo(video.id) : undefined}
                        isInWatchLater={watchLater.includes(video.id)}
                        onToggleWatchLater={() => handleToggleWatchLater(video.id)}
                        isInDownloads={downloads.includes(video.id)}
                        onToggleDownload={() => handleToggleDownload(video.id)}
                        downloadQuality={downloadsMetadata[video.id]?.quality}
                        onChannelClick={(chanId) => {
                          setActiveChannelFilter(chanId);
                          setView('channel');
                        }}
                        onShare={handleShare}
                        language={settings.language}
                        folderName={downloadsFolders[video.id]}
                        availableFolders={(Object.values(downloadsFolders) as string[]).filter((v, i, self) => v && self.indexOf(v) === i)}
                        onAssignFolder={(folder) => handleAssignVideoToFolder(video.id, folder)}
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
          currentUser={currentUser}
          language={settings.language}
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
            setVideos(prev => prev.map(v => {
              if (v.channelId === user.username || v.channelId === 'user_channel' || v.channelId === 'chan-current-mock' || v.channelId === 'usr-current') {
                return {
                  ...v,
                  channelName: user.displayName,
                  channelAvatar: user.avatarUrl
                };
              }
              return v;
            }));
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

      {/* 9. Premium Confirm Modal System */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        language={settings.language}
      />

      {/* 11. Custom Create New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-sans"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-base md:text-lg">
                {settings.language === 'ar' ? 'إنشاء مجلد مخصص جديد' : 'Create New Custom Folder'}
              </h3>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {settings.language === 'ar'
                ? 'أدخل اسماً جديداً للمجلد لتصنيف هذا التنزيل وحفظه به.'
                : 'Enter a name for the folder to save and classify this downloaded asset.'}
            </p>

            <input
              type="text"
              autoFocus
              value={newFolderInput}
              onChange={(e) => setNewFolderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNewFolder();
                }
              }}
              placeholder={settings.language === 'ar' ? 'أدخل اسم المجلد (مثال: البرمجة، الطبخ)...' : 'Folder name (e.g., Coding, Music)...'}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:text-zinc-100 font-medium"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderVideoId(null);
                  setNewFolderInput('');
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-700 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {settings.language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateNewFolder}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
              >
                {settings.language === 'ar' ? 'إنشاء وتعيين' : 'Create & Assign'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 10. Floating Picture-in-Picture Mini Player */}
      <AnimatePresence>
        {activeVideo && currentView !== 'watch' && !isMiniPlayerClosed && (
          <MiniPlayer
            video={activeVideo}
            isPlaying={miniPlayerPlaying}
            isMuted={miniPlayerMuted}
            onTogglePlay={() => setMiniPlayerPlaying(!miniPlayerPlaying)}
            onToggleMute={() => setMiniPlayerMuted(!miniPlayerMuted)}
            onExpand={() => setView('watch')}
            onClose={() => {
              setIsMiniPlayerClosed(true);
              triggerToast(
                settings.language === 'ar' 
                  ? 'تم إغلاق المشغل المصغر 📺' 
                  : 'Mini Player closed 📺',
                'info'
              );
            }}
            language={settings.language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
