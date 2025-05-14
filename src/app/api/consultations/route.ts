/**
 * API endpoint for consultations
 * 
 * GET /api/consultations - Get consultations for the authenticated user
 * POST /api/consultations - Create a new consultation
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ConsultationStatus } from '@/types/consultation';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // In a real implementation, this would call a service to get consultations
    // For now, we'll return mock data
    
    // Generate mock consultations
    const mockConsultations = [
      {
        id: '1001',
        expertId: '1',
        expertName: 'John Doe',
        applicantId: session.user.id,
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        duration: 30,
        status: ConsultationStatus.CONFIRMED,
        title: 'Initial Consultation',
        serviceName: 'Initial Consultation',
        servicePrice: 75,
        serviceCurrency: '€',
      },
      {
        id: '1002',
        expertId: '2',
        expertName: 'Jane Smith',
        applicantId: session.user.id,
        scheduledAt: new Date(Date.now() - 86400000), // Yesterday
        duration: 45,
        status: ConsultationStatus.COMPLETED,
        title: 'Student Visa Consultation',
        serviceName: 'Student Visa Consultation',
        servicePrice: 90,
        serviceCurrency: '€',
      },
    ];
    
    // Filter by status if provided
    let filteredConsultations = mockConsultations;
    if (status) {
      filteredConsultations = mockConsultations.filter(
        consultation => consultation.status === status
      );
    }
    
    // Apply pagination
    const paginatedConsultations = filteredConsultations.slice(offset, offset + limit);
    
    return NextResponse.json({
      consultations: paginatedConsultations,
      total: filteredConsultations.length,
    });
  } catch (error: any) {
    console.error('Error getting consultations:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get consultations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.expertId || !body.scheduledAt || !body.serviceId) {
      return NextResponse.json(
        { error: 'Missing required fields: expertId, scheduledAt, serviceId' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would:
    // 1. Verify that the expert is available at the requested time
    // 2. Verify that the service exists and belongs to the expert
    // 3. Create the consultation in the database
    // 4. Process payment
    // 5. Send confirmation emails
    // 6. Create calendar events
    
    // For now, we'll just return a mock response
    const consultationId = uuidv4();
    
    // Mock service data (in a real implementation, this would come from the database)
    const mockService = {
      id: body.serviceId,
      name: 'Initial Consultation',
      description: 'A 30-minute consultation to discuss your immigration needs and options.',
      duration: 30,
      price: 75,
      currency: '€',
    };
    
    // Mock expert data (in a real implementation, this would come from the database)
    const mockExpert = {
      id: body.expertId,
      firstName: 'John',
      lastName: 'Doe',
    };
    
    // Create mock consultation
    const consultation = {
      id: consultationId,
      expertId: body.expertId,
      expertName: `${mockExpert.firstName} ${mockExpert.lastName}`,
      applicantId: session.user.id,
      scheduledAt: new Date(body.scheduledAt),
      duration: mockService.duration,
      status: ConsultationStatus.CONFIRMED,
      title: mockService.name,
      description: mockService.description,
      serviceName: mockService.name,
      servicePrice: mockService.price,
      serviceCurrency: mockService.currency,
      caseId: body.caseId || null,
      notes: body.notes || null,
      createdAt: new Date(),
    };
    
    return NextResponse.json(
      { consultation },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating consultation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create consultation' },
      { status: 500 }
    );
  }
}
