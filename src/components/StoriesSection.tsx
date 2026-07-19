import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Play, Pause, ChevronLeft, ChevronRight, Send, Sparkles, 
  Clock, Check, Heart, Smile, Flame, Volume2, VolumeX, Eye, FlameKindling, Music,
  Camera, RefreshCw, Trash2, Share2
} from 'lucide-react';

// Defining types for our Snapchat-style Stories
export interface StorySlide {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text';
  url?: string;
  caption?: string;
  bgGradient?: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  duration?: number; // duration in ms, default is 5000ms
  sticker?: string;
  stickerX?: number; // percentage from left
  stickerY?: number; // percentage from top
  filter?: 'none' | 'grayscale' | 'sepia' | 'vivid';
  overlayCaption?: string;
  overlayCaptionStyle?: 'modern' | 'retro' | 'neon' | 'glow';
}

export interface CreatorStories {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  hasUnread: boolean;
  slides: StorySlide[];
  lastUpdated: number; // timestamp
}

interface StoriesSectionProps {
  language?: 'ar' | 'en';
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  } | null;
}

// Initial high-quality presets for the application's demo stories
const PRESET_STORIES: CreatorStories[] = [
  {
    creatorId: 'tech_insider',
    creatorName: 'Tech Insider 💻',
    creatorAvatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=150&h=150&q=80',
    hasUnread: true,
    lastUpdated: Date.now() - 2 * 60 * 60 * 1000, // 2h ago
    slides: [
      {
        id: 'tech_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=640&q=80',
        caption: 'Unveiling the next-generation quantum computing chip! Truly mesmerizing speed! 🚀🌌',
        fontSize: 'md',
        duration: 6000,
        sticker: '⚡'
      },
      {
        id: 'tech_2',
        type: 'text',
        caption: 'Can you believe we will have consumer AI assistants doing 100% of our chores by 2030? Let me know in the comments!',
        bgGradient: 'from-indigo-900 via-purple-900 to-pink-800',
        fontSize: 'lg',
        duration: 5000,
        sticker: '🤖'
      },
      {
        id: 'tech_3',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        caption: 'Testing the new holographic display screens. The color contrast is unreal! 📺✨',
        duration: 8000
      }
    ]
  },
  {
    creatorId: 'nature_escapes',
    creatorName: 'Nature Escapes 🏔️',
    creatorAvatar: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=150&h=150&q=80',
    hasUnread: true,
    lastUpdated: Date.now() - 4 * 60 * 60 * 1000, // 4h ago
    slides: [
      {
        id: 'nature_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=640&q=80',
        caption: 'Waking up to this breathtaking view from the misty mountains of Switzerland! 🏔️✨',
        fontSize: 'md',
        duration: 5000,
        sticker: '🦌'
      },
      {
        id: 'nature_2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        caption: 'A slice of futuristic scenery, cinematic frames from our nature film crew. 🍃📹',
        duration: 8000
      }
    ]
  },
  {
    creatorId: 'lofi_chill',
    creatorName: 'Lofi Chill 🎵',
    creatorAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80',
    hasUnread: true,
    lastUpdated: Date.now() - 6 * 60 * 60 * 1000, // 6h ago
    slides: [
      {
        id: 'lofi_1',
        type: 'audio',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        caption: 'New retro lofi track is cooking! Play with audio on to preview the nostalgic synth wave. 🎹🎧',
        bgGradient: 'from-violet-900 via-slate-900 to-indigo-950',
        fontSize: 'md',
        duration: 8000,
        sticker: '🎵'
      }
    ]
  }
];

// Floating reaction particle type
interface FloatingReaction {
  id: number;
  emoji: string;
  startX: string;
  startY: string;
  driftX: string;
  driftY: string;
  rotStart: string;
  rotEnd: string;
  scaleStart: number;
  scaleEnd: number;
  duration: string;
}

