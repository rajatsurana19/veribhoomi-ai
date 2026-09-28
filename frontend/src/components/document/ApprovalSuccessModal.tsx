import React from 'react';
import { CheckCircle, ShieldCheck, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ApprovalSuccessModalProps {
  externalId: string;
  cadastralCode?: string;
  onClose: () => void;
  onViewAudit: () => void;
}

export const ApprovalSuccessModal: React.FC<ApprovalSuccessModalProps> = ({
  externalId,
  cadastralCode,
  onClose,
  onViewAudit
}) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = () => {
    navigator.clipboard.writeText(externalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-[6px] max-w-md w-full p-5 shadow-lg border border-slate-300 text-center">
        {/* Success Icon */}
        <div className="w-12 h-12 rounded-[6px] bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-300">
          <CheckCircle className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900 font-heading">
          {t('recordApprovedTitle')}
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          {t('recordApprovedDesc')}
        </p>

        {/* Sync Summary Card */}
        <div className="my-4 bg-slate-50 rounded-[4px] p-3 border border-slate-300 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">{t('stateLrmsExternalId')}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-gov-blue bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200">
                {externalId}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-slate-200 rounded-[3px] transition text-slate-600 border border-slate-300"
                title="Copy External ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {cadastralCode && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{t('cadastralRegistryCode')}</span>
              <span className="font-mono text-slate-800 font-semibold">{cadastralCode}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{t('auditEntryAppended')}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewAudit}
            className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-[4px] text-xs font-semibold transition"
          >
            {t('viewAuditTrail')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 bg-gov-navy hover:bg-gov-blue text-white rounded-[4px] text-xs font-semibold transition shadow-xs"
          >
            {t('doneAndReturn')}
          </button>
        </div>
      </div>
    </div>
  );
};

