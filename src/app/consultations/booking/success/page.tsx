'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  
  // Mock consultation data for demo
  const mockConsultation = {
    id: '1001',
    expertId: '1',
    expertName: 'John Doe',
    scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
    duration: 30,
    title: 'Initial Consultation',
    serviceName: 'Initial Consultation',
    servicePrice: 75,
    serviceCurrency: '€',
  };
  
  // In a real implementation, you would fetch the consultation details from the API
  // based on the consultation ID passed in the URL
  
  // Redirect to consultations page if not a valid booking success
  useEffect(() => {
    if (!isDemo) {
      const consultationId = searchParams.get('id');
      if (!consultationId) {
        router.push('/consultations');
      }
    }
  }, [isDemo, router, searchParams]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>
              Your consultation has been successfully booked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t border-b border-gray-200 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Consultation</div>
                  <div className="font-medium">{mockConsultation.title}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Expert</div>
                  <div className="font-medium">{mockConsultation.expertName}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{format(mockConsultation.scheduledAt, 'EEEE, MMMM d, yyyy')}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Time</div>
                  <div className="font-medium">{format(mockConsultation.scheduledAt, 'h:mm a')} ({mockConsultation.duration} minutes)</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Service</div>
                  <div className="font-medium">{mockConsultation.serviceName}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="font-medium">{mockConsultation.serviceCurrency}{mockConsultation.servicePrice}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">What's Next?</h3>
              <ul className="space-y-3 text-blue-700">
                <li className="flex items-start">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>You'll receive a calendar invitation by email</span>
                </li>
                <li className="flex items-start">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>You can join the consultation 15 minutes before the scheduled time</span>
                </li>
                <li className="flex items-start">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Prepare any questions or documents you want to discuss</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href={`/consultations/${mockConsultation.id}`}>
                View Consultation Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/consultations">
                Back to Consultations
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
