import React from 'react';
import { CanonicalFields } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, UserCheck } from 'lucide-react';

interface DiffViewerProps {
  fields: CanonicalFields;
}

interface FieldMeta {
  key: keyof CanonicalFields;
  labelEn: string;
  labelHi: string;
}

const FIELD_DEFS: FieldMeta[] = [
  { key: 'owner_name', labelEn: 'Owner Name', labelHi: 'भूस्वामी नाम' },
  { key: 'survey_number', labelEn: 'Survey Number', labelHi: 'सर्वे संख्या' },
  { key: 'khasra_number', labelEn: 'Khasra Number', labelHi: 'खसरा संख्या' },
  { key: 'khata_number', labelEn: 'Khata Number', labelHi: 'खाता संख्या' },
  { key: 'plot_area', labelEn: 'Plot Area', labelHi: 'रकबा / क्षेत्रफल' },
  { key: 'village', labelEn: 'Village', labelHi: 'ग्राम' },
  { key: 'tehsil', labelEn: 'Tehsil', labelHi: 'तहसील' },
  { key: 'district', labelEn: 'District', labelHi: 'ज़िला' },
  { key: 'land_classification', labelEn: 'Land Classification', labelHi: 'भूमि श्रेणी' },
  { key: 'mutation_details', labelEn: 'Mutation Details', labelHi: 'दाखिल खारिज' },
  { key: 'registration_info', labelEn: 'Registration Info', labelHi: 'पंजीकरण विवरण' }
];

export const DiffViewer: React.FC<DiffViewerProps> = ({ fields }) => {
  const { language, t } = useLanguage();

  return (
    <div className="bg-white rounded-[6px] border border-slate-300 shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 bg-slate-100 text-slate-800 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b border-slate-300">
        <div className="col-span-4 flex items-center gap-1">
          <span>{t('cadastralFieldCol')}</span>
        </div>
        <div className="col-span-4 flex items-center gap-1 text-gov-blue">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('aiDraftCol')}</span>
        </div>
        <div className="col-span-4 flex items-center gap-1 text-emerald-800">
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t('operatorVerifiedCol')}</span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200">
        {FIELD_DEFS.map(({ key, labelEn, labelHi }) => {
          const item = fields[key];
          if (!item) return null;

          const aiVal = item.ai_value || item.value;
          const isCorrected = item.source === 'corrected' && item.ai_value && item.ai_value !== item.value;
          const primaryLabel = language === 'hi' ? labelHi : labelEn;
          const secondaryLabel = language === 'hi' ? labelEn : labelHi;

          return (
            <div
              key={key}
              className={`grid grid-cols-12 px-3.5 py-2 text-xs items-center transition ${
                isCorrected ? 'bg-amber-50/60' : 'hover:bg-slate-50'
              }`}
            >
              {/* Field Name */}
              <div className="col-span-4 pr-2">
                <div className="font-bold text-slate-900">{primaryLabel}</div>
                <div className="text-[10px] text-slate-500">({secondaryLabel})</div>
              </div>

              {/* AI Draft Value */}
              <div className="col-span-4 pr-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-xs ${
                      isCorrected ? 'line-through text-slate-400 bg-slate-100 px-1 py-0.5 rounded-[2px]' : 'text-slate-800 font-semibold'
                    }`}
                  >
                    {aiVal || <span className="text-slate-400 italic font-normal">{t('notExtracted')}</span>}
                  </span>
                  {item.ai_confidence !== undefined && (
                    <span className="text-[10px] text-slate-500">
                      ({item.ai_confidence.toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Operator Verified Value */}
              <div className="col-span-4">
                {isCorrected ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded-[3px] border border-emerald-300 font-mono text-xs">
                      {item.value} {item.unit ? `(${item.unit})` : ''}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded-[2px] border border-emerald-300 uppercase">
                      {t('correctedTag')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                    <span>{item.value} {item.unit ? `(${item.unit})` : ''}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({t('acceptedAi')})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

