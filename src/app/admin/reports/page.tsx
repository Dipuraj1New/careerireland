'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, FileTextIcon, DownloadIcon, SaveIcon, PlayIcon, ClockIcon, BarChart3Icon, PieChartIcon, LineChartIcon, TableIcon, FilterIcon, XIcon } from 'lucide-react';

// Mock data for saved reports
const mockSavedReports = [
  {
    id: '1',
    name: 'Monthly User Growth',
    description: 'User growth and engagement metrics by month',
    type: 'users',
    createdAt: new Date('2023-07-15'),
    lastRun: new Date('2023-08-01'),
    schedule: 'monthly',
    filters: {
      dateRange: 'last6months',
      metrics: ['newUsers', 'activeUsers', 'retentionRate'],
      groupBy: 'month',
    },
  },
  {
    id: '2',
    name: 'Case Status Distribution',
    description: 'Distribution of cases by status and type',
    type: 'cases',
    createdAt: new Date('2023-06-20'),
    lastRun: new Date('2023-08-01'),
    schedule: 'weekly',
    filters: {
      dateRange: 'last3months',
      metrics: ['caseCount', 'approvalRate', 'processingTime'],
      groupBy: 'status',
    },
  },
  {
    id: '3',
    name: 'Consultation Revenue',
    description: 'Revenue from consultations by expert and service type',
    type: 'consultations',
    createdAt: new Date('2023-07-25'),
    lastRun: new Date('2023-08-01'),
    schedule: 'daily',
    filters: {
      dateRange: 'last30days',
      metrics: ['consultationCount', 'revenue', 'averageRating'],
      groupBy: 'expert',
    },
  },
  {
    id: '4',
    name: 'Document Processing Efficiency',
    description: 'Document processing times and success rates',
    type: 'documents',
    createdAt: new Date('2023-07-10'),
    lastRun: new Date('2023-08-01'),
    schedule: 'weekly',
    filters: {
      dateRange: 'last3months',
      metrics: ['documentCount', 'processingTime', 'successRate'],
      groupBy: 'documentType',
    },
  },
];

// Mock data for report types
const reportTypes = [
  { id: 'users', name: 'User Reports', icon: <UsersIcon className="h-5 w-5" /> },
  { id: 'cases', name: 'Case Reports', icon: <FileTextIcon className="h-5 w-5" /> },
  { id: 'consultations', name: 'Consultation Reports', icon: <CalendarIcon className="h-5 w-5" /> },
  { id: 'documents', name: 'Document Reports', icon: <FileIcon className="h-5 w-5" /> },
  { id: 'custom', name: 'Custom Reports', icon: <SettingsIcon className="h-5 w-5" /> },
];

// Mock data for metrics by report type
const metricsByType = {
  users: [
    { id: 'totalUsers', name: 'Total Users' },
    { id: 'newUsers', name: 'New Users' },
    { id: 'activeUsers', name: 'Active Users' },
    { id: 'retentionRate', name: 'Retention Rate' },
    { id: 'churnRate', name: 'Churn Rate' },
  ],
  cases: [
    { id: 'caseCount', name: 'Case Count' },
    { id: 'approvalRate', name: 'Approval Rate' },
    { id: 'rejectionRate', name: 'Rejection Rate' },
    { id: 'processingTime', name: 'Processing Time' },
    { id: 'completionRate', name: 'Completion Rate' },
  ],
  consultations: [
    { id: 'consultationCount', name: 'Consultation Count' },
    { id: 'revenue', name: 'Revenue' },
    { id: 'averageRating', name: 'Average Rating' },
    { id: 'completionRate', name: 'Completion Rate' },
    { id: 'cancellationRate', name: 'Cancellation Rate' },
  ],
  documents: [
    { id: 'documentCount', name: 'Document Count' },
    { id: 'processingTime', name: 'Processing Time' },
    { id: 'successRate', name: 'Success Rate' },
    { id: 'errorRate', name: 'Error Rate' },
    { id: 'extractionAccuracy', name: 'Extraction Accuracy' },
  ],
  custom: [
    { id: 'customMetric1', name: 'Custom Metric 1' },
    { id: 'customMetric2', name: 'Custom Metric 2' },
    { id: 'customMetric3', name: 'Custom Metric 3' },
  ],
};

// Mock data for grouping options
const groupingOptions = [
  { id: 'day', name: 'Day' },
  { id: 'week', name: 'Week' },
  { id: 'month', name: 'Month' },
  { id: 'quarter', name: 'Quarter' },
  { id: 'year', name: 'Year' },
  { id: 'status', name: 'Status' },
  { id: 'type', name: 'Type' },
  { id: 'expert', name: 'Expert' },
  { id: 'user', name: 'User' },
  { id: 'documentType', name: 'Document Type' },
];

