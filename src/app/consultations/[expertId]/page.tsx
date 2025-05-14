'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeftIcon } from 'lucide-react';
import ExpertProfile from '@/components/consultation/ExpertProfile';
import AvailabilityCalendar from '@/components/consultation/AvailabilityCalendar';
import BookingForm from '@/components/consultation/BookingForm';
import { User, UserRole } from '@/types/user';
import { AvailabilitySlot, ExpertService } from '@/types/consultation';

// Mock expert data
const mockExpert: User & {
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  bio?: string;
  experience?: string[];
  education?: string[];
  languages?: string[];
  services?: ExpertService[];
} = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.EXPERT,
  createdAt: new Date(),
  updatedAt: new Date(),
  specializations: ['Work Permits', 'Skilled Worker Visas', 'Family Reunification'],
  rating: 4.8,
  reviewCount: 124,
  bio: 'Immigration lawyer with 10+ years of experience specializing in work permits and skilled worker visas. I have helped hundreds of clients successfully navigate the Irish immigration system.',
  experience: [
    'Senior Immigration Consultant at Dublin Legal Partners (2018-Present)',
    'Immigration Specialist at Global Mobility Solutions (2013-2018)',
    'Legal Advisor at Irish Immigration Services (2010-2013)',
  ],
  education: [
    'Master of Laws (LLM) in Immigration Law, University College Dublin',
    'Bachelor of Laws (LLB), Trinity College Dublin',
    'Certified Immigration Law Specialist',
  ],
  languages: ['English', 'Irish', 'Spanish'],
  services: [
    {
      id: '101',
      expertId: '1',
      name: 'Initial Consultation',
      description: 'A 30-minute consultation to discuss your immigration needs and options.',
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
      description: 'A detailed review of your immigration case with personalized recommendations.',
      duration: 60,
      price: 150,
      currency: '€',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '103',
      expertId: '1',
      name: 'Document Preparation Assistance',
      description: 'Guidance on preparing and organizing your immigration documents.',
      duration: 45,
      price: 120,
      currency: '€',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

// Mock user cases
const mockCases = [
  { id: '1', title: 'Work Permit Application' },
  { id: '2', title: 'Family Reunification' },
];

export default function ExpertProfilePage({ params }: { params: { expertId: string } }) {
  const router = useRouter();
  const [expert, setExpert] = useState<typeof mockExpert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingStep, setBookingStep] = useState<'calendar' | 'form'>('calendar');
  const [cases, setCases] = useState(mockCases);
  
  // Fetch expert data
  useEffect(() => {
    const fetchExpert = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll use mock data
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if expert exists
        if (params.expertId === '1') {
          setExpert(mockExpert);
        } else {
          // For demo purposes, we'll still show the mock expert
          setExpert({
            ...mockExpert,
            id: params.expertId,
          });
        }
      } catch (err) {
        console.error('Error fetching expert:', err);
        setError('Failed to load expert profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpert();
  }, [params.expertId]);
  
  // Handle slot selection
  const handleSelectSlot = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
  };
  
  // Proceed to booking form
  const handleProceedToBooking = () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }
    
    setBookingStep('form');
  };
  
  // Go back to calendar
  const handleBackToCalendar = () => {
    setBookingStep('calendar');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  if (error || !expert) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-500 mb-4">{error || 'Expert not found'}</p>
          <Button variant="outline" asChild>
            <Link href="/consultations">
              Back to Experts
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/consultations">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Experts
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpertProfile expert={expert} />
        </div>
        
        <div>
          {bookingStep === 'calendar' ? (
            <div className="space-y-4">
              <AvailabilityCalendar
                expertId={expert.id}
                onSelectSlot={handleSelectSlot}
                selectedSlot={selectedSlot || undefined}
              />
              
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!selectedSlot}
                onClick={handleProceedToBooking}
              >
                {selectedSlot ? 'Proceed to Booking' : 'Select a Time Slot'}
              </Button>
            </div>
          ) : (
            <BookingForm
              expertId={expert.id}
              selectedSlot={selectedSlot!}
              services={expert.services || []}
              cases={cases}
              onBack={handleBackToCalendar}
            />
          )}
        </div>
      </div>
    </div>
  );
}