export default function StoriesSection({ language = 'en', currentUser }: StoriesSectionProps) {
  const isArabic = language === 'ar';

  // 1. Core Stories State
  const [creators, setCreators] = useState<CreatorStories[]>([]);
  const [activeCreatorIndex, setActiveCreatorIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isViewerPlaying, setIsViewerPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 100
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // 2. Story Creation Studio State
  const [isCreationOpen, setIsCreationOpen] = useState<boolean>(false);
  const [storyType, setStoryType] = useState<'text' | 'media'>('text');
  
  // Text Story Fields
  const [textCaption, setTextCaption] = useState<string>('');
  const [textGradient, setTextGradient] = useState<string>('from-indigo-600 via-purple-600 to-pink-600');
  const [textFontSize, setTextFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [textSticker, setTextSticker] = useState<string>('');
  
  // Media Story Fields
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFileType, setMediaFileType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaCaption, setMediaCaption] = useState<string>('');
  
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [storyViewCounts, setStoryViewCounts] = useState<Record<string, number>>({});

  // Camera & AI Generation state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Preset Filters & Caption overlay state
  const [selectedFilter, setSelectedFilter] = useState<'none' | 'grayscale' | 'sepia' | 'vivid'>('none');
  const [overlayCaption, setOverlayCaption] = useState<string>('');
  const [overlayCaptionStyle, setOverlayCaptionStyle] = useState<'modern' | 'retro' | 'neon' | 'glow'>('modern');

  // Helpers for filters and overlays
  const getFilterStyle = (filterName?: 'none' | 'grayscale' | 'sepia' | 'vivid') => {
    switch (filterName) {
      case 'grayscale':
        return 'grayscale(100%)';
      case 'sepia':
        return 'sepia(100%)';
      case 'vivid':
        return 'saturate(1.8) contrast(1.1)';
      default:
        return 'none';
    }
  };

  const renderStylizedCaption = (text: string, styleName?: 'modern' | 'retro' | 'neon' | 'glow') => {
    if (!text) return null;
    switch (styleName) {
      case 'retro':
        return (
          <div className="absolute bottom-6 px-4 py-2 bg-yellow-400 text-black font-mono font-black border-2 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs md:text-sm uppercase tracking-tight select-none z-30">
            {text}
          </div>
        );
      case 'neon':
        return (
          <div className="absolute bottom-6 px-4 py-2 bg-pink-950/80 text-pink-400 font-sans font-black tracking-widest uppercase border border-pink-500/30 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.5)] text-xs md:text-sm select-none z-30">
            {text}
          </div>
        );
      case 'glow':
        return (
          <div className="absolute bottom-6 px-5 py-2.5 bg-white/15 backdrop-blur-md border border-white/20 text-white font-sans font-semibold rounded-2xl tracking-wide text-xs md:text-sm shadow-xl shadow-white/5 select-none z-30">
            {text}
          </div>
        );
      case 'modern':
      default:
        return (
          <div className="absolute bottom-6 px-4 py-2 bg-black/70 backdrop-blur-xs border border-white/10 text-white font-sans font-bold rounded-xl text-xs md:text-sm tracking-wide shadow select-none z-30">
            {text}
          </div>
        );
    }
  };

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(5000);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // Translations
  const t = {
    title: isArabic ? 'القصص اليومية' : 'Daily Stories',
    yourStory: isArabic ? 'قصتك' : 'Your Story',
    addStory: isArabic ? 'أضف قصة' : 'Add Story',
    createStoryTitle: isArabic ? 'أستوديو إنشاء قصة جديدة' : 'Create New Story Studio',
    textTab: isArabic ? 'قصة نصية ملونة' : 'Colorful Text Story',
    mediaTab: isArabic ? 'قصة وسائط (صورة/فيديو/صوت)' : 'Media Story (Image/Video/Audio)',
    captionLabel: isArabic ? 'اكتب عبارة أو وصفاً للقصة...' : 'Write a caption or quote...',
    captionPlaceholder: isArabic ? 'شارك ما يدور في ذهنك اليوم...' : 'Share what is on your mind today...',
    selectBg: isArabic ? 'اختر التدرج اللوني للخلفية:' : 'Select Background Gradient:',
    fontSizeLabel: isArabic ? 'حجم الخط:' : 'Font Size:',
    stickerLabel: isArabic ? 'أضف ملصقاً تعبيرياً (Sticker):' : 'Add an Emoji Sticker:',
    uploadLabel: isArabic ? 'اختر ملف وسائط محلي:' : 'Select local media file:',
    orUrl: isArabic ? 'أو أدخل رابط ويب مباشر للوسائط:' : 'Or enter a direct web media link:',
    mediaTypeLabel: isArabic ? 'نوع الوسائط:' : 'Media Type:',
    urlPlaceholder: isArabic ? 'مثال: https://images.unsplash.com/... أو رابط MP3' : 'e.g., https://images.unsplash.com/... or MP3 link',
    publishBtn: isArabic ? 'نشر قصتي الآن 🚀' : 'Publish My Story Now 🚀',
    publishing: isArabic ? 'جاري معالجة وتشفير القصة...' : 'Processing and securing story stream...',
    publishedOk: isArabic ? 'تم نشر قصتك بنجاح وتأمينها لمدة 24 ساعة! 🎉' : 'Your story is transcoded & live for 24 hours! 🎉',
    replyPlaceholder: isArabic ? 'أرسل رداً خاصاً...' : 'Send a private reply...',
    replySent: isArabic ? 'تم إرسال ردك بنجاح! 📨' : 'Your reply was sent successfully! 📨',
    noStories: isArabic ? 'لا توجد قصص متاحة' : 'No stories available',
    viewsCount: isArabic ? 'مشاهدة' : 'views',
    holdToPause: isArabic ? 'اضغط مع الاستمرار للإيقاف المؤقت' : 'Press & hold to pause preview',
    audioMode: isArabic ? 'مشغل الصوت النشط 🎵' : 'Playing Audio Preview 🎵',
    arText: isArabic
  };

  // 3. Load Stories on Mount
  useEffect(() => {
    const saved = localStorage.getItem('metatube_stories');
    let loaded: CreatorStories[] = [];
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch (e) {
        loaded = [...PRESET_STORIES];
      }
    } else {
      loaded = [...PRESET_STORIES];
    }

    // Filter out expired stories (TTL > 24 hours)
    const filtered = loaded.map(creator => {
      const activeSlides = creator.slides.filter(slide => {
        // Preset slides do not expire immediately, local user ones do
        if (creator.creatorId === 'tech_insider' || creator.creatorId === 'nature_escapes' || creator.creatorId === 'lofi_chill') {
          return true;
        }
        // Check if slide was created within last 24 hours
        const slideTime = (slide as any).createdAt || creator.lastUpdated;
        return Date.now() - slideTime < 24 * 60 * 60 * 1000;
      });

      return {
        ...creator,
        slides: activeSlides
      };
    }).filter(creator => creator.slides.length > 0);

    setCreators(filtered);
    localStorage.setItem('metatube_stories', JSON.stringify(filtered));

    // Load custom views count
    let finalViews: Record<string, number> = {};
    const views = localStorage.getItem('metatube_story_views');
    if (views) {
      try {
        finalViews = JSON.parse(views);
        setStoryViewCounts(finalViews);
      } catch(e) {}
    } else {
      finalViews = {
        'tech_1': 142,
        'tech_2': 98,
        'tech_3': 210,
        'nature_1': 354,
        'nature_2': 188,
        'lofi_1': 430
      };
      setStoryViewCounts(finalViews);
      localStorage.setItem('metatube_story_views', JSON.stringify(finalViews));
    }

    // Support for Deep-Linked Shared Stories via URL parameters
    const params = new URLSearchParams(window.location.search);
    const targetCreatorId = params.get('storyCreatorId');
    const targetSlideId = params.get('storySlideId');

    if (targetCreatorId) {
      const creatorIdx = filtered.findIndex(c => c.creatorId === targetCreatorId);
      if (creatorIdx !== -1) {
        let slideIdx = 0;
        if (targetSlideId) {
          const foundSlideIdx = filtered[creatorIdx].slides.findIndex(s => s.id === targetSlideId);
          if (foundSlideIdx !== -1) {
            slideIdx = foundSlideIdx;
          }
        }
        setActiveCreatorIndex(creatorIdx);
        setActiveSlideIndex(slideIdx);
        setIsViewerPlaying(true);
        
        // Track a view on load for the shared slide
        const targetSlide = filtered[creatorIdx].slides[slideIdx];
        if (targetSlide) {
          const updatedViews = { ...finalViews };
          updatedViews[targetSlide.id] = (updatedViews[targetSlide.id] || 0) + 1;
          setStoryViewCounts(updatedViews);
          localStorage.setItem('metatube_story_views', JSON.stringify(updatedViews));
        }
      }
    }
  }, []);

  // 4. Timer Logic for Story Auto-Advance
  const activeCreator = activeCreatorIndex !== null ? creators[activeCreatorIndex] : null;
  const activeSlide = activeCreator ? activeCreator.slides[activeSlideIndex] : null;

  useEffect(() => {
    if (activeCreatorIndex === null || !activeCreator || !activeSlide) {
      setProgress(0);
      return;
    }

    // Determine slide duration
    let slideDuration = activeSlide.duration || 5000;
    durationRef.current = slideDuration;

    if (!isViewerPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Initialize progress timer
    startTimeRef.current = Date.now() - (progress / 100) * slideDuration;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const calculatedProgress = Math.min((elapsed / slideDuration) * 100, 100);
      setProgress(calculatedProgress);

      if (calculatedProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Slide finished! Go to next
        handleNextSlide();
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeCreatorIndex, activeSlideIndex, isViewerPlaying]);

  // Handle Video element metadata load to sync duration
  useEffect(() => {
    if (activeSlide?.type === 'video' && videoRef.current && isViewerPlaying) {
      const video = videoRef.current;
      video.muted = isMuted;
      video.play().catch(() => {});

      const onMetadata = () => {
        const vidDuration = (video.duration * 1000) || 5000;
        durationRef.current = vidDuration;
        // restart progress calculation with new duration
        startTimeRef.current = Date.now();
      };

      video.addEventListener('loadedmetadata', onMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', onMetadata);
      };
    }
  }, [activeSlide, isViewerPlaying, isMuted]);

  // Handle Audio element playback
  useEffect(() => {
    if (activeSlide?.type === 'audio' && audioRef.current && isViewerPlaying) {
      const audio = audioRef.current;
      audio.muted = isMuted;
      audio.play().catch(() => {});

      const onMetadata = () => {
        const audDuration = (audio.duration * 1000) || 8000;
        durationRef.current = audDuration;
        startTimeRef.current = Date.now();
      };

      audio.addEventListener('loadedmetadata', onMetadata);
      return () => {
        audio.removeEventListener('loadedmetadata', onMetadata);
      };
    }
  }, [activeSlide, isViewerPlaying, isMuted]);

  // Next Slide / Next Creator
  const handleNextSlide = () => {
    if (activeCreatorIndex === null || !activeCreator) return;

    // Increment view count for the viewed slide
    if (activeSlide) {
      const updatedViews = { ...storyViewCounts };
      updatedViews[activeSlide.id] = (updatedViews[activeSlide.id] || 0) + 1;
      setStoryViewCounts(updatedViews);
      localStorage.setItem('metatube_story_views', JSON.stringify(updatedViews));
    }

    if (activeSlideIndex < activeCreator.slides.length - 1) {
      // Go to next slide of same creator
      setActiveSlideIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to next creator's stories
      if (activeCreatorIndex < creators.length - 1) {
        // Mark current creator as read
        const updatedCreators = [...creators];
        updatedCreators[activeCreatorIndex].hasUnread = false;
        setCreators(updatedCreators);
        localStorage.setItem('metatube_stories', JSON.stringify(updatedCreators));

        setActiveCreatorIndex(activeCreatorIndex + 1);
        setActiveSlideIndex(0);
        setProgress(0);
      } else {
        // All stories finished! Close viewer
        const updatedCreators = [...creators];
        updatedCreators[activeCreatorIndex].hasUnread = false;
        setCreators(updatedCreators);
        localStorage.setItem('metatube_stories', JSON.stringify(updatedCreators));

        handleCloseViewer();
      }
    }
  };

  // Previous Slide / Previous Creator
  const handlePrevSlide = () => {
    if (activeCreatorIndex === null || !activeCreator) return;

    if (activeSlideIndex > 0) {
      // Go to previous slide of same creator
      setActiveSlideIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to previous creator
      if (activeCreatorIndex > 0) {
        setActiveCreatorIndex(activeCreatorIndex - 1);
        // Start at last slide of previous creator
        const prevCreator = creators[activeCreatorIndex - 1];
        setActiveSlideIndex(prevCreator.slides.length - 1);
        setProgress(0);
      } else {
        // Already at first slide of first creator. Restart current slide
        setProgress(0);
        startTimeRef.current = Date.now();
      }
    }
  };

  const handleCloseViewer = () => {
    setActiveCreatorIndex(null);
    setActiveSlideIndex(0);
    setProgress(0);
    setIsViewerPlaying(true);
    setReplyText('');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!activeCreator) return;

    // Filter out the slide
    const updatedCreators = creators.map(c => {
      if (c.creatorId === activeCreator.creatorId) {
        return {
          ...c,
          slides: c.slides.filter(s => s.id !== slideId),
          lastUpdated: Date.now()
        };
      }
      return c;
    }).filter(c => c.slides.length > 0); // Remove any creators with no slides remaining

    setCreators(updatedCreators);
    localStorage.setItem('metatube_stories', JSON.stringify(updatedCreators));

    showToast(isArabic ? "تم حذف القصة بنجاح." : "Story slide deleted successfully.");

    // Check if current creator still exists and has slides
    const currentCreatorExists = updatedCreators.find(c => c.creatorId === activeCreator.creatorId);
    if (!currentCreatorExists) {
      // Entire story deleted, close the viewer
      handleCloseViewer();
    } else {
      // Still has other slides, adjust activeSlideIndex if needed
      if (activeSlideIndex >= currentCreatorExists.slides.length) {
        setActiveSlideIndex(Math.max(0, currentCreatorExists.slides.length - 1));
      }
      setProgress(0);
    }
  };

  const handleShareStory = async () => {
    if (!activeCreator || !activeSlide) return;

    // Pause the viewer so it doesn't auto-advance while sharing
    setIsViewerPlaying(false);

    const shareUrl = `${window.location.origin}${window.location.pathname}?storyCreatorId=${activeCreator.creatorId}&storySlideId=${activeSlide.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: isArabic ? `قصة من ${activeCreator.creatorName}` : `${activeCreator.creatorName}'s Story on MYtube`,
          text: activeSlide.caption || (isArabic ? `شاهد هذه القصة المؤقتة!` : `Check out this temporary story!`),
          url: shareUrl
        });
        showToast(isArabic ? "تم مشاركة القصة بنجاح!" : "Story shared successfully!");
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        showToast(isArabic ? "تم نسخ رابط القصة المؤقت إلى الحافظة! 🔗" : "Temporary story link copied to clipboard! 🔗");
      }
    } catch (err) {
      console.warn("Share API failed or was cancelled:", err);
      // Fallback in case of rejection or error
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast(isArabic ? "تم نسخ رابط القصة المؤقت إلى الحافظة! 🔗" : "Temporary story link copied to clipboard! 🔗");
      } catch (clipErr) {
        // silent fallback fail
      }
    }

    // Resume the story viewer after a tiny delay
    setTimeout(() => {
      setIsViewerPlaying(true);
    }, 1500);
  };

  // Launch Story Creator Studio
  const handleOpenCreation = () => {
    setIsCreationOpen(true);
    setTextCaption('');
    setMediaUrl('');
    setMediaFile(null);
    setMediaCaption('');
    setTextSticker('');
    setAiPrompt('');
    setSelectedFilter('none');
    setOverlayCaption('');
    setOverlayCaptionStyle('modern');
  };

  const handleCloseCreation = () => {
    setIsCreationOpen(false);
    stopCamera();
    setAiPrompt('');
    setSelectedFilter('none');
    setOverlayCaption('');
    setOverlayCaptionStyle('modern');
  };

  // Webcam Capture Actions
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', aspectRatio: { ideal: 9/16 } } 
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(e => console.error("Video play error:", e));
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      showToast(isArabic ? "فشل الوصول إلى الكاميرا. يرجى التحقق من الأذونات." : "Failed to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    
    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw centered video frame to canvas
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoAspect = videoWidth / videoHeight;
      const targetAspect = 9 / 16;
      
      let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;
      if (videoAspect > targetAspect) {
        // Video is wider than 9:16 - crop left/right
        sWidth = videoHeight * targetAspect;
        sx = (videoWidth - sWidth) / 2;
      } else {
        // Video is taller than 9:16 - crop top/bottom
        sHeight = videoWidth / targetAspect;
        sy = (videoHeight - sHeight) / 2;
      }
      
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      setMediaUrl(dataUrl);
      setMediaFileType('image');
      setMediaFile(null); // Clear local file to show preview
      stopCamera();
      showToast(isArabic ? "تم التقاط الصورة بنجاح!" : "Photo captured successfully!");
    }
  };

  // AI Image Generation Action
  const generateAiImage = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    showToast(isArabic ? "جاري توليد الصورة بواسطة الذكاء الاصطناعي..." : "Generating image with AI...");

    try {
      const response = await fetch('/api/ai/generate-story-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      if (data.imageUrl) {
        setMediaUrl(data.imageUrl);
        setMediaFileType('image');
        setMediaFile(null); // Clear local file to show generated URL
        showToast(isArabic ? "تم توليد الصورة الفنية بنجاح!" : "Aesthetic image generated successfully!");
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      showToast(isArabic ? "فشل توليد الصورة. يرجى المحاولة لاحقاً." : "Failed to generate image. Please try again.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle local file selection and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    
    // Determine file type
    if (file.type.startsWith('image/')) {
      setMediaFileType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaFileType('video');
    } else if (file.type.startsWith('audio/')) {
      setMediaFileType('audio');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Publish Story Action
  const handlePublish = () => {
    if (storyType === 'text' && !textCaption.trim()) return;
    if (storyType === 'media' && !mediaUrl) return;

    setIsPublishing(true);

    setTimeout(() => {
      // Create new story slide
      const newSlide: StorySlide = {
        id: `usr_story_${Date.now()}`,
        type: storyType === 'text' ? 'text' : mediaFileType,
        url: storyType === 'media' ? mediaUrl : undefined,
        caption: storyType === 'text' ? textCaption : mediaCaption,
        bgGradient: storyType === 'text' ? textGradient : undefined,
        fontSize: storyType === 'text' ? textFontSize : undefined,
        sticker: storyType === 'text' && textSticker ? textSticker : undefined,
        duration: storyType === 'text' ? 5000 : (mediaFileType === 'video' ? 8000 : 7000),
        stickerX: 50,
        stickerY: 35,
        filter: storyType === 'media' ? selectedFilter : undefined,
        overlayCaption: storyType === 'media' && overlayCaption.trim() ? overlayCaption : undefined,
        overlayCaptionStyle: storyType === 'media' && overlayCaption.trim() ? overlayCaptionStyle : undefined,
        // Custom attribute for tracking time-to-live
        ...({ createdAt: Date.now() } as any)
      };

      // Find if current user already has stories
      const userCreatorId = currentUser?.id || 'usr-current';
      const updatedCreators = [...creators];
      const userIndex = updatedCreators.findIndex(c => c.creatorId === userCreatorId);

      if (userIndex >= 0) {
        // Append to existing slides
        updatedCreators[userIndex].slides.unshift(newSlide);
        updatedCreators[userIndex].lastUpdated = Date.now();
        updatedCreators[userIndex].hasUnread = false; // user's own stories are read by default
      } else {
        // Create new creator entry
        const userEntry: CreatorStories = {
          creatorId: userCreatorId,
          creatorName: currentUser?.displayName || 'My Story 🌟',
          creatorAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
          hasUnread: false,
          lastUpdated: Date.now(),
          slides: [newSlide]
        };
        // Put user story at the front
        updatedCreators.unshift(userEntry);
      }

      setCreators(updatedCreators);
      localStorage.setItem('metatube_stories', JSON.stringify(updatedCreators));

      setIsPublishing(false);
      setIsCreationOpen(false);

      // Trigger high-quality visual confirmation
      showToast(t.publishedOk);
    }, 2000); // simulated processing delay
  };

  // Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Handle send reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeCreator) return;

    showToast(`${t.replySent}`);
    setReplyText('');
  };

  // Trigger interactive emoji burst particle effects with realistic physics (sway, drift, random scale & rotate)
  const triggerEmojiBurst = (emoji: string) => {
    const burstCount = 12;
    const newReactions: FloatingReaction[] = [];

    for (let i = 0; i < burstCount; i++) {
      const randDir = Math.random() > 0.5 ? 1 : -1;
      const driftXValue = (Math.random() * 140 - 70) + (randDir * 40); // nice outward push
      const driftYValue = -(350 + Math.random() * 380); // fly high up the viewport
      
      newReactions.push({
        id: Date.now() + i + Math.random(),
        emoji,
        startX: `${35 + Math.random() * 30}%`, // start in bottom center-ish zone
        startY: `${2 + Math.random() * 5}%`, // start just above the reply area
        driftX: `${driftXValue}px`,
        driftY: `${driftYValue}px`,
        rotStart: `${(Math.random() - 0.5) * 45}deg`,
        rotEnd: `${(Math.random() - 0.5) * 420}deg`, // elegant rotation spins
        scaleStart: 0.5 + Math.random() * 0.3,
        scaleEnd: 1.3 + Math.random() * 0.7,
        duration: `${1.4 + Math.random() * 0.8}s` // staggered flight times
      });
    }

    setFloatingReactions(prev => [...prev, ...newReactions]);

    // Animate reactions upward and clean up
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => !newReactions.find(nr => nr.id === r.id)));
    }, 2400);
  };

  return (
    <div className="w-full bg-white border border-gray-100 rounded-3xl p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 select-none animate-fadeIn">
      
      {/* Stories Bar Header */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <h3 className="font-sans font-black text-gray-900 text-sm md:text-base tracking-tight flex items-center gap-1.5">
            <span>{t.title}</span>
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-mono border border-red-100 uppercase font-black">
              LIVE 24H
            </span>
          </h3>
        </div>

        <button 
          onClick={handleOpenCreation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-sans font-bold text-xs rounded-full shadow-md shadow-indigo-500/10 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          <span>{t.addStory}</span>
        </button>
      </div>

      {/* Stories Circular Horizontal List */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
        
        {/* Your Story item (if not inside state) */}
        {(!creators.some(c => c.creatorId === (currentUser?.id || 'usr-current'))) && (
          <motion.div 
            onClick={handleOpenCreation}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 snap-start"
          >
            <div className="relative w-15 h-15 rounded-full p-[2px] border-2 border-dashed border-gray-200 group-hover:border-indigo-400 transition-all flex items-center justify-center bg-gray-50">
              <img 
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'} 
                alt="My Profile"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
              />
              <span className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full shadow-md border-2 border-white group-hover:scale-110 transition-all">
                <Plus className="w-2.5 h-2.5 stroke-[4px]" />
              </span>
            </div>
            <span className="text-[10.5px] font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">
              {t.yourStory}
            </span>
          </motion.div>
        )}

        {/* Dynamic Creators Stories */}
        {creators.map((creator, idx) => {
          const isUserOwn = creator.creatorId === (currentUser?.id || 'usr-current');
          return (
            <motion.div 
              key={creator.creatorId}
              layout
              initial={{ scale: 0.75, opacity: 0, x: -15 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 18,
                layout: { type: 'spring', stiffness: 300, damping: 22 }
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveCreatorIndex(idx);
                setActiveSlideIndex(0);
                setProgress(0);
                setIsViewerPlaying(true);
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 snap-start animate-none"
            >
              <div className={`relative w-15 h-15 rounded-full p-[2.5px] transition-all flex items-center justify-center ${
                creator.hasUnread 
                  ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.35)] scale-102 group-hover:rotate-12' 
                  : 'bg-gray-200'
              }`}>
                <div className="w-full h-full rounded-full bg-white p-[1.5px] flex items-center justify-center">
                  <img 
                    src={creator.creatorAvatar} 
                    alt={creator.creatorName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-all duration-350"
                  />
                </div>
                {creator.hasUnread && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full animate-pulse" />
                )}
                {isUserOwn && (
                  <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-0.5 rounded-full shadow-md border border-white">
                    <Check className="w-2.5 h-2.5 stroke-[3px]" />
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] font-bold tracking-tight max-w-[70px] truncate ${
                creator.hasUnread ? 'text-gray-900 font-extrabold' : 'text-gray-500'
              } group-hover:text-indigo-600 transition-colors`}>
                {isUserOwn ? t.yourStory : creator.creatorName}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* 5. IMMERSIVE SNAPCHAT-STYLE STORIES VIEWER OVERLAY */}
      <AnimatePresence>
        {activeCreatorIndex !== null && activeCreator && activeSlide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-0 md:p-4 select-none touch-none overflow-hidden"
          >
            {/* Main view container mimicking mobile screen */}
            <div className="relative w-full h-full md:max-w-md md:h-[90vh] md:rounded-3xl bg-neutral-950 shadow-2xl flex flex-col overflow-hidden border border-neutral-900">
              
              {/* TOP STORY CONTROLLER BARS */}
              <div className="absolute top-3 left-0 right-0 z-40 px-3 flex gap-1">
                {activeCreator.slides.map((slide, idx) => (
                  <div key={slide.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-75"
                      style={{
                        width: idx < activeSlideIndex 
                          ? '100%' 
                          : idx === activeSlideIndex 
                          ? `${progress}%` 
                          : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* STORY CREATOR HEADER INFO */}
              <div className="absolute top-6 left-0 right-0 z-40 px-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={activeCreator.creatorAvatar} 
                    alt={activeCreator.creatorName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow-md"
                  />
                  <div>
                    <h4 className="text-white font-sans font-black text-sm drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] flex items-center gap-1">
                      <span>{activeCreator.creatorName}</span>
                    </h4>
                    <span className="text-gray-300 text-[10px] font-sans flex items-center gap-1 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
                      <Clock className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{isArabic ? 'قصة مؤقتة' : 'Temporary Story'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Delete Button for User's Own Story */}
                  {activeCreator.creatorId === (currentUser?.id || 'usr-current') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(activeSlide.id)}
                      className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white border border-red-500/20 shadow-md cursor-pointer active:scale-90 transition-all flex items-center gap-1.5 text-[10px] font-black"
                      title={isArabic ? 'حذف القصة' : 'Delete Story'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isArabic ? 'حذف' : 'Delete'}</span>
                    </button>
                  )}

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={handleShareStory}
                    className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/20 shadow-md cursor-pointer active:scale-90 transition-all flex items-center gap-1.5 text-[10.5px] font-bold"
                    title={isArabic ? 'مشاركة القصة' : 'Share Story'}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isArabic ? 'مشاركة' : 'Share'}</span>
                  </button>

                  {/* Views Count Badge */}
                  <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full text-white text-[9.5px] font-bold font-sans">
                    <Eye className="w-3 h-3 text-indigo-400" />
                    <span>{storyViewCounts[activeSlide.id] || 12} {t.viewsCount}</span>
                  </div>

                  <button 
                    onClick={handleCloseViewer}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/85 border border-white/10 cursor-pointer active:scale-90 transition-all"
                  >
                    <X className="w-4 h-4 stroke-[2.5px]" />
                  </button>
                </div>
              </div>

              {/* TAP NAVIGATION DETECTORS (Left/Right Overlay invisible areas) */}
              <div className="absolute inset-x-0 top-18 bottom-20 z-20 flex">
                <div 
                  className="w-1/3 h-full cursor-w-resize"
                  onClick={handlePrevSlide}
                  onMouseDown={() => setIsViewerPlaying(false)}
                  onMouseUp={() => setIsViewerPlaying(true)}
                  onTouchStart={() => setIsViewerPlaying(false)}
                  onTouchEnd={() => setIsViewerPlaying(true)}
                  title={t.holdToPause}
                />
                <div 
                  className="w-2/3 h-full cursor-e-resize"
                  onClick={handleNextSlide}
                  onMouseDown={() => setIsViewerPlaying(false)}
                  onMouseUp={() => setIsViewerPlaying(true)}
                  onTouchStart={() => setIsViewerPlaying(false)}
                  onTouchEnd={() => setIsViewerPlaying(true)}
                  title={t.holdToPause}
                />
              </div>

              {/* CORE MEDIA CONTENT DISPLAY */}
              <div className="flex-1 w-full bg-black flex items-center justify-center relative">
                
                {/* 1. TEXT STORY VIEW */}
                {activeSlide.type === 'text' && (
                  <div className={`w-full h-full bg-gradient-to-tr ${activeSlide.bgGradient || 'from-indigo-600 via-purple-600 to-pink-600'} flex flex-col items-center justify-center p-8 text-center relative`}>
                    <h2 className={`text-white font-sans font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] leading-relaxed select-text ${
                      activeSlide.fontSize === 'xl' ? 'text-2xl md:text-3xl' :
                      activeSlide.fontSize === 'lg' ? 'text-xl md:text-2xl' :
                      activeSlide.fontSize === 'sm' ? 'text-sm md:text-base' : 'text-base md:text-lg'
                    }`}>
                      {activeSlide.caption}
                    </h2>

                    {/* Cute sticker */}
                    {activeSlide.sticker && (
                      <div 
                        className="absolute text-5xl md:text-6xl animate-bounce select-none"
                        style={{
                          left: `${activeSlide.stickerX || 50}%`,
                          top: `${activeSlide.stickerY || 35}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {activeSlide.sticker}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. IMAGE STORY VIEW */}
                {activeSlide.type === 'image' && (
                  <div className="w-full h-full flex flex-col justify-center items-center relative">
                    <img 
                      src={activeSlide.url} 
                      alt="Story Media"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      style={{ filter: getFilterStyle(activeSlide.filter) }}
                    />
                    
                    {/* Caption bar overlay */}
                    {activeSlide.caption && (
                      <div className="absolute bottom-4 inset-x-3.5 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center text-white text-xs md:text-sm font-semibold select-text drop-shadow">
                        {activeSlide.caption}
                      </div>
                    )}

                    {/* Overlay stylized captions */}
                    {activeSlide.overlayCaption && renderStylizedCaption(activeSlide.overlayCaption, activeSlide.overlayCaptionStyle)}
 
                    {/* Sticker overlay */}
                    {activeSlide.sticker && (
                      <div 
                        className="absolute text-5xl select-none"
                        style={{
                          left: `${activeSlide.stickerX || 50}%`,
                          top: `${activeSlide.stickerY || 35}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {activeSlide.sticker}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. VIDEO STORY VIEW */}
                {activeSlide.type === 'video' && (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <video 
                      ref={videoRef}
                      src={activeSlide.url}
                      className="w-full h-full object-cover"
                      playsInline
                      style={{ filter: getFilterStyle(activeSlide.filter) }}
                    />
                    
                    {/* Caption overlay */}
                    {activeSlide.caption && (
                      <div className="absolute bottom-4 inset-x-3.5 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center text-white text-xs md:text-sm font-semibold select-text">
                        {activeSlide.caption}
                      </div>
                    )}

                    {/* Overlay stylized captions */}
                    {activeSlide.overlayCaption && renderStylizedCaption(activeSlide.overlayCaption, activeSlide.overlayCaptionStyle)}
                  </div>
                )}

                {/* 4. AUDIO STORY VIEW */}
                {activeSlide.type === 'audio' && (
                  <div className={`w-full h-full bg-gradient-to-br ${activeSlide.bgGradient || 'from-neutral-900 to-indigo-950'} flex flex-col items-center justify-center p-8 text-center relative`}>
                    <audio 
                      ref={audioRef}
                      src={activeSlide.url}
                      playsInline
                    />

                    {/* Animated Neon Vinyl Disc */}
                    <div className="relative w-36 h-36 bg-black rounded-full border-[6px] border-indigo-500/20 flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.4)] animate-spin" style={{ animationDuration: '6s' }}>
                      <div className="w-14 h-14 bg-indigo-600 rounded-full border border-indigo-400 flex items-center justify-center">
                        <Music className="w-6 h-6 text-indigo-100" />
                      </div>
                      <span className="absolute -top-2 bg-indigo-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full border border-indigo-400 font-sans tracking-wider uppercase">
                        AUDIO LIVE
                      </span>
                    </div>

                    {/* Custom Audio Waves */}
                    <div className="flex items-end justify-center gap-1.5 h-10 mt-8 w-44">
                      <div className="w-1 bg-indigo-400 rounded-full h-3 animate-bounce" style={{ animationDuration: '0.8s' }} />
                      <div className="w-1 bg-purple-400 rounded-full h-6 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.1s' }} />
                      <div className="w-1 bg-pink-400 rounded-full h-9 animate-bounce" style={{ animationDuration: '1.1s', animationDelay: '0.3s' }} />
                      <div className="w-1 bg-rose-400 rounded-full h-5 animate-bounce" style={{ animationDuration: '0.5s', animationDelay: '0.4s' }} />
                      <div className="w-1 bg-indigo-400 rounded-full h-8 animate-bounce" style={{ animationDuration: '0.9s', animationDelay: '0.15s' }} />
                      <div className="w-1 bg-purple-400 rounded-full h-4 animate-bounce" style={{ animationDuration: '0.7s', animationDelay: '0.2s' }} />
                    </div>

                    <h3 className="text-white font-sans font-black text-base mt-6 leading-relaxed select-text">
                      {activeSlide.caption}
                    </h3>

                    {/* Overlay stylized captions */}
                    {activeSlide.overlayCaption && renderStylizedCaption(activeSlide.overlayCaption, activeSlide.overlayCaptionStyle)}

                    <div className="absolute top-18 right-4 flex items-center gap-1 bg-black/50 border border-white/10 px-2.5 py-1 rounded-full text-indigo-300 text-[10px] font-bold">
                      <Music className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>{t.audioMode}</span>
                    </div>
                  </div>
                )}

                {/* Floating Interactive Reactions Layer */}
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                  {floatingReactions.map(react => (
                    <div 
                      key={react.id}
                      className="absolute text-5xl select-none pointer-events-none"
                      style={{
                        left: react.startX,
                        bottom: react.startY,
                        animation: `fly-and-drift ${react.duration} cubic-bezier(0.12, 0.72, 0.25, 0.98) forwards`,
                        '--drift-x': react.driftX,
                        '--drift-y': react.driftY,
                        '--rot-start': react.rotStart,
                        '--rot-end': react.rotEnd,
                        '--scale-start': react.scaleStart,
                        '--scale-end': react.scaleEnd,
                      } as React.CSSProperties}
                    >
                      {react.emoji}
                    </div>
                  ))}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes fly-and-drift {
                      0% {
                        transform: translate(-50%, 0) scale(var(--scale-start)) rotate(var(--rot-start));
                        opacity: 0;
                      }
                      12% {
                        opacity: 1;
                      }
                      100% {
                        transform: translate(calc(-50% + var(--drift-x)), var(--drift-y)) scale(var(--scale-end)) rotate(var(--rot-end));
                        opacity: 0;
                      }
                    }
                  `}} />
                </div>
              </div>

              {/* MUTED/VOLUME ICON CONTROLLERS */}
              {(activeSlide.type === 'video' || activeSlide.type === 'audio') && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-22 right-4 z-40 bg-black/65 backdrop-blur border border-white/15 text-white p-2 rounded-full cursor-pointer shadow-md"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              )}

              {/* BOTTOM REPLY BAR & QUICK REACTIONS */}
              <div className="bg-neutral-950/95 border-t border-neutral-850 px-4 py-3 flex flex-col justify-center items-stretch gap-2.5 z-40">
                {/* Quick Emoji Reactions */}
                <div className="flex justify-between items-center gap-1.5 bg-neutral-900/60 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-2xl shadow-inner">
                  {['🔥', '❤️', '😂', '😮', '😢', '👏', '🎉', '💯', '✨', '🙌'].map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      type="button"
                      onClick={() => triggerEmojiBurst(emoji)}
                      className="text-2xl hover:scale-135 active:scale-95 transition-all duration-100 cursor-pointer p-0.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform hover:-translate-y-0.5"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="flex gap-2 items-center">
                  <input 
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t.replyPlaceholder}
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white placeholder-zinc-500 rounded-full px-4 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    type="submit"
                    className="p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors active:scale-90 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. CREATION STUDIO MODAL (PREMIUM STORY COMPOSER) */}
      <AnimatePresence>
        {isCreationOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Studio Header */}
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h3 className="font-sans font-black text-gray-900 text-sm md:text-base">
                    {t.createStoryTitle}
                  </h3>
                </div>
                <button 
                  onClick={handleCloseCreation}
                  className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Studio Body Tabs */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                
                {/* Tab selector */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setStoryType('text')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      storyType === 'text' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {t.textTab}
                  </button>
                  <button
                    onClick={() => setStoryType('media')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      storyType === 'media' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {t.mediaTab}
                  </button>
                </div>

                {/* 1. TEXT STORY COMPOSER UI */}
                {storyType === 'text' && (
                  <div className="space-y-4">
                    {/* Live Preview Container */}
                    <div className={`w-full aspect-video rounded-2xl bg-gradient-to-tr ${textGradient} p-6 flex flex-col items-center justify-center text-center relative shadow-inner overflow-hidden`}>
                      <span className="absolute top-2.5 left-3 bg-black/25 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                        {isArabic ? 'معاينة القصة' : 'Live Story Preview'}
                      </span>

                      <p className={`text-white font-sans font-black max-w-sm leading-relaxed drop-shadow-sm break-words whitespace-pre-wrap ${
                        textFontSize === 'xl' ? 'text-xl md:text-2xl' :
                        textFontSize === 'lg' ? 'text-lg md:text-xl' :
                        textFontSize === 'sm' ? 'text-xs md:text-sm' : 'text-sm md:text-base'
                      }`}>
                        {textCaption || t.captionPlaceholder}
                      </p>

                      {textSticker && (
                        <div className="absolute text-4xl animate-bounce select-none" style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}>
                          {textSticker}
                        </div>
                      )}
                    </div>

                    {/* Text Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">{t.captionLabel}</label>
                      <textarea
                        value={textCaption}
                        onChange={(e) => setTextCaption(e.target.value)}
                        placeholder={t.captionPlaceholder}
                        rows={3}
                        maxLength={150}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800"
                      />
                    </div>

                    {/* Gradient Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">{t.selectBg}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'Sunset Glow', value: 'from-amber-500 via-red-500 to-purple-600' },
                          { name: 'Cyber Space', value: 'from-indigo-900 via-purple-900 to-pink-800' },
                          { name: 'Forest Teal', value: 'from-emerald-800 via-teal-900 to-cyan-950' },
                          { name: 'Midnight', value: 'from-neutral-900 via-slate-800 to-zinc-900' }
                        ].map((grad) => (
                          <button
                            key={grad.name}
                            type="button"
                            onClick={() => setTextGradient(grad.value)}
                            className={`h-10 rounded-xl bg-gradient-to-tr ${grad.value} border-2 transition-all cursor-pointer shadow-sm relative flex items-center justify-center ${
                              textGradient === grad.value ? 'border-indigo-600 scale-102 ring-2 ring-indigo-500/10' : 'border-transparent'
                            }`}
                            title={grad.name}
                          >
                            {textGradient === grad.value && (
                              <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font & Sticker Controls Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Font Size */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">{t.fontSizeLabel}</label>
                        <div className="flex bg-gray-50 p-1 border border-gray-200 rounded-xl">
                          {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setTextFontSize(sz)}
                              className={`flex-1 py-1 text-[10px] font-black uppercase rounded transition-all cursor-pointer ${
                                textFontSize === sz ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stickers */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">{t.stickerLabel}</label>
                        <div className="flex gap-1 bg-gray-50 p-1 border border-gray-200 rounded-xl overflow-x-auto justify-between">
                          {['🔥', '💡', '🤖', '🎧', '👾', '✨'].map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setTextSticker(textSticker === st ? '' : st)}
                              className={`text-base p-1 hover:scale-125 transition-all cursor-pointer rounded ${
                                textSticker === st ? 'bg-indigo-100' : ''
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MEDIA STORY COMPOSER UI */}
                {storyType === 'media' && (
                  <div className="space-y-4">
                    {/* Preview Box */}
                    {mediaUrl ? (
                      <div className="w-full aspect-video rounded-2xl bg-black relative overflow-hidden flex items-center justify-center border border-gray-200 shadow-md">
                        {mediaFileType === 'image' && (
                          <img 
                            src={mediaUrl} 
                            className="w-full h-full object-cover" 
                            alt="Selected Preview" 
                            referrerPolicy="no-referrer"
                            style={{ filter: getFilterStyle(selectedFilter) }}
                          />
                        )}
                        {mediaFileType === 'video' && (
                          <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white text-xs">
                            <span className="p-3 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center gap-1.5 font-bold text-center">
                              <Play className="w-4 h-4 text-red-500 animate-pulse fill-red-500" />
                              <span>{isArabic ? 'تم معالجة فيديو القصة بنجاح' : 'Video processed successfully'}</span>
                            </span>
                          </div>
                        )}
                        {mediaFileType === 'audio' && (
                          <div className="w-full h-full bg-indigo-950 flex flex-col items-center justify-center text-indigo-200 text-xs gap-2">
                            <Music className="w-8 h-8 text-indigo-400 animate-bounce" />
                            <span className="font-bold">{isArabic ? 'تم تضمين مسار الأوديو المباشر' : 'Live Audio file embedded'}</span>
                          </div>
                        )}
                        
                        {/* WYSIWYG Stylized Caption Overlay Preview */}
                        {overlayCaption.trim() && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 z-20">
                            {renderStylizedCaption(overlayCaption, overlayCaptionStyle)}
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setMediaUrl('');
                            setMediaFile(null);
                          }}
                          className="absolute top-2.5 right-3 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full cursor-pointer z-20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">
                        <Music className="w-8 h-8 text-gray-300 mb-2.5" />
                        <p className="text-xs text-gray-500 font-sans font-semibold">
                          {isArabic ? 'لم يتم تحميل أي ملف بعد' : 'No file loaded yet'}
                        </p>
                      </div>
                    )}

                    {/* Media Type Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">{t.mediaTypeLabel}</label>
                      <div className="flex bg-gray-100 p-1 border border-gray-250 rounded-xl">
                        {(['image', 'video', 'audio'] as const).map((tp) => (
                          <button
                            key={tp}
                            type="button"
                            onClick={() => {
                              stopCamera();
                              setMediaFileType(tp);
                              setMediaUrl('');
                              setMediaFile(null);
                            }}
                            className={`flex-1 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                              mediaFileType === tp ? 'bg-white text-indigo-650 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Source Selection Options - Only if mediaFileType is image */}
                    {mediaFileType === 'image' && (
                      <div className="bg-gray-50 border border-gray-250 rounded-2xl p-3.5 space-y-3.5 shadow-xs">
                        <span className="text-[11px] font-black text-gray-800 block uppercase tracking-wider">
                          {isArabic ? "مصدر الصورة للقصة المؤقتة:" : "Image Source for Story Slide:"}
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isCameraActive) {
                                stopCamera();
                              } else {
                                startCamera();
                              }
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isCameraActive 
                                ? "border-red-500 bg-red-50 text-red-600 animate-pulse font-extrabold" 
                                : "border-gray-200 bg-white hover:border-indigo-500 hover:text-indigo-600 shadow-xs"
                            }`}
                          >
                            <Camera className="w-4 h-4 text-emerald-500" />
                            <span>
                              {isCameraActive 
                                ? (isArabic ? "إيقاف الكاميرا" : "Stop Camera") 
                                : (isArabic ? "التقاط من الكاميرا" : "Capture via Camera")
                              }
                            </span>
                          </button>

                          <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shadow-xs text-center">
                            <Plus className="w-4 h-4 text-indigo-500" />
                            <span>{isArabic ? "تحميل ملف محلي" : "Upload File"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                stopCamera();
                                handleFileChange(e);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Webcam Active Preview View */}
                        {isCameraActive && (
                          <div className="relative w-full aspect-[9/16] max-h-[300px] rounded-2xl bg-black border border-neutral-800 overflow-hidden shadow-inner flex flex-col justify-end mx-auto">
                            <video 
                              ref={cameraVideoRef}
                              className="absolute inset-0 w-full h-full object-cover"
                              playsInline
                              muted
                            />
                            <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>{isArabic ? "مباشر" : "CAMERA ON"}</span>
                            </div>

                            <div className="relative z-10 p-3 bg-gradient-to-t from-black/85 to-transparent flex gap-2 justify-center items-center">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="px-4 py-2 bg-emerald-600 text-white font-sans font-black text-xs rounded-xl hover:bg-emerald-750 active:scale-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                              >
                                <Camera className="w-4 h-4" />
                                <span>{isArabic ? "التقاط الصورة 📸" : "Snap Photo 📸"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-3 py-2 bg-neutral-800 text-neutral-300 font-sans font-bold text-xs rounded-xl hover:bg-neutral-700 active:scale-90 transition-all cursor-pointer"
                              >
                                {isArabic ? "إلغاء" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* AI Generator Input panel */}
                        <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2 shadow-xs">
                          <label className="text-[11px] font-black text-gray-750 block uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-bounce" />
                            <span>{isArabic ? "توليد صورة فنية بالذكاء الاصطناعي (Gemini):" : "Generate Custom Story Image via AI (Gemini):"}</span>
                          </label>
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder={isArabic ? "اكتب فكرة الصورة (مثال: بحر هادئ تحت ضوء القمر الوردي، فن رقمي ثلاثي الأبعاد)" : "Type what you want to see (e.g. A futuristic synthwave city with neon streets, digital art)..."}
                              rows={2}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-850 font-medium"
                            />
                            <button
                              type="button"
                              onClick={generateAiImage}
                              disabled={isAiGenerating || !aiPrompt.trim()}
                              className={`w-full py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                                isAiGenerating || !aiPrompt.trim()
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                  : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white hover:from-indigo-750 hover:to-purple-750 hover:scale-101 active:scale-98'
                              }`}
                            >
                              {isAiGenerating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              <span>{isAiGenerating ? (isArabic ? "جاري توليد لوحتك الفنية..." : "Generating your art masterpiece...") : (isArabic ? "توليد صورة سحرية ✨" : "Generate Magical Art ✨")}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Filters Selector - Only for image/video media type */}
                    {mediaUrl && (mediaFileType === 'image' || mediaFileType === 'video') && (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                        <span className="text-[11px] font-black text-gray-800 block uppercase tracking-wider">
                          {isArabic ? "مرشحات الصور البصرية (Filters):" : "Visual Preset Filters:"}
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'none', name: isArabic ? 'بدون' : 'Normal', previewClass: '' },
                            { id: 'grayscale', name: isArabic ? 'رمادي' : 'Grayscale', previewClass: 'grayscale' },
                            { id: 'sepia', name: isArabic ? 'عتيق' : 'Sepia', previewClass: 'sepia' },
                            { id: 'vivid', name: isArabic ? 'مشرق' : 'Vivid', style: { filter: 'saturate(1.8) contrast(1.1)' } }
                          ].map((filt) => (
                            <button
                              key={filt.id}
                              type="button"
                              onClick={() => setSelectedFilter(filt.id as any)}
                              className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                                selectedFilter === filt.id
                                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-650 font-black scale-[1.02]'
                                  : 'border-gray-200 bg-white hover:border-gray-400 text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              <div className="w-full h-8 bg-zinc-200 rounded-lg overflow-hidden border border-gray-200/50 relative">
                                {mediaUrl && mediaFileType === 'image' ? (
                                  <img 
                                    src={mediaUrl} 
                                    style={filt.id === 'vivid' ? filt.style : undefined}
                                    className={`w-full h-full object-cover ${filt.previewClass || ''}`}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-indigo-200/30 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold tracking-tight">{filt.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Default file upload fallback for non-image media files (video/audio) */}
                    {mediaFileType !== 'image' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700">{t.uploadLabel}</label>
                          <input
                            type="file"
                            accept="video/*,audio/*"
                            onChange={handleFileChange}
                            className="w-full text-xs text-gray-500 bg-gray-50 border border-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 rounded-xl p-1 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700">{t.orUrl}</label>
                          <input
                            type="text"
                            value={mediaUrl && !mediaFile ? mediaUrl : ''}
                            onChange={(e) => {
                              setMediaFile(null);
                              setMediaUrl(e.target.value);
                            }}
                            placeholder={t.urlPlaceholder}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-850"
                          />
                        </div>
                      </div>
                    )}

                    {/* Stylized Caption Overlay Panel */}
                    {mediaUrl && (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
                        <span className="text-[11px] font-black text-gray-800 block uppercase tracking-wider flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{isArabic ? "تراكب نصي منسق (تصميم فني فوق القصة):" : "Stylized Overlay Caption (On-Screen Art style):"}</span>
                        </span>
                        
                        <div className="space-y-2.5">
                          <input
                            type="text"
                            value={overlayCaption}
                            onChange={(e) => setOverlayCaption(e.target.value)}
                            placeholder={isArabic ? 'اكتب نصاً ليظهر فوق الصورة مباشرة...' : 'Type stylized overlay text...'}
                            maxLength={80}
                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-850 font-bold"
                          />

                          {/* Style Presets */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 block uppercase">
                              {isArabic ? "اختر نمط الخط والتصميم:" : "Select Overlay Typography Style:"}
                            </span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { id: 'modern', name: isArabic ? 'حديث' : 'Modern' },
                                { id: 'retro', name: isArabic ? 'ريترو' : 'Retro' },
                                { id: 'neon', name: isArabic ? 'نيون' : 'Neon' },
                                { id: 'glow', name: isArabic ? 'وهج' : 'Glow' }
                              ].map((stPreset) => (
                                <button
                                  key={stPreset.id}
                                  type="button"
                                  onClick={() => setOverlayCaptionStyle(stPreset.id as any)}
                                  className={`py-1 rounded-lg border text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                    overlayCaptionStyle === stPreset.id
                                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                      : 'border-gray-200 bg-white text-gray-500 hover:text-gray-800'
                                  }`}
                                >
                                  {stPreset.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Media Caption description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">{isArabic ? 'وصف أو تعليق مصاحب للقصة (شريط سفلي):' : 'Bottom Caption Bar Text:'}</label>
                      <input
                        type="text"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        placeholder={isArabic ? 'اكتب عبارة تظهر أسفل الوسائط...' : 'Add some text context overlay...'}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-850"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Studio Footer */}
              <div className="p-4 border-t border-gray-50 bg-gray-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCloseCreation}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || (storyType === 'text' ? !textCaption.trim() : !mediaUrl)}
                  className={`px-5 py-2.5 rounded-xl font-sans font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    isPublishing || (storyType === 'text' ? !textCaption.trim() : !mediaUrl)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-750 hover:to-purple-750 shadow-indigo-500/10 hover:scale-102 active:scale-98'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{isPublishing ? t.publishing : t.publishBtn}</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating global Toast notifications feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl text-white font-sans text-xs md:text-sm font-bold flex items-center gap-2 shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
