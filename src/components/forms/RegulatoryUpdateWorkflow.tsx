'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FormTemplate, 
  FormTemplateStatus,
  FormTemplateUpdateData
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2, FileText, ClipboardList, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface RegulatoryUpdateWorkflowProps {
  templateId: string;
}

// Form schema for regulatory update
const regulatoryUpdateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  regulatoryReference: z.string().min(3, "Regulatory reference is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  changeDescription: z.string().min(10, "Change description must be at least 10 characters"),
  notifyUsers: z.boolean().default(true),
  createNewVersion: z.boolean().default(true),
  deprecateOldVersion: z.boolean().default(false),
});

type RegulatoryUpdateFormValues = z.infer<typeof regulatoryUpdateSchema>;

const RegulatoryUpdateWorkflow: React.FC<RegulatoryUpdateWorkflowProps> = ({
  templateId,
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  const [completedUpdates, setCompletedUpdates] = useState<any[]>([]);

  // Initialize form
  const form = useForm<RegulatoryUpdateFormValues>({
    resolver: zodResolver(regulatoryUpdateSchema),
    defaultValues: {
      title: "",
      description: "",
      regulatoryReference: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      changeDescription: "",
      notifyUsers: true,
      createNewVersion: true,
      deprecateOldVersion: false,
    },
  });

  // Fetch template and regulatory updates
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
        
        // Fetch regulatory updates
        const updatesResponse = await fetch(`/api/forms/templates/${templateId}/regulatory-updates`);
        if (updatesResponse.ok) {
          const updatesData = await updatesResponse.json();
          
          // Split updates into pending and completed
          const pending: any[] = [];
          const completed: any[] = [];
          
          updatesData.updates.forEach((update: any) => {
            if (update.status === 'completed') {
              completed.push(update);
            } else {
              pending.push(update);
            }
          });
          
          setPendingUpdates(pending);
          setCompletedUpdates(completed);
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

  // Handle form submission
  const onSubmit = async (values: RegulatoryUpdateFormValues) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Create regulatory update
      const response = await fetch(`/api/forms/templates/${templateId}/regulatory-updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create regulatory update');
      }
      
      // If createNewVersion is true, create a new template version
      if (values.createNewVersion) {
        const updateData: FormTemplateUpdateData = {
          // No changes to the template data yet, just creating a new version
          // with the same content but a regulatory update reference
          regulatoryUpdateReference: {
            title: values.title,
            reference: values.regulatoryReference,
            effectiveDate: values.effectiveDate,
          },
        };
        
        const templateResponse = await fetch(`/api/forms/templates/${templateId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updateData,
            createNewVersion: true,
          }),
        });
        
        if (!templateResponse.ok) {
          const errorData = await templateResponse.json();
          throw new Error(errorData.error || 'Failed to create new template version');
        }
        
        // If deprecateOldVersion is true, deprecate the old version
        if (values.deprecateOldVersion) {
          const deprecateResponse = await fetch(`/api/forms/templates/${templateId}/deprecate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!deprecateResponse.ok) {
            const errorData = await deprecateResponse.json();
            throw new Error(errorData.error || 'Failed to deprecate old template version');
          }
        }
      }
      
      // Show success message and reset form
      setUpdateSuccess(true);
      form.reset();
      
      // Refresh data
      const updatesResponse = await fetch(`/api/forms/templates/${templateId}/regulatory-updates`);
      if (updatesResponse.ok) {
        const updatesData = await updatesResponse.json();
        
        // Split updates into pending and completed
        const pending: any[] = [];
        const completed: any[] = [];
        
        updatesData.updates.forEach((update: any) => {
          if (update.status === 'completed') {
            completed.push(update);
          } else {
            pending.push(update);
          }
        });
        
        setPendingUpdates(pending);
        setCompletedUpdates(completed);
      }
      
      // Close dialog after a delay
      setTimeout(() => {
        setShowUpdateForm(false);
        setUpdateSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating regulatory update:', error);
      setError(error.message || 'An error occurred while creating the regulatory update');
    } finally {
      setSubmitting(false);
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Regulatory Update Workflow</CardTitle>
              <CardDescription>
                Manage regulatory updates for this form template
              </CardDescription>
            </div>
            <Button onClick={() => setShowUpdateForm(true)}>
              Create Regulatory Update
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Template Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{template.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Version</p>
                <p className="font-medium">{template.version}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  {template.status === FormTemplateStatus.ACTIVE && (
                    <Badge className="bg-green-500">Active</Badge>
                  )}
                  {template.status === FormTemplateStatus.DRAFT && (
                    <Badge className="bg-yellow-500">Draft</Badge>
                  )}
                  {template.status === FormTemplateStatus.DEPRECATED && (
                    <Badge className="bg-red-500">Deprecated</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(template.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center">
                <ClipboardList className="h-4 w-4 mr-2" />
                Pending Updates
                {pendingUpdates.length > 0 && (
                  <Badge className="ml-2 bg-yellow-500">{pendingUpdates.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed Updates
                {completedUpdates.length > 0 && (
                  <Badge className="ml-2 bg-green-500">{completedUpdates.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {pendingUpdates.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No pending regulatory updates
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {pendingUpdates.map((update, index) => (
                    <AccordionItem key={update.id} value={update.id}>
                      <AccordionTrigger className="hover:bg-gray-50 px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                            <span>{update.title}</span>
                          </div>
                          <Badge className="bg-yellow-500">Pending</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium">Description</h4>
                            <p className="text-sm text-gray-600">{update.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium">Regulatory Reference</h4>
                              <p className="text-sm text-gray-600">{update.regulatoryReference}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Effective Date</h4>
                              <p className="text-sm text-gray-600">{formatDate(update.effectiveDate)}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Change Description</h4>
                            <p className="text-sm text-gray-600">{update.changeDescription}</p>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Implement Update
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {completedUpdates.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No completed regulatory updates
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {completedUpdates.map((update, index) => (
                    <AccordionItem key={update.id} value={update.id}>
                      <AccordionTrigger className="hover:bg-gray-50 px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            <span>{update.title}</span>
                          </div>
                          <Badge className="bg-green-500">Completed</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium">Description</h4>
                            <p className="text-sm text-gray-600">{update.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium">Regulatory Reference</h4>
                              <p className="text-sm text-gray-600">{update.regulatoryReference}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Effective Date</h4>
                              <p className="text-sm text-gray-600">{formatDate(update.effectiveDate)}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Completed Date</h4>
                              <p className="text-sm text-gray-600">{formatDate(update.completedDate)}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Completed By</h4>
                              <p className="text-sm text-gray-600">{update.completedBy}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Implementation Notes</h4>
                            <p className="text-sm text-gray-600">{update.implementationNotes || 'No notes provided'}</p>
                          </div>
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Regulatory Update Form Dialog */}
      <Dialog open={showUpdateForm} onOpenChange={setShowUpdateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Regulatory Update</DialogTitle>
            <DialogDescription>
              Document a regulatory change that requires updates to this form template
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., GDPR Compliance Update" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a brief description of the regulatory update" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="regulatoryReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GDPR Article 13" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="changeDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what changes need to be made to the form template" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notifyUsers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Notify Users</FormLabel>
                      <FormDescription>
                        Send notification to all users about this regulatory update
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="createNewVersion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Create New Version</FormLabel>
                      <FormDescription>
                        Create a new version of the template for this regulatory update
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('createNewVersion') && (
                <FormField
                  control={form.control}
                  name="deprecateOldVersion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ml-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Deprecate Old Version</FormLabel>
                        <FormDescription>
                          Mark the current version as deprecated after creating the new version
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
                  {error}
                </div>
              )}
              
              {updateSuccess && (
                <div className="p-3 rounded-md bg-green-50 text-green-800 text-sm flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Regulatory update created successfully
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUpdateForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Update'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegulatoryUpdateWorkflow;
