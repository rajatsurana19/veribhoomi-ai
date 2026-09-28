import React from 'react';
import { getConfidenceColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, showLabel = true, size = 'md' }) => {
  const color = getConfidenceColor(score);
  const { t } = useLanguage();
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1 font-semibold'
  }[size];

  const label = score >= 85 ? t('highConfidence') : score >= 60 ? t('mediumConfidence') : t('lowConfidence');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border font-medium ${color.bg} ${sizeClasses}`}
      title="Accuracy rate from multi-engine OCR and cadastral directory cross-validation"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.badgeBg}`} />
      <span className="font-mono font-bold">{score.toFixed(0)}%</span>
      {showLabel && <span className="opacity-90 font-normal">({label})</span>}
    </span>
  );
};

