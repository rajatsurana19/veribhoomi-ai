import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Filter,
  Clock,
  Search,
  Calendar
} from 'lucide-react';
import { auditApi } from '../services/api';
import { AuditLogItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchDoc, setSearchDoc] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        setLoading(true);
        const data = await auditApi.list({
          action: actionFilter || undefined,
          document_id: searchDoc || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          area: areaFilter || undefined
        });
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [actionFilter, searchDoc, fromDate, toDate, areaFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-[8px] border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-heading tracking-tight">
              {t('auditTrailTitle')}
            </h1>
            <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-[4px] border border-slate-300">
              {t('appendOnlyLedger')} (SHA-256)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {t('auditSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-[6px] border border-emerald-300 text-emerald-900 text-xs font-semibold self-start md:self-auto shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{t('nonRepudiationBadge')}</span>
        </div>
      </div>

      {/* Filters Toolbar with Multi-Criteria */}
      <div className="bg-white p-5 rounded-[8px] border border-slate-300 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-xs">
            <Filter className="w-4 h-4 text-gov-blue" />
            <span>{t('filters')}</span>
          </div>
          <span className="text-slate-500 text-xs font-medium">
            {t('displayingEntries')} <strong className="text-slate-800 font-mono">{logs.length}</strong> {t('auditEntriesSuffix')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Document ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={t('filterDocIdPlaceholder')}
                value={searchDoc}
                onChange={e => setSearchDoc(e.target.value)}
                className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-[4px] text-xs focus:ring-1 focus:ring-gov-blue focus:outline-none bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Area / Village
            </label>
            <input
              type="text"
              placeholder="e.g. Posari, Kalote..."
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-xs focus:ring-1 focus:ring-gov-blue focus:outline-none bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-xs bg-white text-slate-800 focus:ring-1 focus:ring-gov-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-xs bg-white text-slate-800 focus:ring-1 focus:ring-gov-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Action Status
            </label>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-gov-blue focus:outline-none"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="FIELD_CORRECTED">FIELD_CORRECTED</option>
              <option value="OFFICER_FIELD_CORRECTED">OFFICER_FIELD_CORRECTED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PUSHED_TO_LRMS">PUSHED_TO_LRMS</option>
              <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
              <option value="BATCH_CREATED">BATCH_CREATED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[8px] border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="gov-table min-w-[1000px]">
            <thead>
              <tr>
                <th className="w-[180px]">{t('colTimestamp')}</th>
                <th className="w-[220px]">{t('colUserRole')}</th>
                <th className="w-[170px]">{t('colAction')}</th>
                <th className="w-[120px]">{t('colDocBatch')}</th>
                <th className="w-[150px]">{t('colFieldName')}</th>
                <th>{t('colChangeLog')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 text-xs">
                    {t('noAuditLogs')}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isCorrection = log.action === 'FIELD_CORRECTED' || log.action === 'OFFICER_FIELD_CORRECTED';
                  const isApproval = log.action === 'APPROVED' || log.action === 'PUSHED_TO_LRMS';
                  const isReject = log.action === 'REJECTED';

                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-slate-700 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900">
                              {new Date(log.timestamp).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="font-semibold text-slate-900 text-xs break-all">
                          {log.user_email}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block text-[10px] uppercase font-bold text-gov-blue bg-blue-50 px-1.5 py-0.5 rounded-[3px] border border-blue-200">
                            {log.role}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-block font-mono font-bold text-[11px] px-2.5 py-1 rounded-[4px] border ${
                            isApproval
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : isReject
                              ? 'bg-rose-50 text-rose-900 border-rose-300'
                              : isCorrection
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="font-mono text-slate-800 text-xs font-semibold">
                        {log.document_id ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded-[3px] border border-slate-200">
                            {log.document_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {log.batch_id?.slice(0, 8) || 'System'}
                          </span>
                        )}
                      </td>

                      <td className="font-semibold text-slate-800 text-xs">
                        {log.field_name ? (
                          <span className="font-mono text-slate-900">{log.field_name}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td>
                        {isCorrection ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="line-through text-slate-500 font-mono text-xs px-1.5 py-0.5 bg-slate-100 rounded-[3px]">
                              {log.old_value || 'None'}
                            </span>
                            <span className="text-slate-400 font-bold">→</span>
                            <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-300 font-mono text-xs">
                              {log.new_value}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-800 font-medium text-xs leading-relaxed">{log.new_value}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


