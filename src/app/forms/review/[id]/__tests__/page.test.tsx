import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReviewPage from '../page';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.Mock;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.Mock;

// Mock FormReviewSubmissionUI component
jest.mock('../../../../../components/forms/FormReviewSubmissionUI', () => {
  return function MockFormReviewSubmissionUI({ formSubmissionId }: { formSubmissionId: string }) {
    return <div data-testid="form-review-submission-ui">Form Review UI for ID: {formSubmissionId}</div>;
  };
});

describe('ReviewPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('should redirect to login if not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<ReviewPage params={{ id: '123' }} />);

    expect(mockPush).toHaveBeenCalledWith('/auth/signin');
  });

  it('should show loading state while checking authentication', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<ReviewPage params={{ id: '123' }} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render the form review UI when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-123' } },
      status: 'authenticated',
    });

    render(<ReviewPage params={{ id: '123' }} />);

    expect(screen.getByText(/form review & submission/i)).toBeInTheDocument();
    expect(screen.getByTestId('form-review-submission-ui')).toBeInTheDocument();
    expect(screen.getByText(/form review ui for id: 123/i)).toBeInTheDocument();
  });
});
