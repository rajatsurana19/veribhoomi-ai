import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CanonicalDocument,
  DocumentValidationSummary,
  AuditLogItem
} from '../types';
import { documentsApi, auditApi } from '../services/api';
import { DiffViewer } from '../components/document/DiffViewer';
import { DocumentViewer } from '../components/document/DocumentViewer';
import { ValidationPanel } from '../components/document/ValidationPanel';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { ApprovalSuccessModal } from '../components/document/ApprovalSuccessModal';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  History,
  FileCheck,
  RefreshCw,
  Edit3,
  BellRing
} from 'lucide-react';
import { SendNotificationModal } from '../components/common/SendNotificationModal';

export const OfficerReview: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [doc, setDoc] = useState<CanonicalDocument | null>(null);
  const [scanBlobUrl, setScanBlobUrl] = useState<string>('');
  const [validation, setValidation] = useState<DocumentValidationSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [approving, setApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Add Difference Modal State
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedField, setSelectedField] = useState('owner_name');
  const [diffNewValue, setDiffNewValue] = useState('');
  const [diffReason, setDiffReason] = useState('');
  const [savingDiff, setSavingDiff] = useState(false);

  // Success Celebration Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [syncedExternalId, setSyncedExternalId] = useState('');
  const [cadastralCode, setCadastralCode] = useState('');
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { t, language } = useLanguage();

  const navigate = useNavigate();

  const loadAll = async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const [docData, valData, logs, scanUrl] = await Promise.all([
        documentsApi.getById(documentId),
        documentsApi.getValidation(documentId),
        auditApi.list({ document_id: documentId }),
        documentsApi.getScanBlobUrl(documentId).catch(() => '')
      ]);
      setDoc(docData);
      setValidation(valData);
      setAuditLogs(logs);
      if (scanUrl) {
        setScanBlobUrl(scanUrl);
      }
    } catch (e: any) {
      console.error(e);
      setNotification({
        msg: e?.response?.data?.detail || 'Failed to load record details',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    return () => {
      if (scanBlobUrl) URL.revokeObjectURL(scanBlobUrl);
    };
  }, [documentId]);

  const handleApprove = async () => {
    if (!documentId) return;
    setApproving(true);
    try {
      const res = await documentsApi.approve(documentId);
      setDoc(res);
      const extId = res.external_lrms_id || (res.lrms_sync && res.lrms_sync.external_id) || 'LRMS-MAH-2026-001';
      setSyncedExternalId(extId);
      setCadastralCode(res.lrms_sync?.cadastral_registry_code || `CAD-MAH-${res.fields.survey_number?.value || res.fields.khasra_number?.value || '7-12'}`);
      setShowSuccessModal(true);
    } catch (err: any) {
      setNotification({
        msg: err?.response?.data?.detail || 'Approval failed due to blocking validation errors.',
        type: 'error'
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!documentId || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      const res = await documentsApi.reject(documentId, rejectReason.trim());
      setDoc(res);
      setShowRejectModal(false);
      setNotification({
        msg: `Record returned to operator. Notification created with note: '${rejectReason}'.`,
        type: 'success'
      });
      loadAll();
    } catch (err: any) {
      setNotification({
        msg: err?.response?.data?.detail || 'Rejection failed.',
        type: 'error'
      });
    } finally {
      setRejecting(false);
    }
  };

  const handleSaveDifference = async () => {
    if (!documentId || !diffNewValue.trim()) return;
    setSavingDiff(true);
    try {
      const updated = await documentsApi.officerEdit(documentId, {
        field_name: selectedField,
        new_value: diffNewValue.trim(),
        reason: diffReason.trim() || 'Officer field correction'
      });
      setDoc(updated);
      setShowDiffModal(false);
      setDiffNewValue('');
      setDiffReason('');
      setNotification({
        msg: `Difference saved for field '${selectedField}' and appended to SHA-256 audit ledger.`,
        type: 'success'
      });
      // Refresh validation and audit logs
      const [newVal, newLogs] = await Promise.all([
        documentsApi.getValidation(documentId),
        auditApi.list({ document_id: documentId })
      ]);
      setValidation(newVal);
      setAuditLogs(newLogs);
    } catch (err: any) {
      setNotification({
        msg: err?.response?.data?.detail || 'Failed to save difference',
        type: 'error'
      });
    } finally {
      setSavingDiff(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 p-6 bg-white border border-slate-300 rounded-[6px]">
          <div className="w-8 h-8 border-3 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-700">{t('loadingOfficerReview')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Top Header & Decision Bar */}
      <div className="bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/officer"
            className="p-1.5 hover:bg-slate-100 border border-slate-300 rounded-[4px] transition text-slate-700 inline-flex items-center justify-center"
            title={t('backToQueue')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 truncate max-w-sm font-heading">
                {t('officerDiffReviewTitle')}: {doc.filename}
              </h1>
              <StatusBadge status={doc.status} />
              {doc.land_type && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                  doc.land_type === 'Agricultural'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}>
                  {doc.land_type === 'Agricultural' ? 'कृषि (Agri)' : 'अकृषिक (N.A.)'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {t('village')}: <span className="font-semibold text-slate-800">{doc.fields.village.value || '—'}</span> • {t('district')}:{' '}
              <span className="font-semibold text-slate-800">{doc.fields.district.value || 'Central District'}</span> • ID:{' '}
              <span className="font-mono text-slate-700 font-semibold">{doc.document_id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div className="flex items-center gap-2">
          {/* Add Difference Button */}
          <button
            onClick={() => {
              setDiffNewValue((doc.fields as any)[selectedField]?.value || '');
              setShowDiffModal(true);
            }}
            disabled={doc.status === 'pushed_to_lrms'}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-[4px] text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Edit3 className="w-3.5 h-3.5 text-gov-blue" />
            <span>+ {t('addDifference')}</span>
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={doc.status === 'pushed_to_lrms'}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-[4px] text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>{t('rejectRecord')}</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={approving || doc.status === 'pushed_to_lrms'}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[4px] text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
          >
            {approving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span>
              {doc.status === 'pushed_to_lrms' ? t('status_pushed_to_lrms') : t('differencesAndApprove')}
            </span>
          </button>

          {/* Send Directive / Redo Notice to Operator */}
          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-3 py-2 bg-[#0A2540] hover:bg-[#1E40AF] text-white rounded-[4px] text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            title="Dispatch Directive or Redo Request to Revenue Staff"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'mr' ? 'ऑपरेटरकडे सूचना पाठवा' : 'Send Notice / Redo'}</span>
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner at Top */}
      {doc.is_duplicate && (
        <div className="p-3 bg-amber-50 border border-amber-400 rounded-[6px] flex items-center justify-between text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Duplicate Document Detected
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                This land record matches an existing survey number and village already committed in the registry database. Please cross-verify carefully before approving.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-[3px] border border-amber-400 font-bold shrink-0">
            DUPLICATE FLAG
          </span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-[4px] border text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Errors & Warnings for immediate officer visibility */}
      {validation && (validation.error_count > 0 || validation.warning_count > 0) && (
        <div className="bg-white rounded-[6px] border border-rose-300 p-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Attention Required: Validation Errors & Warnings
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {validation.error_count > 0 && (
                <span className="px-2 py-0.5 rounded-[3px] bg-rose-100 text-rose-900 font-bold text-[10px] border border-rose-300">
                  {validation.error_count} Blocking Errors
                </span>
              )}
              {validation.warning_count > 0 && (
                <span className="px-2 py-0.5 rounded-[3px] bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                  {validation.warning_count} Warnings
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
            {validation.results
              .filter(r => r.severity === 'ERROR' || r.severity === 'WARNING')
              .map(r => (
                <div
                  key={r.id}
                  className={`p-2 rounded-[4px] border text-xs flex items-start gap-2 ${
                    r.severity === 'ERROR'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  {r.severity === 'ERROR' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {r.field_name ? `Field '${r.field_name}': ` : ''}{r.message}
                    </div>
                    {r.details && <div className="text-[11px] text-slate-700 mt-0.5">{r.details}</div>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Layout: Left Side (Original Scan), Right Side (Diff Viewer, Validation, Audit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side (5 cols) -> Document Scan */}
        <div className="lg:col-span-5 h-[700px]">
          <DocumentViewer
            imageUrl={scanBlobUrl || doc.original_scan_url}
            filename={doc.filename}
          />
        </div>

        {/* Right Side (7 cols) -> Visual Diff Table & Full Verification */}
        <div className="lg:col-span-7 space-y-4">
          {/* Visual Diff Header Strip */}
          <div className="bg-gov-navy text-white p-3 rounded-[6px] border border-gov-navy flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-100">
                <FileCheck className="w-4 h-4 text-gov-saffron" />
                <span>{t('diffBannerTitle')}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {t('diffBannerDesc')}
              </p>
            </div>
            <ConfidenceBadge score={doc.overall_confidence} size="md" />
          </div>

          {/* Diff Viewer */}
          <div className="overflow-y-auto max-h-[440px] rounded-[6px] border border-slate-300">
            <DiffViewer fields={doc.fields} />
          </div>

          {/* Validation Checklist */}
          <ValidationPanel validation={validation} />

          {/* Audit History Snapshot */}
          <div className="bg-white rounded-[6px] border border-slate-300 p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <History className="w-3.5 h-3.5 text-gov-blue" />
                <span>{t('docAuditHistory')}</span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium">{auditLogs.length} {t('eventsLogged')}</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-50 rounded-[4px] border border-slate-200 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">
                      <span className="text-gov-blue font-mono font-semibold">[{log.action}]</span> {log.user_email} ({log.role})
                    </div>
                    <div className="text-slate-700 mt-0.5">
                      {log.field_name && (
                        <span>
                          {t('colFieldName')} <span className="font-semibold text-slate-900">{log.field_name}</span>: '{log.old_value}' → '{log.new_value}'
                        </span>
                      )}
                      {!log.field_name && log.new_value}
                    </div>
                  </div>
                  {/* Full Date and Time */}
                  <div className="text-[10px] text-slate-500 shrink-0 font-mono text-right">
                    <div>
                      {new Date(log.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    <div>
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Difference Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-lg w-full p-5 shadow-lg border border-slate-300">
            <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-[4px] bg-gov-blue/10 text-gov-blue flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Field Difference / Correction</h3>
                <p className="text-[11px] text-slate-600">Edit extracted data and record difference to immutable audit ledger.</p>
              </div>
            </div>

            <div className="space-y-3 my-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Field to Correct
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => {
                    const f = e.target.value;
                    setSelectedField(f);
                    setDiffNewValue((doc.fields as any)[f]?.value || '');
                  }}
                  className="w-full p-2 text-xs border border-slate-300 rounded-[4px] focus:ring-1 focus:ring-gov-blue focus:outline-none bg-white font-medium"
                >
                  <option value="owner_name">Owner Name (खातेदार)</option>
                  <option value="survey_number">Survey / Gat Number (गट / सर्व्हे क्र.)</option>
                  <option value="khasra_number">Khasra Number</option>
                  <option value="khata_number">Khata Number (खाते क्र.)</option>
                  <option value="plot_area">Plot Area (क्षेत्रफळ / हेक्टर.आर)</option>
                  <option value="village">Village (गाव / मौजे)</option>
                  <option value="tehsil">Tehsil / Taluka (तालुका)</option>
                  <option value="district">District (जिल्हा)</option>
                  <option value="land_classification">Land Classification (शेती / अकृषिक)</option>
                  <option value="mutation_details">Mutation Details (फेरफार नोंद)</option>
                  <option value="registration_info">Registration Info</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Verified Value *
                </label>
                <input
                  type="text"
                  value={diffNewValue}
                  onChange={(e) => setDiffNewValue(e.target.value)}
                  placeholder="Enter corrected value from scan..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-[4px] focus:ring-1 focus:ring-gov-blue focus:outline-none font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Difference / Audit Justification
                </label>
                <textarea
                  rows={2}
                  value={diffReason}
                  onChange={(e) => setDiffReason(e.target.value)}
                  placeholder="e.g. Corrected spelling of owner name per physical scan..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-[4px] focus:ring-1 focus:ring-gov-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-[4px] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDifference}
                disabled={savingDiff || !diffNewValue.trim()}
                className="px-4 py-1.5 bg-gov-blue hover:bg-gov-navy text-white text-xs font-semibold rounded-[4px] transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingDiff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Save Difference & Log to Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-md w-full p-5 shadow-lg border border-slate-300">
            <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-[4px] bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t('rejectRecord')}</h3>
                <p className="text-[11px] text-slate-600">{t('rejectionNotice')}</p>
              </div>
            </div>

            <div className="my-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('rejectionReasonPrompt')} *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={t('rejectionPlaceholder')}
                className="w-full p-2 text-xs border border-slate-300 rounded-[4px] focus:ring-1 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-[4px] transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-[4px] transition disabled:opacity-50"
              >
                {rejecting ? t('rejectingBtn') : t('confirmRejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Celebration Modal */}
      {showSuccessModal && (
        <ApprovalSuccessModal
          externalId={syncedExternalId}
          cadastralCode={cadastralCode}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/officer');
          }}
          onViewAudit={() => {
            setShowSuccessModal(false);
            navigate('/admin/audit');
          }}
        />
      )}

      {/* Send Directive Modal */}
      <SendNotificationModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        defaultDocumentId={doc?.document_id}
        defaultBatchId={doc?.batch_id}
        onSuccess={(msg) => setNotification({ msg, type: 'success' })}
      />
    </div>
  );
};

