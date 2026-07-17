import React from 'react';
import { X, Keyboard, Play, Volume2, Maximize2, Zap, RotateCcw, RotateCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ShortcutsHelpModalProps {
  onClose: () => void;
  language?: 'en' | 'ar';
}

export default function ShortcutsHelpModal({ onClose, language = 'en' }: ShortcutsHelpModalProps) {
  const isArabic = language === 'ar';

  const t = {
    title: isArabic ? 'إصدار مفاتيح الاختصار المباشر' : 'Video Keyboard Shortcuts',
    subtitle: isArabic 
      ? 'استخدم لوحة المفاتيح للتحكم بالكامل في مشغل مقاطع الفيديو بمثالية.' 
      : 'Control the custom media player instantly using fast action hotkeys.',
    shortcutCol: isArabic ? 'مفتاح الاختصار' : 'Hotkey',
    actionCol: isArabic ? 'الوظيفة' : 'Action',
    closeBtn: isArabic ? 'إغلاق' : 'Close',
    playPause: isArabic ? 'تشغيل / إيقاف مؤقت' : 'Play / Pause',
    rewind: isArabic ? 'إرجاع 5 ثوانٍ للخلف' : 'Rewind 5 Seconds',
    fastForward: isArabic ? 'تقديم 5 ثوانٍ للأمام' : 'Fast Forward 5 Seconds',
    mute: isArabic ? 'كتم / تشغيل الصوت' : 'Mute / Unmute Audio',
    fullscreen: isArabic ? 'ملء الشاشة / خروج' : 'Toggle Fullscreen',
    volumeUp: isArabic ? 'زيادة مستوى الصوت (10%)' : 'Volume Up (10%)',
    volumeDown: isArabic ? 'خفض مستوى الصوت (10%)' : 'Volume Down (10%)',
    quickTip: isArabic 
      ? 'نصيحة: تأكد من أن تركيز الشاشة ليس على خانة التعليقات عند استخدام الاختصارات!'
      : 'Tip: Ensure your keyboard focus isn\'t on a text input box when pressing these keys.'
  };

  const shortcuts = [
    { keys: ['K', 'Space'], label: t.playPause, icon: <Play className="w-3.5 h-3.5 text-indigo-500" /> },
    { keys: ['J', '←'], label: t.rewind, icon: <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> },
    { keys: ['L', '→'], label: t.fastForward, icon: <RotateCw className="w-3.5 h-3.5 text-amber-500" /> },
    { keys: ['M'], label: t.mute, icon: <Volume2 className="w-3.5 h-3.5 text-sky-500" /> },
    { keys: ['F'], label: t.fullscreen, icon: <Maximize2 className="w-3.5 h-3.5 text-emerald-500" /> },
    { keys: ['↑'], label: t.volumeUp, icon: <span className="text-xs font-bold text-indigo-500">↑</span> },
    { keys: ['↓'], label: t.volumeDown, icon: <span className="text-xs font-bold text-indigo-500">↓</span> },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white border border-gray-250 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5 overflow-hidden"
      >
        {/* Subtle glowing ambient indicator */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>

        {/* Header block */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3 relative">
          <div className="space-y-1">
            <h3 className="font-sans font-black text-lg text-gray-900 flex items-center gap-2">
              <Keyboard className="w-5.5 h-5.5 text-indigo-600" />
              <span>{t.title}</span>
            </h3>
            <p className="text-xs text-gray-400 font-sans">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list container */}
        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {shortcuts.map((shortcut, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between py-2 px-3 hover:bg-slate-50/80 rounded-xl border border-transparent hover:border-gray-150 transition-all duration-150"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-3xs">
                  {shortcut.icon}
                </span>
                <span className="text-xs font-bold text-gray-700 font-sans">{shortcut.label}</span>
              </div>

              <div className="flex items-center gap-1">
                {shortcut.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    {kIdx > 0 && <span className="text-gray-300 text-[10px] px-0.5">/</span>}
                    <kbd className="px-2 py-1 text-[10px] font-extrabold font-mono text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 border-b-[3px] rounded-lg shadow-2xs">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Tip Block */}
        <div className="bg-amber-50/60 border border-amber-100/70 rounded-2xl p-3.5 flex gap-2.5 items-start">
          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800/90 font-sans leading-relaxed">
            {t.quickTip}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="cursor-pointer bg-gray-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
          >
            {t.closeBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
