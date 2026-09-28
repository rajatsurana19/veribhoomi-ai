import React, { useState } from 'react';
import { FieldItem } from '../../types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { useLanguage } from '../../context/LanguageContext';
import { AlertTriangle, CheckCircle2, Edit3, ArrowRight } from 'lucide-react';

interface FieldCardProps {
  fieldName: string;
  labelEn: string;
  labelHi: string;
  field: FieldItem;
  onSave: (val: string, unit?: string) => void;
  units?: string[];
}

export const FieldCard: React.FC<FieldCardProps> = ({
  fieldName,
  labelEn,
  labelHi,
  field,
  onSave,
  units
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentVal, setCurrentVal] = useState<string>(field.value || '');
  const [currentUnit, setCurrentUnit] = useState<string>(field.unit || 'acre');
  const { language, t } = useLanguage();

  const isLowConfidence = field.confidence < 60 && field.source === 'auto';
  const isCorrected = field.source === 'corrected';

  const handleSave = () => {
    onSave(currentVal, units ? currentUnit : undefined);
    setIsEditing(false);
  };

  const primaryLabel = language === 'hi' ? labelHi : labelEn;
  const secondaryLabel = language === 'hi' ? labelEn : labelHi;

  return (
    <div
      className={`p-3 rounded-[6px] border transition-all ${
        isLowConfidence
          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
          : isCorrected
          ? 'bg-emerald-50/50 border-emerald-300'
          : 'bg-white border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Header: Labels + Confidence Badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {primaryLabel}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({secondaryLabel})
            </span>
          </div>
          {isLowConfidence && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('lowConfidenceVerify')}</span>
            </div>
          )}
          {isCorrected && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{t('verifiedAndCorrected')}</span>
            </div>
          )}
        </div>

        <ConfidenceBadge score={field.confidence} size="sm" showLabel={false} />
      </div>

      {/* Field Content & Edit Form */}
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentVal}
              onChange={(e) => setCurrentVal(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs border border-gov-blue rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gov-blue bg-white font-semibold text-slate-900"
              placeholder={`${language === 'hi' ? 'सत्यापित मान दर्ज करें' : 'Enter verified'} ${primaryLabel}`}
              autoFocus
            />
            {units && (
              <select
                value={currentUnit}
                onChange={(e) => setCurrentUnit(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-[4px] bg-white font-medium"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => {
                setCurrentVal(field.value || '');
                setIsEditing(false);
              }}
              className="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-[4px] font-medium transition"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-gov-blue text-white rounded-[4px] font-semibold hover:bg-gov-navy transition"
            >
              {t('saveCorrection')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 mt-1">
          <div className="flex-1">
            {isCorrected && field.ai_value && field.ai_value !== field.value ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 line-through font-mono">
                  {field.ai_value}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-slate-900 bg-emerald-100 px-1.5 py-0.5 rounded-[3px] border border-emerald-300">
                  {field.value} {field.unit ? `(${field.unit})` : ''}
                </span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-900">
                {field.value || <span className="text-slate-400 italic font-normal">{t('notExtracted')}</span>}{' '}
                {field.unit && <span className="text-[11px] text-slate-600 font-normal">({field.unit})</span>}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className={`px-2 py-1 rounded-[4px] border transition text-xs flex items-center gap-1 font-medium ${
              isLowConfidence
                ? 'bg-rose-700 text-white hover:bg-rose-800 border-rose-700'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300'
            }`}
            title="Edit / Correct Field"
          >
            <Edit3 className="w-3 h-3" />
            <span className="hidden sm:inline">{isLowConfidence ? t('correctNow') : t('edit')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

