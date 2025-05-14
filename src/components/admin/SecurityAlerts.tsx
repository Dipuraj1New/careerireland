'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  SecurityAlert, 
  SecurityAlertStatus, 
  SecurityAlertSeverity,
  SecurityAlertType
} from '@/types/security';
import { UserRole } from '@/types/user';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  RefreshCw, 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  ShieldX 
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';

interface SecurityAlertsProps {
  // Props can be added as needed
}

export default function SecurityAlerts({ }: SecurityAlertsProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<SecurityAlertStatus | ''>('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    type: '',
    search: ''
  });

  // Check if user is admin
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (session && isAdmin) {
      fetchAlerts();
    }
  }, [session, isAdmin, pagination.offset, pagination.limit, filters]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = `/api/security/alerts?limit=${pagination.limit}&offset=${pagination.offset}`;
      
      if (filters.status) {
        url += `&status=${filters.status}`;
      }
      
      if (filters.severity) {
        url += `&severity=${filters.severity}`;
      }
      
      if (filters.type) {
        url += `&type=${filters.type}`;
      }
      
      // Search is not implemented in the API yet, but we'll add it here for future use
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setAlerts(data.alerts || []);
      setPagination({
        ...pagination,
        total: data.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security alerts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAlert = async () => {
    if (!selectedAlert || !updateStatus) return;
    
    try {
      const response = await fetch(`/api/security/alerts/${selectedAlert.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: updateStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update alert');
      }
      
      const updatedAlert = await response.json();
      
      // Update the alert in the list
      setAlerts(alerts.map(alert => 
        alert.id === updatedAlert.id ? updatedAlert : alert
      ));
      
      toast({
        title: 'Success',
        description: 'Alert status updated successfully',
        variant: 'default'
      });
      
      setDialogOpen(false);
      setSelectedAlert(null);
      setUpdateStatus('');
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert status',
        variant: 'destructive'
      });
    }
  };

  const handlePageChange = (newOffset: number) => {
    setPagination({
      ...pagination,
      offset: newOffset
    });
  };

  const getAlertSeverityColor = (severity: SecurityAlertSeverity) => {
    switch (severity) {
      case SecurityAlertSeverity.CRITICAL:
        return 'bg-red-100 text-red-800';
      case SecurityAlertSeverity.HIGH:
        return 'bg-orange-100 text-orange-800';
      case SecurityAlertSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case SecurityAlertSeverity.LOW:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertStatusColor = (status: SecurityAlertStatus) => {
    switch (status) {
      case SecurityAlertStatus.NEW:
        return 'bg-red-100 text-red-800';
      case SecurityAlertStatus.ACKNOWLEDGED:
        return 'bg-yellow-100 text-yellow-800';
      case SecurityAlertStatus.RESOLVED:
        return 'bg-green-100 text-green-800';
      case SecurityAlertStatus.FALSE_POSITIVE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeIcon = (type: SecurityAlertType) => {
    switch (type) {
      case SecurityAlertType.AUTHENTICATION_FAILURE:
        return <ShieldX className="h-4 w-4" />;
      case SecurityAlertType.SUSPICIOUS_ACTIVITY:
        return <ShieldAlert className="h-4 w-4" />;
      case SecurityAlertType.PERMISSION_VIOLATION:
        return <ShieldX className="h-4 w-4" />;
      case SecurityAlertType.DATA_BREACH:
        return <ShieldAlert className="h-4 w-4" />;
      case SecurityAlertType.POLICY_VIOLATION:
        return <ShieldQuestion className="h-4 w-4" />;
      case SecurityAlertType.SYSTEM_VULNERABILITY:
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access the Security Alerts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Security Alerts</h1>
        <Button onClick={fetchAlerts} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={SecurityAlertStatus.NEW}>New</SelectItem>
                  <SelectItem value={SecurityAlertStatus.ACKNOWLEDGED}>Acknowledged</SelectItem>
                  <SelectItem value={SecurityAlertStatus.RESOLVED}>Resolved</SelectItem>
                  <SelectItem value={SecurityAlertStatus.FALSE_POSITIVE}>False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="severity-filter">Severity</Label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger id="severity-filter">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value={SecurityAlertSeverity.CRITICAL}>Critical</SelectItem>
                  <SelectItem value={SecurityAlertSeverity.HIGH}>High</SelectItem>
                  <SelectItem value={SecurityAlertSeverity.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={SecurityAlertSeverity.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type-filter">Alert Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value={SecurityAlertType.AUTHENTICATION_FAILURE}>Authentication Failure</SelectItem>
                  <SelectItem value={SecurityAlertType.SUSPICIOUS_ACTIVITY}>Suspicious Activity</SelectItem>
                  <SelectItem value={SecurityAlertType.PERMISSION_VIOLATION}>Permission Violation</SelectItem>
                  <SelectItem value={SecurityAlertType.DATA_BREACH}>Data Breach</SelectItem>
                  <SelectItem value={SecurityAlertType.POLICY_VIOLATION}>Policy Violation</SelectItem>
                  <SelectItem value={SecurityAlertType.SYSTEM_VULNERABILITY}>System Vulnerability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search-filter">Search</Label>
              <div className="flex">
                <Input
                  id="search-filter"
                  placeholder="Search alerts..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="flex-1"
                />
                <Button variant="ghost" className="ml-2">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
          <CardDescription>
            {pagination.total} alerts found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : alerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge className={getAlertSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center">
                      {getAlertTypeIcon(alert.alertType)}
                      <span className="ml-2">{alert.alertType}</span>
                    </TableCell>
                    <TableCell>{alert.source}</TableCell>
                    <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                    <TableCell>
                      <Badge className={getAlertStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(alert.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setDialogOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ShieldCheck className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No security alerts found</p>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} alerts
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset === 0}
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Security Alert Details</DialogTitle>
            <DialogDescription>
              View and manage security alert
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity</Label>
                  <div className="mt-1">
                    <Badge className={getAlertSeverityColor(selectedAlert.severity)}>
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge className={getAlertStatusColor(selectedAlert.status)}>
                      {selectedAlert.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="mt-1 flex items-center">
                    {getAlertTypeIcon(selectedAlert.alertType)}
                    <span className="ml-2">{selectedAlert.alertType}</span>
                  </div>
                </div>
                <div>
                  <Label>Source</Label>
                  <div className="mt-1">{selectedAlert.source}</div>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <div className="mt-1">{selectedAlert.description}</div>
                </div>
                <div className="col-span-2">
                  <Label>Details</Label>
                  <div className="mt-1 bg-gray-50 p-2 rounded text-sm font-mono overflow-auto max-h-32">
                    {selectedAlert.details ? (
                      <pre>{JSON.stringify(selectedAlert.details, null, 2)}</pre>
                    ) : (
                      <span className="text-gray-500">No additional details</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Created At</Label>
                  <div className="mt-1">{new Date(selectedAlert.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Updated At</Label>
                  <div className="mt-1">{new Date(selectedAlert.updatedAt).toLocaleString()}</div>
                </div>
                {selectedAlert.resolvedAt && (
                  <>
                    <div>
                      <Label>Resolved At</Label>
                      <div className="mt-1">{new Date(selectedAlert.resolvedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <Label>Resolved By</Label>
                      <div className="mt-1">{selectedAlert.resolvedBy || 'Unknown'}</div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="border-t pt-4">
                <Label htmlFor="update-status">Update Status</Label>
                <Select
                  value={updateStatus}
                  onValueChange={setUpdateStatus}
                >
                  <SelectTrigger id="update-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SecurityAlertStatus.ACKNOWLEDGED}>Acknowledge</SelectItem>
                    <SelectItem value={SecurityAlertStatus.RESOLVED}>Resolve</SelectItem>
                    <SelectItem value={SecurityAlertStatus.FALSE_POSITIVE}>Mark as False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAlert} disabled={!updateStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
