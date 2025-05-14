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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Plus, 
  RefreshCw,
  Trash,
  Clock
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  ReportType, 
  ReportFormat, 
  ComplianceReport 
} from '@/types/security';
import { UserRole } from '@/types/user';

interface ComplianceReportingInterfaceProps {
  isAdmin: boolean;
}

export default function ComplianceReportingInterface({ isAdmin }: ComplianceReportingInterfaceProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState<boolean>(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState<boolean>(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: ReportType.COMPLIANCE_SUMMARY,
    format: ReportFormat.PDF,
    parameters: {}
  });
  const [emailDetails, setEmailDetails] = useState({
    recipients: '',
    subject: '',
    message: ''
  });
  const [scheduleDetails, setScheduleDetails] = useState({
    frequency: 'monthly',
    recipients: '',
    startDate: new Date()
  });

  useEffect(() => {
    if (session && isAdmin) {
      fetchReports();
    }
  }, [session, isAdmin]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/reports');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching reports');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load compliance reports',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReport)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }
      
      const report = await response.json();
      
      setReports(prev => [report, ...prev]);
      setIsGenerateDialogOpen(false);
      setNewReport({
        name: '',
        description: '',
        type: ReportType.COMPLIANCE_SUMMARY,
        format: ReportFormat.PDF,
        parameters: {}
      });
      
      toast({
        title: 'Success',
        description: 'Compliance report generated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedReport) return;
    
    try {
      const recipients = emailDetails.recipients.split(',').map(email => email.trim());
      
      const response = await fetch(`/api/compliance/reports/${selectedReport.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients,
          subject: emailDetails.subject,
          message: emailDetails.message
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send report');
      }
      
      setIsEmailDialogOpen(false);
      setEmailDetails({
        recipients: '',
        subject: '',
        message: ''
      });
      
      toast({
        title: 'Success',
        description: 'Report sent by email successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send report by email',
        variant: 'destructive'
      });
    }
  };

  const handleScheduleReport = async () => {
    try {
      const recipients = scheduleDetails.recipients.split(',').map(email => email.trim());
      
      const response = await fetch('/api/compliance/reports/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newReport.name,
          description: newReport.description,
          type: newReport.type,
          format: newReport.format,
          parameters: newReport.parameters,
          frequency: scheduleDetails.frequency,
          recipients,
          startDate: scheduleDetails.startDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule report');
      }
      
      setIsScheduleDialogOpen(false);
      setScheduleDetails({
        frequency: 'monthly',
        recipients: '',
        startDate: new Date()
      });
      
      toast({
        title: 'Success',
        description: 'Report scheduled successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to schedule report',
        variant: 'destructive'
      });
    }
  };

  const downloadReport = (report: ComplianceReport) => {
    if (!report.filePath) {
      toast({
        title: 'Error',
        description: 'Report file not available',
        variant: 'destructive'
      });
      return;
    }
    
    window.open(`/${report.filePath}`, '_blank');
  };

  const getReportTypeName = (type: ReportType): string => {
    switch (type) {
      case ReportType.COMPLIANCE_SUMMARY:
        return 'Compliance Summary';
      case ReportType.GDPR_COMPLIANCE:
        return 'GDPR Compliance';
      case ReportType.DATA_PROTECTION:
        return 'Data Protection';
      case ReportType.CONSENT_MANAGEMENT:
        return 'Consent Management';
      case ReportType.ACCESS_CONTROL:
        return 'Access Control';
      case ReportType.AUDIT_LOG:
        return 'Audit Log';
      case ReportType.CUSTOM:
        return 'Custom Report';
      default:
        return 'Unknown';
    }
  };

  const getReportFormatName = (format: ReportFormat): string => {
    switch (format) {
      case ReportFormat.PDF:
        return 'PDF';
      case ReportFormat.CSV:
        return 'CSV';
      case ReportFormat.JSON:
        return 'JSON';
      case ReportFormat.HTML:
        return 'HTML';
      default:
        return 'Unknown';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Reporting</CardTitle>
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
        <h2 className="text-2xl font-bold">Compliance Reporting</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsScheduleDialogOpen(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">Generated Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                View and manage compliance reports that have been generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No reports have been generated yet. Click "Generate Report" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>{report.name}</TableCell>
                        <TableCell>{getReportTypeName(report.type)}</TableCell>
                        <TableCell>{getReportFormatName(report.format)}</TableCell>
                        <TableCell>
                          {format(new Date(report.generatedAt), 'PPp')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadReport(report)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setEmailDetails({
                                  recipients: '',
                                  subject: `Compliance Report: ${report.name}`,
                                  message: `Please find attached the compliance report "${report.name}" generated on ${format(new Date(report.generatedAt), 'PPp')}.`
                                });
                                setIsEmailDialogOpen(true);
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                View and manage scheduled compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                Scheduled reports feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Generate Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Compliance Report</DialogTitle>
            <DialogDescription>
              Create a new compliance report with the selected parameters.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newReport.name}
                onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newReport.description}
                onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Report Type
              </Label>
              <Select
                value={newReport.type}
                onValueChange={(value) => setNewReport({...newReport, type: value as ReportType})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportType.COMPLIANCE_SUMMARY}>Compliance Summary</SelectItem>
                  <SelectItem value={ReportType.GDPR_COMPLIANCE}>GDPR Compliance</SelectItem>
                  <SelectItem value={ReportType.DATA_PROTECTION}>Data Protection</SelectItem>
                  <SelectItem value={ReportType.CONSENT_MANAGEMENT}>Consent Management</SelectItem>
                  <SelectItem value={ReportType.ACCESS_CONTROL}>Access Control</SelectItem>
                  <SelectItem value={ReportType.AUDIT_LOG}>Audit Log</SelectItem>
                  <SelectItem value={ReportType.CUSTOM}>Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <Select
                value={newReport.format}
                onValueChange={(value) => setNewReport({...newReport, format: value as ReportFormat})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportFormat.PDF}>PDF</SelectItem>
                  <SelectItem value={ReportFormat.CSV}>CSV</SelectItem>
                  <SelectItem value={ReportFormat.JSON}>JSON</SelectItem>
                  <SelectItem value={ReportFormat.HTML}>HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={!newReport.name || isGenerating}
            >
              {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email Report Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
            <DialogDescription>
              Send the selected report by email to recipients.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipients" className="text-right">
                Recipients
              </Label>
              <Input
                id="recipients"
                value={emailDetails.recipients}
                onChange={(e) => setEmailDetails({...emailDetails, recipients: e.target.value})}
                placeholder="email@example.com, email2@example.com"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                value={emailDetails.subject}
                onChange={(e) => setEmailDetails({...emailDetails, subject: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={emailDetails.message}
                onChange={(e) => setEmailDetails({...emailDetails, message: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={!emailDetails.recipients || !emailDetails.subject}
            >
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Report Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Recurring Report</DialogTitle>
            <DialogDescription>
              Set up a recurring compliance report generation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Report Name
              </Label>
              <Input
                id="name"
                value={newReport.name}
                onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Report Type
              </Label>
              <Select
                value={newReport.type}
                onValueChange={(value) => setNewReport({...newReport, type: value as ReportType})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportType.COMPLIANCE_SUMMARY}>Compliance Summary</SelectItem>
                  <SelectItem value={ReportType.GDPR_COMPLIANCE}>GDPR Compliance</SelectItem>
                  <SelectItem value={ReportType.DATA_PROTECTION}>Data Protection</SelectItem>
                  <SelectItem value={ReportType.CONSENT_MANAGEMENT}>Consent Management</SelectItem>
                  <SelectItem value={ReportType.ACCESS_CONTROL}>Access Control</SelectItem>
                  <SelectItem value={ReportType.AUDIT_LOG}>Audit Log</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <Select
                value={newReport.format}
                onValueChange={(value) => setNewReport({...newReport, format: value as ReportFormat})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportFormat.PDF}>PDF</SelectItem>
                  <SelectItem value={ReportFormat.CSV}>CSV</SelectItem>
                  <SelectItem value={ReportFormat.JSON}>JSON</SelectItem>
                  <SelectItem value={ReportFormat.HTML}>HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipients" className="text-right">
                Recipients
              </Label>
              <Input
                id="recipients"
                value={scheduleDetails.recipients}
                onChange={(e) => setScheduleDetails({...scheduleDetails, recipients: e.target.value})}
                placeholder="email@example.com, email2@example.com"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleReport} 
              disabled={!newReport.name || !scheduleDetails.recipients}
            >
              Schedule Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
