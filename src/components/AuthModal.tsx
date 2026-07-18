import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Lock, User, Image, Upload, Facebook, LogOut, Camera, Check, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  currentUser: UserType | null;
  language: 'en' | 'ar';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
];

export default function AuthModal({
  onClose,
  onLoginSuccess,
  currentUser,
  language
}: AuthModalProps) {
  // If currentUser is present, the modal opens in "Edit Profile" mode.
  // Otherwise, it starts as 'login' or 'register'
  const isEditing = !!currentUser;
  const isArabic = language === 'ar';
  
  const [mode, setMode] = useState<'login' | 'register' | 'edit'>(isEditing ? 'edit' : 'login');
  
  // Form fields
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || PRESET_AVATARS[0]);
  
  // Custom URL input toggle
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  
  // Error / Alert messages
  const [error, setError] = useState<string | null>(null);
  
  // Simulated OAuth popup overlays
  const [simulatedOAuth, setSimulatedOAuth] = useState<'google' | 'facebook' | null>(null);
  const [oauthStep, setOauthStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translation text resources
  const t = {
    titleLogin: isArabic ? 'تسجيل الدخول' : 'Sign In',
    titleRegister: isArabic ? 'إنشاء حساب جديد' : 'Create New Account',
    titleEdit: isArabic ? 'تعديل الملف الشخصي' : 'Edit Profile',
    descLogin: isArabic ? 'سجل دخولك للتعليق ورفع الفيديوهات وتحليلها بالذكاء الاصطناعي' : 'Sign in to comment, upload videos, and analyze them with AI',
    descRegister: isArabic ? 'انضم إلى مجتمعنا الإبداعي اليوم واكتشف قوة الذكاء الاصطناعي' : 'Join our creative community today and unlock the power of AI',
    descEdit: isArabic ? 'قم بتحديث صورتك الشخصية واسمك ومعلومات حسابك' : 'Update your personal photo, display name, and account details',
    
    labelEmail: isArabic ? 'البريد الإلكتروني' : 'Email Address',
    labelPassword: isArabic ? 'كلمة المرور' : 'Password',
    labelName: isArabic ? 'الاسم الكامل' : 'Full Name',
    labelUsername: isArabic ? 'اسم المستخدم' : 'Username',
    labelAvatar: isArabic ? 'اختر صورة الملف الشخصي' : 'Choose Profile Picture',
    
    btnGoogle: isArabic ? 'الدخول بواسطة Google' : 'Sign in with Google',
    btnFacebook: isArabic ? 'الدخول بواسطة Facebook' : 'Sign in with Facebook',
    btnEmailLogin: isArabic ? 'تسجيل الدخول بالبريد' : 'Sign In with Email',
    btnEmailRegister: isArabic ? 'إنشاء الحساب' : 'Create Account',
    btnSaveChanges: isArabic ? 'حفظ التغييرات' : 'Save Changes',
    
    orSeparator: isArabic ? 'أو عن طريق البريد الإلكتروني' : 'Or via email address',
    noAccount: isArabic ? 'ليس لديك حساب؟' : "Don't have an account?",
    haveAccount: isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    toggleRegister: isArabic ? 'سجل الآن مجاناً' : 'Register now for free',
    toggleLogin: isArabic ? 'سجل دخولك من هنا' : 'Sign in here',
    
    avatarPreset: isArabic ? 'الصور الافتراضية' : 'Preset Avatars',
    avatarUpload: isArabic ? 'تحميل صورة من جهازك' : 'Upload from your device',
    avatarUrlPlaceholder: isArabic ? 'أدخل رابط الصورة (URL)' : 'Or paste direct image URL',
    avatarUrlBtn: isArabic ? 'تطبيق الرابط' : 'Apply URL',
    
    // OAuth simulation strings
    oauthSimTitle: isArabic ? 'اتصال آمن' : 'Secure Connection',
    googleChooseAcc: isArabic ? 'اختر حساباً للمتابعة إلى MYtube' : 'Choose an account to continue to MYtube',
    fbConfirm: isArabic ? 'متابعة باسم المستخدم الافتراضي' : 'Continue with Facebook profile',
    simulatedGoogleUser: isArabic ? 'مستخدم جوجل الافتراضي' : 'Google Default User',
    simulatedFbUser: isArabic ? 'مستكشف فيس بوك' : 'Facebook Explorer',
    loading: isArabic ? 'جاري الاتصال آمن...' : 'Establishing secure connection...',
    success: isArabic ? 'تم الاتصال بنجاح!' : 'Connected successfully!',
    closeBtn: isArabic ? 'إغلاق' : 'Close'
  };

  const handlePresetSelect = (url: string) => {
    setAvatarUrl(url);
    setShowCustomUrlInput(false);
  };

  // Local file upload handling (base64 conversion)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(isArabic ? 'حجم الصورة يجب أن لا يتجاوز 2 ميجابايت' : 'Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setAvatarUrl(event.target.result);
          setShowCustomUrlInput(false);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCustomUrl = () => {
    if (customUrl.trim()) {
      setAvatarUrl(customUrl.trim());
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!displayName.trim() || !username.trim() || !email.trim() || !password.trim()) {
        setError(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
        return;
      }
      
      const newUser: UserType = {
        id: `usr-${Date.now()}`,
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        email: email.trim(),
        avatarUrl: avatarUrl
      };
      
      onLoginSuccess(newUser);
      onClose();
    } else if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setError(isArabic ? 'يرجى إدخال البريد وكلمة المرور' : 'Please enter your email and password');
        return;
      }
      
      // Simulate successful login with email
      const nameFromEmail = email.split('@')[0];
      const signedInUser: UserType = {
        id: `usr-${Date.now()}`,
        displayName: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
        username: nameFromEmail.toLowerCase(),
        email: email.trim(),
        avatarUrl: avatarUrl
      };
      
      onLoginSuccess(signedInUser);
      onClose();
    } else if (mode === 'edit' && currentUser) {
      if (!displayName.trim() || !email.trim()) {
        setError(isArabic ? 'الاسم والبريد حقول مطلوبة' : 'Display Name and Email are required fields');
        return;
      }

      const updatedUser: UserType = {
        ...currentUser,
        displayName: displayName.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl
      };

      onLoginSuccess(updatedUser);
      onClose();
    }
  };

  // Simulating the Google & Facebook popups
  const handleOAuthClick = (provider: 'google' | 'facebook') => {
    setSimulatedOAuth(provider);
    setOauthStep(1);
    
    // Simulate loading
    setTimeout(() => {
      setOauthStep(2);
    }, 1200);
  };

  const handleSelectOauthUser = (selectedName: string, selectedEmail: string, selectedAvatar: string) => {
    setOauthStep(3); // success state
    
    setTimeout(() => {
      const oauthUser: UserType = {
        id: `usr-oauth-${Date.now()}`,
        displayName: selectedName,
        username: selectedEmail.split('@')[0],
        email: selectedEmail,
        avatarUrl: selectedAvatar
      };
      onLoginSuccess(oauthUser);
      setSimulatedOAuth(null);
      onClose();
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Main modal card */}
      <div 
        id="auth-modal" 
        className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 flex flex-col"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 h-1.5 w-full"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Header Title */}
          <div className="text-center space-y-1.5 pt-2">
            <h2 className="font-sans font-black text-xl md:text-2xl text-gray-900 tracking-tight">
              {mode === 'login' ? t.titleLogin : mode === 'register' ? t.titleRegister : t.titleEdit}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed px-2">
              {mode === 'login' ? t.descLogin : mode === 'register' ? t.descRegister : t.descEdit}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Sign In Providers - Only show when not editing profile */}
          {mode !== 'edit' && (
            <div className="space-y-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleOAuthClick('google')}
                className="cursor-pointer w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs py-3 px-4 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-all active:scale-98"
              >
                {/* Custom Vector Google logo */}
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.59 5.59 0 0 1 8.4 12.928a5.59 5.59 0 0 1 5.591-5.59c1.508 0 2.883.6 3.91 1.576l3.122-3.12A9.957 9.957 0 0 0 13.99 2.1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.783 0 9.87-4.062 9.87-10 0-.663-.06-1.3-.17-1.815H12.24Z"
                  />
                </svg>
                <span>{t.btnGoogle}</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => handleOAuthClick('facebook')}
                className="cursor-pointer w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs py-3 px-4 border border-transparent rounded-xl shadow-sm hover:shadow transition-all active:scale-98"
              >
                <Facebook className="w-4.5 h-4.5 fill-current" />
                <span>{t.btnFacebook}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.orSeparator}</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Display Name Input (Register & Edit) */}
            {mode !== 'login' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">{t.labelName}</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isArabic ? 'ادخل اسمك الكامل' : 'John Doe'}
                    className={`w-full bg-gray-50 border border-gray-300 focus:border-red-600 text-gray-900 rounded-xl text-xs outline-none transition-all placeholder-gray-450 ${isArabic ? 'pr-3.5 pl-10 py-3' : 'pl-10 pr-3.5 py-3'}`}
                  />
                </div>
              </div>
            )}

            {/* Username Input (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">{t.labelUsername}</label>
                <div className="relative flex items-center">
                  <span className={`absolute text-gray-400 text-xs font-semibold ${isArabic ? 'right-3.5' : 'left-3.5'}`}>@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className={`w-full bg-gray-50 border border-gray-300 focus:border-red-600 text-gray-900 rounded-xl text-xs outline-none transition-all placeholder-gray-450 ${isArabic ? 'pr-7 pl-3.5 py-3' : 'pl-7 pr-3.5 py-3'}`}
                  />
                </div>
              </div>
            )}

            {/* Email Address Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">{t.labelEmail}</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full bg-gray-50 border border-gray-300 focus:border-red-600 text-gray-900 rounded-xl text-xs outline-none transition-all placeholder-gray-450 ${isArabic ? 'pr-3.5 pl-10 py-3' : 'pl-10 pr-3.5 py-3'}`}
                />
              </div>
            </div>

            {/* Password Input (Login & Register) */}
            {mode !== 'edit' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">{t.labelPassword}</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-gray-50 border border-gray-300 focus:border-red-600 text-gray-900 rounded-xl text-xs outline-none transition-all placeholder-gray-450 ${isArabic ? 'pr-3.5 pl-10 py-3' : 'pl-10 pr-3.5 py-3'}`}
                  />
                </div>
              </div>
            )}

            {/* Avatar Selection Field (Register & Edit) */}
            {mode !== 'login' && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700">{t.labelAvatar}</label>
                
                {/* Active Avatar Preview and picker options */}
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title={t.avatarUpload}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Preset Quick Selection Grid */}
                  <div className="flex-1 space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.avatarPreset}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePresetSelect(url)}
                          className={`relative w-8 h-8 rounded-full overflow-hidden border transition-all cursor-pointer ${
                            avatarUrl === url 
                              ? 'ring-2 ring-indigo-600 scale-105 border-transparent' 
                              : 'border-gray-200 hover:scale-105'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          {avatarUrl === url && (
                            <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-indigo-600 fill-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prominent Upload from computer zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/10 rounded-2xl p-4 text-center transition-all group flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="p-2 rounded-full bg-gray-50 group-hover:bg-indigo-50 transition-colors text-gray-400 group-hover:text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-700 group-hover:text-indigo-600">
                    {t.avatarUpload}
                  </p>
                  <p className="text-[10px] text-gray-400 font-sans">
                    {isArabic ? 'يدعم صور JPG, PNG, WebP حتى 2 ميجابايت' : 'Supports JPG, PNG, WebP up to 2MB'}
                  </p>
                </div>

                {/* Custom Image URL option */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                      className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-800 font-semibold hover:underline"
                    >
                      <span>{showCustomUrlInput ? (isArabic ? 'إخفاء الرابط' : 'Hide URL input') : t.avatarUrlPlaceholder}</span>
                    </button>
                  </div>

                  {showCustomUrlInput && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-gray-50 border border-gray-300 focus:border-red-600 text-gray-900 rounded-xl text-xs outline-none pl-3 pr-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={applyCustomUrl}
                        className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-[11px] font-bold px-3 py-2 rounded-xl"
                      >
                        {t.avatarUrlBtn}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form submit actions */}
            <div className="pt-3">
              <button
                type="submit"
                className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{mode === 'login' ? t.btnEmailLogin : mode === 'register' ? t.btnEmailRegister : t.btnSaveChanges}</span>
              </button>
            </div>
          </form>

          {/* Toggle form mode link */}
          {mode !== 'edit' && (
            <p className="text-center text-xs text-gray-500">
              {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="cursor-pointer font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline"
              >
                {mode === 'login' ? t.toggleRegister : t.toggleLogin}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Simulated OAuth popup overlays */}
      {simulatedOAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div 
            id="simulated-oauth-popup"
            className="w-full max-w-sm bg-white border border-gray-300 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6 flex flex-col items-center"
          >
            {/* OAuth Popup Header */}
            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {simulatedOAuth === 'google' ? (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.59 5.59 0 0 1 8.4 12.928a5.59 5.59 0 0 1 5.591-5.59c1.508 0 2.883.6 3.91 1.576l3.122-3.12A9.957 9.957 0 0 0 13.99 2.1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.783 0 9.87-4.062 9.87-10 0-.663-.06-1.3-.17-1.815H12.24Z"
                    />
                  </svg>
                ) : (
                  <Facebook className="w-5 h-5 text-[#1877F2] fill-current shrink-0" />
                )}
                <span className="font-sans font-extrabold text-xs text-gray-700">{t.oauthSimTitle}</span>
              </div>
              <button 
                onClick={() => setSimulatedOAuth(null)}
                className="text-gray-450 hover:text-gray-700 cursor-pointer text-xs"
              >
                {t.closeBtn}
              </button>
            </div>

            {/* Step 1: Connecting spinner */}
            {oauthStep === 1 && (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-indigo-600 font-bold animate-pulse font-sans">
                  {t.loading}
                </p>
              </div>
            )}

            {/* Step 2: Choose profile credentials */}
            {oauthStep === 2 && (
              <div className="w-full space-y-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-sm text-gray-800 leading-snug">
                    {simulatedOAuth === 'google' ? t.googleChooseAcc : t.fbConfirm}
                  </h3>
                </div>

                {simulatedOAuth === 'google' ? (
                  /* Choose account grid */
                  <div className="space-y-2 text-start">
                    {/* Account 1 */}
                    <button
                      type="button"
                      onClick={() => handleSelectOauthUser(
                        'My Channel', 
                        'myahia69@gmail.com', 
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
                      )}
                      className="cursor-pointer w-full flex items-center gap-3 p-3 border border-gray-150 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-xs"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
                        alt="Default" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">My Channel</p>
                        <p className="font-mono text-gray-400 text-[10px] truncate">myahia69@gmail.com</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  /* Facebook option click-through */
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSelectOauthUser(
                        'My Channel', 
                        'myahia69@gmail.com', 
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
                      )}
                      className="cursor-pointer w-full flex items-center justify-center gap-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs py-3 px-4 border border-transparent rounded-xl shadow transition-all active:scale-98"
                    >
                      <Facebook className="w-4.5 h-4.5 fill-current" />
                      <span>{t.fbConfirm}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Success check animation */}
            {oauthStep === 3 && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 mt-2">{t.success}</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
