'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, ClockIcon, FileTextIcon, UserIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import { ConsultationStatus } from '@/types/consultation';

interface ConsultationSummaryProps {
  consultation: {
    id: string;
    expertId: string;
    expertName: string;
    applicantId: string;
    applicantName: string;
    scheduledAt: Date;
    duration: number;
    status: ConsultationStatus;
    title: string;
    description?: string;
    meetingUrl?: string;
    recordingUrl?: string;
    transcriptUrl?: string;
    notes?: string;
    caseId?: string;
    caseTitle?: string;
    serviceName: string;
    servicePrice: number;
    serviceCurrency: string;
  };
}

export default function ConsultationSummary({ consultation }: ConsultationSummaryProps) {
  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case ConsultationStatus.SCHEDULED:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case ConsultationStatus.CONFIRMED:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case ConsultationStatus.IN_PROGRESS:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case ConsultationStatus.COMPLETED:
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Completed</Badge>;
      case ConsultationStatus.CANCELLED:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case ConsultationStatus.NO_SHOW:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">No Show</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const isUpcoming = [ConsultationStatus.SCHEDULED, ConsultationStatus.CONFIRMED].includes(consultation.status);
  const isPast = [ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED, ConsultationStatus.NO_SHOW].includes(consultation.status);
  const canJoin = consultation.status === ConsultationStatus.CONFIRMED || consultation.status === ConsultationStatus.IN_PROGRESS;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{consultation.title || 'Consultation'}</CardTitle>
            <CardDescription>
              with {consultation.expertName}
            </CardDescription>
          </div>
          {getStatusBadge(consultation.status)}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="resources" disabled={!isPast}>Resources</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-indigo-600 mr-2" />
                  <span>{format(consultation.scheduledAt, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-indigo-600 mr-2" />
                  <span>{format(consultation.scheduledAt, 'h:mm a')} ({consultation.duration} minutes)</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Service</h3>
                <div className="flex items-start">
                  <FileTextIcon className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                  <div>
                    <div>{consultation.serviceName}</div>
                    <div className="text-sm text-gray-500">
                      {consultation.serviceCurrency}{consultation.servicePrice}
                    </div>
                  </div>
                </div>
              </div>
              
              {consultation.caseId && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Related Case</h3>
                  <div className="flex items-center">
                    <FileTextIcon className="h-4 w-4 text-indigo-600 mr-2" />
                    <Link href={`/cases/${consultation.caseId}`} className="text-indigo-600 hover:underline">
                      {consultation.caseTitle || 'View Case'}
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Expert</h3>
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-indigo-600 mr-2" />
                  <Link href={`/consultations/${consultation.expertId}`} className="text-indigo-600 hover:underline">
                    {consultation.expertName}
                  </Link>
                </div>
              </div>
            </div>
            
            {consultation.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-700">{consultation.description}</p>
              </div>
            )}
            
            {isUpcoming && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <AlertCircleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">Upcoming Consultation</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Your consultation is scheduled for {format(consultation.scheduledAt, 'EEEE, MMMM d, yyyy')} at {format(consultation.scheduledAt, 'h:mm a')}.
                      {canJoin ? ' You can join the meeting when it\'s time.' : ' The meeting link will be available once the consultation is confirmed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isPast && consultation.status === ConsultationStatus.COMPLETED && (
              <div className="mt-6 p-4 bg-green-50 rounded-md">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-800">Consultation Completed</h3>
                    <p className="text-green-700 text-sm mt-1">
                      Your consultation was completed on {format(consultation.scheduledAt, 'MMMM d, yyyy')} at {format(consultation.scheduledAt, 'h:mm a')}.
                      {consultation.recordingUrl && ' You can access the recording and transcript in the Resources tab.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isPast && consultation.status === ConsultationStatus.CANCELLED && (
              <div className="mt-6 p-4 bg-red-50 rounded-md">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Consultation Cancelled</h3>
                    <p className="text-red-700 text-sm mt-1">
                      This consultation was cancelled. If you need to reschedule, please book a new consultation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-4">
            {consultation.recordingUrl ? (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Recording</h3>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <FileTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <Button variant="outline" asChild>
                      <a href={consultation.recordingUrl} target="_blank" rel="noopener noreferrer">
                        View Recording
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No resources available for this consultation
              </div>
            )}
            
            {consultation.transcriptUrl && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Transcript</h3>
                <Button variant="outline" asChild className="w-full">
                  <a href={consultation.transcriptUrl} target="_blank" rel="noopener noreferrer">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Download Transcript
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            {consultation.notes ? (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Consultation Notes</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-700 whitespace-pre-line">{consultation.notes}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No notes available for this consultation
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/consultations">
            Back to Consultations
          </Link>
        </Button>
        
        {canJoin && consultation.meetingUrl && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link href={`/consultations/${consultation.id}/join`}>
              Join Meeting
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