// Mock data for visualization types
const visualizationTypes = [
  { id: 'table', name: 'Table', icon: <TableIcon className="h-5 w-5" /> },
  { id: 'bar', name: 'Bar Chart', icon: <BarChart3Icon className="h-5 w-5" /> },
  { id: 'line', name: 'Line Chart', icon: <LineChartIcon className="h-5 w-5" /> },
  { id: 'pie', name: 'Pie Chart', icon: <PieChartIcon className="h-5 w-5" /> },
];

// Mock data for schedule options
const scheduleOptions = [
  { id: 'none', name: 'No Schedule' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
];

// Mock icons for UI
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ReportBuilderPage() {
  const router = useRouter();
  const [savedReports, setSavedReports] = useState(mockSavedReports);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  // New report form state
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState('month');
  const [visualization, setVisualization] = useState('table');
  const [schedule, setSchedule] = useState('none');
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!showNewReportDialog) {
      setReportName('');
      setReportDescription('');
      setReportType('');
      setDateRange('last30days');
      setSelectedMetrics([]);
      setGroupBy('month');
      setVisualization('table');
      setSchedule('none');
    }
  }, [showNewReportDialog]);
  
  // Handle metric selection
  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter(id => id !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };
  
  // Handle report creation
  const handleCreateReport = () => {
    // Validate form
    if (!reportName || !reportType || selectedMetrics.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create new report
    const newReport = {
      id: Math.random().toString(36).substring(2, 9),
      name: reportName,
      description: reportDescription,
      type: reportType,
      createdAt: new Date(),
      lastRun: new Date(),
      schedule,
      filters: {
        dateRange,
        metrics: selectedMetrics,
        groupBy,
      },
    };
    
    // Add to saved reports
    setSavedReports([newReport, ...savedReports]);
    
    // Close dialog
    setShowNewReportDialog(false);
    
    // Navigate to report view
    router.push(`/admin/reports/${newReport.id}`);
  };
  
  // Handle report deletion
  const handleDeleteReport = () => {
    if (reportToDelete) {
      setSavedReports(savedReports.filter(report => report.id !== reportToDelete));
      setReportToDelete(null);
      setShowDeleteDialog(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Report Builder</h1>
          <p className="text-gray-500">Create and manage custom reports</p>
        </div>
        
        <Button onClick={() => setShowNewReportDialog(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New Report
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <Tabs defaultValue="saved" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="saved">Saved Reports</TabsTrigger>
            <TabsTrigger value="recent">Recently Run</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved">
            {savedReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{report.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {report.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {report.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="text-sm text-gray-500 mb-2">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Last run: {report.lastRun.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <FilterIcon className="h-4 w-4 mr-1" />
                          Metrics: {report.filters.metrics.length}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/reports/${report.id}`}>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Run
                        </Link>
                      </Button>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/reports/${report.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setReportToDelete(report.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reports</h3>
                <p className="text-gray-500 mb-4">Create your first report to get started</p>
                <Button onClick={() => setShowNewReportDialog(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Report
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recently run reports</h3>
              <p className="text-gray-500 mb-4">Run a report to see it here</p>
              <Button onClick={() => setShowNewReportDialog(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Report
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduled">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
              <p className="text-gray-500 mb-4">Schedule a report to see it here</p>
              <Button onClick={() => setShowNewReportDialog(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Configure your custom report
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Report Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    placeholder="Enter description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{type.icon}</span>
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last7days">Last 7 Days</SelectItem>
                      <SelectItem value="last30days">Last 30 Days</SelectItem>
                      <SelectItem value="last3months">Last 3 Months</SelectItem>
                      <SelectItem value="last6months">Last 6 Months</SelectItem>
                      <SelectItem value="lastyear">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group By
                  </label>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupingOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visualization
                  </label>
                  <Select value={visualization} onValueChange={setVisualization}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visualization" />
                    </SelectTrigger>
                    <SelectContent>
                      {visualizationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{type.icon}</span>
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <Select value={schedule} onValueChange={setSchedule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Metrics <span className="text-red-500">*</span></h3>
              
              {reportType ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {metricsByType[reportType as keyof typeof metricsByType]?.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => toggleMetric(metric.id)}
                      />
                      <label
                        htmlFor={metric.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {metric.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Select a report type to see available metrics</p>
                </div>
              )}
              
              {reportType && selectedMetrics.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected Metrics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMetrics.map((metricId) => {
                      const metric = metricsByType[reportType as keyof typeof metricsByType]?.find(m => m.id === metricId);
                      return (
                        <Badge key={metricId} variant="outline" className="flex items-center">
                          {metric?.name}
                          <button
                            type="button"
                            onClick={() => toggleMetric(metricId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>
              <SaveIcon className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReport}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
