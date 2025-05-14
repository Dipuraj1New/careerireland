'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowDown, 
  ArrowUp, 
  Filter, 
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  SlidersHorizontal 
} from 'lucide-react';
import { CaseStatus, CasePriority, VisaType } from '@/types/case';

interface CaseQueueProps {
  userId: string;
  initialFilters?: {
    status?: CaseStatus[];
    priority?: CasePriority[];
    visaType?: VisaType[];
  };
}

export default function CaseQueue({ userId, initialFilters }: CaseQueueProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [filteredCases, setFilteredCases] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState(initialFilters || {
    status: [],
    priority: [],
    visaType: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchCases();
  }, [userId]);

  useEffect(() => {
    // Apply filters and search
    let result = [...cases];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(caseItem => 
        caseItem.id.toLowerCase().includes(query) ||
        `${caseItem.applicant.firstName} ${caseItem.applicant.lastName}`.toLowerCase().includes(query) ||
        caseItem.visaType.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      result = result.filter(caseItem => filters.status.includes(caseItem.status));
    }
    
    if (filters.priority && filters.priority.length > 0) {
      result = result.filter(caseItem => filters.priority.includes(caseItem.priority));
    }
    
    if (filters.visaType && filters.visaType.length > 0) {
      result = result.filter(caseItem => filters.visaType.includes(caseItem.visaType));
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested fields
      if (sortField === 'applicant') {
        aValue = `${a.applicant.firstName} ${a.applicant.lastName}`;
        bValue = `${b.applicant.firstName} ${b.applicant.lastName}`;
      }
      
      // Handle date fields
      if (sortField === 'updatedAt' || sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Update pagination
    setPagination(prev => ({
      ...prev,
      total: result.length
    }));
    
    // Apply pagination
    const start = (pagination.page - 1) * pagination.pageSize;
    const paginatedResult = result.slice(start, start + pagination.pageSize);
    
    setFilteredCases(paginatedResult);
  }, [cases, searchQuery, filters, sortField, sortDirection, pagination.page, pagination.pageSize]);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cases');
      const data = await response.json();
      
      if (data.cases) {
        setCases(data.cases);
        setFilteredCases(data.cases);
        setPagination(prev => ({
          ...prev,
          total: data.cases.length
        }));
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPriorityBadge = (priority: CasePriority) => {
    switch (priority) {
      case CasePriority.LOW:
        return <Badge variant="secondary">Low</Badge>;
      case CasePriority.MEDIUM:
        return <Badge variant="info">Medium</Badge>;
      case CasePriority.HIGH:
        return <Badge variant="warning">High</Badge>;
      case CasePriority.URGENT:
        return <Badge variant="destructive">Urgent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>;
      case CaseStatus.SUBMITTED:
        return <Badge variant="info">Submitted</Badge>;
      case CaseStatus.UNDER_REVIEW:
        return <Badge variant="pending">Under Review</Badge>;
      case CaseStatus.ADDITIONAL_DOCUMENTS_REQUIRED:
        return <Badge variant="warning">Docs Required</Badge>;
      case CaseStatus.PENDING_GOVERNMENT_SUBMISSION:
        return <Badge variant="pending">Pending Submission</Badge>;
      case CaseStatus.SUBMITTED_TO_GOVERNMENT:
        return <Badge variant="info">Submitted to Gov</Badge>;
      case CaseStatus.APPROVED:
        return <Badge variant="success">Approved</Badge>;
      case CaseStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case CaseStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case CaseStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleCaseClick = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  const handleRefresh = () => {
    fetchCases();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-4 w-4" /> 
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Queue</CardTitle>
        <CardDescription>Manage and process immigration cases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cases..."
              className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mb-4 p-4 border rounded-md bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Filter Cases</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilters({ status: [], priority: [], visaType: [] })}
              >
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(CaseStatus).map(status => (
                    <Badge 
                      key={status}
                      variant={filters.status?.includes(status) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters(prev => {
                          const newStatus = prev.status?.includes(status)
                            ? prev.status.filter(s => s !== status)
                            : [...(prev.status || []), status];
                          
                          return { ...prev, status: newStatus };
                        });
                      }}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Priority Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Priority</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(CasePriority).map(priority => (
                    <Badge 
                      key={priority}
                      variant={filters.priority?.includes(priority) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters(prev => {
                          const newPriority = prev.priority?.includes(priority)
                            ? prev.priority.filter(p => p !== priority)
                            : [...(prev.priority || []), priority];
                          
                          return { ...prev, priority: newPriority };
                        });
                      }}
                    >
                      {priority}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Visa Type Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Visa Type</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(VisaType).map(type => (
                    <Badge 
                      key={type}
                      variant={filters.visaType?.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters(prev => {
                          const newVisaType = prev.visaType?.includes(type)
                            ? prev.visaType.filter(t => t !== type)
                            : [...(prev.visaType || []), type];
                          
                          return { ...prev, visaType: newVisaType };
                        });
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center">
                  Case ID
                  {renderSortIcon('id')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('applicant')}
              >
                <div className="flex items-center">
                  Applicant
                  {renderSortIcon('applicant')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('visaType')}
              >
                <div className="flex items-center">
                  Visa Type
                  {renderSortIcon('visaType')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center">
                  Priority
                  {renderSortIcon('priority')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center">
                  Updated
                  {renderSortIcon('updatedAt')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">Loading cases...</TableCell>
              </TableRow>
            ) : filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No cases found</TableCell>
              </TableRow>
            ) : (
              filteredCases.map((caseItem) => (
                <TableRow 
                  key={caseItem.id} 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleCaseClick(caseItem.id)}
                >
                  <TableCell className="font-medium">{caseItem.id.substring(0, 8)}</TableCell>
                  <TableCell>{caseItem.applicant.firstName} {caseItem.applicant.lastName}</TableCell>
                  <TableCell>{caseItem.visaType}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                  <TableCell>{new Date(caseItem.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCases.length} of {pagination.total} cases
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={pagination.page * pagination.pageSize >= pagination.total}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
