'use client';

import React, { useState, useEffect } from 'react';
import { 
  FormTemplate, 
  FormTemplateVersion, 
  FormTemplateStatus,
  FormField,
  FormSection
} from '@/types/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Plus, Minus, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TemplateVersionComparisonProps {
  templateId: string;
}

const TemplateVersionComparison: React.FC<TemplateVersionComparisonProps> = ({
  templateId,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [versions, setVersions] = useState<FormTemplateVersion[]>([]);
  const [sourceVersionId, setSourceVersionId] = useState<string>('');
  const [targetVersionId, setTargetVersionId] = useState<string>('');
  const [sourceVersion, setSourceVersion] = useState<FormTemplateVersion | null>(null);
  const [targetVersion, setTargetVersion] = useState<FormTemplateVersion | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');

  // Fetch template and versions
  useEffect(() => {
    const fetchTemplateAndVersions = async () => {
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
        
        // Set default versions for comparison (latest and previous)
        if (versionsData.versions.length >= 2) {
          setSourceVersionId(versionsData.versions[1].id);
          setTargetVersionId(versionsData.versions[0].id);
        } else if (versionsData.versions.length === 1) {
          setSourceVersionId(versionsData.versions[0].id);
          setTargetVersionId(versionsData.versions[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching template data:', error);
        setError(error.message || 'An error occurred while fetching template data');
      } finally {
        setLoading(false);
      }
    };
    
    if (templateId) {
      fetchTemplateAndVersions();
    }
  }, [templateId]);

  // Update source and target versions when selections change
  useEffect(() => {
    if (sourceVersionId) {
      const source = versions.find(v => v.id === sourceVersionId) || null;
      setSourceVersion(source);
    }
    
    if (targetVersionId) {
      const target = versions.find(v => v.id === targetVersionId) || null;
      setTargetVersion(target);
    }
  }, [sourceVersionId, targetVersionId, versions]);

  // Helper function to get status badge
  const getStatusBadge = (status: FormTemplateStatus) => {
    switch (status) {
      case FormTemplateStatus.ACTIVE:
        return <Badge className="bg-green-500">Active</Badge>;
      case FormTemplateStatus.DRAFT:
        return <Badge className="bg-yellow-500">Draft</Badge>;
      case FormTemplateStatus.DEPRECATED:
        return <Badge className="bg-red-500">Deprecated</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Helper function to compare arrays
  const compareArrays = <T extends unknown>(
    sourceArray: T[] = [],
    targetArray: T[] = [],
    getKey: (item: T) => string
  ) => {
    const sourceMap = new Map(sourceArray.map(item => [getKey(item), item]));
    const targetMap = new Map(targetArray.map(item => [getKey(item), item]));
    
    const added = targetArray.filter(item => !sourceMap.has(getKey(item)));
    const removed = sourceArray.filter(item => !targetMap.has(getKey(item)));
    const modified: { source: T; target: T }[] = [];
    
    sourceArray.forEach(sourceItem => {
      const key = getKey(sourceItem);
      if (targetMap.has(key)) {
        const targetItem = targetMap.get(key)!;
        if (JSON.stringify(sourceItem) !== JSON.stringify(targetItem)) {
          modified.push({ source: sourceItem, target: targetItem });
        }
      }
    });
    
    return { added, removed, modified };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading template versions...</span>
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

  if (!template || versions.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-800">
        <h3 className="font-medium">No Data</h3>
        <p>No template or version data available for comparison.</p>
      </div>
    );
  }

  // Compare fields
  const fieldComparison = sourceVersion && targetVersion
    ? compareArrays(
        sourceVersion.fields,
        targetVersion.fields,
        field => field.id
      )
    : { added: [], removed: [], modified: [] };

  // Compare sections
  const sectionComparison = sourceVersion && targetVersion
    ? compareArrays(
        sourceVersion.templateData?.sections || [],
        targetVersion.templateData?.sections || [],
        section => section.id
      )
    : { added: [], removed: [], modified: [] };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Version Comparison</CardTitle>
          <CardDescription>
            Compare different versions of the template to see what has changed
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
          
          {sourceVersion && targetVersion && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Version {sourceVersion.version}</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Version {targetVersion.version}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Name</TableCell>
                      <TableCell>{sourceVersion.name}</TableCell>
                      <TableCell className="text-center">
                        {sourceVersion.name !== targetVersion.name && <ArrowRight className="inline h-4 w-4" />}
                      </TableCell>
                      <TableCell>{targetVersion.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Description</TableCell>
                      <TableCell>{sourceVersion.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        {sourceVersion.description !== targetVersion.description && <ArrowRight className="inline h-4 w-4" />}
                      </TableCell>
                      <TableCell>{targetVersion.description || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Status</TableCell>
                      <TableCell>{getStatusBadge(sourceVersion.status)}</TableCell>
                      <TableCell className="text-center">
                        {sourceVersion.status !== targetVersion.status && <ArrowRight className="inline h-4 w-4" />}
                      </TableCell>
                      <TableCell>{getStatusBadge(targetVersion.status)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Created At</TableCell>
                      <TableCell>{formatDate(sourceVersion.createdAt)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell>{formatDate(targetVersion.createdAt)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Created By</TableCell>
                      <TableCell>{sourceVersion.createdBy}</TableCell>
                      <TableCell></TableCell>
                      <TableCell>{targetVersion.createdBy}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="fields">
                <div className="space-y-4">
                  {fieldComparison.added.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Plus className="h-4 w-4 mr-1 text-green-500" />
                        Added Fields
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldComparison.added.map(field => (
                            <TableRow key={`added-${field.id}`} className="bg-green-50">
                              <TableCell>{field.name}</TableCell>
                              <TableCell>{field.label}</TableCell>
                              <TableCell>{field.type}</TableCell>
                              <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {fieldComparison.removed.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Minus className="h-4 w-4 mr-1 text-red-500" />
                        Removed Fields
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldComparison.removed.map(field => (
                            <TableRow key={`removed-${field.id}`} className="bg-red-50">
                              <TableCell>{field.name}</TableCell>
                              <TableCell>{field.label}</TableCell>
                              <TableCell>{field.type}</TableCell>
                              <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {fieldComparison.modified.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Edit className="h-4 w-4 mr-1 text-blue-500" />
                        Modified Fields
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Version {sourceVersion.version}</TableHead>
                            <TableHead></TableHead>
                            <TableHead>Version {targetVersion.version}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldComparison.modified.map(({ source, target }) => (
                            <React.Fragment key={`modified-${source.id}`}>
                              <TableRow className="bg-blue-50">
                                <TableCell colSpan={4} className="font-medium">
                                  Field: {source.name}
                                </TableCell>
                              </TableRow>
                              {source.label !== target.label && (
                                <TableRow>
                                  <TableCell>Label</TableCell>
                                  <TableCell>{source.label}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="inline h-4 w-4" />
                                  </TableCell>
                                  <TableCell>{target.label}</TableCell>
                                </TableRow>
                              )}
                              {source.type !== target.type && (
                                <TableRow>
                                  <TableCell>Type</TableCell>
                                  <TableCell>{source.type}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="inline h-4 w-4" />
                                  </TableCell>
                                  <TableCell>{target.type}</TableCell>
                                </TableRow>
                              )}
                              {source.required !== target.required && (
                                <TableRow>
                                  <TableCell>Required</TableCell>
                                  <TableCell>{source.required ? 'Yes' : 'No'}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="inline h-4 w-4" />
                                  </TableCell>
                                  <TableCell>{target.required ? 'Yes' : 'No'}</TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {fieldComparison.added.length === 0 && 
                   fieldComparison.removed.length === 0 && 
                   fieldComparison.modified.length === 0 && (
                    <div className="text-center p-4 text-gray-500">
                      No field changes between these versions
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="sections">
                <div className="space-y-4">
                  {sectionComparison.added.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Plus className="h-4 w-4 mr-1 text-green-500" />
                        Added Sections
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Fields</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionComparison.added.map(section => (
                            <TableRow key={`added-section-${section.id}`} className="bg-green-50">
                              <TableCell>{section.title}</TableCell>
                              <TableCell>{section.description || '-'}</TableCell>
                              <TableCell>{section.fields?.length || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {sectionComparison.removed.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Minus className="h-4 w-4 mr-1 text-red-500" />
                        Removed Sections
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Fields</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionComparison.removed.map(section => (
                            <TableRow key={`removed-section-${section.id}`} className="bg-red-50">
                              <TableCell>{section.title}</TableCell>
                              <TableCell>{section.description || '-'}</TableCell>
                              <TableCell>{section.fields?.length || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {sectionComparison.modified.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Edit className="h-4 w-4 mr-1 text-blue-500" />
                        Modified Sections
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Version {sourceVersion.version}</TableHead>
                            <TableHead></TableHead>
                            <TableHead>Version {targetVersion.version}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionComparison.modified.map(({ source, target }) => (
                            <React.Fragment key={`modified-section-${source.id}`}>
                              <TableRow className="bg-blue-50">
                                <TableCell colSpan={4} className="font-medium">
                                  Section: {source.title}
                                </TableCell>
                              </TableRow>
                              {source.title !== target.title && (
                                <TableRow>
                                  <TableCell>Title</TableCell>
                                  <TableCell>{source.title}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="inline h-4 w-4" />
                                  </TableCell>
                                  <TableCell>{target.title}</TableCell>
                                </TableRow>
                              )}
                              {source.description !== target.description && (
                                <TableRow>
                                  <TableCell>Description</TableCell>
                                  <TableCell>{source.description || '-'}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="inline h-4 w-4" />
                                  </TableCell>
                                  <TableCell>{target.description || '-'}</TableCell>
                                </TableRow>
                              )}
                              {(source.fields?.length || 0) !== (target.fields?.length || 0) && (
                                <TableRow>
                                  <TableCell>Fields Count</TableCell>
                                  <TableCell>{source.fields?.length || 0}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="inline h-4 w-4" />
                                  </TableCell>
                                  <TableCell>{target.fields?.length || 0}</TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {sectionComparison.added.length === 0 && 
                   sectionComparison.removed.length === 0 && 
                   sectionComparison.modified.length === 0 && (
                    <div className="text-center p-4 text-gray-500">
                      No section changes between these versions
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="layout">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Version {sourceVersion.version}</TableHead>
                        <TableHead></TableHead>
                        <TableHead>Version {targetVersion.version}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Page Size</TableCell>
                        <TableCell>{sourceVersion.templateData?.pageSize || 'A4'}</TableCell>
                        <TableCell className="text-center">
                          {sourceVersion.templateData?.pageSize !== targetVersion.templateData?.pageSize && 
                            <ArrowRight className="inline h-4 w-4" />}
                        </TableCell>
                        <TableCell>{targetVersion.templateData?.pageSize || 'A4'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Orientation</TableCell>
                        <TableCell>{sourceVersion.templateData?.orientation || 'portrait'}</TableCell>
                        <TableCell className="text-center">
                          {sourceVersion.templateData?.orientation !== targetVersion.templateData?.orientation && 
                            <ArrowRight className="inline h-4 w-4" />}
                        </TableCell>
                        <TableCell>{targetVersion.templateData?.orientation || 'portrait'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Margins</TableCell>
                        <TableCell>
                          {sourceVersion.templateData?.margins ? 
                            `T:${sourceVersion.templateData.margins.top} R:${sourceVersion.templateData.margins.right} B:${sourceVersion.templateData.margins.bottom} L:${sourceVersion.templateData.margins.left}` : 
                            'Default'}
                        </TableCell>
                        <TableCell className="text-center">
                          {JSON.stringify(sourceVersion.templateData?.margins) !== JSON.stringify(targetVersion.templateData?.margins) && 
                            <ArrowRight className="inline h-4 w-4" />}
                        </TableCell>
                        <TableCell>
                          {targetVersion.templateData?.margins ? 
                            `T:${targetVersion.templateData.margins.top} R:${targetVersion.templateData.margins.right} B:${targetVersion.templateData.margins.bottom} L:${targetVersion.templateData.margins.left}` : 
                            'Default'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Font Size</TableCell>
                        <TableCell>{sourceVersion.templateData?.styling?.fontSize || 'Default'}</TableCell>
                        <TableCell className="text-center">
                          {sourceVersion.templateData?.styling?.fontSize !== targetVersion.templateData?.styling?.fontSize && 
                            <ArrowRight className="inline h-4 w-4" />}
                        </TableCell>
                        <TableCell>{targetVersion.templateData?.styling?.fontSize || 'Default'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Line Height</TableCell>
                        <TableCell>{sourceVersion.templateData?.styling?.lineHeight || 'Default'}</TableCell>
                        <TableCell className="text-center">
                          {sourceVersion.templateData?.styling?.lineHeight !== targetVersion.templateData?.styling?.lineHeight && 
                            <ArrowRight className="inline h-4 w-4" />}
                        </TableCell>
                        <TableCell>{targetVersion.templateData?.styling?.lineHeight || 'Default'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Primary Color</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {sourceVersion.templateData?.styling?.primaryColor && (
                              <div 
                                className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                                style={{ backgroundColor: sourceVersion.templateData.styling.primaryColor }}
                              />
                            )}
                            {sourceVersion.templateData?.styling?.primaryColor || 'Default'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {sourceVersion.templateData?.styling?.primaryColor !== targetVersion.templateData?.styling?.primaryColor && 
                            <ArrowRight className="inline h-4 w-4" />}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {targetVersion.templateData?.styling?.primaryColor && (
                              <div 
                                className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                                style={{ backgroundColor: targetVersion.templateData.styling.primaryColor }}
                              />
                            )}
                            {targetVersion.templateData?.styling?.primaryColor || 'Default'}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateVersionComparison;
