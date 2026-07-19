import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  language?: 'en' | 'ar';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  language = 'en',
}: ConfirmModalProps) {
  const isArabic = language === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal Container Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`bg-white rounded-3xl p-6 max-w-md w-full border border-gray-150 shadow-2xl relative z-10 select-none ${
              isArabic ? 'rtl text-right' : 'ltr text-left'
            }`}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mt-2">
              {/* Warning/Danger Circle Icon */}
              <div className="bg-red-50 p-3 rounded-2xl shrink-0 border border-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              {/* Title & Body Text */}
              <div className="space-y-1.5 flex-1 pt-1.5">
                <h3 className="font-sans font-black text-base text-gray-950 tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-gray-500 font-sans leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Action Buttons Tray */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
              <button
                onClick={onCancel}
                className="cursor-pointer text-xs font-bold text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-full shadow-3xs transition-all active:scale-95"
              >
                {cancelText || (isArabic ? 'إلغاء' : 'Cancel')}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                }}
                className="cursor-pointer text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 hover:shadow-md hover:shadow-red-500/15 px-5 py-2.5 rounded-full transition-all active:scale-95 border border-transparent"
              >
                {confirmText || (isArabic ? 'تأكيد الحذف' : 'Confirm Delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
