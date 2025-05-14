/**
 * Portal API service
 * Handles API calls related to portal submissions
 */
import { apiClient } from './apiClient';
import { 
  PortalSubmission, 
  PortalSubmissionCreateData,
  PortalSubmissionResult
} from '../../types/portal';

/**
 * Get portal submissions with optional filtering
 */
export async function getPortalSubmissions(params?: {
  caseId?: string;
  status?: string;
  portalType?: string;
}): Promise<PortalSubmission[]> {
  const response = await apiClient.get('/api/portal-submissions', { params });
  return response.data;
}

/**
 * Get a portal submission by ID
 */
export async function getPortalSubmission(id: string): Promise<PortalSubmission> {
  const response = await apiClient.get(`/api/portal-submissions/${id}`);
  return response.data;
}

/**
 * Create a new portal submission
 */
export async function createPortalSubmission(
  data: PortalSubmissionCreateData
): Promise<PortalSubmission> {
  const response = await apiClient.post('/api/portal-submissions', data);
  return response.data;
}

/**
 * Submit a form to a government portal
 */
export async function submitFormToPortal(
  formSubmissionId: string,
  portalType: string
): Promise<PortalSubmissionResult> {
  const response = await apiClient.post('/api/forms/submit-to-portal', {
    formSubmissionId,
    portalType
  });
  return response.data;
}

/**
 * Retry a failed portal submission
 */
export async function retryPortalSubmission(
  portalSubmissionId: string
): Promise<PortalSubmissionResult> {
  const response = await apiClient.post(`/api/portal-submissions/${portalSubmissionId}/retry`);
  return response.data;
}

/**
 * Get portal submission status
 */
export async function getPortalSubmissionStatus(
  portalSubmissionId: string
): Promise<PortalSubmissionResult> {
  const response = await apiClient.get(`/api/portal-submissions/${portalSubmissionId}/status`);
  return response.data;
}

/**
 * Get field mappings for a portal type
 */
export async function getFieldMappings(portalType: string): Promise<any[]> {
  const response = await apiClient.get(`/api/portal-field-mappings`, {
    params: { portalType }
  });
  return response.data;
}

/**
 * Create a new field mapping
 */
export async function createFieldMapping(data: {
  portalType: string;
  formField: string;
  portalField: string;
}): Promise<any> {
  const response = await apiClient.post('/api/portal-field-mappings', data);
  return response.data;
}

/**
 * Update a field mapping
 */
export async function updateFieldMapping(
  id: string,
  data: { portalField: string }
): Promise<any> {
  const response = await apiClient.put(`/api/portal-field-mappings/${id}`, data);
  return response.data;
}

/**
 * Delete a field mapping
 */
export async function deleteFieldMapping(id: string): Promise<void> {
  await apiClient.delete(`/api/portal-field-mappings/${id}`);
}
