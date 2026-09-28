import React from 'react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { HelpCircle } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { language, setLanguage, fontSize, setFontSize, t } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' }
  ];

  return (
    <div className="bg-[#0A2540] text-slate-100 text-xs border-b-2 border-[#EA580C] select-none">
      <div className="max-w-7xl mx-auto px-4 py-1 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Official Government of India text */}
        <div className="flex items-center gap-2 font-medium text-[11px] tracking-wide">
          <span className="text-white font-semibold flex items-center gap-1.5">
            <span>{t('govIndia')}</span>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 hidden md:inline">
            {t('govSubtitle')}
          </span>
        </div>

        {/* Right: Accessibility Controls & Language Selector */}
        <div className="flex items-center gap-4 text-[11px]">
          {/* Font Sizer */}
          <div className="flex items-center gap-1 text-slate-300 bg-white/10 px-2 py-0.5 rounded-[4px] border border-white/15">
            <span className="text-[10px] text-slate-300 uppercase font-semibold mr-1">{t('fontSize')}:</span>
            <button
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded-[3px] font-bold text-xs transition ${
                fontSize === 'sm'
                  ? 'bg-gov-saffron text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Small font size (A-)"
              aria-label="Small font size"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-1.5 py-0.5 rounded-[3px] font-bold text-xs transition ${
                fontSize === 'base'
                  ? 'bg-gov-saffron text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Default font size (A)"
              aria-label="Default font size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded-[3px] font-bold text-xs transition ${
                fontSize === 'lg'
                  ? 'bg-gov-saffron text-white shadow-xs font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Large font size (A+)"
              aria-label="Large font size"
            >
              A+
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center bg-white/10 rounded-[4px] p-0.5 border border-white/15">
            {languages.map((item) => (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-[3px] transition ${
                  language === item.code
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

