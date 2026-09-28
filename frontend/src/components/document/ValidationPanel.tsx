import React from 'react';
import { DocumentValidationSummary } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck } from 'lucide-react';
import { getSeverityColor } from '../../utils/colors';

interface ValidationPanelProps {
  validation: DocumentValidationSummary | null;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validation }) => {
  const { t } = useLanguage();

  if (!validation) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-300 rounded-[6px] text-xs text-slate-600 text-center">
        {t('validationEngineInit')}
      </div>
    );
  }

  const { passed_count, warning_count, error_count, results } = validation;

  return (
    <div className="bg-white rounded-[6px] border border-slate-300 shadow-xs p-3.5 space-y-2.5">
      {/* Header with summary rectangular badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-gov-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t('cadastralRulesTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-[3px] border border-emerald-300">
            {passed_count} {t('passedCount')}
          </span>
          {warning_count > 0 && (
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-[3px] border border-amber-300">
              {warning_count} {t('warningsCount')}
            </span>
          )}
          {error_count > 0 && (
            <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-[3px] border border-rose-300">
              {error_count} {t('blockingErrorsCount')}
            </span>
          )}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {results.map((r) => {
          const isError = r.severity === 'ERROR';
          const isWarn = r.severity === 'WARNING';

          return (
            <div
              key={r.id || r.rule_name}
              className={`p-2 rounded-[4px] border text-xs flex items-start gap-2 transition ${getSeverityColor(
                r.severity
              )}`}
            >
              <div className="mt-0.5 shrink-0">
                {isError ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-700" />
                ) : isWarn ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{r.message}</div>
                {r.details && <div className="text-[11px] text-slate-600 mt-0.5">{r.details}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation Notice */}
      <div className="bg-slate-50 border border-slate-200 p-2 rounded-[4px] text-[11px] text-slate-600 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-gov-blue shrink-0" />
        <span>
          {t('validationNotice')}
        </span>
      </div>
    </div>
  );
};

