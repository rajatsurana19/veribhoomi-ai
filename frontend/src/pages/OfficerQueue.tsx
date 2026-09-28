import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Filter,
  ArrowRight,
  FileText,
  Search,
  Eye,
  BellRing
} from 'lucide-react';
import { documentsApi } from '../services/api';
import { DocumentListItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useLanguage } from '../context/LanguageContext';
import { SendNotificationModal } from '../components/common/SendNotificationModal';

export const OfficerQueue: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [landTypeFilter, setLandTypeFilter] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState('');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const list = await documentsApi.list({
          district: districtFilter || undefined,
          village: villageFilter || undefined,
          status: statusFilter || undefined,
          land_type: landTypeFilter || undefined,
          is_duplicate: duplicateFilter === 'true' ? true : undefined
        });
        setDocuments(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [districtFilter, villageFilter, statusFilter, landTypeFilter, duplicateFilter]);

  const pendingDocs = documents.filter(d => d.status === 'reviewed' || d.status === 'needs_review');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-[4px] border border-[#CBD5E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">
              {t('officerQueueTitle')}
            </h1>
            <span className="bg-blue-50 text-blue-900 text-[11px] font-bold px-2 py-0.5 rounded-[3px] border border-blue-200">
              {t('officerRankBadge')}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            {t('officerQueueSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowNoticeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2540] hover:bg-[#1E40AF] text-white rounded-[4px] text-xs font-bold transition shadow-xs"
            title="Dispatch Directive or Redo Request to Revenue Staff"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'mr' ? 'ऑपरेटरकडे सूचना पाठवा' : 'Send Directive to Operator'}</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-[4px] border border-slate-300 text-[#0A2540] text-xs font-bold">
            <FileCheck2 className="w-4 h-4 text-[#1E40AF]" />
            <span>{pendingDocs.length} {t('recordsPendingReview')}</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-3 rounded-[4px] border border-[#CBD5E1] shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
          <Filter className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span>{t('filters')}:</span>
        </div>

        <input
          type="text"
          placeholder={t('filterDistrict')}
          value={districtFilter}
          onChange={e => setDistrictFilter(e.target.value)}
          className="px-2.5 py-1 border border-slate-300 rounded-[4px] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
        />

        <input
          type="text"
          placeholder={t('filterVillage')}
          value={villageFilter}
          onChange={e => setVillageFilter(e.target.value)}
          className="px-2.5 py-1 border border-slate-300 rounded-[4px] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-2.5 py-1 border border-slate-300 rounded-[4px] text-xs bg-white text-slate-700 font-medium"
        >
          <option value="">{t('allStatuses')}</option>
          <option value="reviewed">{t('status_reviewed')}</option>
          <option value="needs_review">{t('status_needs_review')}</option>
          <option value="pushed_to_lrms">{t('status_pushed_to_lrms')}</option>
          <option value="approved">{t('status_approved')}</option>
          <option value="rejected">{t('status_rejected')}</option>
        </select>

        {/* Multi-Criteria Filter: Land Classification */}
        <select
          value={landTypeFilter}
          onChange={e => setLandTypeFilter(e.target.value)}
          className="px-2.5 py-1 border border-slate-300 rounded-[4px] text-xs bg-white text-slate-700 font-medium"
        >
          <option value="">{t('allLandTypes')}</option>
          <option value="Agricultural">Agricultural (शेती)</option>
          <option value="Non-Agricultural">Non-Agricultural (अकृषिक / N.A.)</option>
        </select>

        {/* Multi-Criteria Filter: Duplicate Flag */}
        <select
          value={duplicateFilter}
          onChange={e => setDuplicateFilter(e.target.value)}
          className="px-2.5 py-1 border border-slate-300 rounded-[4px] text-xs bg-white text-slate-700 font-medium"
        >
          <option value="">{t('allScans')}</option>
          <option value="true">{t('duplicateOnly')}</option>
        </select>
      </div>

      {/* Approval Queue Table */}
      <div className="bg-white rounded-[4px] border border-[#CBD5E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs gov-table">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">{t('colDocument')}</th>
                <th className="px-4 py-2.5">{t('colOwnerName')}</th>
                <th className="px-4 py-2.5">{t('colKhasraPlot')}</th>
                <th className="px-4 py-2.5">{t('colJurisdiction')}</th>
                <th className="px-4 py-2.5">{t('colLandType')}</th>
                <th className="px-4 py-2.5">{t('colConfidence')}</th>
                <th className="px-4 py-2.5">{t('colWorkflowStatus')}</th>
                <th className="px-4 py-2.5 text-right">{t('colOfficerAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 text-xs">
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#1E40AF] shrink-0" />
                        <span className="truncate max-w-[150px]" title={doc.filename}>{doc.filename}</span>
                      </div>
                      {doc.is_duplicate && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 px-1 py-0.2 rounded border border-amber-300">
                          Duplicate
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
                        to={`/officer/review/${doc.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0A2540] hover:bg-[#1E40AF] text-white rounded-[3px] text-xs font-semibold transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('reviewDiffBtn')}</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SendNotificationModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
      />
    </div>
  );
};

