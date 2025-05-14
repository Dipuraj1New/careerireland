'use client';

import React, { useState } from 'react';
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
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Send,
  User,
  XCircle
} from 'lucide-react';
import { CaseStatus, CasePriority, VisaType } from '@/types/case';
import { DocumentStatus, DocumentType } from '@/types/document';

interface CaseDetailViewProps {
  caseData: any;
  documents: any[];
  timeline: any[];
  onStatusChange: (newStatus: CaseStatus) => Promise<void>;
  onPriorityChange: (newPriority: CasePriority) => Promise<void>;
  onDocumentStatusChange: (documentId: string, newStatus: DocumentStatus) => Promise<void>;
}

export default function CaseDetailView({
  caseData,
  documents,
  timeline,
  onStatusChange,
  onPriorityChange,
  onDocumentStatusChange
}: CaseDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showPriorityOptions, setShowPriorityOptions] = useState(false);
  const [note, setNote] = useState('');

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

  const getDocumentStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      case DocumentStatus.APPROVED:
        return <Badge variant="success">Approved</Badge>;
      case DocumentStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case DocumentStatus.EXPIRED:
        return <Badge variant="warning">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    try {
      setIsUpdating(true);
      await onStatusChange(newStatus);
      setShowStatusOptions(false);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: CasePriority) => {
    try {
      setIsUpdating(true);
      await onPriorityChange(newPriority);
      setShowPriorityOptions(false);
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDocumentStatusChange = async (documentId: string, newStatus: DocumentStatus) => {
    try {
      setIsUpdating(true);
      await onDocumentStatusChange(documentId, newStatus);
    } catch (error) {
      console.error('Error updating document status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddNote = () => {
    // Add note logic
    setNote('');
  };

  const handleMessageApplicant = () => {
    router.push(`/messages?caseId=${caseData.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">Case #{caseData.id.substring(0, 8)}</h1>
          {getStatusBadge(caseData.status)}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleMessageApplicant}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Applicant
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Case
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Case Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Case Overview</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowStatusOptions(!showStatusOptions)}
                      disabled={isUpdating}
                    >
                      Status: {caseData.status}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    {showStatusOptions && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-10 border">
                        <div className="py-1">
                          {Object.values(CaseStatus).map((status) => (
                            <button
                              key={status}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => handleStatusChange(status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPriorityOptions(!showPriorityOptions)}
                      disabled={isUpdating}
                    >
                      Priority: {caseData.priority}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    {showPriorityOptions && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-10 border">
                        <div className="py-1">
                          {Object.values(CasePriority).map((priority) => (
                            <button
                              key={priority}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => handlePriorityChange(priority)}
                            >
                              {priority}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription>
                {caseData.visaType} Visa Application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Applicant</h3>
                  <p className="mt-1">{caseData.applicant.firstName} {caseData.applicant.lastName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="mt-1">{caseData.applicant.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nationality</h3>
                  <p className="mt-1">{caseData.applicant.nationality || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                  <p className="mt-1">{caseData.applicant.dateOfBirth ? new Date(caseData.applicant.dateOfBirth).toLocaleDateString() : 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="mt-1">{new Date(caseData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="mt-1">{new Date(caseData.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1">{caseData.description || 'No description provided.'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Required and submitted documents for this case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">No documents uploaded</TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.fileName}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getDocumentStatusBadge(doc.status)}
                            <div className="relative">
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              <div className="absolute hidden group-hover:block right-0 mt-2 w-48 rounded-md shadow-lg bg-white z-10 border">
                                <div className="py-1">
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                                    onClick={() => handleDocumentStatusChange(doc.id, DocumentStatus.APPROVED)}
                                  >
                                    Mark as Approved
                                  </button>
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                                    onClick={() => handleDocumentStatusChange(doc.id, DocumentStatus.REJECTED)}
                                  >
                                    Mark as Rejected
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Timeline and Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
              <CardDescription>
                History of case activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {event.type === 'status_change' && <Clock className="h-4 w-4 text-primary" />}
                        {event.type === 'document_upload' && <Paperclip className="h-4 w-4 text-primary" />}
                        {event.type === 'note_added' && <MessageSquare className="h-4 w-4 text-primary" />}
                        {event.type === 'document_status_change' && <FileText className="h-4 w-4 text-primary" />}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Add Note</CardTitle>
              <CardDescription>
                Add a note to this case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Enter your note here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddNote} disabled={!note.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
