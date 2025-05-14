'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Download, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLog, AuditEntityType, AuditAction } from '@/types/audit';
import { cn } from '@/lib/utils';

interface AuditLogViewerProps {
  className?: string;
}

export default function AuditLogViewer({ className }: AuditLogViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filters
  const [entityType, setEntityType] = useState<string>(
    searchParams.get('entityType') || ''
  );
  const [entityId, setEntityId] = useState<string>(
    searchParams.get('entityId') || ''
  );
  const [userId, setUserId] = useState<string>(
    searchParams.get('userId') || ''
  );
  const [action, setAction] = useState<string>(
    searchParams.get('action') || ''
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate') as string) 
      : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate') as string) 
      : undefined
  );
  
  // State for pagination
  const [page, setPage] = useState<number>(
    parseInt(searchParams.get('page') || '1')
  );
  const [limit, setLimit] = useState<number>(
    parseInt(searchParams.get('limit') || '10')
  );
  
  // State for data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (entityType) params.append('entityType', entityType);
      if (entityId) params.append('entityId', entityId);
      if (userId) params.append('userId', userId);
      if (action) params.append('action', action);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Fetch data
      const response = await fetch(`/api/security/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching audit logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state
      setAuditLogs(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update URL with filters
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams();
    
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    if (userId) params.append('userId', userId);
    if (action) params.append('action', action);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    router.push(`?${params.toString()}`);
  };
  
  // Handle filter changes
  const handleFilterChange = () => {
    setPage(1); // Reset to first page when filters change
    updateUrlWithFilters();
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Reset filters
  const resetFilters = () => {
    setEntityType('');
    setEntityId('');
    setUserId('');
    setAction('');
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };
  
  // Export logs as CSV
  const exportLogs = () => {
    // Convert logs to CSV
    const headers = ['ID', 'User ID', 'Entity Type', 'Entity ID', 'Action', 'Details', 'IP Address', 'User Agent', 'Timestamp'];
    const csvRows = [headers.join(',')];
    
    auditLogs.forEach(log => {
      const row = [
        log.id,
        log.userId,
        log.entityType,
        log.entityId,
        log.action,
        JSON.stringify(log.details).replace(/,/g, ';'),
        log.ipAddress || '',
        (log.userAgent || '').replace(/,/g, ' '),
        log.timestamp.toISOString()
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Effect to fetch data when filters or pagination changes
  useEffect(() => {
    fetchAuditLogs();
  }, [page, limit, entityType, entityId, userId, action, startDate, endDate]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'PPpp');
  };
  
  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case AuditAction.CREATE:
        return 'bg-green-100 text-green-800';
      case AuditAction.UPDATE:
        return 'bg-blue-100 text-blue-800';
      case AuditAction.DELETE:
        return 'bg-red-100 text-red-800';
      case AuditAction.LOGIN:
        return 'bg-purple-100 text-purple-800';
      case AuditAction.LOGOUT:
        return 'bg-gray-100 text-gray-800';
      case AuditAction.VIEW:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-2xl">Audit Log Viewer</CardTitle>
        <CardDescription>
          View and search system audit logs for security and compliance monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter controls */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select
                value={entityType}
                onValueChange={(value) => {
                  setEntityType(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="All entity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entity types</SelectItem>
                  {Object.values(AuditEntityType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entityId">Entity ID</Label>
              <div className="flex gap-2">
                <Input
                  id="entityId"
                  placeholder="Entity ID"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleFilterChange}
                  size="icon"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <div className="flex gap-2">
                <Input
                  id="userId"
                  placeholder="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleFilterChange}
                  size="icon"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={action}
                onValueChange={(value) => {
                  setAction(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {Object.values(AuditAction).map((actionType) => (
                    <SelectItem key={actionType} value={actionType}>
                      {actionType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      handleFilterChange();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      handleFilterChange();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Reset Filters
            </Button>
            
            <Button
              variant="outline"
              onClick={exportLogs}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {auditLogs.length} of {totalCount} results
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Audit logs table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.userId}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-normal", getActionBadgeColor(log.action))}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.entityId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ipAddress || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around the current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
