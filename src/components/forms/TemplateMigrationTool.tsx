'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FormTemplate, 
  FormTemplateVersion,
  FormSubmission,
  FormSubmissionStatus
} from '@/types/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TemplateMigrationToolProps {
  templateId: string;
}

const TemplateMigrationTool: React.FC<TemplateMigrationToolProps> = ({
  templateId,
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [versions, setVersions] = useState<FormTemplateVersion[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [sourceVersionId, setSourceVersionId] = useState<string>('');
  const [targetVersionId, setTargetVersionId] = useState<string>('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [showMigrationDialog, setShowMigrationDialog] = useState<boolean>(false);
  const [migrating, setMigrating] = useState<boolean>(false);
  const [migrationSuccess, setMigrationSuccess] = useState<boolean>(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch template, versions, and submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch template
        const templateResponse = await fetch(`/api/forms/templates/${templateId}`);
        if (!templateResponse.ok) {
          throw new Error('Failed to fetch template');
        }
        const templateData = await templateResponse.json();
        setTemplate(templateData.template);
        
        // Fetch versions
        const versionsResponse = await fetch(`/api/forms/templates/${templateId}/versions`);
        if (!versionsResponse.ok) {
          throw new Error('Failed to fetch template versions');
        }
        const versionsData = await versionsResponse.json();
        setVersions(versionsData.versions);
        
        // Set default versions for migration (current and previous)
        if (versionsData.versions.length >= 2) {
          setSourceVersionId(versionsData.versions[1].id);
          setTargetVersionId(versionsData.versions[0].id);
        } else if (versionsData.versions.length === 1) {
          setSourceVersionId(versionsData.versions[0].id);
          setTargetVersionId(versionsData.versions[0].id);
        }
        
        // Fetch submissions for this template
        const submissionsResponse = await fetch(`/api/forms/submissions?templateId=${templateId}`);
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setSubmissions(submissionsData.submissions);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    if (templateId && session?.user) {
      fetchData();
    }
  }, [templateId, session]);

  // Filter submissions based on search term and status filter
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || 
      submission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.fileName && submission.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle submission selection
  const handleSubmissionSelect = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId);
      } else {
        return [...prev, submissionId];
      }
    });
  };

  // Handle select all submissions
  const handleSelectAll = () => {
    if (selectedSubmissions.length === filteredSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(filteredSubmissions.map(s => s.id));
    }
  };

  // Handle migration
  const handleMigrate = async () => {
    try {
      setMigrating(true);
      setError(null);
      
      // Call migration API
      const response = await fetch(`/api/forms/templates/${templateId}/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceVersionId,
          targetVersionId,
          submissionIds: selectedSubmissions,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to migrate submissions');
      }
      
      const data = await response.json();
      
      // Show success message
      setMigrationSuccess(true);
      setMigrationResults(data.results);
      
      // Refresh submissions after migration
      const submissionsResponse = await fetch(`/api/forms/submissions?templateId=${templateId}`);
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions);
      }
      
      // Clear selection
      setSelectedSubmissions([]);
    } catch (error: any) {
      console.error('Error migrating submissions:', error);
      setError(error.message || 'An error occurred while migrating submissions');
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading template data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <h3 className="font-medium">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-800">
        <h3 className="font-medium">No Data</h3>
        <p>Template not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Migration Tool</CardTitle>
          <CardDescription>
            Migrate form submissions between different template versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Source Version</label>
              <Select
                value={sourceVersionId}
                onValueChange={setSourceVersionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(version => (
                    <SelectItem key={`source-${version.id}`} value={version.id}>
                      Version {version.version} ({formatDate(version.createdAt)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Version</label>
              <Select
                value={targetVersionId}
                onValueChange={setTargetVersionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(version => (
                    <SelectItem key={`target-${version.id}`} value={version.id}>
                      Version {version.version} ({formatDate(version.createdAt)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Form Submissions</h3>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={FormSubmissionStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={FormSubmissionStatus.GENERATED}>Generated</SelectItem>
                    <SelectItem value={FormSubmissionStatus.SUBMITTED}>Submitted</SelectItem>
                    <SelectItem value={FormSubmissionStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={FormSubmissionStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {submissions.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No submissions found for this template
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedSubmissions.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                          onCheckedChange={handleSelectAll}
                          disabled={filteredSubmissions.length === 0}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No submissions match your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map(submission => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubmissions.includes(submission.id)}
                              onCheckedChange={() => handleSubmissionSelect(submission.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{submission.id}</TableCell>
                          <TableCell>{submission.fileName || 'N/A'}</TableCell>
                          <TableCell>
                            {submission.status === FormSubmissionStatus.DRAFT && (
                              <Badge className="bg-yellow-500">Draft</Badge>
                            )}
                            {submission.status === FormSubmissionStatus.GENERATED && (
                              <Badge className="bg-blue-500">Generated</Badge>
                            )}
                            {submission.status === FormSubmissionStatus.SUBMITTED && (
                              <Badge className="bg-purple-500">Submitted</Badge>
                            )}
                            {submission.status === FormSubmissionStatus.APPROVED && (
                              <Badge className="bg-green-500">Approved</Badge>
                            )}
                            {submission.status === FormSubmissionStatus.REJECTED && (
                              <Badge className="bg-red-500">Rejected</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(submission.createdAt)}</TableCell>
                          <TableCell>{submission.templateVersion}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-sm text-gray-500">
              {selectedSubmissions.length} submissions selected
            </span>
          </div>
          <Button
            onClick={() => setShowMigrationDialog(true)}
            disabled={selectedSubmissions.length === 0 || sourceVersionId === targetVersionId}
          >
            Migrate Selected Submissions
          </Button>
        </CardFooter>
      </Card>
      
      {/* Migration Confirmation Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Confirm Migration</DialogTitle>
            <DialogDescription>
              You are about to migrate {selectedSubmissions.length} submissions from version{' '}
              {versions.find(v => v.id === sourceVersionId)?.version} to version{' '}
              {versions.find(v => v.id === targetVersionId)?.version}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Warning</p>
                <p className="text-sm">
                  This operation will update the form data structure of the selected submissions.
                  Make sure you have backed up your data before proceeding.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Source Version</h3>
                <p className="text-sm text-gray-600">
                  Version {versions.find(v => v.id === sourceVersionId)?.version} ({formatDate(versions.find(v => v.id === sourceVersionId)?.createdAt || new Date())})
                </p>
              </div>
              
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Target Version</h3>
                <p className="text-sm text-gray-600">
                  Version {versions.find(v => v.id === targetVersionId)?.version} ({formatDate(versions.find(v => v.id === targetVersionId)?.createdAt || new Date())})
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Selected Submissions</h3>
                <p className="text-sm text-gray-600">
                  {selectedSubmissions.length} submissions selected for migration
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
              {error}
            </div>
          )}
          
          {migrationSuccess && (
            <div className="p-3 rounded-md bg-green-50 text-green-800 text-sm flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Migration completed successfully
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowMigrationDialog(false)}
              disabled={migrating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMigrate} 
              disabled={migrating || migrationSuccess}
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                'Confirm Migration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateMigrationTool;
