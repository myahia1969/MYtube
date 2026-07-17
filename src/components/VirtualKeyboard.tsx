import React, { useState } from 'react';
import { Delete, Globe, X } from 'lucide-react';

interface VirtualKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  language?: 'en' | 'ar';
  onClose: () => void;
}

export default function VirtualKeyboard({
  value,
  onChange,
  language = 'en',
  onClose,
}: VirtualKeyboardProps) {
  const [currentLayout, setCurrentLayout] = useState<'ar' | 'en'>(language === 'ar' ? 'ar' : 'en');

  // Keyboard Rows
  const arRows = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ']
  ];

  const enRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const activeRows = currentLayout === 'ar' ? arRows : enRows;

  const handleKeyPress = (key: string) => {
    onChange(value + key);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl border border-gray-800 select-none w-full animate-fadeIn" dir={currentLayout === 'ar' ? 'rtl' : 'ltr'}>
      {/* Keyboard Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold font-sans">
            {currentLayout === 'ar' ? 'لوحة المفاتيح العربية' : 'English Keyboard'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentLayout(currentLayout === 'ar' ? 'en' : 'ar')}
            className="cursor-pointer bg-gray-800 hover:bg-gray-750 text-[10px] font-black px-2.5 py-1 rounded border border-gray-700 text-red-400 hover:text-red-300 transition-colors"
          >
            {currentLayout === 'ar' ? 'English' : 'العربية'}
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
            title="Close Keyboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keys Layout */}
      <div className="space-y-2">
        {activeRows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1.5 flex-wrap">
            {row.map((char) => (
              <button
                key={char}
                onClick={() => handleKeyPress(char)}
                className="cursor-pointer min-w-[32px] h-9 sm:min-w-[36px] sm:h-10 bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all text-xs font-bold rounded-lg flex items-center justify-center border border-gray-700 shadow-sm"
              >
                {char}
              </button>
            ))}
          </div>
        ))}

        {/* Special Actions Row */}
        <div className="flex justify-center gap-1.5 pt-1">
          {/* Clear Key */}
          <button
            onClick={handleClear}
            className="cursor-pointer px-3 h-9 sm:h-10 bg-red-950 hover:bg-red-900 text-red-300 border border-red-900 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center justify-center shrink-0"
          >
            {currentLayout === 'ar' ? 'مسح' : 'Clear'}
          </button>

          {/* Spacebar */}
          <button
            onClick={() => handleKeyPress(' ')}
            className="cursor-pointer flex-1 h-9 sm:h-10 bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all rounded-lg flex items-center justify-center border border-gray-700 shadow-sm"
          >
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              {currentLayout === 'ar' ? 'مسافة' : 'Space'}
            </span>
          </button>

          {/* Backspace Key */}
          <button
            onClick={handleBackspace}
            className="cursor-pointer px-4 h-9 sm:h-10 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center justify-center shrink-0 gap-1"
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
