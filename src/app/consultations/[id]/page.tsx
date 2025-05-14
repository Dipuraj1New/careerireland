'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';
import ConsultationSummary from '@/components/consultation/ConsultationSummary';
import FeedbackForm from '@/components/consultation/FeedbackForm';
import { ConsultationStatus } from '@/types/consultation';

// Mock consultation data
const mockConsultation = {
  id: '1001',
  expertId: '1',
  expertName: 'John Doe',
  applicantId: 'user123',
  applicantName: 'Current User',
  scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
  duration: 30,
  status: ConsultationStatus.CONFIRMED,
  title: 'Initial Consultation',
  description: 'A 30-minute consultation to discuss your immigration needs and options.',
  meetingUrl: 'https://zoom.us/j/123456789',
  serviceName: 'Initial Consultation',
  servicePrice: 75,
  serviceCurrency: '€',
  caseId: '1',
  caseTitle: 'Work Permit Application',
};

export default function ConsultationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [consultation, setConsultation] = useState<typeof mockConsultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Fetch consultation data
  useEffect(() => {
    const fetchConsultation = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll use mock data
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, we'll show the mock consultation with different statuses
        // based on the ID to demonstrate different states
        let status = ConsultationStatus.CONFIRMED;
        
        if (params.id.endsWith('2')) {
          status = ConsultationStatus.COMPLETED;
        } else if (params.id.endsWith('3')) {
          status = ConsultationStatus.CANCELLED;
        } else if (params.id.endsWith('4')) {
          status = ConsultationStatus.IN_PROGRESS;
        } else if (params.id.endsWith('5')) {
          status = ConsultationStatus.SCHEDULED;
        } else if (params.id.endsWith('6')) {
          status = ConsultationStatus.NO_SHOW;
        }
        
        setConsultation({
          ...mockConsultation,
          id: params.id,
          status,
          // For completed consultations, add recording and transcript
          ...(status === ConsultationStatus.COMPLETED ? {
            recordingUrl: 'https://example.com/recording',
            transcriptUrl: 'https://example.com/transcript',
            notes: 'Discussed work permit requirements and application process. Recommended gathering additional documentation for stronger application.',
          } : {}),
          // For past consultations, set the date to yesterday
          ...(status === ConsultationStatus.COMPLETED || status === ConsultationStatus.CANCELLED || status === ConsultationStatus.NO_SHOW ? {
            scheduledAt: new Date(Date.now() - 86400000),
          } : {}),
        });
      } catch (err) {
        console.error('Error fetching consultation:', err);
        setError('Failed to load consultation details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsultation();
  }, [params.id]);
  
  // Handle feedback submission
  const handleFeedbackSubmitted = () => {
    setShowFeedback(false);
    // In a real implementation, you might want to refresh the consultation data
    // to show that feedback has been submitted
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
  
  if (error || !consultation) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-500 mb-4">{error || 'Consultation not found'}</p>
          <Button variant="outline" asChild>
            <Link href="/consultations">
              Back to Consultations
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const isPastConsultation = [
    ConsultationStatus.COMPLETED,
    ConsultationStatus.CANCELLED,
    ConsultationStatus.NO_SHOW
  ].includes(consultation.status);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/consultations">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Consultations
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold">Consultation Details</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsultationSummary consultation={consultation} />
          
          {consultation.status === ConsultationStatus.COMPLETED && !showFeedback && (
            <div className="mt-6">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setShowFeedback(true)}
              >
                Provide Feedback
              </Button>
            </div>
          )}
        </div>
        
        <div>
          {showFeedback ? (
            <FeedbackForm
              consultationId={consultation.id}
              expertName={consultation.expertName}
              onSubmitSuccess={handleFeedbackSubmitted}
            />
          ) : isPastConsultation ? (
            <div className="space-y-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Need Further Assistance?</h2>
                <p className="text-gray-600 mb-4">
                  If you need additional help with your immigration case, you can book another consultation with {consultation.expertName} or explore other experts.
                </p>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    asChild
                  >
                    <Link href={`/consultations/${consultation.expertId}`}>
                      Book Again with {consultation.expertName}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href="/consultations">
                      Explore Other Experts
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Preparing for Your Consultation</h2>
                <p className="text-gray-600 mb-4">
                  To make the most of your consultation with {consultation.expertName}, please prepare the following:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Have your identification documents ready</li>
                  <li>Prepare a list of questions you want to ask</li>
                  <li>Gather any relevant immigration documents</li>
                  <li>Be ready to discuss your specific immigration goals</li>
                </ul>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/consultations/${consultation.id}/join`}>
                      Test Your Connection
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
