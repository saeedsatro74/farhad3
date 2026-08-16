import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Camera,
  Film,
  ArrowLeft,
} from 'lucide-react';
import { AuthUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AuthUser, rememberMe: boolean) => void;
}

const SECRET_ACCESS_KEY = '@Farhad1367';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password.trim()) {
      setErrorMessage('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (password === SECRET_ACCESS_KEY) {
        const user: AuthUser = {
          id: 'user-farhad',
          username: 'farhad',
          fullName: 'فرهاد حسینی',
          role: 'مدیر استودیو',
          lastLogin: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        };

        onLogin(user, rememberMe);
      } else {
        setErrorMessage('رمز عبور وارد شده نامعتبر است.');
      }
    }, 300);
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans text-right select-none"
      dir="rtl"
    >
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/70">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 border border-slate-700/80 mb-3.5">
              <Camera className="w-8 h-8 text-teal-400" />
              <Film className="w-4 h-4 text-amber-400 absolute translate-x-3 translate-y-3" />
            </div>

            <h1 className="text-xl font-black text-white tracking-wide font-mono bg-gradient-to-r from-indigo-300 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              FARHAD FOTOSET
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              ورود به سامانه فتوسِت
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pure Password Gate Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رمز عبور
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="رمز عبور را وارد کنید..."
                  className="w-full pr-10 pl-11 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-mono"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500/30 accent-teal-500 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">مرا به خاطر بسپار</span>
              </label>

              <span className="text-[11px] text-teal-400/90 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ورود امن
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-teal-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ورود به سیستم</span>
                  <ArrowLeft className="w-4 h-4 mr-auto" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 font-medium mt-4">
          استودیو عکس و فتوسِت فرهاد © {new Date().toLocaleDateString('fa-IR', { year: 'numeric' })}
        </p>
      </div>
    </div>
  );
};
