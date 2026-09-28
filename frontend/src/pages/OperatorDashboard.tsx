import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { documentsApi, batchesApi, statsApi } from '../services/api';
import { DocumentListItem, BatchItem, SummaryStats } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useLanguage } from '../context/LanguageContext';

export const OperatorDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if ((location.state as any)?.toast) {
      setToastMessage((location.state as any).toast);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [docs, batchList, summary] = await Promise.all([
        documentsApi.list(),
        batchesApi.list(),
        statsApi.getSummary()
      ]);
      setDocuments(docs);
      setBatches(batchList);
      setStats(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const pipelineSteps = [
    { num: '1', title: language === 'hi' ? 'अपलोड' : language === 'mr' ? 'अपलोड' : 'Upload', status: 'completed' },
    { num: '2', title: language === 'hi' ? 'प्री-प्रोसेस' : language === 'mr' ? 'प्री-प्रोसेस' : 'Preprocess', status: 'completed' },
    { num: '3', title: language === 'hi' ? 'OCR निष्कर्षण' : language === 'mr' ? 'OCR निष्कर्षण' : 'OCR Extract', status: 'completed' },
    { num: '4', title: language === 'hi' ? 'फ़ील्ड मैपिंग' : language === 'mr' ? 'नोंद मॅपिंग' : 'Field Mapping', status: 'completed' },
    { num: '5', title: language === 'hi' ? 'सत्यापन नियम' : language === 'mr' ? 'पडताळणी नियम' : 'Validation', status: 'completed' },
    { num: '6', title: language === 'hi' ? 'मानवीय जांच' : language === 'mr' ? 'कर्मचारी तपासणी' : 'Human Review', status: 'active' },
    { num: '7', title: language === 'hi' ? 'अधिकारी अनुमोदन' : language === 'mr' ? 'अधिकारी मंजुरी' : 'Officer Approval', status: 'pending' },
    { num: '8', title: language === 'hi' ? 'राज्य LRMS' : language === 'mr' ? 'राज्य LRMS' : 'State LRMS', status: 'pending' }
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === '' ||
      (doc.filename && doc.filename.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.owner_name && doc.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.khasra_number && doc.khasra_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.village && doc.village.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === '' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-[4px] flex items-center justify-between text-emerald-900 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold text-emerald-800 hover:underline shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Administrative Workspace Header */}
      <div className="bg-white p-4 rounded-[4px] border border-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">
              {t('operatorWorkspace')}
            </h1>
            <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-[3px] border border-slate-300">
              Department Operations
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            {t('operatorSubtitle')}
          </p>
        </div>

        <Link
          to="/operator/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A2540] hover:bg-[#1E40AF] text-white rounded-[4px] text-xs font-bold transition shadow-xs self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{t('uploadNewBatch')}</span>
        </Link>
      </div>

      {/* 4 Compact Rectangular Statistics Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-white p-3.5 rounded-[4px] border border-[#CBD5E1] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>{t('documentsProcessed')}</span>
            <FileText className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="text-2xl font-black text-[#0A2540] mt-1 font-mono">
            {stats?.processed_documents ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 border-t border-slate-100 pt-1">
            <span className="text-[#15803D] font-bold">100%</span>
            <span>{t('originalScansPreserved')}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 rounded-[4px] border border-[#CBD5E1] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>{t('needsReview')}</span>
            <AlertCircle className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-black text-[#B45309] mt-1 font-mono">
            {stats?.needs_review ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1">
            {t('awaitingOperatorCheck')}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 rounded-[4px] border border-[#CBD5E1] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>{t('averageConfidence')}</span>
            <Sparkles className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="text-2xl font-black text-[#0A2540] mt-1 font-mono">
            {stats?.avg_confidence ? `${stats.avg_confidence}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1">
            {t('weightedFormula')}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 rounded-[4px] border border-[#CBD5E1] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>{t('approvedAndSynced')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="text-2xl font-black text-[#15803D] mt-1 font-mono">
            {stats?.pushed_to_lrms ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1">
            {t('committedToLedger')}
          </div>
        </div>
      </div>

      {/* 8-Step Digitization Pipeline Timeline */}
      <div className="bg-white p-4 rounded-[4px] border border-[#CBD5E1] shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('govPipelineTitle')}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {t('govPipelineSubtitle')}
          </span>
        </div>

        {/* Linear step diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineSteps.map((s, idx) => {
            const isDone = s.status === 'completed';
            const isActive = s.status === 'active';

            return (
              <div
                key={s.num}
                className={`p-2 rounded-[4px] border text-center transition ${
                  isActive
                    ? 'bg-blue-50 border-[#1E40AF] ring-1 ring-[#1E40AF]'
                    : isDone
                    ? 'bg-slate-50 border-slate-300'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full mx-auto mb-1 text-[10px] font-bold flex items-center justify-center ${
                    isDone
                      ? 'bg-[#15803D] text-white'
                      : isActive
                      ? 'bg-[#0A2540] text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {s.num}
                </div>
                <div className="font-bold text-[11px] text-slate-800 leading-tight">
                  {s.title}
                </div>
                <div className="text-[9px] uppercase font-semibold text-slate-500 mt-0.5">
                  {isDone ? 'Done' : isActive ? 'Active' : 'Queue'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Administrative Document Table */}
      <div className="bg-white rounded-[4px] border border-[#CBD5E1] shadow-xs overflow-hidden">
        {/* Table Toolbar & Filters */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('docsAwaitingReview')} ({filteredDocs.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search records / Gat / Village..."
                className="pl-7 pr-3 py-1 text-xs border border-slate-300 rounded-[4px] bg-white focus:outline-none focus:ring-1 focus:ring-[#1E40AF] w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded-[4px] bg-white text-slate-700 font-medium"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="needs_review">{t('status_needs_review')}</option>
              <option value="reviewed">{t('status_reviewed')}</option>
              <option value="approved">{t('status_approved')}</option>
              <option value="pushed_to_lrms">{t('status_pushed_to_lrms')}</option>
              <option value="rejected">{t('status_rejected')}</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs gov-table">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">{t('colDocument')}</th>
                <th className="px-4 py-2.5">{t('colOwnerName')}</th>
                <th className="px-4 py-2.5">{t('colKhasraPlot')}</th>
                <th className="px-4 py-2.5">{t('colVillageDistrict')}</th>
                <th className="px-4 py-2.5">{t('colLandType')}</th>
                <th className="px-4 py-2.5">{t('colConfidence')}</th>
                <th className="px-4 py-2.5">{t('colStatus')}</th>
                <th className="px-4 py-2.5 text-right">{t('colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    {t('noDocsInQueue')}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#1E40AF] shrink-0" />
                        <span className="truncate max-w-[150px]" title={doc.filename}>{doc.filename}</span>
                      </div>
                      {doc.is_duplicate && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 px-1 py-0.2 rounded border border-amber-300">
                          Duplicate Scan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {doc.owner_name || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                      {doc.khasra_number || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {doc.village || '—'}, {doc.district || 'Central District'}
                    </td>
                    <td className="px-4 py-2.5">
                      {doc.land_type ? (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-[3px] border ${
                          doc.land_type === 'Agricultural'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}>
                          {doc.land_type === 'Agricultural' ? 'Agricultural (शेती)' : 'Non-Agri (अकृषिक)'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <ConfidenceBadge score={doc.overall_confidence} size="sm" />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={`/operator/review/${doc.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0A2540] rounded-[3px] text-xs font-semibold transition border border-slate-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('openWorkspace')}</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Batches Section */}
      <div className="bg-white rounded-[4px] border border-[#CBD5E1] shadow-xs p-4">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t('activeBatches')} ({batches.length})
          </h3>
          <Link to="/operator/upload" className="text-xs font-semibold text-[#1D4ED8] hover:underline">
            + {t('uploadNewBatch')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {batches.map((b) => (
            <div key={b.id} className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 space-y-1.5">
              <div className="font-bold text-xs text-[#0A2540] truncate">{b.name}</div>
              <div className="text-[11px] text-slate-500">
                {b.village}, {b.tehsil}, {b.district}
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">{b.total_documents} {t('recordsCount')}</span>
                <span className="font-bold text-[#1E40AF] font-mono">{b.avg_confidence}% {t('avgConfShort')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

