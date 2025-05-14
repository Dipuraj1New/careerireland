/**
 * API endpoint for a specific consultation
 * 
 * GET /api/consultations/[id] - Get consultation details
 * PATCH /api/consultations/[id] - Update consultation status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ConsultationStatus } from '@/types/consultation';
import { UserRole } from '@/types/user';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const consultationId = params.id;
    
    // In a real implementation, this would call a service to get the consultation
    // For now, we'll return mock data
    
    // Mock consultation data
    const mockConsultation = {
      id: consultationId,
      expertId: '1',
      expertName: 'John Doe',
      applicantId: session.user.id,
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
      caseId: '1',
      caseTitle: 'Work Permit Application',
      createdAt: new Date(Date.now() - 7 * 86400000), // 7 days ago
    };
    
    // Check if user has access to the consultation
    // Applicants can only access their own consultations
    // Experts can only access consultations they are part of
    // Admins can access all consultations
    if (
      session.user.role === UserRole.APPLICANT && mockConsultation.applicantId !== session.user.id ||
      session.user.role === UserRole.EXPERT && mockConsultation.expertId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ consultation: mockConsultation });
  } catch (error: any) {
    console.error('Error getting consultation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get consultation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const consultationId = params.id;
    
    // Get request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!Object.values(ConsultationStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would:
    // 1. Verify that the user has permission to update the consultation
    // 2. Verify that the status transition is valid
    // 3. Update the consultation in the database
    // 4. Send notifications
    
    // Mock consultation data
    const mockConsultation = {
      id: consultationId,
      expertId: '1',
      expertName: 'John Doe',
      applicantId: 'user123',
      applicantName: 'Current User',
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      duration: 30,
      status: body.status,
      title: 'Initial Consultation',
      description: 'A 30-minute consultation to discuss your immigration needs and options.',
      meetingUrl: 'https://zoom.us/j/123456789',
      meetingId: '123456789',
      meetingPassword: '123456',
      serviceName: 'Initial Consultation',
      servicePrice: 75,
      serviceCurrency: '€',
      caseId: '1',
      caseTitle: 'Work Permit Application',
      createdAt: new Date(Date.now() - 7 * 86400000), // 7 days ago
      updatedAt: new Date(),
    };
    
    return NextResponse.json({ consultation: mockConsultation });
  } catch (error: any) {
    console.error('Error updating consultation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update consultation' },
      { status: 500 }
    );
  }
}
