'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchIcon, FilterIcon, CalendarIcon } from 'lucide-react';
import ExpertCard from '@/components/consultation/ExpertCard';
import { User, UserRole } from '@/types/user';
import { ExpertService, ConsultationStatus } from '@/types/consultation';

// Mock data for experts
const mockExperts: (User & {
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  bio?: string;
  services?: ExpertService[];
})[] = [
  {
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
    bio: 'Immigration lawyer with 10+ years of experience specializing in work permits and skilled worker visas.',
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
    ],
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.EXPERT,
    createdAt: new Date(),
    updatedAt: new Date(),
    specializations: ['Student Visas', 'Citizenship Applications', 'Permanent Residency'],
    rating: 4.9,
    reviewCount: 87,
    bio: 'Specialized in student visas and citizenship applications with a focus on Irish immigration law.',
    services: [
      {
        id: '201',
        expertId: '2',
        name: 'Student Visa Consultation',
        description: 'Guidance on student visa applications and requirements.',
        duration: 45,
        price: 90,
        currency: '€',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '202',
        expertId: '2',
        name: 'Citizenship Application Review',
        description: 'Detailed review of your citizenship application documents.',
        duration: 60,
        price: 120,
        currency: '€',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: '3',
    email: 'michael.johnson@example.com',
    firstName: 'Michael',
    lastName: 'Johnson',
    role: UserRole.EXPERT,
    createdAt: new Date(),
    updatedAt: new Date(),
    specializations: ['Business Visas', 'Investor Programs', 'Corporate Immigration'],
    rating: 4.7,
    reviewCount: 56,
    bio: 'Expert in business immigration with experience helping companies relocate employees to Ireland.',
    services: [
      {
        id: '301',
        expertId: '3',
        name: 'Business Visa Strategy',
        description: 'Strategic consultation for business visa applications.',
        duration: 60,
        price: 180,
        currency: '€',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '302',
        expertId: '3',
        name: 'Investor Program Guidance',
        description: 'Comprehensive guidance on investor immigration programs.',
        duration: 90,
        price: 250,
        currency: '€',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
];

// Mock data for user consultations
const mockConsultations = [
  {
    id: '1001',
    expertId: '1',
    expertName: 'John Doe',
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
    scheduledAt: new Date(Date.now() - 86400000), // Yesterday
    duration: 45,
    status: ConsultationStatus.COMPLETED,
    title: 'Student Visa Consultation',
    serviceName: 'Student Visa Consultation',
    servicePrice: 90,
    serviceCurrency: '€',
  },
];

export default function ConsultationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experts, setExperts] = useState(mockExperts);
  const [filteredExperts, setFilteredExperts] = useState(mockExperts);
  const [userConsultations, setUserConsultations] = useState(mockConsultations);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filter experts based on search term and specialization
  useEffect(() => {
    let filtered = experts;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expert => 
        expert.firstName.toLowerCase().includes(term) ||
        expert.lastName.toLowerCase().includes(term) ||
        expert.bio?.toLowerCase().includes(term) ||
        expert.specializations?.some(spec => spec.toLowerCase().includes(term))
      );
    }
    
    if (specialization) {
      filtered = filtered.filter(expert => 
        expert.specializations?.includes(specialization)
      );
    }
    
    setFilteredExperts(filtered);
  }, [experts, searchTerm, specialization]);
  
  // Get all unique specializations from experts
  const allSpecializations = Array.from(
    new Set(experts.flatMap(expert => expert.specializations || []))
  ).sort();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Expert Consultations</h1>
      
      <Tabs defaultValue="experts" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="experts">Find Experts</TabsTrigger>
          <TabsTrigger value="my-consultations">My Consultations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="experts">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search experts by name or specialization..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Specializations</SelectItem>
                  {allSpecializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {specialization && (
              <div className="flex items-center mb-4">
                <span className="text-sm text-gray-500 mr-2">Filtered by:</span>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  {specialization}
                  <button
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    onClick={() => setSpecialization('')}
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredExperts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No experts found matching your criteria</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSpecialization(''); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-consultations">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : userConsultations.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium mb-4">Your Consultations</h2>
              
              {userConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{consultation.title}</h3>
                      <p className="text-gray-500">with {consultation.expertName}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>
                          {new Date(consultation.scheduledAt).toLocaleDateString()} at {new Date(consultation.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className={`mr-4 ${
                          consultation.status === ConsultationStatus.CONFIRMED
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : consultation.status === ConsultationStatus.COMPLETED
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {consultation.status}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/consultations/${consultation.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">You don't have any consultations yet</p>
              <Button onClick={() => document.querySelector('[data-value="experts"]')?.click()}>
                Find an Expert
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
