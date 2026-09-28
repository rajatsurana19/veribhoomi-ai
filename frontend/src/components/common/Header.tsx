import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, LogOut, FileText, CheckCircle2, Shield, User, Building, Database } from 'lucide-react';
import { notificationsApi, statsApi } from '../../services/api';
import { NotificationItem } from '../../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; label: string }>({
    connected: true,
    label: 'Supabase Cloud: Connected'
  });

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const list = await notificationsApi.list();
        setNotifications(list);
      } catch (err) {
        // quiet
      }
    };

    const fetchDb = async () => {
      try {
        const res = await statsApi.getDbStatus();
        if (res?.supabase?.connected) {
          setDbStatus({ connected: true, label: 'Supabase Cloud: Connected' });
        } else {
          setDbStatus({ connected: false, label: 'Database: Local Engine' });
        }
      } catch (err) {
        // quiet
      }
    };

    fetchNotifs();
    fetchDb();
    const timer = setInterval(() => {
      fetchNotifs();
      fetchDb();
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="bg-white border-b border-[#CBD5E1] sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Left: Official Gov Emblem & Product Title */}
        <div className="flex items-center gap-3">
          {/* Neutral official land-record document emblem */}
          <div className="w-10 h-10 rounded-[4px] bg-[#0A2540] text-white flex items-center justify-center border border-[#1E40AF] shrink-0">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF]">
              {t('govServiceTag')}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0A2540] tracking-tight leading-none">
                {t('appName')}
              </h1>
              <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-[3px] border border-slate-300">
                Official
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Right: Cloud DB status, Notifications, User Information, and Logout */}
        <div className="flex items-center gap-2.5">
          {/* Supabase Cloud Connection Status Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11px] font-bold transition ${
              dbStatus.connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
            title="Connected to Supabase Cloud Instance (ncvowwkrzsiexvcrhpyi.supabase.co)"
          >
            <Database className={`w-3.5 h-3.5 ${dbStatus.connected ? 'text-emerald-700' : 'text-amber-700'}`} />
            <span>{dbStatus.label}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-1.5 text-slate-700 hover:text-[#0A2540] hover:bg-slate-100 rounded-[4px] border border-slate-200 transition"
              title="Official Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B91C1C] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-[6px] shadow-lg border border-slate-300 p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">{t('notifications')}</h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">{notifications.length} {t('alertsCount')}</span>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 font-medium">{t('noActiveNotifs')}</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-[4px] border text-xs transition ${
                          !n.is_read
                            ? 'bg-amber-50/70 border-amber-300 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                            {n.type === 'error' ? '🔴' : n.type === 'warning' ? '⚠️' : 'ℹ️'} {n.title}
                          </div>
                          {!n.is_read && (
                            <button
                              onClick={async () => {
                                await notificationsApi.markRead(n.id);
                                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                              }}
                              className="text-[10px] text-blue-700 hover:underline font-semibold shrink-0"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                        <div className="text-slate-700 mt-1 leading-relaxed text-[11px]">{n.message}</div>
                        
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                          <span>
                            {new Date(n.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {n.sender_role && (
                            <span className="uppercase font-semibold text-slate-600">
                              From: {n.sender_role}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile details */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
            <div className="w-8 h-8 rounded-[4px] bg-[#0A2540] text-white flex items-center justify-center font-bold text-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-bold text-slate-900 leading-tight truncate max-w-[160px]">{user?.full_name}</div>
              <div className="text-[10px] text-slate-600 font-medium capitalize">
                {user?.designation || (user?.role === 'operator' ? 'Revenue Operator' : user?.role === 'officer' ? 'Approving Officer' : 'System Admin')}
              </div>
            </div>

            <button
              onClick={logout}
              className="ml-1 p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-[4px] border border-slate-200 transition"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

