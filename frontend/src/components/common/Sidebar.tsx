import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  MapPin,
  History,
  Cpu,
  ShieldCheck,
  Building
} from 'lucide-react';
import { feedbackApi } from '../../services/api';

export const Sidebar: React.FC = () => {
  const { role, user } = useAuth();
  const { t } = useLanguage();
  const [feedbackStats, setFeedbackStats] = useState<any>({ corrections_collected: 0, potential_training_samples: 0 });

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const stats = await feedbackApi.getStats();
        if (stats) {
          setFeedbackStats(stats);
        }
      } catch (e) {
        // silent
      }
    };
    fetchFeedback();
    const interval = setInterval(fetchFeedback, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-semibold transition ${
      isActive
        ? 'bg-[#0A2540] text-white shadow-xs'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
    }`;

  return (
    <aside className="w-60 bg-white border-r border-[#CBD5E1] min-h-[calc(100vh-4rem)] flex flex-col justify-between p-3.5 shrink-0 shadow-[1px_0_2px_rgba(0,0,0,0.03)]">
      <div className="space-y-4">
        {/* Active Role Card */}
        <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            {t('activeWorkspace')}
          </div>
          <div className="text-xs font-bold text-[#0A2540] flex items-center justify-between mt-0.5">
            <span>
              {role === 'operator'
                ? t('operatorWorkspace')
                : role === 'officer'
                ? t('officerWorkspace')
                : t('executiveAnalytics')}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          {user?.department && (
            <div className="text-[10px] text-slate-500 truncate mt-1 pt-1 border-t border-slate-200">
              {user.department}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1">
          {/* Operator Links */}
          {role === 'operator' && (
            <>
              <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('operatorControls')}
              </div>
              <NavLink to="/operator" end className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>{t('dashboard')}</span>
              </NavLink>
              <NavLink to="/operator/upload" className={navItemClass}>
                <UploadCloud className="w-4 h-4 text-slate-500" />
                <span>{t('uploadDocuments')}</span>
              </NavLink>
            </>
          )}

          {/* Officer Links */}
          {role === 'officer' && (
            <>
              <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('officerApprovals')}
              </div>
              <NavLink to="/officer" end className={navItemClass}>
                <FileCheck2 className="w-4 h-4 text-slate-500" />
                <span>{t('approvalQueue')}</span>
              </NavLink>
            </>
          )}

          {/* Admin Links */}
          {role === 'admin' && (
            <>
              <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('administration')}
              </div>
              <NavLink to="/admin" end className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>{t('executiveAnalytics')}</span>
              </NavLink>
              <NavLink to="/admin/gis" className={navItemClass}>
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{t('gisMap')}</span>
              </NavLink>
              <NavLink to="/admin/audit" className={navItemClass}>
                <History className="w-4 h-4 text-slate-500" />
                <span>{t('auditLogs')}</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Quality Engine / Recognition Telemetry Card */}
      <div className="bg-slate-50 p-3 rounded-[4px] border border-slate-200 text-slate-800">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span className="text-[11px] font-bold text-slate-900">{t('activeLearningLoop')}</span>
        </div>
        <p className="text-[10px] text-slate-600 mb-2 leading-normal">
          {t('activeLearningDesc')}
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-center bg-white p-1.5 rounded-[4px] border border-slate-200">
          <div>
            <div className="text-xs font-bold text-[#15803D]">{feedbackStats.corrections_collected ?? 0}</div>
            <div className="text-[9px] text-slate-500">{t('corrections')}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#1E40AF]">{feedbackStats.potential_training_samples ?? 0}</div>
            <div className="text-[9px] text-slate-500">{t('samples')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

