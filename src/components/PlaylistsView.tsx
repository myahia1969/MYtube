import React, { useState } from 'react';
import { Playlist, Video } from '../types';
import { 
  FolderHeart, Plus, Trash2, Edit3, ArrowLeft, Play, Clock, 
  Download, ListPlus, CheckSquare, Square, X, Calendar, FolderOpen, Heart,
  WifiOff, Shuffle, ListMusic, Layers, ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VideoCard from './VideoCard';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => void;
  onUpdatePlaylist: (id: string, name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onToggleVideoInPlaylist: (playlistId: string, videoId: string) => void;
  allVideos: Video[];
  watchLater: string[];
  downloads: string[];
  onVideoSelect: (video: Video) => void;
  language?: 'en' | 'ar';
  askConfirmation?: (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => void;
}

export default function PlaylistsView({
  playlists,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onToggleVideoInPlaylist,
  allVideos,
  watchLater,
  downloads,
  onVideoSelect,
  language = 'en',
  askConfirmation,
}: PlaylistsViewProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);

  // Form states
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Active Tab Selection
  const [activeTab, setActiveTab] = useState<'custom' | 'offline'>('custom');

  // Search filter for downloaded videos in pool
  const [downloadsSearch, setDownloadsSearch] = useState('');

  // Offline Playback Queue State loaded/stored in localStorage
  const [offlineQueue, setOfflineQueue] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('offline_playback_queue');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // filter to make sure they are still downloaded
          return parsed.filter(id => downloads.includes(id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Keep offline queue updated if downloads change
  React.useEffect(() => {
    const validQueue = offlineQueue.filter(id => downloads.includes(id));
    if (validQueue.length !== offlineQueue.length) {
      saveQueue(validQueue);
    }
  }, [downloads]);

  // Update localStorage when queue changes
  const saveQueue = (newQueue: string[]) => {
    setOfflineQueue(newQueue);
    try {
      localStorage.setItem('offline_playback_queue', JSON.stringify(newQueue));
    } catch (e) {
      console.error(e);
    }
  };

  const addToQueue = (videoId: string) => {
    if (!offlineQueue.includes(videoId)) {
      saveQueue([...offlineQueue, videoId]);
    }
  };

  const removeFromQueue = (videoId: string) => {
    saveQueue(offlineQueue.filter(id => id !== videoId));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...offlineQueue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index - 1];
    newQueue[index - 1] = temp;
    saveQueue(newQueue);
  };

  const moveDown = (index: number) => {
    if (index === offlineQueue.length - 1) return;
    const newQueue = [...offlineQueue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index + 1];
    newQueue[index + 1] = temp;
    saveQueue(newQueue);
  };

  const shuffleQueue = () => {
    const shuffled = [...offlineQueue].sort(() => Math.random() - 0.5);
    saveQueue(shuffled);
  };

  const clearQueue = () => {
    saveQueue([]);
  };

  const addAllDownloads = () => {
    const newQueue = Array.from(new Set([...offlineQueue, ...downloads]));
    saveQueue(newQueue);
  };

  const downloadsFiltered = downloads.filter(id => {
    const video = allVideos.find(v => v.id === id);
    if (!video) return false;
    return video.title.toLowerCase().includes(downloadsSearch.toLowerCase()) ||
           video.channelName.toLowerCase().includes(downloadsSearch.toLowerCase());
  });

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  // Helper: Get videos in playlist
  const getPlaylistVideos = (playlist: Playlist): Video[] => {
    return playlist.videoIds
      .map(id => allVideos.find(v => v.id === id))
      .filter((v): v is Video => !!v);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    onCreatePlaylist(createName.trim(), createDesc.trim());
    setCreateName('');
    setCreateDesc('');
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editId) return;
    onUpdatePlaylist(editId, editName.trim(), editDesc.trim());
    setIsEditModalOpen(false);
  };

  const openEditModal = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening the playlist detail
    setEditId(playlist.id);
    setEditName(playlist.name);
    setEditDesc(playlist.description);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening
    const confirmTitle = language === 'ar' ? 'حذف قائمة التشغيل' : 'Delete Playlist';
    const confirmMsg = language === 'ar'
      ? 'هل أنت متأكد من رغبتك في حذف قائمة التشغيل هذه؟'
      : 'Are you sure you want to delete this playlist?';
    
    if (askConfirmation) {
      askConfirmation({
        title: confirmTitle,
        message: confirmMsg,
        onConfirm: () => {
          onDeletePlaylist(playlistId);
          if (selectedPlaylistId === playlistId) {
            setSelectedPlaylistId(null);
          }
        },
        confirmText: language === 'ar' ? 'نعم، احذف القائمة' : 'Yes, delete playlist',
        cancelText: language === 'ar' ? 'إلغاء' : 'Cancel'
      });
    } else if (confirm(confirmMsg)) {
      onDeletePlaylist(playlistId);
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
      }
    }
  };

  // List of source videos to organize from (Watch Later & Downloads union)
  const sourceVideoIds = Array.from(new Set([...watchLater, ...downloads]));
  const sourceVideos = sourceVideoIds
    .map(id => allVideos.find(v => v.id === id))
    .filter((v): v is Video => !!v);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. MAIN GRID VIEW */}
      {!selectedPlaylistId ? (
        <div className="space-y-6">
          {/* Tab Selection */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <FolderHeart className="w-4 h-4" />
              {language === 'ar' ? 'قوائم التشغيل المخصصة' : 'Custom Playlists'}
            </button>
            <button
              onClick={() => setActiveTab('offline')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'offline'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <WifiOff className="w-4 h-4 text-purple-500" />
              {language === 'ar' ? 'طابور التشغيل دون اتصال' : 'Offline Playback Queue'}
              {downloads.length > 0 && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-mono">
                  {downloads.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'custom' ? (
            <div className="space-y-6">
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="space-y-1">
                  <h2 className="font-bold text-lg md:text-xl text-gray-900 tracking-tight flex items-center gap-2">
                    <FolderHeart className="w-5 h-5 text-purple-600" />
                    {language === 'ar' ? 'قوائم التشغيل المخصصة' : 'Custom Playlists'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {language === 'ar'
                      ? 'قم بتنظيم فيديوهات التنزيل والمشاهدة لاحقاً في تصنيفات مخصصة.'
                      : 'Organize your offline downloads and bookmarked watch later videos into named categories.'}
                  </p>
                </div>
                
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm shadow-purple-600/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إنشاء قائمة جديدة' : 'Create New Playlist'}
                </button>
              </div>

              {/* Playlists cards list */}
              {playlists.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white border border-gray-100 rounded-3xl shadow-xs">
                  <div className="p-4 bg-purple-50 text-purple-500 rounded-full">
                    <FolderHeart className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-700">
                      {language === 'ar' ? 'لا توجد قوائم تشغيل مخصصة' : 'No playlists yet'}
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      {language === 'ar'
                        ? 'اضغط على زر "إنشاء قائمة جديدة" لتبدأ في تنظيم فيديوهاتك وحفظها.'
                        : 'Create your first customized category folder to start organizing your offline and bookmarked streams.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors active:scale-95 cursor-pointer"
                  >
                    {language === 'ar' ? 'إنشاء قائمتي الأولى 📂' : 'Create My First Playlist 📂'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {playlists.map((playlist) => {
                    const playlistVideos = getPlaylistVideos(playlist);
                    const firstThumbnail = playlistVideos[0]?.thumbnailUrl;

                    return (
                      <div
                        key={playlist.id}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        className="group bg-white border border-gray-200/80 hover:border-purple-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
                      >
                        {/* Folder-like visual stacked deck */}
                        <div className="relative aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                          {firstThumbnail ? (
                            <>
                              <img
                                src={firstThumbnail}
                                alt={playlist.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {/* Folder Overlay badge right corner */}
                              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="p-3 bg-purple-600/90 hover:bg-purple-600 text-white rounded-full scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-purple-600/20">
                                  <FolderOpen className="w-5 h-5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-purple-400 p-4 space-y-2">
                              <FolderHeart className="w-12 h-12 stroke-[1.5]" />
                              <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">
                                {language === 'ar' ? 'مجلد فارغ' : 'Empty Folder'}
                              </span>
                            </div>
                          )}
                          
                          {/* Count Indicator */}
                          <div className="absolute bottom-2.5 right-2.5 bg-black/75 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white font-mono flex items-center gap-1.5 backdrop-blur-xs">
                            <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>{playlistVideos.length} {language === 'ar' ? 'فيديو' : 'VIDEOS'}</span>
                          </div>
                        </div>

                        {/* Meta Section */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-1 group-hover:text-purple-700 transition-colors">
                              {playlist.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                              {playlist.description || (language === 'ar' ? 'لا يوجد وصف.' : 'No description provided.')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(playlist.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => openEditModal(playlist, e)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title={language === 'ar' ? 'تعديل التفاصيل' : 'Edit Details'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(playlist.id, e)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title={language === 'ar' ? 'حذف القائمة' : 'Delete Playlist'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Dedicated Offline Queue Tab Content */
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                      <WifiOff className="w-3 h-3" />
                      {language === 'ar' ? 'التشغيل دون اتصال' : 'Offline Mode Enabled'}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-xs text-blue-200/70 font-medium">
                      {language === 'ar' 
                        ? `${offlineQueue.length} فيديو في الانتظار` 
                        : `${offlineQueue.length} videos queued`}
                    </span>
                  </div>
                  <h1 className="font-sans font-bold text-xl md:text-2xl tracking-tight">
                    {language === 'ar' ? 'طابور التشغيل دون اتصال' : 'Offline Playback Queue'}
                  </h1>
                  <p className="text-xs md:text-sm text-blue-100 max-w-2xl leading-relaxed">
                    {language === 'ar'
                      ? 'قم بترتيب الفيديوهات المحملة مسبقاً لتشغيلها بشكل متتابع وتلقائي بدون إنترنت. مثالي للسفر والأماكن ضعيفة الشبكة!'
                      : 'Prioritize and sequence your offline downloads for uninterrupted sequential playback without internet. Great for flights or low-connectivity zones!'}
                  </p>
                </div>

                {offlineQueue.length > 0 && (
                  <button
                    onClick={() => {
                      const firstVid = allVideos.find(v => v.id === offlineQueue[0]);
                      if (firstVid) onVideoSelect(firstVid);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20 shrink-0 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {language === 'ar' ? 'بدء تشغيل الطابور 🚀' : 'Start Queue Playback 🚀'}
                  </button>
                )}
              </div>

              {/* Controls bar */}
              {downloads.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-150 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={shuffleQueue}
                      disabled={offlineQueue.length <= 1}
                      className="bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      {language === 'ar' ? 'ترتيب عشوائي' : 'Shuffle'}
                    </button>
                    <button
                      onClick={clearQueue}
                      disabled={offlineQueue.length === 0}
                      className="bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 hover:border-red-100 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {language === 'ar' ? 'مسح الطابور' : 'Clear Queue'}
                    </button>
                  </div>

                  <button
                    onClick={addAllDownloads}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'إضافة كل التنزيلات للطابور' : 'Queue All Downloads'}
                  </button>
                </div>
              )}

              {/* Split layout */}
              {downloads.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white border border-gray-100 rounded-3xl shadow-xs">
                  <div className="p-4 bg-blue-50 text-blue-500 rounded-full">
                    <WifiOff className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-700">
                      {language === 'ar' ? 'لا توجد فيديوهات محملة بعد' : 'No offline downloads found'}
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {language === 'ar'
                        ? 'اذهب للصفحة الرئيسية أو ابحث عن فيديوهات، واضغط على أيقونة التنزيل 📥 لحفظها ومشاهدتها دون اتصال.'
                        : 'Navigate to home or search, and click the Download icon 📥 on any video to save it for offline viewing.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Sequence list */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h3 className="font-bold text-sm text-gray-800 tracking-tight flex items-center gap-1.5">
                        <ListMusic className="w-4 h-4 text-blue-600" />
                        {language === 'ar' ? 'ترتيب التشغيل المتتابع' : 'Sequence of Playback'}
                      </h3>
                      <span className="text-[10px] bg-gray-150 text-gray-600 font-mono font-bold px-2 py-0.5 rounded-full">
                        {offlineQueue.length} {language === 'ar' ? 'فيديو' : 'queued'}
                      </span>
                    </div>

                    {offlineQueue.length === 0 ? (
                      <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                        <Layers className="w-8 h-8 text-gray-400 stroke-[1.2]" />
                        <p className="text-xs font-semibold text-gray-500">
                          {language === 'ar' ? 'طابور التشغيل فارغ حالياً' : 'No items in playback queue'}
                        </p>
                        <p className="text-[11px] text-gray-400 max-w-xs">
                          {language === 'ar'
                            ? 'أضف فيديوهات من قسم "التنزيلات المتاحة" لبناء قائمة التشغيل دون اتصال.'
                            : 'Add videos from the "Available Downloads" sidebar on the right to start building your offline list.'}
                        </p>
                        <button
                          onClick={addAllDownloads}
                          className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {language === 'ar' ? 'تعبئة الطابور بجميع التنزيلات ⚡' : 'Auto-fill queue with all downloads ⚡'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence initial={false}>
                          {offlineQueue.map((id, index) => {
                            const video = allVideos.find(v => v.id === id);
                            if (!video) return null;

                            return (
                              <motion.div
                                key={`${id}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="group p-3 bg-white border border-gray-200 hover:border-blue-200 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-xs transition-all"
                              >
                                {/* Position badge */}
                                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold">
                                  {index + 1}
                                </div>

                                {/* Thumbnail */}
                                <div 
                                  onClick={() => onVideoSelect(video)}
                                  className="relative w-20 md:w-24 aspect-video rounded-lg overflow-hidden bg-gray-900 shrink-0 cursor-pointer group/thumb border border-gray-100"
                                >
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-5 h-5 text-white fill-current" />
                                  </div>
                                  <span className="absolute bottom-1 right-1 bg-black/75 px-1 rounded text-[9px] font-mono font-bold text-white leading-none">
                                    {video.duration}
                                  </span>
                                </div>

                                {/* Title detail */}
                                <div className="min-w-0 flex-1">
                                  <h4 
                                    onClick={() => onVideoSelect(video)}
                                    className="font-bold text-gray-900 text-xs md:text-sm line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                                  >
                                    {video.title}
                                  </h4>
                                  <p className="text-[10px] text-gray-500 line-clamp-1">
                                    {video.channelName}
                                  </p>
                                </div>

                                {/* Reordering actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => moveUp(index)}
                                      disabled={index === 0}
                                      className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                                      title={language === 'ar' ? 'تحريك لأعلى' : 'Move Up'}
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => moveDown(index)}
                                      disabled={index === offlineQueue.length - 1}
                                      className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                                      title={language === 'ar' ? 'تحريك لأسفل' : 'Move Down'}
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => removeFromQueue(id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                    title={language === 'ar' ? 'إزالة' : 'Remove'}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Downloads Pool */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="border-b border-gray-200 pb-2">
                      <h3 className="font-bold text-sm text-gray-800 tracking-tight flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-purple-600" />
                        {language === 'ar' ? 'التنزيلات المتوفرة حالياً' : 'Available Downloads'}
                      </h3>
                    </div>

                    {/* Filter search input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={downloadsSearch}
                        onChange={(e) => setDownloadsSearch(e.target.value)}
                        placeholder={language === 'ar' ? 'ابحث في التنزيلات...' : 'Search downloaded clips...'}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                      />
                      {downloadsSearch && (
                        <button
                          onClick={() => setDownloadsSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Pool list */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {downloadsFiltered.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-xs">
                          {language === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching downloaded videos.'}
                        </div>
                      ) : (
                        downloadsFiltered.map((id) => {
                          const video = allVideos.find(v => v.id === id);
                          if (!video) return null;

                          const queueIndex = offlineQueue.indexOf(id);
                          const isQueued = queueIndex !== -1;

                          return (
                            <div
                              key={id}
                              className={`p-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                                isQueued 
                                  ? 'bg-blue-50/40 border-blue-100' 
                                  : 'bg-white border-gray-150 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-12 aspect-video rounded-lg overflow-hidden bg-gray-950 shrink-0 border border-gray-100">
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-800 text-[11px] line-clamp-1">
                                    {video.title}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-mono">
                                    {video.duration} • {video.channelName}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isQueued ? (
                                  <button
                                    onClick={() => removeFromQueue(id)}
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                    title={language === 'ar' ? 'إزالة من الطابور' : 'Remove from queue'}
                                  >
                                    {language === 'ar' ? `بالطابور (#${queueIndex + 1})` : `Queued (#${queueIndex + 1})`}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => addToQueue(id)}
                                    className="bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                  >
                                    {language === 'ar' ? '+ إضافة' : '+ Add'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 2. PLAYLIST DETAIL VIEW */
        <div className="space-y-6">
          {/* Back Action Row */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'ar' ? 'العودة للقوائم' : 'Back to Playlists'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOrganizeModalOpen(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all active:scale-95 border border-purple-200 cursor-pointer"
              >
                <ListPlus className="w-4 h-4" />
                {language === 'ar' ? 'تنظيم وإضافة فيديوهات' : 'Organize & Manage Videos'}
              </button>

              <button
                onClick={(e) => openEditModal(selectedPlaylist!, e)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-full border border-gray-200 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => handleDeleteClick(selectedPlaylist!.id, e)}
                className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-full border border-red-200 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Playlist Info Banner */}
          <div className="p-6 bg-linear-to-r from-purple-900 to-indigo-950 rounded-3xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  {language === 'ar' ? 'مجلد تشغيل مخصص' : 'Custom Category'}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-white/70 font-mono">
                  {new Date(selectedPlaylist!.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
              <h1 className="font-sans font-bold text-xl md:text-3xl tracking-tight">
                {selectedPlaylist!.name}
              </h1>
              <p className="text-xs md:text-sm text-purple-100 max-w-2xl leading-relaxed">
                {selectedPlaylist!.description || (language === 'ar' ? 'لا يوجد وصف مضاف لقائمة التشغيل هذه.' : 'No descriptive text assigned yet. Edit to provide detail.')}
              </p>
            </div>

            <div className="px-5 py-3 bg-white/10 rounded-2xl border border-white/10 text-center shrink-0 min-w-[7rem]">
              <p className="text-2xl font-bold font-mono text-purple-300">
                {selectedPlaylist!.videoIds.length}
              </p>
              <p className="text-[10px] tracking-wider text-purple-200 font-bold uppercase">
                {language === 'ar' ? 'مجموع الفيديوهات' : 'TOTAL STREAMS'}
              </p>
            </div>
          </div>

          {/* Playlist Content Video Grid */}
          {selectedPlaylist!.videoIds.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white border border-gray-100 rounded-3xl shadow-xs">
              <div className="p-4 bg-purple-50 text-purple-500 rounded-full animate-bounce">
                <ListPlus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-gray-700">
                  {language === 'ar' ? 'قائمة التشغيل هذه فارغة' : 'This playlist is empty'}
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {language === 'ar'
                    ? 'اضغط على زر "تنظيم وإضافة فيديوهات" لإضافة الفيديوهات التي قمت بتنزيلها أو وضعتها للمشاهدة لاحقاً.'
                    : 'Add bookmarked watch later videos or local downloads to organize them in this custom category.'}
                </p>
              </div>
              <button
                onClick={() => setIsOrganizeModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                {language === 'ar' ? 'تنظيم وإضافة الفيديوهات الآن 📥' : 'Manage Playlist Content Now 📥'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getPlaylistVideos(selectedPlaylist!).map((video) => (
                <div key={video.id} className="relative group">
                  <VideoCard
                    video={video}
                    onClick={() => onVideoSelect(video)}
                    isInWatchLater={watchLater.includes(video.id)}
                    isInDownloads={downloads.includes(video.id)}
                    language={language}
                  />
                  {/* Quick remove from playlist overlay button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVideoInPlaylist(selectedPlaylist!.id, video.id);
                    }}
                    className="absolute top-2.5 left-2.5 p-2 bg-black/70 hover:bg-red-600 text-white rounded-xl transition-all scale-0 group-hover:scale-100 cursor-pointer shadow-lg"
                    title={language === 'ar' ? 'إزالة من قائمة التشغيل' : 'Remove from Playlist'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS CORNER */}
      <AnimatePresence>
        {/* CREATE MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-1.5">
                <FolderHeart className="w-5 h-5 text-purple-600" />
                {language === 'ar' ? 'إنشاء قائمة تشغيل مخصصة' : 'Create Custom Playlist'}
              </h3>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {language === 'ar' ? 'اسم قائمة التشغيل *' : 'Playlist Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: شرح البرمجة، الفيديوهات التعليمية' : 'e.g. Coding Lectures, Nature Breaks'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {language === 'ar' ? 'الوصف والتفاصيل' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder={language === 'ar' ? 'أضف وصفاً مختصراً لمحتويات المجلد...' : 'Summarize the category contents...'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer shadow-sm"
                  >
                    {language === 'ar' ? 'إنشاء القائمة ✨' : 'Create Playlist ✨'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-1.5">
                <Edit3 className="w-5 h-5 text-purple-600" />
                {language === 'ar' ? 'تعديل تفاصيل قائمة التشغيل' : 'Edit Playlist Details'}
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {language === 'ar' ? 'اسم قائمة التشغيل *' : 'Playlist Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {language === 'ar' ? 'الوصف والتفاصيل' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer shadow-sm"
                  >
                    {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ORGANIZE MODAL (MANAGE PLAYLIST VIDEOS) */}
        {isOrganizeModalOpen && selectedPlaylistId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <button
                onClick={() => setIsOrganizeModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                  <ListPlus className="w-5 h-5 text-purple-600" />
                  {language === 'ar' ? 'تنظيم محتوى قائمة التشغيل' : 'Organize Playlist Content'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar'
                    ? `اختر الفيديوهات من التنزيلات والمشاهدة لاحقاً لضمها إلى القائمة: "${selectedPlaylist!.name}"`
                    : `Check the videos from your bookmarks or downloads to add them to: "${selectedPlaylist!.name}"`}
                </p>
              </div>

              {/* Scrollable checklist of source videos */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
                {sourceVideos.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <FolderOpen className="w-10 h-10 mx-auto text-gray-300 stroke-[1.2]" />
                    <p className="text-sm font-semibold text-gray-500">
                      {language === 'ar' ? 'لا يوجد فيديوهات في التنزيلات أو المشاهدة لاحقاً' : 'No available source videos'}
                    </p>
                    <p className="text-xs max-w-xs mx-auto">
                      {language === 'ar'
                        ? 'تأكد من تنزيل أو حفظ بعض الفيديوهات أولاً لتتمكن من تنظيمها هنا.'
                        : 'Download a video or mark it watch-later to start categorizing here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* List grouped */}
                    {sourceVideos.map((video) => {
                      const isIncluded = selectedPlaylist!.videoIds.includes(video.id);
                      const isDL = downloads.includes(video.id);
                      const isWL = watchLater.includes(video.id);

                      return (
                        <div
                          key={video.id}
                          onClick={() => onToggleVideoInPlaylist(selectedPlaylist!.id, video.id)}
                          className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                            isIncluded 
                              ? 'bg-purple-50/60 border-purple-200 shadow-xs' 
                              : 'bg-gray-50/50 hover:bg-gray-50 border-gray-150'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox indicator */}
                            <div className="shrink-0 text-purple-600">
                              {isIncluded ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>

                            {/* Thumbnail */}
                            <div className="w-16 aspect-video rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-gray-100">
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Video detail */}
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-bold text-gray-800 text-xs md:text-sm line-clamp-1">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-gray-400 font-mono">{video.duration}</span>
                                {isDL && (
                                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                    <Download className="w-2.5 h-2.5" />
                                    {language === 'ar' ? 'تنزيل' : 'DL'}
                                  </span>
                                )}
                                {isWL && (
                                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {language === 'ar' ? 'لاحقاً' : 'WL'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                <span className="text-[10px] md:text-xs text-gray-500 font-medium">
                  {language === 'ar'
                    ? `مختار حالياً: ${selectedPlaylist!.videoIds.length} فيديوهات`
                    : `Currently Selected: ${selectedPlaylist!.videoIds.length} streams`}
                </span>
                
                <button
                  type="button"
                  onClick={() => setIsOrganizeModalOpen(false)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'تم وحفظ' : 'Done & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
