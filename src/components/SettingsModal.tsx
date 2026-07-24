import React, { useState, useEffect, useRef } from 'react';
import { X, Paintbrush, Gauge, Play, Languages, Trash2, RotateCcw, AlertTriangle, ShieldCheck, Cloud, RefreshCw } from 'lucide-react';

export interface AppSettings {
  playbackSpeed: number;
  autoplayNext: boolean;
  accentColor: 'red' | 'blue' | 'purple' | 'emerald' | 'slate';
  language: 'en' | 'ar';
}

interface SettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetAllData: () => void;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  watchLater: string[];
  setWatchLater: React.Dispatch<React.SetStateAction<string[]>>;
  playlists?: any[];
  setPlaylists?: React.Dispatch<React.SetStateAction<any[]>>;
  bookmarks?: any[];
  setBookmarks?: React.Dispatch<React.SetStateAction<any[]>>;
  onTriggerToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function SettingsModal({
  onClose,
  settings,
  onUpdateSettings,
  onResetAllData,
  history,
  setHistory,
  watchLater,
  setWatchLater,
  playlists = [],
  setPlaylists,
  bookmarks = [],
  setBookmarks,
  onTriggerToast,
}: SettingsModalProps) {
  const isAr = settings.language === 'ar';

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('metatube_cloud_sync_timestamp');
  });

  const handleSyncData = () => {
    setIsSyncing(true);

    // Simulate network latency for uploading to mock server
    setTimeout(() => {
      try {
        // 1. Fetch existing mock cloud data if any
        const rawCloudData = localStorage.getItem('metatube_cloud_sync_data');
        let cloudWatchLater: string[] = [];
        let cloudHistory: any[] = [];
        let cloudPlaylists: any[] = [];
        let cloudBookmarks: any[] = [];

        if (rawCloudData) {
          const parsed = JSON.parse(rawCloudData);
          cloudWatchLater = parsed.watchLater || [];
          cloudHistory = parsed.history || [];
          cloudPlaylists = parsed.playlists || [];
          cloudBookmarks = parsed.bookmarks || [];
        }

        // 2. Merge watch later
        const mergedWatchLater = Array.from(new Set([...watchLater, ...cloudWatchLater]));

        // 3. Merge history (by videoId)
        const historyMap = new Map<string, any>();
        history.forEach(item => historyMap.set(item.videoId, item));
        cloudHistory.forEach(item => {
          const existing = historyMap.get(item.videoId);
          if (!existing) {
            historyMap.set(item.videoId, item);
          } else {
            const existingDate = new Date(existing.watchedAt || 0).getTime();
            const cloudDate = new Date(item.watchedAt || 0).getTime();
            if (cloudDate > existingDate) {
              historyMap.set(item.videoId, item);
            }
          }
        });
        const mergedHistory = Array.from(historyMap.values());

        // 4. Merge playlists (by id)
        const playlistsMap = new Map<string, any>();
        playlists.forEach(p => playlistsMap.set(p.id, p));
        cloudPlaylists.forEach(p => {
          if (!playlistsMap.has(p.id)) {
            playlistsMap.set(p.id, p);
          }
        });
        const mergedPlaylists = Array.from(playlistsMap.values());

        // 5. Merge bookmarks (by id)
        const bookmarksMap = new Map<string, any>();
        bookmarks.forEach(b => bookmarksMap.set(b.id, b));
        cloudBookmarks.forEach(b => {
          if (!bookmarksMap.has(b.id)) {
            bookmarksMap.set(b.id, b);
          }
        });
        const mergedBookmarks = Array.from(bookmarksMap.values());

        // 6. Update local React states if setters are available
        setWatchLater(mergedWatchLater);
        setHistory(mergedHistory);
        if (setPlaylists) setPlaylists(mergedPlaylists);
        if (setBookmarks) setBookmarks(mergedBookmarks);

        // 7. Store payload on simulated mock server storage
        const now = new Date();
        const formattedTimestamp = now.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const syncPayload = {
          timestamp: now.toISOString(),
          watchLater: mergedWatchLater,
          history: mergedHistory,
          playlists: mergedPlaylists,
          bookmarks: mergedBookmarks,
          meta: {
            syncedBy: 'MYtube Client',
            version: '2.0',
            serverStatus: '200 OK (Mock Server)',
          }
        };

        localStorage.setItem('metatube_cloud_sync_data', JSON.stringify(syncPayload));
        localStorage.setItem('metatube_cloud_sync_timestamp', formattedTimestamp);
        setLastSyncTime(formattedTimestamp);

        // 8. Trigger success notification
        onTriggerToast?.(
          isAr
            ? 'تم رفع ومزامنة البيانات المحلية (السجل، قوائم التشغيل، الإشارات المرجعية) إلى خادم السحابة بنجاح! ☁️'
            : 'Local metadata (history, playlists, bookmarks) successfully synced to cloud! ☁️',
          'success'
        );
      } catch (error) {
        console.error('Error during cloud sync simulation:', error);
        onTriggerToast?.(
          isAr ? 'فشلت المزامنة. يرجى المحاولة مرة أخرى.' : 'Sync failed. Please try again.',
          'error'
        );
      } finally {
        setIsSyncing(false);
      }
    }, 1200);
  };

  const accentColors = [
    { id: 'red', name: 'YouTube Red', color: 'bg-red-600', text: 'text-red-600', hover: 'hover:bg-red-50' },
    { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
    { id: 'purple', name: 'Amethyst Purple', color: 'bg-purple-600', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
    { id: 'emerald', name: 'Emerald Green', color: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:bg-emerald-50' },
    { id: 'slate', name: 'Cosmic Charcoal', color: 'bg-slate-800', text: 'text-slate-800', hover: 'hover:bg-slate-100' },
  ];

  const speedOptions = [1.0, 1.25, 1.5, 2.0];

  const handleResetClick = () => {
    onResetAllData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-150 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${
              settings.accentColor === 'red' ? 'bg-red-600' :
              settings.accentColor === 'blue' ? 'bg-blue-600' :
              settings.accentColor === 'purple' ? 'bg-purple-600' :
              settings.accentColor === 'emerald' ? 'bg-emerald-600' : 'bg-slate-800'
            }`}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </div>
            <div>
              <h3 className="font-sans font-bold text-gray-900 tracking-tight text-base">
                {isAr ? 'إعدادات التحكم الكامل' : 'Full Control Settings'}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">
                {isAr ? 'تخصيص كامل لواجهة وتجربة مشغل MYtube' : 'Personalize MYtube interface & player features'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-150 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Language Selector */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Languages className="w-4 h-4 text-sky-500" />
              <span>{isAr ? 'لغة الواجهة' : 'Interface Language'}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`flex items-center justify-center py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  settings.language === 'en'
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                English (US)
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'ar' })}
                className={`flex items-center justify-center py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer font-sans ${
                  settings.language === 'ar'
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                العربية (Arabic)
              </button>
            </div>
          </div>

          {/* Accent Color / Custom Brand Theme */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-purple-500" />
              <span>{isAr ? 'لون الهوية والمظهر' : 'Accent Color & Theme'}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {accentColors.map((color) => {
                const isActive = settings.accentColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => onUpdateSettings({ accentColor: color.id as any })}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      isActive 
                        ? 'border-gray-900 bg-gray-50 font-bold shadow-sm' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.color} shrink-0`} />
                    <span className="truncate text-gray-700">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Playback Speed */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'سرعة التشغيل التلقائية' : 'Default Playback Speed'}</span>
            </h4>
            <div className="flex gap-2">
              {speedOptions.map((speed) => {
                const isActive = settings.playbackSpeed === speed;
                return (
                  <button
                    key={speed}
                    onClick={() => onUpdateSettings({ playbackSpeed: speed })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {speed === 1.0 ? (isAr ? 'عادي' : 'Normal') : `${speed}x`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Autoplay toggle switch */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <Play className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-gray-900">
                  {isAr ? 'التشغيل التلقائي المستمر' : 'Autoplay Next Video'}
                </h5>
                <p className="text-[10px] text-gray-500 font-sans">
                  {isAr ? 'تشغيل الفيديو التالي في القائمة تلقائياً فور انتهاء التشغيل' : 'Start playing the next recommended video when current one ends'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoplayNext: !settings.autoplayNext })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.autoplayNext ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                settings.autoplayNext ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Simulated Cloud Sync */}
          <div className="space-y-2.5 pt-2 border-t border-gray-150">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" />
              <span>{isAr ? 'المزامنة السحابية (محاكاة)' : 'Simulated Cloud Sync'}</span>
            </h4>
            <div className="p-3.5 bg-sky-50/40 rounded-xl border border-sky-100 space-y-3">
              <div className="flex items-start gap-3">
                <RefreshCw className={`w-4 h-4 text-sky-600 mt-0.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <div className="flex-1">
                  <h5 className="text-xs font-bold text-gray-900">
                    {isAr ? 'مزامنة بيانات المشاهدة وقائمة التشغيل' : 'Sync History & Watch Later'}
                  </h5>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    {isAr
                      ? 'احفظ واحمِ سجل المشاهدة وقائمة التشغيل لاحقاً في التخزين السحابي المحاكى واسترجعها في أي وقت.'
                      : 'Backup and merge your watch history and watch later list with our simulated cloud storage database.'}
                  </p>
                  {lastSyncTime && (
                    <p className="text-[9px] text-sky-600 font-mono mt-1">
                      {isAr ? 'آخر مزامنة ناجحة:' : 'Last Synced:'} {lastSyncTime}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (isAr ? 'جاري المزامنة...' : 'Syncing Data...') : (isAr ? 'مزامنة بياناتي الآن 🔄' : 'Sync my data 🔄')}</span>
              </button>
            </div>
          </div>

          {/* Storage & Clear */}
          <div className="space-y-2.5 pt-2 border-t border-gray-150">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{isAr ? 'إدارة التخزين واستعادة الضبط' : 'Data Management & Recovery'}</span>
            </h4>
            <button
              onClick={handleResetClick}
              className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isAr ? 'إعادة تهيئة جميع بيانات التطبيق' : 'Restore All Application Factory State'}</span>
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-150 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-sans">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>{isAr ? 'الإعدادات نشطة ومحفوظة محلياً' : 'All settings saved locally'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'حفظ وإغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
