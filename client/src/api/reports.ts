/**
 * API client for Status Reports endpoints
 */

import type {
  ReportConfig,
  ReportRecipients,
  ExternalRecipient,
  InternalRecipient,
  Report,
  CreateReportConfigRequest,
  AddExternalRecipientRequest,
  AddInternalRecipientRequest,
  GenerateReportRequest,
  UpdateNarrativeRequest,
  QuickBooksInvoice,
  HarvestTimeEntry
} from '../types/reports';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// ==================== REPORT CONFIGURATION ====================

export const getReportConfig = async (projectCode: string): Promise<ReportConfig> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/report-config`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Report configuration not found');
    }
    throw new Error('Failed to fetch report configuration');
  }
  return response.json();
};

export const createOrUpdateReportConfig = async (
  projectCode: string,
  config: CreateReportConfigRequest
): Promise<ReportConfig> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/report-config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error('Failed to save report configuration');
  }
  return response.json();
};

export const deleteReportConfig = async (projectCode: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/report-config`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete report configuration');
  }
};

// ==================== RECIPIENT MANAGEMENT ====================

export const getReportRecipients = async (projectCode: string): Promise<ReportRecipients> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/report-recipients`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch report recipients');
  }
  return response.json();
};

export const addExternalRecipient = async (
  projectCode: string,
  recipient: AddExternalRecipientRequest
): Promise<ExternalRecipient> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/report-recipients/external`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(recipient),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add external recipient');
  }
  return response.json();
};

export const removeExternalRecipient = async (
  projectCode: string,
  recipientId: number
): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/projects/${projectCode}/report-recipients/external/${recipientId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to remove external recipient');
  }
};

export const addInternalRecipient = async (
  projectCode: string,
  recipient: AddInternalRecipientRequest
): Promise<InternalRecipient> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/report-recipients/internal`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(recipient),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add internal recipient');
  }
  return response.json();
};

export const removeInternalRecipient = async (
  projectCode: string,
  recipientId: number
): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/projects/${projectCode}/report-recipients/internal/${recipientId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to remove internal recipient');
  }
};

// ==================== REPORT GENERATION & MANAGEMENT ====================

export const getProjectReports = async (projectCode: string): Promise<Report[]> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/reports`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  return response.json();
};

export const generateReport = async (
  projectCode: string,
  request: GenerateReportRequest = {}
): Promise<Report> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/reports/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate report');
  }
  return response.json();
};

export const getReport = async (reportId: number): Promise<Report> => {
  const response = await fetch(`${API_BASE}/reports/${reportId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch report');
  }
  return response.json();
};

export const getReportPreviewUrl = (reportId: number): string => {
  return `${API_BASE}/reports/${reportId}/preview`;
};

export const getReportPdfUrl = (reportId: number): string => {
  return `${API_BASE}/reports/${reportId}/pdf`;
};

export const updateReportNarrative = async (
  reportId: number,
  request: UpdateNarrativeRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE}/reports/${reportId}/narrative`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error('Failed to update narrative');
  }
};

export const approveReport = async (reportId: number): Promise<Report> => {
  const response = await fetch(`${API_BASE}/reports/${reportId}/approve`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to approve report');
  }
  return response.json();
};

export const sendReport = async (reportId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/reports/${reportId}/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send report');
  }
};

export const deleteReport = async (reportId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/reports/${reportId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete report');
  }
};

export const getPendingReports = async (): Promise<Report[]> => {
  const response = await fetch(`${API_BASE}/reports/pending-review`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch pending reports');
  }
  return response.json();
};

// ==================== DATA RETRIEVAL ====================

export const getProjectInvoices = async (projectCode: string): Promise<QuickBooksInvoice[]> => {
  const response = await fetch(`${API_BASE}/projects/${projectCode}/invoices`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  return response.json();
};

export const getProjectTimeEntries = async (
  projectCode: string,
  startDate?: string,
  endDate?: string
): Promise<HarvestTimeEntry[]> => {
  let url = `${API_BASE}/projects/${projectCode}/time-entries`;
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch time entries');
  }
  return response.json();
};
