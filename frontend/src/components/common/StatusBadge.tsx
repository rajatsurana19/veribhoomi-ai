import React from 'react';
import { getStatusColor } from '../../utils/colors';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = getStatusColor(status);
  const { t } = useLanguage();

  const statusKeyMap: { [key: string]: string } = {
    'pushed_to_lrms': 'status_pushed_to_lrms',
    'approved': 'status_approved',
    'reviewed': 'status_reviewed',
    'needs_review': 'status_needs_review',
    'processing': 'status_processing',
    'rejected': 'status_rejected',
    'queued': 'status_queued',
    'verified': 'status_verified'
  };

  const label = statusKeyMap[status] ? t(statusKeyMap[status]) : cfg.label;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span>{label}</span>
    </span>
  );
};

