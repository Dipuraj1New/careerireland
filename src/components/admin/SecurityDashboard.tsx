'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  SecurityAlert,
  SecurityAlertStatus,
  SecurityAlertSeverity,
  DataSubjectRequestStatus
} from '@/types/security';
import { UserRole } from '@/types/user';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
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
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  ShieldAlert,
  User
} from 'lucide-react';
import Link from 'next/link';

interface SecurityDashboardProps {
  // Props can be added as needed
}

export default function SecurityDashboard({ }: SecurityDashboardProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [dataSubjectRequests, setDataSubjectRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    criticalAlerts: 0,
    pendingRequests: 0,
    completedRequests: 0,
    auditLogsToday: 0
  });

  // Check if user is admin
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (session && isAdmin) {
      fetchDashboardData();
    }
  }, [session, isAdmin]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch security alerts
      const alertsResponse = await fetch('/api/security/alerts?limit=5');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);

      // Fetch data subject requests
      const requestsResponse = await fetch('/api/security/data-subject-requests?limit=5');
      const requestsData = await requestsResponse.json();
      setDataSubjectRequests(requestsData.requests || []);

      // Calculate stats
      const activeAlerts = alertsData.alerts?.filter(
        (alert: SecurityAlert) => alert.status === SecurityAlertStatus.NEW ||
                                alert.status === SecurityAlertStatus.ACKNOWLEDGED
      ).length || 0;

      const criticalAlerts = alertsData.alerts?.filter(
        (alert: SecurityAlert) => alert.severity === SecurityAlertSeverity.CRITICAL ||
                                alert.severity === SecurityAlertSeverity.HIGH
      ).length || 0;

      const pendingRequests = requestsData.requests?.filter(
        (req: any) => req.status === DataSubjectRequestStatus.PENDING ||
                     req.status === DataSubjectRequestStatus.IN_PROGRESS
      ).length || 0;

      const completedRequests = requestsData.requests?.filter(
        (req: any) => req.status === DataSubjectRequestStatus.COMPLETED
      ).length || 0;

      // Fetch audit logs count for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const auditLogsResponse = await fetch(`/api/security/audit-logs?startDate=${today.toISOString()}`);
      const auditLogsData = await auditLogsResponse.json();
      const auditLogsToday = auditLogsData.pagination?.totalCount || 0;

      setStats({
        activeAlerts,
        criticalAlerts,
        pendingRequests,
        completedRequests,
        auditLogsToday
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const getRequestStatusColor = (status: DataSubjectRequestStatus) => {
    switch (status) {
      case DataSubjectRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case DataSubjectRequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case DataSubjectRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case DataSubjectRequestStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access the Security Dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Security & Compliance Dashboard</h1>
        <Button onClick={fetchDashboardData}>Refresh</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-center">
                <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-2xl font-bold">{stats.activeAlerts}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/admin/security/alerts" className="text-sm text-blue-600 hover:underline">
              View all alerts
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                <p className="text-2xl font-bold">{stats.criticalAlerts}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/admin/security/alerts?severity=critical" className="text-sm text-blue-600 hover:underline">
              View critical alerts
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Access Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <User className="h-5 w-5 text-purple-500 mr-2" />
              <p className="text-2xl font-bold">New</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/admin/security/access-review" className="text-sm text-blue-600 hover:underline">
              Manage access reviews
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-2xl font-bold">New</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/admin/compliance/reports" className="text-sm text-blue-600 hover:underline">
              View compliance reports
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/admin/security/data-subject-requests?status=pending" className="text-sm text-blue-600 hover:underline">
              View pending requests
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs Today</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-2xl font-bold">{stats.auditLogsToday}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/admin/security/audit-logs" className="text-sm text-blue-600 hover:underline">
              View audit logs
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>Latest security alerts that require attention</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.slice(0, 5).map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge className={getAlertSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{alert.alertType}</TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell>
                          <Badge className={getAlertStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(alert.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-gray-500">No security alerts found</p>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/admin/security/alerts">
                <Button variant="outline">View All Alerts</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Data Subject Requests</CardTitle>
              <CardDescription>Latest requests from users regarding their data</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : dataSubjectRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSubjectRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.userName || request.userEmail || 'Unknown'}</TableCell>
                        <TableCell>{request.requestType}</TableCell>
                        <TableCell>
                          <Badge className={getRequestStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-gray-500">No data subject requests found</p>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/admin/security/data-subject-requests">
                <Button variant="outline">View All Requests</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Manage and respond to security alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Security alerts content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>Manage user requests regarding their personal data</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Data subject requests content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>View and search system audit logs for security and compliance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <p>
                  Audit logs track all important actions in the system, providing a comprehensive trail for security monitoring and compliance purposes.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Recent Activity</h3>
                    <p className="text-sm text-muted-foreground">View the most recent system activities</p>
                  </div>
                  <Link href="/admin/security/audit-logs">
                    <Button>View Full Audit Log</Button>
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Entity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* This would be populated with actual audit log data */}
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            Connect to the Audit Log API to view recent activities
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/admin/security/audit-logs" className="w-full">
                <Button variant="outline" className="w-full">View Complete Audit Log</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage user access and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Access Reviews</h3>
                    <p className="text-sm text-muted-foreground">Periodically review user access rights</p>
                  </div>
                  <Link href="/admin/security/access-review">
                    <Button>Manage Access Reviews</Button>
                  </Link>
                </div>
                <p>
                  Access reviews help ensure that users only have the permissions they need to perform their job functions.
                  Regular reviews are essential for maintaining security and compliance with regulations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Role-Based Access Control</h4>
                    <p className="text-sm">Manage access based on user roles and responsibilities</p>
                    <Link href="/admin/security/roles" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                      Manage roles
                    </Link>
                  </div>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Attribute-Based Permissions</h4>
                    <p className="text-sm">Fine-grained access control based on user and resource attributes</p>
                    <Link href="/admin/security/permissions" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                      Manage permissions
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/admin/security/access-review" className="w-full">
                <Button variant="outline" className="w-full">Go to Access Review Dashboard</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Management</CardTitle>
              <CardDescription>Monitor and manage compliance with regulations and standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Compliance Reports</h3>
                    <p className="text-sm text-muted-foreground">Generate and manage compliance reports</p>
                  </div>
                  <Link href="/admin/compliance/reports">
                    <Button>View Reports</Button>
                  </Link>
                </div>
                <p>
                  Compliance reports provide documentation of your organization's adherence to regulatory requirements
                  and internal policies. Regular reporting helps identify gaps and demonstrate due diligence.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">GDPR Compliance</h4>
                    <p className="text-sm">Monitor compliance with data protection regulations</p>
                    <Link href="/admin/compliance/gdpr" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                      View GDPR status
                    </Link>
                  </div>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Data Retention</h4>
                    <p className="text-sm">Manage data retention policies and compliance</p>
                    <Link href="/admin/compliance/retention" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                      View retention policies
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/admin/compliance/reports" className="w-full">
                <Button variant="outline" className="w-full">Go to Compliance Reporting</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Manage security policies and compliance settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Security policies content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
