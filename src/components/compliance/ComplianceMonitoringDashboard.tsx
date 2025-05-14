'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, subMonths, subDays, parseISO } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileText,
  Plus,
  Search,
  Calendar,
  BarChart4,
  PieChart
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  ComplianceRequirementType,
  ComplianceStatus,
  ComplianceRequirement,
  ComplianceTrend
} from '@/types/security';

interface ComplianceMonitoringDashboardProps {
  isAdmin: boolean;
}

export default function ComplianceMonitoringDashboard({ isAdmin }: ComplianceMonitoringDashboardProps) {
  const { data: session } = useSession();
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeChartTab, setActiveChartTab] = useState<string>('status');
  const [complianceStats, setComplianceStats] = useState({
    total: 0,
    compliant: 0,
    nonCompliant: 0,
    partiallyCompliant: 0,
    underReview: 0,
    complianceRate: 0
  });
  const [complianceTrends, setComplianceTrends] = useState<ComplianceTrend[]>([]);
  const [timeRange, setTimeRange] = useState<string>('6months');
  const [newRequirement, setNewRequirement] = useState({
    name: '',
    description: '',
    type: ComplianceRequirementType.GDPR,
    details: {}
  });
  const [scheduleDetails, setScheduleDetails] = useState({
    frequency: 'weekly',
    dayOfWeek: 'monday',
    time: '09:00',
    notifyEmail: '',
    requirementIds: [] as string[]
  });

  // Fetch compliance requirements
  useEffect(() => {
    if (!isAdmin || !session) return;

    const fetchRequirements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/compliance/status${activeTab !== 'all' ? `?status=${activeTab.toUpperCase()}` : ''}`);

        if (!response.ok) {
          throw new Error('Failed to fetch compliance requirements');
        }

        const data = await response.json();
        setRequirements(data.requirements);

        // Calculate compliance stats
        const total = data.requirements.length;
        const compliant = data.requirements.filter((r: ComplianceRequirement) =>
          r.status === ComplianceStatus.COMPLIANT
        ).length;
        const nonCompliant = data.requirements.filter((r: ComplianceRequirement) =>
          r.status === ComplianceStatus.NON_COMPLIANT
        ).length;
        const partiallyCompliant = data.requirements.filter((r: ComplianceRequirement) =>
          r.status === ComplianceStatus.PARTIALLY_COMPLIANT
        ).length;
        const underReview = data.requirements.filter((r: ComplianceRequirement) =>
          r.status === ComplianceStatus.UNDER_REVIEW
        ).length;

        setComplianceStats({
          total,
          compliant,
          nonCompliant,
          partiallyCompliant,
          underReview,
          complianceRate: total > 0 ? (compliant / total) * 100 : 0
        });
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error',
          description: `Failed to load compliance requirements: ${err.message}`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [isAdmin, session, activeTab]);

  // Fetch compliance trends
  useEffect(() => {
    if (!isAdmin || !session) return;

    const fetchTrends = async () => {
      try {
        let timeParam = '';

        switch (timeRange) {
          case '1month':
            timeParam = 'period=1month';
            break;
          case '3months':
            timeParam = 'period=3months';
            break;
          case '6months':
            timeParam = 'period=6months';
            break;
          case '1year':
            timeParam = 'period=1year';
            break;
          default:
            timeParam = 'period=6months';
        }

        const response = await fetch(`/api/compliance/trends?${timeParam}`);

        if (!response.ok) {
          throw new Error('Failed to fetch compliance trends');
        }

        const data = await response.json();
        setComplianceTrends(data.trends);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: `Failed to load compliance trends: ${err.message}`,
          variant: 'destructive'
        });
      }
    };

    fetchTrends();
  }, [isAdmin, session, timeRange]);

  const handleCreateRequirement = async () => {
    try {
      if (!newRequirement.name || !newRequirement.description) {
        toast({
          title: 'Validation Error',
          description: 'Please provide a name and description',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/compliance/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRequirement.name,
          description: newRequirement.description,
          type: newRequirement.type,
          details: newRequirement.details
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create compliance requirement');
      }

      const data = await response.json();

      // Reset form and close dialog
      setNewRequirement({
        name: '',
        description: '',
        type: ComplianceRequirementType.GDPR,
        details: {}
      });
      setIsCreateDialogOpen(false);

      // Refresh requirements
      setRequirements(prev => [data, ...prev]);

      toast({
        title: 'Success',
        description: 'Compliance requirement created successfully',
        variant: 'default'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to create compliance requirement: ${err.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleRunCheck = async (requirementId?: string) => {
    try {
      setIsRunningCheck(true);

      const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requirementId ? { requirementId } : {})
      });

      if (!response.ok) {
        throw new Error('Failed to run compliance check');
      }

      const data = await response.json();

      // Refresh requirements after check
      const statusResponse = await fetch(`/api/compliance/status${activeTab !== 'all' ? `?status=${activeTab.toUpperCase()}` : ''}`);

      if (!statusResponse.ok) {
        throw new Error('Failed to refresh compliance requirements');
      }

      const statusData = await statusResponse.json();
      setRequirements(statusData.requirements);

      // Update selected requirement if applicable
      if (requirementId && selectedRequirement?.id === requirementId) {
        const updatedRequirement = statusData.requirements.find(
          (r: ComplianceRequirement) => r.id === requirementId
        );
        if (updatedRequirement) {
          setSelectedRequirement(updatedRequirement);
        }
      }

      toast({
        title: 'Success',
        description: requirementId
          ? 'Compliance check completed successfully'
          : 'All compliance checks completed successfully',
        variant: 'default'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to run compliance check: ${err.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  const handleScheduleChecks = async () => {
    try {
      if (!scheduleDetails.notifyEmail) {
        toast({
          title: 'Validation Error',
          description: 'Please provide a notification email',
          variant: 'destructive'
        });
        return;
      }

      if (scheduleDetails.requirementIds.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select at least one requirement to schedule',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/compliance/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleDetails)
      });

      if (!response.ok) {
        throw new Error('Failed to schedule compliance checks');
      }

      setIsScheduleDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Compliance checks scheduled successfully',
        variant: 'default'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to schedule compliance checks: ${err.message}`,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Compliant</Badge>;
      case ComplianceStatus.NON_COMPLIANT:
        return <Badge variant="outline" className="bg-red-100 text-red-800">Non-Compliant</Badge>;
      case ComplianceStatus.PARTIALLY_COMPLIANT:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Partially Compliant</Badge>;
      case ComplianceStatus.UNDER_REVIEW:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case ComplianceStatus.NOT_APPLICABLE:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Applicable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeLabel = (type: ComplianceRequirementType) => {
    switch (type) {
      case ComplianceRequirementType.GDPR:
        return 'GDPR';
      case ComplianceRequirementType.DATA_PROTECTION:
        return 'Data Protection';
      case ComplianceRequirementType.RETENTION:
        return 'Data Retention';
      case ComplianceRequirementType.CONSENT:
        return 'Consent Management';
      case ComplianceRequirementType.ACCESS_CONTROL:
        return 'Access Control';
      case ComplianceRequirementType.AUDIT:
        return 'Audit Logging';
      case ComplianceRequirementType.BREACH_NOTIFICATION:
        return 'Breach Notification';
      case ComplianceRequirementType.CUSTOM:
        return 'Custom';
      default:
        return 'Unknown';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Monitoring</CardTitle>
          <CardDescription>
            You do not have permission to access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Compliance Monitoring Dashboard</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsScheduleDialogOpen(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Checks
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRunCheck()}
            disabled={isRunningCheck}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
            Run All Checks
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Requirement
          </Button>
        </div>
      </div>

      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceStats.complianceRate.toFixed(1)}%
            </div>
            <Progress
              value={complianceStats.complianceRate}
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {complianceStats.compliant} of {complianceStats.total} requirements compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{complianceStats.compliant}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non-Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold">{complianceStats.nonCompliant}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{complianceStats.underReview}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Trends</CardTitle>
          <CardDescription>
            Track compliance status changes over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Tabs defaultValue="status" value={activeChartTab} onValueChange={setActiveChartTab}>
              <TabsList>
                <TabsTrigger value="status">Status Distribution</TabsTrigger>
                <TabsTrigger value="trend">Compliance Rate Trend</TabsTrigger>
                <TabsTrigger value="type">By Requirement Type</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-80">
            {activeChartTab === 'status' && (
              <div className="flex flex-col items-center justify-center h-full">
                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Status distribution chart will be displayed here.
                  <br />
                  This would show the proportion of requirements in each compliance status.
                </p>
              </div>
            )}

            {activeChartTab === 'trend' && (
              <div className="flex flex-col items-center justify-center h-full">
                <BarChart4 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Compliance rate trend chart will be displayed here.
                  <br />
                  This would show how the overall compliance rate has changed over time.
                </p>
              </div>
            )}

            {activeChartTab === 'type' && (
              <div className="flex flex-col items-center justify-center h-full">
                <BarChart4 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Requirement type chart will be displayed here.
                  <br />
                  This would show compliance rates broken down by requirement type.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="compliant">Compliant</TabsTrigger>
          <TabsTrigger value="non_compliant">Non-Compliant</TabsTrigger>
          <TabsTrigger value="partially_compliant">Partially Compliant</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ComplianceRequirementList
            requirements={requirements}
            loading={loading}
            error={error}
            onSelectRequirement={setSelectedRequirement}
            selectedRequirement={selectedRequirement}
            onRunCheck={handleRunCheck}
            isRunningCheck={isRunningCheck}
          />
        </TabsContent>

        <TabsContent value="compliant" className="mt-4">
          <ComplianceRequirementList
            requirements={requirements.filter(r => r.status === ComplianceStatus.COMPLIANT)}
            loading={loading}
            error={error}
            onSelectRequirement={setSelectedRequirement}
            selectedRequirement={selectedRequirement}
            onRunCheck={handleRunCheck}
            isRunningCheck={isRunningCheck}
          />
        </TabsContent>

        <TabsContent value="non_compliant" className="mt-4">
          <ComplianceRequirementList
            requirements={requirements.filter(r => r.status === ComplianceStatus.NON_COMPLIANT)}
            loading={loading}
            error={error}
            onSelectRequirement={setSelectedRequirement}
            selectedRequirement={selectedRequirement}
            onRunCheck={handleRunCheck}
            isRunningCheck={isRunningCheck}
          />
        </TabsContent>

        <TabsContent value="partially_compliant" className="mt-4">
          <ComplianceRequirementList
            requirements={requirements.filter(r => r.status === ComplianceStatus.PARTIALLY_COMPLIANT)}
            loading={loading}
            error={error}
            onSelectRequirement={setSelectedRequirement}
            selectedRequirement={selectedRequirement}
            onRunCheck={handleRunCheck}
            isRunningCheck={isRunningCheck}
          />
        </TabsContent>

        <TabsContent value="under_review" className="mt-4">
          <ComplianceRequirementList
            requirements={requirements.filter(r => r.status === ComplianceStatus.UNDER_REVIEW)}
            loading={loading}
            error={error}
            onSelectRequirement={setSelectedRequirement}
            selectedRequirement={selectedRequirement}
            onRunCheck={handleRunCheck}
            isRunningCheck={isRunningCheck}
          />
        </TabsContent>
      </Tabs>

      {selectedRequirement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>{selectedRequirement.name}</span>
              {getStatusBadge(selectedRequirement.status)}
            </CardTitle>
            <CardDescription>
              {selectedRequirement.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium">Type</p>
                <p>{getTypeLabel(selectedRequirement.type)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Checked</p>
                <p>
                  {selectedRequirement.lastChecked
                    ? format(new Date(selectedRequirement.lastChecked), 'PPP')
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Next Check Due</p>
                <p>
                  {selectedRequirement.nextCheckDue
                    ? format(new Date(selectedRequirement.nextCheckDue), 'PPP')
                    : 'Not scheduled'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p>{format(new Date(selectedRequirement.createdAt), 'PPP')}</p>
              </div>
            </div>

            {selectedRequirement.details && Object.keys(selectedRequirement.details).length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-sm">
                    {JSON.stringify(selectedRequirement.details, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleRunCheck(selectedRequirement.id)}
              disabled={isRunningCheck}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
              Run Check
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Create Requirement Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Compliance Requirement</DialogTitle>
            <DialogDescription>
              Create a new compliance requirement to monitor and track.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newRequirement.name}
                onChange={(e) => setNewRequirement({...newRequirement, name: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={newRequirement.type}
                onValueChange={(value) => setNewRequirement({
                  ...newRequirement,
                  type: value as ComplianceRequirementType
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ComplianceRequirementType.GDPR}>GDPR</SelectItem>
                  <SelectItem value={ComplianceRequirementType.DATA_PROTECTION}>Data Protection</SelectItem>
                  <SelectItem value={ComplianceRequirementType.RETENTION}>Data Retention</SelectItem>
                  <SelectItem value={ComplianceRequirementType.CONSENT}>Consent Management</SelectItem>
                  <SelectItem value={ComplianceRequirementType.ACCESS_CONTROL}>Access Control</SelectItem>
                  <SelectItem value={ComplianceRequirementType.AUDIT}>Audit Logging</SelectItem>
                  <SelectItem value={ComplianceRequirementType.BREACH_NOTIFICATION}>Breach Notification</SelectItem>
                  <SelectItem value={ComplianceRequirementType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({...newRequirement, description: e.target.value})}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequirement}>Create Requirement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Checks Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Compliance Checks</DialogTitle>
            <DialogDescription>
              Set up recurring compliance checks for selected requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select
                value={scheduleDetails.frequency}
                onValueChange={(value) => setScheduleDetails({...scheduleDetails, frequency: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleDetails.frequency === 'weekly' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dayOfWeek" className="text-right">
                  Day of Week
                </Label>
                <Select
                  value={scheduleDetails.dayOfWeek}
                  onValueChange={(value) => setScheduleDetails({...scheduleDetails, dayOfWeek: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduleDetails.time}
                onChange={(e) => setScheduleDetails({...scheduleDetails, time: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notifyEmail" className="text-right">
                Notification Email
              </Label>
              <Input
                id="notifyEmail"
                type="email"
                value={scheduleDetails.notifyEmail}
                onChange={(e) => setScheduleDetails({...scheduleDetails, notifyEmail: e.target.value})}
                placeholder="email@example.com"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Requirements
              </Label>
              <div className="col-span-3 border rounded-md p-4 max-h-60 overflow-y-auto">
                {requirements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No requirements available</p>
                ) : (
                  <div className="space-y-2">
                    {requirements.map(requirement => (
                      <div key={requirement.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`req-${requirement.id}`}
                          checked={scheduleDetails.requirementIds.includes(requirement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleDetails({
                                ...scheduleDetails,
                                requirementIds: [...scheduleDetails.requirementIds, requirement.id]
                              });
                            } else {
                              setScheduleDetails({
                                ...scheduleDetails,
                                requirementIds: scheduleDetails.requirementIds.filter(id => id !== requirement.id)
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`req-${requirement.id}`} className="text-sm">
                          {requirement.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleChecks}
              disabled={scheduleDetails.requirementIds.length === 0 || !scheduleDetails.notifyEmail}
            >
              Schedule Checks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ComplianceRequirementListProps {
  requirements: ComplianceRequirement[];
  loading: boolean;
  error: string | null;
  onSelectRequirement: (requirement: ComplianceRequirement) => void;
  selectedRequirement: ComplianceRequirement | null;
  onRunCheck: (requirementId: string) => void;
  isRunningCheck: boolean;
}

function ComplianceRequirementList({
  requirements,
  loading,
  error,
  onSelectRequirement,
  selectedRequirement,
  onRunCheck,
  isRunningCheck
}: ComplianceRequirementListProps) {
  if (loading) {
    return <p>Loading compliance requirements...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (requirements.length === 0) {
    return <p>No compliance requirements found.</p>;
  }

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Compliant</Badge>;
      case ComplianceStatus.NON_COMPLIANT:
        return <Badge variant="outline" className="bg-red-100 text-red-800">Non-Compliant</Badge>;
      case ComplianceStatus.PARTIALLY_COMPLIANT:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Partially Compliant</Badge>;
      case ComplianceStatus.UNDER_REVIEW:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case ComplianceStatus.NOT_APPLICABLE:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Applicable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Checked</TableHead>
          <TableHead>Next Check Due</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requirements.map(requirement => (
          <TableRow
            key={requirement.id}
            className={selectedRequirement?.id === requirement.id ? 'bg-muted/50' : ''}
          >
            <TableCell>{requirement.name}</TableCell>
            <TableCell>
              {requirement.type === ComplianceRequirementType.GDPR && 'GDPR'}
              {requirement.type === ComplianceRequirementType.DATA_PROTECTION && 'Data Protection'}
              {requirement.type === ComplianceRequirementType.RETENTION && 'Data Retention'}
              {requirement.type === ComplianceRequirementType.CONSENT && 'Consent Management'}
              {requirement.type === ComplianceRequirementType.ACCESS_CONTROL && 'Access Control'}
              {requirement.type === ComplianceRequirementType.AUDIT && 'Audit Logging'}
              {requirement.type === ComplianceRequirementType.BREACH_NOTIFICATION && 'Breach Notification'}
              {requirement.type === ComplianceRequirementType.CUSTOM && 'Custom'}
            </TableCell>
            <TableCell>{getStatusBadge(requirement.status)}</TableCell>
            <TableCell>
              {requirement.lastChecked
                ? format(new Date(requirement.lastChecked), 'PP')
                : 'Never'}
            </TableCell>
            <TableCell>
              {requirement.nextCheckDue
                ? format(new Date(requirement.nextCheckDue), 'PP')
                : 'Not scheduled'}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectRequirement(requirement)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRunCheck(requirement.id)}
                  disabled={isRunningCheck}
                >
                  <RefreshCw className={`h-4 w-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
