'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeftIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import VideoConference from '@/components/consultation/VideoConference';
import { ConsultationStatus } from '@/types/consultation';
import { format, differenceInMinutes } from 'date-fns';

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
  meetingId: '123456789',
  meetingPassword: '123456',
  serviceName: 'Initial Consultation',
  servicePrice: 75,
  serviceCurrency: '€',
};

export default function JoinConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [consultation, setConsultation] = useState<typeof mockConsultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);
  
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
        // and times based on the ID to demonstrate different states
        let status = ConsultationStatus.CONFIRMED;
        let scheduledAt = new Date(Date.now() + 86400000); // Tomorrow
        
        // For demo purposes, set the consultation to start soon or be in progress
        if (params.id.endsWith('4')) {
          status = ConsultationStatus.IN_PROGRESS;
          scheduledAt = new Date(Date.now() - 15 * 60000); // Started 15 minutes ago
        } else if (params.id.endsWith('5')) {
          scheduledAt = new Date(Date.now() + 15 * 60000); // Starts in 15 minutes
        } else if (params.id.endsWith('6')) {
          scheduledAt = new Date(Date.now() + 5 * 60000); // Starts in 5 minutes
        } else if (params.id.endsWith('7')) {
          scheduledAt = new Date(Date.now() - 5 * 60000); // Started 5 minutes ago
          status = ConsultationStatus.IN_PROGRESS;
        } else if (params.id.endsWith('8')) {
          status = ConsultationStatus.COMPLETED;
          scheduledAt = new Date(Date.now() - 24 * 60 * 60000); // Yesterday
        } else if (params.id.endsWith('9')) {
          status = ConsultationStatus.CANCELLED;
          scheduledAt = new Date(Date.now() - 24 * 60 * 60000); // Yesterday
        }
        
        setConsultation({
          ...mockConsultation,
          id: params.id,
          status,
          scheduledAt,
        });
        
        // Calculate time until start
        if (scheduledAt > new Date()) {
          setTimeUntilStart(differenceInMinutes(scheduledAt, new Date()));
        } else {
          setTimeUntilStart(null);
        }
      } catch (err) {
        console.error('Error fetching consultation:', err);
        setError('Failed to load consultation details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsultation();
    
    // Update time until start every minute
    const interval = setInterval(() => {
      if (consultation?.scheduledAt && consultation.scheduledAt > new Date()) {
        setTimeUntilStart(differenceInMinutes(consultation.scheduledAt, new Date()));
      } else {
        setTimeUntilStart(null);
        clearInterval(interval);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [params.id]);
  
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
  
  const canJoin = consultation.status === ConsultationStatus.CONFIRMED || consultation.status === ConsultationStatus.IN_PROGRESS;
  const isPast = consultation.status === ConsultationStatus.COMPLETED || consultation.status === ConsultationStatus.CANCELLED;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/consultations/${consultation.id}`}>
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Consultation Details
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold">Join Consultation</h1>
      </div>
      
      {isPast && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Consultation Unavailable</AlertTitle>
          <AlertDescription>
            This consultation has already ended or been cancelled. You cannot join it anymore.
          </AlertDescription>
        </Alert>
      )}
      
      {timeUntilStart !== null && timeUntilStart > 15 && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <ClockIcon className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Consultation Not Started Yet</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your consultation is scheduled for {format(consultation.scheduledAt, 'EEEE, MMMM d, yyyy')} at {format(consultation.scheduledAt, 'h:mm a')}.
            You can join the meeting 15 minutes before the scheduled time.
          </AlertDescription>
        </Alert>
      )}
      
      {timeUntilStart !== null && timeUntilStart <= 15 && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Consultation Starting Soon</AlertTitle>
          <AlertDescription className="text-green-700">
            Your consultation will start in approximately {timeUntilStart} minutes.
            You can join the meeting now to test your audio and video.
          </AlertDescription>
        </Alert>
      )}
      
      {consultation.status === ConsultationStatus.IN_PROGRESS && (
        <Alert className="mb-6 bg-indigo-50 border-indigo-200">
          <CheckCircleIcon className="h-4 w-4 text-indigo-600" />
          <AlertTitle className="text-indigo-800">Consultation In Progress</AlertTitle>
          <AlertDescription className="text-indigo-700">
            Your consultation with {consultation.expertName} is currently in progress.
            Join now to participate.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {canJoin ? (
            <VideoConference
              consultationId={consultation.id}
              meetingDetails={{
                meetingUrl: consultation.meetingUrl,
                meetingId: consultation.meetingId,
                meetingPassword: consultation.meetingPassword,
                startTime: consultation.scheduledAt,
                duration: consultation.duration,
              }}
              expertName={consultation.expertName}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Consultation Unavailable</CardTitle>
                <CardDescription>
                  You cannot join this consultation at the moment
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                {isPast ? (
                  <div className="text-center">
                    <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      This consultation has already ended or been cancelled.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ClockIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Your consultation is scheduled for {format(consultation.scheduledAt, 'EEEE, MMMM d, yyyy')} at {format(consultation.scheduledAt, 'h:mm a')}.
                      You can join the meeting 15 minutes before the scheduled time.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link href={`/consultations/${consultation.id}`}>
                    Back to Consultation Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Consultation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                <p>{consultation.title}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Expert</h3>
                <p>{consultation.expertName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p>{format(consultation.scheduledAt, 'EEEE, MMMM d, yyyy')} at {format(consultation.scheduledAt, 'h:mm a')}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p>{consultation.duration} minutes</p>
              </div>
              
              {consultation.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-sm">{consultation.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Technical Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full p-1 mr-2">✓</span>
                  <span>Stable internet connection</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full p-1 mr-2">✓</span>
                  <span>Working microphone and speakers</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full p-1 mr-2">✓</span>
                  <span>Webcam (recommended)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full p-1 mr-2">✓</span>
                  <span>Updated browser (Chrome, Firefox, Safari)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full p-1 mr-2">✓</span>
                  <span>Quiet environment for the call</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
