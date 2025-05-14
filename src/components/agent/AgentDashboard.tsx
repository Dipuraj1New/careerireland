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
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  Filter, 
  Inbox, 
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  User, 
  XCircle 
} from 'lucide-react';
import { CaseStatus, CasePriority } from '@/types/case';

interface AgentDashboardProps {
  userId: string;
}

export default function AgentDashboard({ userId }: AgentDashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    pendingReview: 0,
    additionalDocsRequired: 0,
    pendingSubmission: 0,
    submittedToGov: 0,
    approved: 0,
    rejected: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch agent's cases
    const fetchCases = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cases');
        const data = await response.json();
        
        if (data.cases) {
          setCases(data.cases);
          
          // Calculate stats
          const totalCases = data.cases.length;
          const pendingReview = data.cases.filter((c: any) => c.status === CaseStatus.UNDER_REVIEW).length;
          const additionalDocsRequired = data.cases.filter((c: any) => c.status === CaseStatus.ADDITIONAL_DOCUMENTS_REQUIRED).length;
          const pendingSubmission = data.cases.filter((c: any) => c.status === CaseStatus.PENDING_GOVERNMENT_SUBMISSION).length;
          const submittedToGov = data.cases.filter((c: any) => c.status === CaseStatus.SUBMITTED_TO_GOVERNMENT).length;
          const approved = data.cases.filter((c: any) => c.status === CaseStatus.APPROVED).length;
          const rejected = data.cases.filter((c: any) => c.status === CaseStatus.REJECTED).length;
          
          setStats({
            totalCases,
            pendingReview,
            additionalDocsRequired,
            pendingSubmission,
            submittedToGov,
            approved,
            rejected
          });
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch upcoming appointments
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/consultations?upcoming=true');
        const data = await response.json();
        
        if (data.consultations) {
          setUpcomingAppointments(data.consultations);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };
    
    fetchCases();
    fetchAppointments();
  }, [userId]);

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
    // Refresh data
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCases}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingReview}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Docs Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.additionalDocsRequired}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingSubmission}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Case Queue */}
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
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Visa Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">Loading cases...</TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">No cases found</TableCell>
                </TableRow>
              ) : (
                cases.map((caseItem) => (
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
            Showing {cases.length} of {stats.totalCases} cases
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Scheduled consultations with applicants</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No upcoming appointments
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-4">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{appointment.applicant.firstName} {appointment.applicant.lastName}</div>
                      <div className="text-sm text-muted-foreground">{new Date(appointment.scheduledAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Join</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
