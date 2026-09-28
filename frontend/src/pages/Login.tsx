import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { Eye, EyeOff, Lock, User, ShieldCheck, HelpCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    const e = loginEmail || email;
    const p = loginPass || password;
    if (!e || !p) {
      setError(
        language === 'hi'
          ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।'
          : language === 'mr'
          ? 'कृपया ई-मेल आणि पासवर्ड दोन्ही प्रविष्ट करा.'
          : 'Please enter both official email and password.'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(e, p);
      const role = localStorage.getItem('veribhoomi_role');
      if (role === 'operator') navigate('/operator');
      else if (role === 'officer') navigate('/officer');
      else if (role === 'admin') navigate('/admin');
      else navigate('/operator');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          (language === 'hi'
            ? 'प्रमाणीकरण विफल रहा। कृपया विवरण जांचें।'
            : language === 'mr'
            ? 'प्रमाणीकरण अयशस्वी. कृपया तपशील तपासा.'
            : 'Authentication failed. Please verify your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    handleLogin(demoEmail, 'password');
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900 font-sans">
      {/* Top Official Government Bar */}
      <div className="bg-[#0A2540] text-white border-b-2 border-[#EA580C]">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide">
            <span className="font-semibold">{t('govIndia')}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 hidden sm:inline">{t('govSubtitle')}</span>
          </div>

          {/* Trilingual Language Selector */}
          <div className="flex items-center bg-white/10 rounded-[4px] p-0.5 border border-white/20">
            {languages.map((item) => (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-[3px] transition ${
                  language === item.code
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Login Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-10">
        <div className="max-w-md w-full bg-white rounded-[6px] border border-[#CBD5E1] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-7 relative">
          {/* Header */}
          <div className="text-center pb-5 mb-5 border-b border-slate-200">
            {/* Neutral Land-Record Emblem */}
            <div className="w-12 h-12 rounded-[4px] bg-[#0A2540] text-white flex items-center justify-center mx-auto mb-3 border border-[#1E40AF]">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-0.5">
              {t('govServiceTag')}
            </div>
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">
              {t('appName')}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {t('appSubtitle')}
            </p>
          </div>

          {/* Official Login Heading */}
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              {t('officialLoginHeading')}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t('officialLoginSubheading')}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-300 text-red-800 rounded-[4px] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('officialEmailLabel')} <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. operator@veribhoomi.gov"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#1E40AF] focus:border-[#1E40AF] bg-white"
                  required
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('passwordLabel')} <span className="text-red-600">*</span>
                </label>
                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      language === 'hi'
                        ? 'पासवर्ड रीसेट हेतु कृपया अपने संबंधित राजस्व विभाग नोडल अधिकारी से संपर्क करें।'
                        : language === 'mr'
                        ? 'पासवर्ड रीसेट करण्यासाठी कृपया आपल्या महसूल विभाग नोडल अधिकाऱ्यांशी संपर्क साधा.'
                        : 'For password reset, please contact your district revenue department nodal administrator.'
                    );
                  }}
                  className="text-[11px] text-[#1D4ED8] hover:underline"
                >
                  {t('forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#1E40AF] focus:border-[#1E40AF] bg-white font-mono"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  title={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E40AF] focus:ring-[#1E40AF]"
                />
                <span>{t('rememberMe')}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0A2540] hover:bg-[#1E40AF] text-white rounded-[4px] text-xs font-bold transition duration-150 shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{t('signInBtn')}</span>
              )}
            </button>
          </form>

          {/* Quick Role Selection (Directly Visible, No Dropdown) */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span>
                {language === 'hi'
                  ? 'त्वरित भूमिका लॉगिन (परीक्षण खाते)'
                  : language === 'mr'
                  ? 'त्वरित पद लॉगिन (चाचणी खाती)'
                  : 'Quick Role Login (One-Click Access)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickDemo('operator@veribhoomi.gov')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-[4px] transition text-left group"
              >
                <div className="text-xs font-bold text-[#0A2540] group-hover:text-[#1E40AF]">Operator</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{t('operatorDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('officer@veribhoomi.gov')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-[4px] transition text-left group"
              >
                <div className="text-xs font-bold text-[#0A2540] group-hover:text-[#1E40AF]">Officer</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{t('officerDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin@veribhoomi.gov')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-[4px] transition text-left group"
              >
                <div className="text-xs font-bold text-[#0A2540] group-hover:text-[#1E40AF]">Admin</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{t('adminDesc')}</div>
              </button>
            </div>
          </div>
        </div>

        {/* Informational disclaimer */}
        <p className="mt-4 text-[11px] text-slate-500 text-center max-w-md leading-normal">
          {t('loginFooterNote')}
        </p>
      </div>

      {/* Official Government Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            <span className="font-semibold text-slate-800">{t('govServiceTag')}</span>
            <span className="mx-2 text-slate-400">•</span>
            <span>{t('appSubtitle')}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                alert('Government Digital Service — Data privacy adheres to official land revenue record protection guidelines.');
              }}
              className="hover:text-[#0A2540] hover:underline"
            >
              {t('privacyPolicy')}
            </a>
            <a
              href="#terms"
              onClick={(e) => {
                e.preventDefault();
                alert('Terms of Use — Authorized access only for designated revenue and land administration personnel.');
              }}
              className="hover:text-[#0A2540] hover:underline"
            >
              {t('termsOfUse')}
            </a>
            <a
              href="#accessibility"
              onClick={(e) => {
                e.preventDefault();
                alert('Accessibility Statement — Built following GIGW (Guidelines for Indian Government Websites) accessibility standards.');
              }}
              className="hover:text-[#0A2540] hover:underline"
            >
              {t('accessibility')}
            </a>
            <a
              href="#help"
              onClick={(e) => {
                e.preventDefault();
                alert('Help Desk: contact helpdesk@veribhoomi.gov for technical support and user access assistance.');
              }}
              className="hover:text-[#0A2540] hover:underline"
            >
              {t('help')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

