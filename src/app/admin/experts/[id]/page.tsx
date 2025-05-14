'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeftIcon, StarIcon, CheckCircleIcon, XCircleIcon, EditIcon, UserIcon, BriefcaseIcon, GraduationCapIcon, GlobeIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { UserRole } from '@/types/user';
import { ConsultationStatus } from '@/types/consultation';

// Mock expert data
const mockExpert = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.EXPERT,
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2023-06-20'),
  specializations: ['Work Permits', 'Skilled Worker Visas', 'Family Reunification'],
  rating: 4.8,
  reviewCount: 124,
  bio: 'Immigration lawyer with 10+ years of experience specializing in work permits and skilled worker visas.',
  isVerified: true,
  status: 'active' as const,
  lastActive: new Date('2023-07-01'),
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

// Mock consultations data
const mockConsultations = [
  {
    id: '1001',
    applicantName: 'Alice Johnson',
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
    applicantName: 'Bob Smith',
    scheduledAt: new Date(Date.now() - 86400000), // Yesterday
    duration: 60,
    status: ConsultationStatus.COMPLETED,
    title: 'Comprehensive Case Review',
    serviceName: 'Comprehensive Case Review',
    servicePrice: 150,
    serviceCurrency: '€',
  },
  {
    id: '1003',
    applicantName: 'Charlie Brown',
    scheduledAt: new Date(Date.now() + 7 * 86400000), // Next week
    duration: 45,
    status: ConsultationStatus.SCHEDULED,
    title: 'Document Preparation Assistance',
    serviceName: 'Document Preparation Assistance',
    servicePrice: 120,
    serviceCurrency: '€',
  },
  {
    id: '1004',
    applicantName: 'Diana Prince',
    scheduledAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
    duration: 30,
    status: ConsultationStatus.CANCELLED,
    title: 'Initial Consultation',
    serviceName: 'Initial Consultation',
    servicePrice: 75,
    serviceCurrency: '€',
  },
];

// Mock reviews data
const mockReviews = [
  {
    id: '2001',
    applicantName: 'Bob Smith',
    consultationId: '1002',
    rating: 5,
    comment: 'Excellent consultation! John was very knowledgeable and provided clear guidance for my case.',
    createdAt: new Date(Date.now() - 85400000), // Yesterday
  },
  {
    id: '2002',
    applicantName: 'Eva Garcia',
    consultationId: '1005',
    rating: 4,
    comment: 'Very helpful session. John answered all my questions and gave me a good understanding of the process.',
    createdAt: new Date(Date.now() - 10 * 86400000), // 10 days ago
  },
  {
    id: '2003',
    applicantName: 'Frank Miller',
    consultationId: '1006',
    rating: 5,
    comment: 'John is an expert in his field. He provided valuable insights that I hadn\'t considered before.',
    createdAt: new Date(Date.now() - 15 * 86400000), // 15 days ago
  },
];

export default function ExpertDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [expert, setExpert] = useState<typeof mockExpert | null>(null);
  const [consultations, setConsultations] = useState<typeof mockConsultations>([]);
  const [reviews, setReviews] = useState<typeof mockReviews>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  
  // Fetch expert data
  useEffect(() => {
    const fetchExpert = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll use mock data
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, we'll show the mock expert
        setExpert(mockExpert);
        setConsultations(mockConsultations);
        setReviews(mockReviews);
      } catch (error) {
        console.error('Error fetching expert:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpert();
  }, [params.id]);
  
  // Handle expert deactivation
  const handleDeactivateExpert = () => {
    // In a real implementation, this would call an API endpoint
    if (expert) {
      setExpert({
        ...expert,
        status: 'inactive',
      });
    }
    setShowDeactivateDialog(false);
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
  
  if (!expert) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-500 mb-4">Expert not found</p>
          <Button variant="outline" asChild>
            <Link href="/admin/experts">
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
          <Link href="/admin/experts">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Experts
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="relative h-32 w-32 rounded-full overflow-hidden">
                  <Image
                    src={`https://ui-avatars.com/api/?name=${expert.firstName}+${expert.lastName}&background=6366f1&color=fff&size=256`}
                    alt={`${expert.firstName} ${expert.lastName}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CardTitle className="text-2xl mr-2">
                      {expert.firstName} {expert.lastName}
                    </CardTitle>
                    {expert.isVerified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="font-medium">
                      {expert.rating || 'N/A'} ({expert.reviewCount || 0} reviews)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expert.specializations?.map((specialization, index) => (
                      <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div>{expert.email}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className={`${
                      expert.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : expert.status === 'pending'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {expert.status}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Bio</h3>
                <p className="text-gray-700">
                  {expert.bio || 'No bio available.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Experience</h3>
                  <ul className="space-y-3">
                    {expert.experience?.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <BriefcaseIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    )) || (
                      <li className="text-gray-500">No experience listed.</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Education</h3>
                  <ul className="space-y-3">
                    {expert.education?.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <GraduationCapIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    )) || (
                      <li className="text-gray-500">No education listed.</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.languages?.map((language, index) => (
                    <Badge key={index} variant="outline" className="flex items-center">
                      <GlobeIcon className="h-3 w-3 mr-1" />
                      {language}
                    </Badge>
                  )) || (
                    <span className="text-gray-500">No languages listed.</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 border-t pt-6">
              <Button variant="outline" asChild>
                <Link href={`/admin/experts/${expert.id}/edit`}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit Expert
                </Link>
              </Button>
              
              {expert.status === 'active' ? (
                <Button variant="destructive" onClick={() => setShowDeactivateDialog(true)}>
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Deactivate Expert
                </Button>
              ) : (
                <Button variant="default" onClick={() => setExpert({ ...expert, status: 'active' })}>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Activate Expert
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Services offered by this expert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expert.services?.map((service, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{service.duration} minutes</span>
                        </div>
                        <div className="font-medium text-lg text-indigo-700">
                          {service.currency}{service.price}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-gray-500">No services available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Tabs defaultValue="consultations" className="mb-6">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="consultations" className="flex-1">Consultations</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="consultations">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Consultations</CardTitle>
                  <CardDescription>
                    Consultations with this expert
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consultations.length > 0 ? (
                    <div className="space-y-4">
                      {consultations.map((consultation) => (
                        <div
                          key={consultation.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h3 className="font-medium">{consultation.title}</h3>
                              <p className="text-sm text-gray-500">with {consultation.applicantName}</p>
                              <div className="flex items-center mt-2 text-sm text-gray-600">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>
                                  {consultation.scheduledAt.toLocaleDateString()} at {consultation.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <Badge
                                variant="outline"
                                className={`${
                                  consultation.status === ConsultationStatus.CONFIRMED
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : consultation.status === ConsultationStatus.COMPLETED
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : consultation.status === ConsultationStatus.SCHEDULED
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : consultation.status === ConsultationStatus.CANCELLED
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {consultation.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No consultations found.</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/consultations?expertId=${expert.id}`}>
                      View All Consultations
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews</CardTitle>
                  <CardDescription>
                    Feedback from clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{review.applicantName}</div>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            {review.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No reviews found.</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/reviews?expertId=${expert.id}`}>
                      View All Reviews
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Account Created</div>
                  <div>{expert.createdAt.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div>{expert.updatedAt.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Active</div>
                  <div>{expert.lastActive?.toLocaleDateString() || 'Never'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Expert</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {expert.firstName} {expert.lastName}? This will prevent them from receiving new consultation bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateExpert}>
              Deactivate Expert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
