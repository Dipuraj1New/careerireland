'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SearchIcon, PlusIcon, FilterIcon, CheckCircleIcon, XCircleIcon, MoreHorizontalIcon, StarIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, UserRole } from '@/types/user';

// Mock data for experts
const mockExperts: (User & {
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  bio?: string;
  isVerified?: boolean;
  status?: 'active' | 'pending' | 'inactive';
  lastActive?: Date;
})[] = [
  {
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
    status: 'active',
    lastActive: new Date('2023-07-01'),
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.EXPERT,
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-06-15'),
    specializations: ['Student Visas', 'Citizenship Applications', 'Permanent Residency'],
    rating: 4.9,
    reviewCount: 87,
    bio: 'Specialized in student visas and citizenship applications with a focus on Irish immigration law.',
    isVerified: true,
    status: 'active',
    lastActive: new Date('2023-06-28'),
  },
  {
    id: '3',
    email: 'michael.johnson@example.com',
    firstName: 'Michael',
    lastName: 'Johnson',
    role: UserRole.EXPERT,
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-05-20'),
    specializations: ['Business Visas', 'Investor Programs', 'Corporate Immigration'],
    rating: 4.7,
    reviewCount: 56,
    bio: 'Expert in business immigration with experience helping companies relocate employees to Ireland.',
    isVerified: true,
    status: 'active',
    lastActive: new Date('2023-06-25'),
  },
  {
    id: '4',
    email: 'sarah.williams@example.com',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: UserRole.EXPERT,
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2023-06-10'),
    specializations: ['Family Visas', 'Spousal Visas', 'Dependent Visas'],
    rating: 4.5,
    reviewCount: 23,
    bio: 'Specializing in family-based immigration with a focus on reunification.',
    isVerified: false,
    status: 'pending',
    lastActive: new Date('2023-06-10'),
  },
  {
    id: '5',
    email: 'robert.brown@example.com',
    firstName: 'Robert',
    lastName: 'Brown',
    role: UserRole.EXPERT,
    createdAt: new Date('2023-04-15'),
    updatedAt: new Date('2023-06-05'),
    specializations: ['Asylum', 'Refugee Status', 'Humanitarian Visas'],
    rating: 4.6,
    reviewCount: 42,
    bio: 'Dedicated to helping asylum seekers and refugees navigate the immigration system.',
    isVerified: true,
    status: 'inactive',
    lastActive: new Date('2023-05-15'),
  },
];

export default function ExpertManagementPage() {
  const router = useRouter();
  const [experts, setExperts] = useState(mockExperts);
  const [filteredExperts, setFilteredExperts] = useState(mockExperts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedExpert, setSelectedExpert] = useState<typeof mockExperts[0] | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filter experts based on search term and filters
  useEffect(() => {
    let filtered = experts;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expert => 
        expert.firstName.toLowerCase().includes(term) ||
        expert.lastName.toLowerCase().includes(term) ||
        expert.email.toLowerCase().includes(term) ||
        expert.specializations?.some(spec => spec.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(expert => expert.status === statusFilter);
    }
    
    if (verificationFilter) {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(expert => expert.isVerified);
      } else if (verificationFilter === 'unverified') {
        filtered = filtered.filter(expert => !expert.isVerified);
      }
    }
    
    setFilteredExperts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [experts, searchTerm, statusFilter, verificationFilter]);
  
  // Get current experts for pagination
  const indexOfLastExpert = currentPage * itemsPerPage;
  const indexOfFirstExpert = indexOfLastExpert - itemsPerPage;
  const currentExperts = filteredExperts.slice(indexOfFirstExpert, indexOfLastExpert);
  const totalPages = Math.ceil(filteredExperts.length / itemsPerPage);
  
  // Handle expert verification
  const handleVerifyExpert = (expert: typeof mockExperts[0]) => {
    setSelectedExpert(expert);
    setShowVerifyDialog(true);
  };
  
  const confirmVerification = () => {
    if (selectedExpert) {
      // In a real implementation, this would call an API endpoint
      const updatedExperts = experts.map(expert => 
        expert.id === selectedExpert.id 
          ? { ...expert, isVerified: true, status: 'active' as const } 
          : expert
      );
      
      setExperts(updatedExperts);
      setShowVerifyDialog(false);
      setSelectedExpert(null);
    }
  };
  
  // Handle expert status change
  const handleStatusChange = (expertId: string, newStatus: 'active' | 'pending' | 'inactive') => {
    // In a real implementation, this would call an API endpoint
    const updatedExperts = experts.map(expert => 
      expert.id === expertId 
        ? { ...expert, status: newStatus } 
        : expert
    );
    
    setExperts(updatedExperts);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expert Management</h1>
          <p className="text-gray-500">Manage and monitor immigration experts</p>
        </div>
        
        <Button asChild>
          <Link href="/admin/experts/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Expert
          </Link>
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search experts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredExperts.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentExperts.map((expert) => (
                    <TableRow key={expert.id}>
                      <TableCell className="font-medium">
                        {expert.firstName} {expert.lastName}
                      </TableCell>
                      <TableCell>{expert.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {expert.specializations?.slice(0, 2).map((spec, index) => (
                            <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {spec}
                            </Badge>
                          ))}
                          {expert.specializations && expert.specializations.length > 2 && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              +{expert.specializations.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{expert.rating || 'N/A'}</span>
                          <span className="text-gray-500 text-xs ml-1">({expert.reviewCount || 0})</span>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        {expert.isVerified ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/admin/experts/${expert.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/experts/${expert.id}/edit`)}>
                              Edit Expert
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!expert.isVerified && (
                              <DropdownMenuItem onClick={() => handleVerifyExpert(expert)}>
                                Verify Expert
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {expert.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(expert.id, 'active')}>
                                Set as Active
                              </DropdownMenuItem>
                            )}
                            {expert.status !== 'inactive' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(expert.id, 'inactive')}>
                                Set as Inactive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstExpert + 1} to {Math.min(indexOfLastExpert, filteredExperts.length)} of {filteredExperts.length} experts
              </div>
              
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardFooter>
          </Card>
          
          <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verify Expert</DialogTitle>
                <DialogDescription>
                  Are you sure you want to verify {selectedExpert?.firstName} {selectedExpert?.lastName}? This will mark them as verified and set their status to active.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmVerification}>
                  Verify Expert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No experts found matching your criteria</p>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter(''); setVerificationFilter(''); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
