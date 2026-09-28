import axios from 'axios';
import {
  User,
  CanonicalDocument,
  DocumentListItem,
  BatchItem,
  DocumentValidationSummary,
  SummaryStats,
  TimeseriesPoint,
  ConfidenceBucket,
  RegionalProgress,
  AuditLogItem,
  NotificationItem
} from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('veribhoomi_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const res = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  listUsers: async (role?: string): Promise<User[]> => {
    const res = await apiClient.get('/auth/users', { params: { role } });
    return res.data;
  }
};

// Batches APIs
export const batchesApi = {
  list: async (): Promise<BatchItem[]> => {
    const res = await apiClient.get('/batches');
    return res.data;
  },
  getById: async (id: string): Promise<BatchItem> => {
    const res = await apiClient.get(`/batches/${id}`);
    return res.data;
  },
  create: async (data: { name: string; state: string; district: string; tehsil: string; village: string }): Promise<BatchItem> => {
    const res = await apiClient.post('/batches', data);
    return res.data;
  }
};

// Documents APIs
export const documentsApi = {
  upload: async (batchId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const res = await apiClient.post(`/batches/${batchId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  list: async (params?: {
    batch_id?: string;
    status?: string;
    district?: string;
    village?: string;
    land_type?: string;
    from_date?: string;
    to_date?: string;
    is_duplicate?: boolean;
  }): Promise<DocumentListItem[]> => {
    const res = await apiClient.get('/documents', { params });
    return res.data;
  },
  getById: async (id: string): Promise<CanonicalDocument> => {
    const res = await apiClient.get(`/documents/${id}`);
    return res.data;
  },
  getScanBlobUrl: async (documentId: string): Promise<string> => {
    const res = await apiClient.get(`/documents/${documentId}/scan`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(res.data);
  },
  correctFields: async (documentId: string, corrections: { field_name: string; value: string; unit?: string }[]): Promise<CanonicalDocument> => {
    const res = await apiClient.patch(`/documents/${documentId}/fields`, { corrections });
    return res.data;
  },
  officerEdit: async (documentId: string, data: { field_name: string; new_value: string; reason?: string }): Promise<CanonicalDocument> => {
    const res = await apiClient.patch(`/documents/${documentId}/officer-edit`, data);
    return res.data;
  },
  submitForApproval: async (documentId: string): Promise<CanonicalDocument> => {
    const res = await apiClient.post(`/documents/${documentId}/submit`);
    return res.data;
  },
  approve: async (documentId: string): Promise<CanonicalDocument> => {
    const res = await apiClient.post(`/documents/${documentId}/approve`);
    return res.data;
  },
  reject: async (documentId: string, reason: string): Promise<CanonicalDocument> => {
    const res = await apiClient.post(`/documents/${documentId}/reject`, { reason });
    return res.data;
  },
  getValidation: async (documentId: string): Promise<DocumentValidationSummary> => {
    const res = await apiClient.get(`/documents/${documentId}/validation`);
    return res.data;
  }
};

// Statistics APIs
export const statsApi = {
  getSummary: async (): Promise<SummaryStats> => {
    const res = await apiClient.get('/stats/summary');
    return res.data;
  },
  getTimeseries: async (): Promise<TimeseriesPoint[]> => {
    const res = await apiClient.get('/stats/timeseries');
    return res.data;
  },
  getConfidenceDistribution: async (): Promise<ConfidenceBucket[]> => {
    const res = await apiClient.get('/stats/confidence-distribution');
    return res.data;
  },
  getRegionalProgress: async (): Promise<RegionalProgress[]> => {
    const res = await apiClient.get('/stats/by-region');
    return res.data;
  },
  getLandClassification: async (): Promise<{
    agricultural_count: number;
    non_agricultural_count: number;
    unclassified_count: number;
    total: number;
    agricultural_percentage: number;
    non_agricultural_percentage: number;
  }> => {
    const res = await apiClient.get('/stats/land-classification');
    return res.data;
  },
  getDbStatus: async (): Promise<{ database: string; supabase: { connected: boolean; url: string; status: string } }> => {
    const res = await apiClient.get('/stats/db-status');
    return res.data;
  },
  getDiscrepancies: async (): Promise<{ total_issues: number; categories: { name: string; label_mr: string; count: number; percentage: number; severity: string }[] }> => {
    const res = await apiClient.get('/stats/discrepancies-breakdown');
    return res.data;
  },
  getCircleThroughput: async (): Promise<{ circle: string; taluka: string; total_docs: number; approved: number; pending: number; accuracy: number }[]> => {
    const res = await apiClient.get('/stats/circle-throughput');
    return res.data;
  },
  getSlaVelocity: async (): Promise<{ avg_ocr_seconds: number; avg_operator_minutes: number; avg_officer_hours: number; total_turnaround_hours: number; sla_compliance_percentage: number; daily_trend: { day: string; velocity: number; sla_met: number }[] }> => {
    const res = await apiClient.get('/stats/sla-velocity');
    return res.data;
  }
};

// Audit Logs APIs
export const auditApi = {
  list: async (params?: {
    document_id?: string;
    user_id?: string;
    action?: string;
    from_date?: string;
    to_date?: string;
    area?: string;
  }): Promise<AuditLogItem[]> => {
    const res = await apiClient.get('/audit-logs', { params });
    return res.data;
  }
};

// GIS APIs
export const gisApi = {
  getVillages: async (params?: { district?: string; tehsil?: string }) => {
    const res = await apiClient.get('/gis/villages', { params });
    return res.data;
  },
  getHeatmap: async (params?: { district?: string; tehsil?: string }) => {
    const res = await apiClient.get('/gis/heatmap', { params });
    return res.data;
  }
};

// Notifications & Feedback
export const notificationsApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },
  send: async (data: {
    recipient_role?: string;
    recipient_id?: string;
    recipient_user_id?: string;
    document_id?: string;
    batch_id?: string;
    title: string;
    message: string;
    type?: string;
    action_type?: string;
    parent_notification_id?: string;
  }) => {
    const res = await apiClient.post('/notifications/send', {
      ...data,
      recipient_user_id: data.recipient_user_id || data.recipient_id
    });
    return res.data;
  },
  revert: async (id: string, replyMessage: string) => {
    const res = await apiClient.post(`/notifications/${id}/revert`, { reply_message: replyMessage });
    return res.data;
  }
};

export const feedbackApi = {
  getStats: async () => {
    const res = await apiClient.get('/feedback/stats');
    return res.data;
  }
};

