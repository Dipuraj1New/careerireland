import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import FormReviewSubmissionUI from '../FormReviewSubmissionUI';
import { FormSubmissionStatus } from '../../../types/form';
import { PortalSubmissionStatus } from '../../../types/portal';
import { useRouter } from 'next/navigation';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock FormPreview component
jest.mock('../FormPreview', () => {
  return function MockFormPreview({ onSubmit, readOnly }: any) {
    return (
      <div data-testid="form-preview">
        <p>Form Preview Component (readOnly: {readOnly ? 'true' : 'false'})</p>
        {!readOnly && onSubmit && (
          <button onClick={() => onSubmit({ field1: 'value1' })}>Submit Form</button>
        )}
      </div>
    );
  };
});

// Mock FormSubmissionTracker component
jest.mock('../FormSubmissionTracker', () => {
  return function MockFormSubmissionTracker() {
    return <div data-testid="form-submission-tracker">Form Submission Tracker Component</div>;
  };
});

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Mock router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};
(useRouter as jest.Mock).mockReturnValue(mockRouter);

describe('FormReviewSubmissionUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ formSubmission: {} }),
    });

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load form submission' }),
    });

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load form submission/i)).toBeInTheDocument();
    });
  });

  it('should display form not found message when submission is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ formSubmission: null }),
    });

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/form not found/i)).toBeInTheDocument();
    });
  });

  it('should display form review UI for a generated form', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        formSubmission: {
          id: '123',
          templateId: 'template-123',
          caseId: 'case-123',
          status: FormSubmissionStatus.GENERATED,
        },
      }),
    });

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/review and submit form/i)).toBeInTheDocument();
      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        formSubmission: {
          id: '123',
          templateId: 'template-123',
          caseId: 'case-123',
          status: FormSubmissionStatus.GENERATED,
        },
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        formSubmission: {
          id: '123',
          templateId: 'template-123',
          caseId: 'case-123',
          status: FormSubmissionStatus.SUBMITTED,
        },
      }),
    });

    global.alert = jest.fn();

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/review and submit form/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit Form'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Form submitted successfully');
      expect(screen.getByText(/form review complete/i)).toBeInTheDocument();
    });
  });

  it('should display review complete UI for a submitted form', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        formSubmission: {
          id: '123',
          templateId: 'template-123',
          caseId: 'case-123',
          status: FormSubmissionStatus.SUBMITTED,
        },
      }),
    });

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/form already submitted/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Review'));

    await waitFor(() => {
      expect(screen.getByText(/form review complete/i)).toBeInTheDocument();
      expect(screen.getByText(/submit to government portal/i)).toBeInTheDocument();
    });
  });

  it('should handle portal submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        formSubmission: {
          id: '123',
          templateId: 'template-123',
          caseId: 'case-123',
          status: FormSubmissionStatus.SUBMITTED,
        },
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        submission: {
          id: 'portal-123',
          formSubmissionId: '123',
          status: PortalSubmissionStatus.PENDING,
        },
      }),
    });

    global.alert = jest.fn();

    render(
      <SessionProvider session={{ user: { id: '123' } } as any}>
        <FormReviewSubmissionUI formSubmissionId="123" />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/form already submitted/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Review'));

    await waitFor(() => {
      expect(screen.getByText(/form review complete/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit to Government Portal'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Form has been submitted to the government portal');
      expect(mockPush).toHaveBeenCalledWith('/forms/submissions/123/confirmation');
    });
  });
});
