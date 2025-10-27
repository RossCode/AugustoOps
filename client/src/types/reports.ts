/**
 * TypeScript type definitions for Status Reports feature
 */

export interface ReportConfig {
  id: number;
  project_code: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  send_day: string;
  send_time: string;
  reporting_period_weeks: number;
  is_active: boolean;
  include_jira: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalRecipient {
  id: number;
  project_code: string;
  name: string;
  email: string;
  created_at: string;
}

export interface InternalRecipient {
  id: number;
  project_code: string;
  team_member_id: number;
  name: string;
  augusto_team_member_id: number;
  created_at: string;
}

export interface ReportRecipients {
  internal: InternalRecipient[];
  external: ExternalRecipient[];
}

export interface TaskData {
  task_id: number;
  task_name: string;
  budget: number | null;
  spent_period: number;
  spent_total: number;
  remaining: number | null;
  type: 'time_tracked' | 'fixed_cost';
}

export interface InvoiceData {
  invoice_number: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'draft' | 'open' | 'paid' | 'overdue';
  is_overdue: boolean;
}

export interface InvoiceSummary {
  total_count: number;
  paid_count: number;
  open_count: number;
  overdue_count: number;
  paid_amount: number;
  open_amount: number;
  overdue_amount: number;
}

export interface ReportTotals {
  budget: number;
  spent_period: number;
  spent_total: number;
  remaining: number;
}

export interface ReportData {
  project: {
    code: string;
    name: string;
    client_name: string;
    budget: number;
    budget_hours: number;
    is_fixed_fee: boolean;
    billable: boolean;
  };
  period: {
    start: string;
    end: string;
  };
  tasks: TaskData[];
  totals: ReportTotals;
  invoices: InvoiceData[];
  invoice_summary: InvoiceSummary;
  generated_at: string;
}

export interface Report {
  id: number;
  project_code: string;
  report_period_start: string;
  report_period_end: string;
  status: 'draft' | 'pending_review' | 'approved' | 'sent';
  generated_at: string;
  generated_by: number | null;
  generated_by_name: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  sent_at: string | null;
  pm_narrative: string | null;
  report_data_json: string;
  report_data?: ReportData;
  project_name?: string;
  client_name?: string;
}

export interface CreateReportConfigRequest {
  frequency?: 'weekly' | 'bi-weekly' | 'monthly';
  send_day?: string;
  send_time?: string;
  reporting_period_weeks?: number;
  is_active?: boolean;
  include_jira?: boolean;
}

export interface AddExternalRecipientRequest {
  name: string;
  email: string;
}

export interface AddInternalRecipientRequest {
  team_member_id: number;
}

export interface GenerateReportRequest {
  period_start?: string;
  period_end?: string;
  status?: 'draft' | 'pending_review';
}

export interface UpdateNarrativeRequest {
  pm_narrative: string;
}

export interface QuickBooksInvoice {
  id: number;
  project_code: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'draft' | 'open' | 'paid' | 'overdue';
  synced_at: string;
}

export interface HarvestTimeEntry {
  id: number;
  harvest_id: number;
  project_code: string;
  task_id: number;
  user_id: number;
  hours: number;
  billable_rate: number;
  cost_rate: number;
  entry_date: string;
  synced_at: string;
}
