/**
 * API endpoint for consultation feedback
 * 
 * POST /api/consultations/[id]/feedback - Submit feedback for a consultation
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ConsultationStatus } from '@/types/consultation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
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
    if (!body.rating || !body.feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: rating, feedback' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would:
    // 1. Verify that the user has permission to submit feedback for this consultation
    // 2. Verify that the consultation is completed
    // 3. Save the feedback in the database
    // 4. Update the expert's rating
    // 5. Send notifications
    
    // Mock consultation data
    const mockConsultation = {
      id: consultationId,
      expertId: '1',
      expertName: 'John Doe',
      applicantId: session.user.id,
      applicantName: 'Current User',
      scheduledAt: new Date(Date.now() - 86400000), // Yesterday
      duration: 30,
      status: ConsultationStatus.COMPLETED,
      title: 'Initial Consultation',
      serviceName: 'Initial Consultation',
      servicePrice: 75,
      serviceCurrency: '€',
    };
    
    // Check if user has permission to submit feedback
    if (mockConsultation.applicantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if consultation is completed
    if (mockConsultation.status !== ConsultationStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Feedback can only be submitted for completed consultations' },
        { status: 400 }
      );
    }
    
    // Create mock feedback
    const feedback = {
      id: uuidv4(),
      consultationId,
      userId: session.user.id,
      rating: parseInt(body.rating),
      feedback: body.feedback,
      wasHelpful: body.wasHelpful || false,
      wouldRecommend: body.wouldRecommend || false,
      followUpNeeded: body.followUpNeeded || false,
      createdAt: new Date(),
    };
    
    return NextResponse.json(
      { feedback },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
