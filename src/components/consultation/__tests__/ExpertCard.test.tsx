import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpertCard from '../ExpertCard';
import { UserRole } from '@/types/user';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('ExpertCard Component', () => {
  const mockExpert = {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.EXPERT,
    createdAt: new Date(),
    updatedAt: new Date(),
    specializations: ['Work Permits', 'Skilled Worker Visas'],
    rating: 4.8,
    reviewCount: 124,
    bio: 'Immigration expert specializing in visa applications.',
    services: [
      {
        id: '101',
        expertId: '1',
        name: 'Initial Consultation',
        description: 'A 30-minute consultation to discuss your immigration needs.',
        duration: 30,
        price: 75,
        currency: '€',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '102',
        expertId: '1',
        name: 'Comprehensive Case Review',
        description: 'A detailed review of your immigration case.',
        duration: 60,
        price: 150,
        currency: '€',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  it('renders expert name correctly', () => {
    render(<ExpertCard expert={mockExpert} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders expert rating and review count', () => {
    render(<ExpertCard expert={mockExpert} />);
    expect(screen.getByText(/4.8/)).toBeInTheDocument();
    expect(screen.getByText(/124 reviews/)).toBeInTheDocument();
  });

  it('renders expert specializations as badges', () => {
    render(<ExpertCard expert={mockExpert} />);
    expect(screen.getByText('Work Permits')).toBeInTheDocument();
    expect(screen.getByText('Skilled Worker Visas')).toBeInTheDocument();
  });

  it('renders expert bio', () => {
    render(<ExpertCard expert={mockExpert} />);
    expect(screen.getByText('Immigration expert specializing in visa applications.')).toBeInTheDocument();
  });

  it('renders the lowest priced service information', () => {
    render(<ExpertCard expert={mockExpert} />);
    expect(screen.getByText('30 min consultation')).toBeInTheDocument();
    expect(screen.getByText('From €75')).toBeInTheDocument();
  });

  it('renders a View Profile button with correct link', () => {
    render(<ExpertCard expert={mockExpert} />);
    const button = screen.getByRole('link', { name: /View Profile/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/consultations/1');
  });

  it('handles experts with no services gracefully', () => {
    const expertWithoutServices = { ...mockExpert, services: undefined };
    render(<ExpertCard expert={expertWithoutServices} />);
    expect(screen.queryByText(/min consultation/)).not.toBeInTheDocument();
    expect(screen.queryByText(/From €/)).not.toBeInTheDocument();
  });

  it('handles experts with no specializations gracefully', () => {
    const expertWithoutSpecializations = { ...mockExpert, specializations: undefined };
    render(<ExpertCard expert={expertWithoutSpecializations} />);
    expect(screen.queryByText('Work Permits')).not.toBeInTheDocument();
    expect(screen.queryByText('Skilled Worker Visas')).not.toBeInTheDocument();
  });

  it('handles experts with no bio gracefully', () => {
    const expertWithoutBio = { ...mockExpert, bio: undefined };
    render(<ExpertCard expert={expertWithoutBio} />);
    expect(screen.getByText('Immigration expert specializing in visa applications and legal consultations.')).toBeInTheDocument();
  });
});
