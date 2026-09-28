import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CanonicalDocument,
  DocumentValidationSummary,
  CanonicalFields
} from '../types';
import { documentsApi } from '../services/api';
import { DocumentViewer } from '../components/document/DocumentViewer';
import { FieldCard } from '../components/document/FieldCard';
import { ValidationPanel } from '../components/document/ValidationPanel';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileCheck,
  RefreshCw
} from 'lucide-react';

interface FieldMeta {
  key: keyof CanonicalFields;
  labelEn: string;
  labelHi: string;
  units?: string[];
}

const FIELD_CONFIG: FieldMeta[] = [
  { key: 'khasra_number', labelEn: 'Khasra Number', labelHi: 'खसरा संख्या' },
  { key: 'owner_name', labelEn: 'Owner Name', labelHi: 'भूस्वामी / खातेदार' },
  { key: 'survey_number', labelEn: 'Survey Number', labelHi: 'सर्वे संख्या' },
  { key: 'khata_number', labelEn: 'Khata Number', labelHi: 'खाता / खतौनी' },
  { key: 'plot_area', labelEn: 'Plot Area', labelHi: 'रकबा / क्षेत्रफल', units: ['acre', 'hectare', 'bigha'] },
  { key: 'village', labelEn: 'Village', labelHi: 'ग्राम' },
  { key: 'tehsil', labelEn: 'Tehsil', labelHi: 'तहसील' },
  { key: 'district', labelEn: 'District', labelHi: 'ज़िला' },
  { key: 'land_classification', labelEn: 'Land Classification', labelHi: 'भूमि श्रेणी' },
  { key: 'mutation_details', labelEn: 'Mutation Details', labelHi: 'दाखिल खारिज' },
  { key: 'registration_info', labelEn: 'Registration Info', labelHi: 'पंजीकरण विवरण' }
];

export const DocumentReview: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [doc, setDoc] = useState<CanonicalDocument | null>(null);
  const [scanBlobUrl, setScanBlobUrl] = useState<string>('');
  const [validation, setValidation] = useState<DocumentValidationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { t } = useLanguage();

  const navigate = useNavigate();

  const loadDocumentData = async (fetchScan: boolean = false) => {
    if (!documentId) return;
    try {
      if (fetchScan) setLoading(true);
      const [docData, valData] = await Promise.all([
        documentsApi.getById(documentId),
        documentsApi.getValidation(documentId)
      ]);
      setDoc(docData);
      setValidation(valData);

      if (fetchScan) {
        const scanUrl = await documentsApi.getScanBlobUrl(documentId).catch(() => '');
        if (scanUrl) {
          setScanBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return scanUrl;
          });
        }
      }
    } catch (e: any) {
      console.error(e);
      setNotification({
        msg: e?.response?.data?.detail || 'Failed to load document records',
        type: 'error'
      });
    } finally {
      if (fetchScan) setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentData(true);

    const interval = setInterval(() => {
      if (doc && (doc.status === 'queued' || doc.status === 'processing')) {
        loadDocumentData(false);
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      setScanBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
    };
  }, [documentId, doc?.status]);

  const handleFieldSave = async (fieldName: string, value: string, unit?: string) => {
    if (!documentId) return;
    try {
      const updated = await documentsApi.correctFields(documentId, [
        { field_name: fieldName, value, unit }
      ]);
      setDoc(updated);
      
      const valData = await documentsApi.getValidation(documentId);
      setValidation(valData);

      setNotification({
        msg: `Field '${fieldName}' verified & updated in database.`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        msg: err?.response?.data?.detail || 'Correction update failed',
        type: 'error'
      });
    }
  };

  const handleSubmitForApproval = async () => {
    if (!documentId) return;
    setSubmitting(true);
    try {
      const res = await documentsApi.submitForApproval(documentId);
      setDoc(res);
      setNotification({
        msg: 'Record successfully verified and submitted to Officer Approval Queue!',
        type: 'success'
      });
      setTimeout(() => {
        navigate('/operator');
      }, 1500);
    } catch (err: any) {
      setNotification({
        msg: err?.response?.data?.detail || 'Submission blocked by validation rules.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 p-6 bg-white border border-slate-300 rounded-[6px]">
          <div className="w-8 h-8 border-3 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-700">{t('loadingWorkspace')}</span>
        </div>
      </div>
    );
  }

  const hasUncorrectedLowConf = Object.values(doc.fields).some(
    f => f.confidence < 60 && f.source === 'auto'
  );

  const isSubmitDisabled = hasUncorrectedLowConf || (validation ? !validation.can_submit : false);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Workspace Top Bar */}
      <div className="bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/operator"
            className="p-1.5 hover:bg-slate-100 border border-slate-300 rounded-[4px] transition text-slate-700 inline-flex items-center justify-center"
            title={t('backToDashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 truncate max-w-sm font-heading">
                {doc.filename}
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
              ID: <span className="font-mono font-semibold text-slate-800">{doc.document_id.slice(0, 12)}...</span> • Batch:{' '}
              <span className="font-mono text-slate-700">{doc.batch_id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Overall Confidence & Submit Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              {t('overallConfidence')}
            </div>
            <ConfidenceBadge score={doc.overall_confidence} size="md" />
          </div>

          <div className="relative group">
            <button
              onClick={handleSubmitForApproval}
              disabled={isSubmitDisabled || submitting || doc.status === 'reviewed' || doc.status === 'pushed_to_lrms'}
              className="px-4 py-2 bg-gov-navy hover:bg-gov-blue text-white rounded-[4px] text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t('submitForApproval')}</span>
            </button>

            {hasUncorrectedLowConf && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 text-slate-100 text-[11px] p-2.5 rounded-[4px] shadow-lg border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition z-50">
                ⚠ {t('cannotSubmitWarning')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {doc.is_duplicate && (
        <div className="p-3 bg-amber-50 border border-amber-400 rounded-[6px] flex items-center justify-between text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Duplicate Record Scan Detected
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                A matching survey number and village already exists in the system. Verify attributes carefully.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-[3px] border border-amber-400 font-bold shrink-0">
            DUPLICATE
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
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: 55% -> Scanned Document Viewer */}
        <div className="lg:col-span-7 h-[750px]">
          <DocumentViewer
            imageUrl={scanBlobUrl || doc.original_scan_url}
            filename={doc.filename}
            highlightKhasra={doc.fields.khasra_number.confidence < 60 && doc.fields.khasra_number.source === 'auto'}
          />
        </div>

        {/* Right Side: 45% -> AI Extraction Panel + Rules Panel */}
        <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {/* AI Banner */}
          <div className="bg-gov-navy text-white p-3 rounded-[6px] border border-gov-navy shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-gov-saffron" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  {t('aiExtractedBannerTitle')}
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-[3px] font-mono border border-slate-700">
                Canonical v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {t('aiExtractedBannerDesc')}
            </p>
          </div>

          {/* Canonical Fields Cards */}
          <div className="space-y-2">
            {FIELD_CONFIG.map(({ key, labelEn, labelHi, units }) => {
              const field = doc.fields[key];
              if (!field) return null;
              return (
                <FieldCard
                  key={key}
                  fieldName={key}
                  labelEn={labelEn}
                  labelHi={labelHi}
                  field={field}
                  units={units}
                  onSave={(val, unit) => handleFieldSave(key, val, unit)}
                />
              );
            })}
          </div>

          {/* Validation Rules Checklist Panel */}
          <ValidationPanel validation={validation} />
        </div>
      </div>
    </div>
  );
};

