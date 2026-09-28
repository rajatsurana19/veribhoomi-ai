export type UserRole = 'operator' | 'officer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  designation?: string;
}

export interface FieldItem {
  value: string;
  confidence: number;
  source: 'auto' | 'corrected';
  unit?: 'acre' | 'hectare' | 'bigha' | string;
  ai_value?: string;
  ai_confidence?: number;
}

export interface CanonicalFields {
  owner_name: FieldItem;
  survey_number: FieldItem;
  khasra_number: FieldItem;
  khata_number: FieldItem;
  plot_area: FieldItem;
  village: FieldItem;
  tehsil: FieldItem;
  district: FieldItem;
  land_classification: FieldItem;
  mutation_details: FieldItem;
  registration_info: FieldItem;
}

export type DocumentStatus =
  | 'queued'
  | 'processing'
  | 'ocr_complete'
  | 'needs_review'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'pushed_to_lrms';

export interface CanonicalDocument {
  document_id: string;
  batch_id: string;
  filename: string;
  fields: CanonicalFields;
  overall_confidence: number;
  status: DocumentStatus;
  original_scan_url: string;
  is_duplicate?: boolean;
  duplicate_of_id?: string;
  land_type?: string;
  is_encrypted?: boolean;
  external_lrms_id?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  lrms_sync?: any;
}

export interface DocumentListItem {
  id: string;
  batch_id: string;
  filename: string;
  status: DocumentStatus;
  overall_confidence: number;
  original_scan_url: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  khasra_number?: string;
  village?: string;
  district?: string;
  land_type?: string;
  is_duplicate?: boolean;
  duplicate_of_id?: string;
  external_lrms_id?: string;
}

export interface BatchItem {
  id: string;
  name: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  status: string;
  total_documents: number;
  processed_count?: number;
  needs_review_count?: number;
  approved_count?: number;
  avg_confidence?: number;
  created_at: string;
}

export interface ValidationRuleResult {
  id: string;
  rule_name: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  field_name?: string;
  is_blocking: boolean;
  is_resolved?: boolean;
  details?: string;
}

export interface DocumentValidationSummary {
  document_id: string;
  total_checks: number;
  passed_count: number;
  warning_count: number;
  error_count: number;
  can_submit: boolean;
  can_approve: boolean;
  results: ValidationRuleResult[];
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email: string;
  role: string;
  action: string;
  document_id?: string;
  batch_id?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  timestamp: string;
}

export interface SummaryStats {
  total_documents: number;
  processed_documents: number;
  needs_review: number;
  reviewed: number;
  approved: number;
  rejected: number;
  pushed_to_lrms: number;
  avg_confidence: number;
  validation_error_rate: number;
  total_batches: number;
}

export interface TimeseriesPoint {
  date: string;
  uploaded: number;
  processed: number;
  approved: number;
  pushed: number;
}

export interface ConfidenceBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface RegionalProgress {
  state: string;
  district: string;
  village: string;
  processed: number;
  pending: number;
  approved: number;
  pushed_to_lrms: number;
  avg_confidence: number;
  total_plots: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  document_id?: string;
  batch_id?: string;
  sender_id?: string;
  sender_role?: string;
  parent_notification_id?: string;
  action_type?: string;
}

export interface OfficerEditRequest {
  field_name: string;
  new_value: string;
  reason?: string;
}

export interface VillageHeatmapPoint {
  village: string;
  tehsil: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  total_documents: number;
  total_plots: number;
  plots_covered: number;
  plots_left: number;
  coverage_percentage: number;
  coverage_intensity: number;
}

export interface LandClassificationStats {
  agricultural_count: number;
  non_agricultural_count: number;
  unclassified_count: number;
  total: number;
  agricultural_percentage: number;
  non_agricultural_percentage: number;
}
