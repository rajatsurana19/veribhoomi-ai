export const getConfidenceColor = (score: number) => {
  if (score >= 85) {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      badgeBg: 'bg-emerald-600',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      label: 'High Accuracy'
    };
  } else if (score >= 60) {
    return {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      badgeBg: 'bg-amber-600',
      text: 'text-amber-900',
      border: 'border-amber-300',
      label: 'Standard Accuracy'
    };
  } else {
    return {
      bg: 'bg-red-50 text-red-900 border-red-300',
      badgeBg: 'bg-red-600',
      text: 'text-red-900',
      border: 'border-red-300',
      label: 'Low — Verify'
    };
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pushed_to_lrms':
      return {
        bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
        dot: 'bg-emerald-600',
        label: 'Synced'
      };
    case 'approved':
      return {
        bg: 'bg-blue-50 text-blue-900 border-blue-300',
        dot: 'bg-blue-600',
        label: 'Approved'
      };
    case 'reviewed':
      return {
        bg: 'bg-slate-100 text-slate-900 border-slate-300',
        dot: 'bg-blue-700',
        label: 'Pending Approval'
      };
    case 'needs_review':
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        dot: 'bg-amber-600',
        label: 'Needs Review'
      };
    case 'processing':
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Processing'
      };
    case 'rejected':
      return {
        bg: 'bg-red-50 text-red-900 border-red-300',
        dot: 'bg-red-600',
        label: 'Returned'
      };
    case 'queued':
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-300',
        dot: 'bg-slate-400',
        label: 'Queued'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-800 border-slate-300',
        dot: 'bg-slate-500',
        label: status
      };
  }
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'ERROR':
      return 'bg-red-50 text-red-900 border-red-300';
    case 'WARNING':
      return 'bg-amber-50 text-amber-900 border-amber-300';
    case 'INFO':
    default:
      return 'bg-emerald-50 text-emerald-900 border-emerald-300';
  }
};

