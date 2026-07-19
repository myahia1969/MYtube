import React, { useState } from 'react';
import { X, Upload, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Video, User } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newVideo: Video) => void;
  currentUser?: User | null;
  language?: 'ar' | 'en';
}

export default function UploadModal({ onClose, onUploadSuccess, currentUser, language = 'en' }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [pastedUrl, setPastedUrl] = useState('');
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coding');
  const [customDuration, setCustomDuration] = useState('4:15');
  const [durationError, setDurationError] = useState('');
  const [isShort, setIsShort] = useState(false);

  // Upload progress states
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [stepMessage, setStepMessage] = useState('');

  const isArabic = language === 'ar';

  const t = {
    title: isArabic ? 'رفع وإضافة فيديو أو ملف صوتي جديد' : 'Upload New Video or Audio',
    localFileTab: isArabic ? 'ملف محلي (فيديو / صوت)' : 'Local File (Video / Audio)',
    webLinkTab: isArabic ? 'رابط ويب / منصة أخرى' : 'Web Video / Audio Link',
    selectFile: isArabic ? 'اختر ملفاً' : 'Select File',
    dragDrop: isArabic ? 'اسحب وأفلت ملفات الفيديو أو الصوت هنا لرفعها' : 'Drag and drop video or audio files to upload',
    privateWarning: isArabic ? 'ستكون ملفاتك خاصة حتى تقوم بنشرها.' : 'Your files will be private until you publish them.',
    urlLabel: isArabic ? 'رابط الفيديو أو الصوت (يوتيوب، ساوند كلاود، أو أي موقع) *' : 'Video or Audio Link (YouTube, SoundCloud, or any site) *',
    urlPlaceholder: isArabic ? 'مثال: https://soundcloud.com/... أو رابط مباشر' : 'e.g. https://soundcloud.com/... or direct link',
    urlHint: isArabic ? 'يدعم يوتيوب، فيميو، تيك توك، ساوند كلاود، وروابط MP4/MP3 المباشرة أو أي موقع آخر.' : 'Supports YouTube, Vimeo, TikTok, SoundCloud, direct MP4/MP3 links, or any other web page.',
    thumbLabel: isArabic ? 'رابط صورة مصغرة مخصصة (اختياري)' : 'Custom Thumbnail URL (Optional)',
    thumbHint: isArabic ? 'إذا ترك فارغاً، سيتم جلب غلاف يوتيوب/فيميو تلقائياً، أو غلاف مميز من فئة الفيديو.' : 'If left empty, YouTube/Vimeo covers or a high-quality category cover is applied automatically.',
    videoTitleLabel: isArabic ? 'العنوان *' : 'Title *',
    videoTitlePlaceholder: isArabic ? 'اكتب عنواناً جذاباً' : 'Enter a catchy title',
    descriptionLabel: isArabic ? 'الوصف' : 'Description',
    descriptionPlaceholder: isArabic ? 'أخبر المشاهدين المزيد عن هذا الملف...' : 'Tell viewers about this file...',
    categoryLabel: isArabic ? 'التصنيف' : 'Category',
    durationLabel: isArabic ? 'المدة (دقيقة:ثانية) *' : 'Duration (mm:ss) *',
    invalidDuration: isArabic ? 'تنسيق غير صالح' : 'Invalid Format',
    uploadAsShort: isArabic ? 'الرفع كفيديو قصير (Shorts)' : 'Upload as YouTube Short (Vertical 9:16 format)',
    uploadAsShortHint: isArabic ? 'يحسن العرض ليتناسب مع الشاشات الرأسية، وسيتم تحويل الفيديو لقسم الفيديوهات القصيرة تلقائياً.' : 'Optimizes playback specifically for vertical screen ratios. Categories will automatically route to Shorts.',
    publishBtn: isArabic ? 'نشر وتشغيل الملف 🚀' : 'Publish & Stream Content',
    limitWarning: isArabic ? 'الحد الأقصى لحجم الملف هو 500 ميجابايت. يتم معالجة جميع الملفات المرفوعة وتأمينها لتلائم دقة الأجهزة المتعددة.' : 'Upload size is limited to 500MB per file. All uploaded assets are processed, optimized for multi-device streaming quality, and instantly indexed on search feeds globally.',
    successTitle: isArabic ? 'تم نشر الملف بنجاح! 🎉' : 'Content Published Successfully!',
    successDesc: isArabic ? 'الملف الخاص بك جاهز، منسق، ومتاح الآن للبث على شاشة MYtube الرئيسية.' : 'Your file is transcoded, secured, and live on the MYtube Home Feed.',
    uploadingTitle: isArabic ? 'جاري رفع بيانات الملف...' : 'Uploading Database Payload',
  };

  const validateDuration = (val: string): boolean => {
    const trimmed = val.trim();
    const regex = /^\d+:[0-5]\d$/;
    if (!trimmed) {
      setDurationError(isArabic ? 'المدة مطلوبة.' : 'Duration is required.');
      return false;
    }
    if (!regex.test(trimmed)) {
      setDurationError(isArabic ? 'يجب أن يكون بالتنسيق mm:ss (مثال: 04:15).' : 'Must be in mm:ss format (e.g., 04:15 or 12:30).');
      return false;
    }
    setDurationError('');
    return true;
  };

  // Helper to parse YouTube ID
  const getYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Detect platform info
  const detectPlatform = (url: string) => {
    if (!url) return null;
    const clean = url.trim();
    if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
      return { name: 'YouTube', icon: '📺', color: 'text-red-600 bg-red-50 border-red-150' };
    }
    if (clean.includes('vimeo.com')) {
      return { name: 'Vimeo', icon: '🎬', color: 'text-blue-600 bg-blue-50 border-blue-150' };
    }
    if (clean.includes('soundcloud.com')) {
      return { name: 'SoundCloud', icon: '🎵', color: 'text-orange-600 bg-orange-50 border-orange-150' };
    }
    if (clean.includes('tiktok.com')) {
      return { name: 'TikTok', icon: '🎵', color: 'text-zinc-900 bg-zinc-100 border-zinc-200' };
    }
    if (clean.includes('twitch.tv')) {
      return { name: 'Twitch', icon: '🎮', color: 'text-purple-600 bg-purple-50 border-purple-150' };
    }
    if (clean.includes('dailymotion.com') || clean.includes('dai.ly')) {
      return { name: 'DailyMotion', icon: '📽️', color: 'text-sky-600 bg-sky-50 border-sky-150' };
    }
    if (clean.includes('facebook.com') || clean.includes('fb.watch')) {
      return { name: 'Facebook', icon: '👥', color: 'text-indigo-600 bg-indigo-50 border-indigo-150' };
    }
    if (clean.includes('instagram.com')) {
      return { name: 'Instagram', icon: '📸', color: 'text-pink-600 bg-pink-50 border-pink-150' };
    }
    if (clean.includes('twitter.com') || clean.includes('x.com')) {
      return { name: 'Twitter / X', icon: '🐦', color: 'text-neutral-900 bg-neutral-50 border-neutral-200' };
    }
    if (clean.match(/\.(mp3|wav|ogg|aac|m4a|flac)(?:\?|$)/i)) {
      return { name: isArabic ? 'ملف صوتي مباشر' : 'Direct Audio File', icon: '🎵', color: 'text-indigo-600 bg-indigo-50 border-indigo-150' };
    }
    if (clean.match(/\.(mp4|webm|ogg|mov|m4v|m3u8)(?:\?|$)/i)) {
      return { name: 'Direct MP4 File', icon: '📂', color: 'text-emerald-600 bg-emerald-50 border-emerald-150' };
    }
    return { name: isArabic ? 'صفحة ويب عامة' : 'General Web Page', icon: '🌐', color: 'text-amber-600 bg-amber-50 border-amber-150' };
  };

  const detected = detectPlatform(pastedUrl);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFileSelected(droppedFile);
      if (!title) {
        // Auto-fill title with filename (without ext)
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFileSelected(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const startUploadSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (uploadMethod === 'file' && !fileSelected) return;
    if (uploadMethod === 'link' && !pastedUrl.trim()) return;

    if (!validateDuration(customDuration)) return;

    setUploadStatus('uploading');
    setProgress(0);

    const steps = uploadMethod === 'file' ? [
      { prg: 15, msg: isArabic ? 'جاري تهيئة اتصال النفق الآمن بمركز البيانات...' : 'Initializing secure tunnel connection...' },
      { prg: 35, msg: isArabic ? 'جاري تقسيم تدفقات ملف الفيديو الخام...' : 'Chunking raw video file streams...' },
      { prg: 55, msg: isArabic ? 'جاري رفع حزم الفيديو الخام إلى مخزن البيانات...' : 'Uploading raw video chunk bytes to storage bucket...' },
      { prg: 75, msg: isArabic ? 'جاري تسجيل سجل البيانات التعريفية في محرك الفهرسة...' : 'Pushing database row metadata record to database...' },
      { prg: 90, msg: isArabic ? 'جاري تنفيذ خطوط معالجة وترميز البث المتعدد...' : 'Executing stream transcoding pipelines...' },
      { prg: 100, msg: isArabic ? 'اكتمل الترميز! مؤشر البث المباشر نشط الآن.' : 'Transcoding complete! Streaming index live.' }
    ] : [
      { prg: 25, msg: isArabic ? 'جاري التحقق من رابط مصدر الفيديو ومعلماته...' : 'Validating video source URL and parameters...' },
      { prg: 50, msg: isArabic ? 'جاري جلب ترويسات البث وتحليل معلومات المضيف...' : 'Retrieving stream headers & resolving host information...' },
      { prg: 75, msg: isArabic ? 'جاري توليد صور مصغرة ومعاينات محسنة للغلاف...' : 'Generating optimized cover thumbnail preview graphics...' },
      { prg: 90, msg: isArabic ? 'جاري مزامنة سجل البيانات مع محرك الفهرسة...' : 'Syncing live metadata records with database indexing engine...' },
      { prg: 100, msg: isArabic ? 'تم تسجيل الفهرس! رابط البث جاهز ونشط.' : 'Video index registered! Stream link is live.' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const currentStep = steps[stepIndex];
        setProgress(currentStep.prg);
        setStepMessage(currentStep.msg);
        stepIndex++;
      } else {
        clearInterval(interval);
        setUploadStatus('completed');

        // Cover options
        const categoryMap: { [key: string]: string } = {
          Tech: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=640&q=80',
          Design: 'https://images.unsplash.com/photo-1502462041144-01e91583e762?auto=format&fit=crop&w=640&q=80',
          Nature: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=640&q=80',
          Music: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&q=80',
          Coding: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=640&q=80',
          Gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=640&q=80',
          Shorts: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=640&q=80'
        };

        const platformCovers: Record<string, string> = {
          'YouTube': 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=640&q=80',
          'Vimeo': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=640&q=80',
          'TikTok': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=640&q=80',
          'Twitch': 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=640&q=80',
          'DailyMotion': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=640&q=80',
          'Facebook': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=640&q=80',
          'Instagram': 'https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?auto=format&fit=crop&w=640&q=80',
          'Twitter / X': 'https://images.unsplash.com/photo-1611605698335-8b15d27e03f4?auto=format&fit=crop&w=640&q=80',
          'Direct MP4 File': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=640&q=80'
        };

        let finalThumb = customThumbnailUrl.trim();
        if (!finalThumb) {
          if (detected && platformCovers[detected.name]) {
            finalThumb = platformCovers[detected.name];
          } else {
            finalThumb = categoryMap[category] || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=640&q=80';
          }
        }

        let finalVideoUrl = '';

        if (uploadMethod === 'file') {
          // Choose a beautiful stock video loop
          const sampleVideos = [
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
          ];
          finalVideoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
        } else {
          finalVideoUrl = pastedUrl.trim();
          const ytId = getYoutubeId(finalVideoUrl);
          if (ytId && !customThumbnailUrl.trim()) {
            finalThumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
          }
        }

        const newVideo: Video = {
          id: `vid-upload-${Date.now()}`,
          title,
          description: description || (isArabic ? 'لا يوجد وصف متاح لهذا الفيديو.' : 'No description provided.'),
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumb,
          duration: customDuration || '2:30',
          views: 0,
          uploadedAt: isArabic ? 'الآن' : 'Just now',
          category,
          channelId: currentUser?.username || 'user_channel',
          channelName: currentUser?.displayName || (isArabic ? 'قناتي' : 'My Channel'),
          channelAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
          likes: 0,
          dislikes: 0,
          likeStatus: 'none',
          isShort: isShort,
        } as any;

        // Delay closing modal slightly so they see the completed status
        setTimeout(() => {
          onUploadSuccess(newVideo);
          onClose();
        }, 1500);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0f0f]/40 backdrop-blur-sm transition-all" id="upload-modal-container">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-gray-900 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-red-600 animate-bounce" />
            <span className="font-sans font-bold text-lg text-gray-900">{t.title}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-[#0f0f0f] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {uploadStatus === 'idle' ? (
            <div className="space-y-6">
              {/* Method Tab Selector */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    uploadMethod === 'file' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t.localFileTab}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('link')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    uploadMethod === 'link' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t.webLinkTab}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Upload Frame or URL Input */}
                {uploadMethod === 'file' ? (
                  /* Drag & Drop Frame */
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all h-full min-h-[250px] cursor-pointer ${
                      dragActive 
                        ? 'border-red-600 bg-red-50/50 scale-95' 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload-input"
                      accept="video/*,audio/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    
                    <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="p-4 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-[#0f0f0f] transition-colors shadow-sm">
                        <Upload className="w-8 h-8 text-red-600" />
                      </div>
                      
                      {fileSelected ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-emerald-600">
                            {isArabic ? 'تم اختيار الملف بنجاح! 🎉' : 'File Selected Successfully!'}
                          </p>
                          <p className="text-xs text-gray-600 font-mono max-w-[200px] truncate">{fileSelected.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{(fileSelected.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800">{t.dragDrop}</p>
                          <p className="text-xs text-gray-500">{t.privateWarning}</p>
                          <span className="inline-block mt-3 bg-white border border-gray-200 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-50 transition-all shadow-sm">
                            {t.selectFile}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  /* Web Link Forms */
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col justify-center space-y-4 min-h-[250px]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 font-mono">{t.urlLabel}</label>
                      <input
                        type="url"
                        required={uploadMethod === 'link'}
                        placeholder={t.urlPlaceholder}
                        value={pastedUrl}
                        onChange={(e) => {
                          setPastedUrl(e.target.value);
                          const val = e.target.value.trim();
                          const ytId = getYoutubeId(val);
                          if (ytId && !title) {
                            setTitle(`YouTube Video (${ytId})`);
                          } else if (val) {
                            // Suggest generic platform title
                            try {
                              const host = new URL(val).hostname.replace('www.', '');
                              if (!title) {
                                setTitle(`${host.split('.')[0].toUpperCase()} Video Media`);
                              }
                            } catch (e) {}
                          }
                        }}
                        className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors"
                      />
                      
                      {/* Platform Detection Badge */}
                      {detected && (
                        <div className={`self-start flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border ${detected.color} transition-all animate-fade-in mt-1`}>
                          <span>{detected.icon}</span>
                          <span>{isArabic ? 'تم كشف المنصة:' : 'Detected Source:'}</span>
                          <span>{detected.name}</span>
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 mt-1">{t.urlHint}</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 font-mono">{t.thumbLabel}</label>
                      <input
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={customThumbnailUrl}
                        onChange={(e) => setCustomThumbnailUrl(e.target.value)}
                        className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors"
                      />
                      <p className="text-[10px] text-gray-400">{t.thumbHint}</p>
                    </div>
                  </div>
                )}

                {/* Video Metadata Form */}
                <form onSubmit={startUploadSimulation} className="space-y-4">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 font-mono">{t.videoTitleLabel}</label>
                    <input
                      type="text"
                      required
                      placeholder={t.videoTitlePlaceholder}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 font-mono">{t.descriptionLabel}</label>
                    <textarea
                      rows={3}
                      placeholder={t.descriptionPlaceholder}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Category & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 font-mono">{t.categoryLabel}</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors cursor-pointer"
                      >
                        {['Coding', 'Tech', 'Design', 'Nature', 'Music', 'Gaming'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 font-mono flex justify-between items-center">
                        <span>{t.durationLabel}</span>
                        {durationError && (
                          <span className="text-[10px] text-red-500 font-sans normal-case animate-pulse font-medium">
                            {t.invalidDuration}
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 04:15"
                        value={customDuration}
                        onChange={(e) => {
                          setCustomDuration(e.target.value);
                          if (durationError) {
                            const regex = /^\d+:[0-5]\d$/;
                            if (regex.test(e.target.value.trim())) {
                              setDurationError('');
                            }
                          }
                        }}
                        className={`bg-white border text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-all font-mono ${
                          durationError 
                            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-red-600'
                        }`}
                      />
                      {durationError && (
                        <p className="text-[10px] text-red-500 font-sans font-medium mt-0.5">
                          {durationError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Upload as Short Toggle */}
                  <div className="flex items-start gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                    <input
                      type="checkbox"
                      id="upload-as-short"
                      checked={isShort}
                      onChange={(e) => {
                        setIsShort(e.target.checked);
                        if (e.target.checked) {
                          setCategory('Shorts');
                          setCustomDuration('0:30');
                        } else {
                          setCategory('Coding');
                          setCustomDuration('4:15');
                        }
                      }}
                      className="w-4.5 h-4.5 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600 cursor-pointer mt-0.5"
                    />
                    <label htmlFor="upload-as-short" className="text-xs font-semibold text-gray-800 select-none cursor-pointer flex-1">
                      <span>{t.uploadAsShort}</span>
                      <p className="text-[10px] text-gray-500 font-normal font-sans mt-0.5">{t.uploadAsShortHint}</p>
                    </label>
                  </div>

                  {/* Submit trigger */}
                  <button
                    type="submit"
                    disabled={uploadMethod === 'file' ? (!fileSelected || !title) : (!pastedUrl.trim() || !title)}
                    className={`w-full py-2.5 rounded-xl font-sans font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                      (uploadMethod === 'file' ? (fileSelected && title) : (pastedUrl.trim() && title))
                        ? 'bg-red-600 hover:bg-red-750 text-white shadow-sm cursor-pointer active:scale-[0.98]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {t.publishBtn}
                  </button>
                </form>

              </div>
            </div>
          ) : (
            /* Uploading simulation container */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <div className="absolute w-24 h-24 bg-red-50 border border-red-200 rounded-full animate-ping"></div>
                    <div className="bg-white border border-gray-200 p-6 rounded-full shadow-lg relative z-10 text-red-600">
                      <Loader2 className="w-10 h-10 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-md w-full">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-500 mb-1">
                      <span>{t.uploadingTitle}</span>
                      <span className="text-red-600">{progress}%</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs font-mono text-gray-400 animate-pulse mt-2">{stepMessage}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-full shadow-lg text-emerald-600 animate-bounce">
                    <Check className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-lg text-gray-900">{t.successTitle}</h3>
                    <p className="text-sm text-gray-500">{t.successDesc}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer info warning */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{t.limitWarning}</span>
        </div>

      </div>
    </div>
  );
}
