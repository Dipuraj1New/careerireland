'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { UserRole } from '../../types/user';
import { GovernmentPortalType, PortalFieldMapping } from '../../types/portal';

interface FieldMappingInterfaceProps {
  templateId?: string;
  existingMappingId?: string;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormTemplate {
  id: string;
  name: string;
  sections: FormSection[];
  version: string;
}

interface GovernmentPortalField {
  id: string;
  name: string;
  label: string;
  portalId: string;
  required: boolean;
  fieldType: string;
}

interface GovernmentPortal {
  id: string;
  name: string;
  url: string;
  fields: GovernmentPortalField[];
}

interface FieldMapping {
  templateFieldId: string;
  portalFieldId: string;
  transformationRule?: string;
}

interface FieldMappingData {
  id?: string;
  templateId: string;
  portalId: string;
  mappings: FieldMapping[];
  name: string;
  description?: string;
}

export default function FieldMappingInterface({ templateId, existingMappingId }: FieldMappingInterfaceProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [portals, setPortals] = useState<GovernmentPortal[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<GovernmentPortal | null>(null);
  const [mappingData, setMappingData] = useState<FieldMappingData>({
    templateId: templateId || '',
    portalId: '',
    mappings: [],
    name: '',
  });

  // Legacy state for backward compatibility
  const [portalType, setPortalType] = useState<GovernmentPortalType>(GovernmentPortalType.IRISH_IMMIGRATION);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [fieldMappings, setFieldMappings] = useState<PortalFieldMapping[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [newMapping, setNewMapping] = useState<{ formField: string; portalField: string }>({
    formField: '',
    portalField: '',
  });

  const [unmappedFields, setUnmappedFields] = useState<FormField[]>([]);
  const [suggestedMappings, setSuggestedMappings] = useState<FieldMapping[]>([]);

  // Check if user is authorized (admin only)
  useEffect(() => {
    if (session && session.user && session.user.role !== UserRole.ADMIN) {
      // Redirect or show error
      setError('Only administrators can access this page');
    }
  }, [session]);

  // Load templates and portals
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load templates
        const templatesResponse = await fetch('/api/forms/templates');
        if (!templatesResponse.ok) {
          throw new Error('Failed to load templates');
        }
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates);

        // Load portals
        const portalsResponse = await fetch('/api/government/portals');
        if (!portalsResponse.ok) {
          throw new Error('Failed to load government portals');
        }
        const portalsData = await portalsResponse.json();
        setPortals(portalsData.portals);

        // If templateId is provided, set the selected template
        if (templateId) {
          const template = templatesData.templates.find((t: FormTemplate) => t.id === templateId);
          if (template) {
            setSelectedTemplate(template);
            setMappingData(prev => ({
              ...prev,
              templateId
            }));

            // Extract fields for backward compatibility
            const fields = template.sections.flatMap(section =>
              section.fields.map(field => ({
                id: field.id,
                name: field.name,
                label: field.label,
                type: field.type
              }))
            );
            setFormFields(fields);
          }
        }

        // Load existing field mappings for backward compatibility
        if (templateId) {
          await loadFieldMappings();
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadData();
    }
  }, [session]);

  // Load existing mapping if editing
  useEffect(() => {
    const loadMapping = async () => {
      if (!existingMappingId || !session || templates.length === 0 || portals.length === 0) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/forms/mappings/${existingMappingId}`);

        if (!response.ok) {
          throw new Error('Failed to load mapping');
        }

        const data = await response.json();
        setMappingData(data.mapping);

        // Set selected template and portal
        const template = templates.find(t => t.id === data.mapping.templateId) || null;
        const portal = portals.find(p => p.id === data.mapping.portalId) || null;

        setSelectedTemplate(template);
        setSelectedPortal(portal);

        // Extract fields for backward compatibility if template exists
        if (template) {
          const fields = template.sections.flatMap(section =>
            section.fields.map(field => ({
              id: field.id,
              name: field.name,
              label: field.label,
              type: field.type
            }))
          );
          setFormFields(fields);
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading the mapping');
      } finally {
        setLoading(false);
      }
    };

    if (existingMappingId && session) {
      loadMapping();
    }
  }, [existingMappingId, session, templates, portals]);

  // Load field mappings for the selected portal type
  const loadFieldMappings = async () => {
    try {
      const mappingsResponse = await fetch(`/api/portal/field-mappings?portalType=${portalType}`);
      if (!mappingsResponse.ok) {
        throw new Error('Failed to load field mappings');
      }
      const mappingsData = await mappingsResponse.json();
      setFieldMappings(mappingsData.fieldMappings);
    } catch (error: any) {
      setError(error.message || 'An error occurred while loading field mappings');
    }
  };

  // Update unmapped fields when template or portal changes
  useEffect(() => {
    if (selectedTemplate && selectedPortal) {
      const allFields = selectedTemplate.sections.flatMap(section => section.fields);
      const mappedFieldIds = mappingData.mappings.map(m => m.templateFieldId);
      const unmapped = allFields.filter(field => !mappedFieldIds.includes(field.id));
      setUnmappedFields(unmapped);

      // Generate suggested mappings
      generateSuggestedMappings(unmapped, selectedPortal.fields);
    }
  }, [selectedTemplate, selectedPortal, mappingData.mappings]);

  // Generate suggested mappings based on field names and labels
  const generateSuggestedMappings = (templateFields: FormField[], portalFields: GovernmentPortalField[]) => {
    const suggestions: FieldMapping[] = [];

    templateFields.forEach(templateField => {
      // Try to find a match by name (case insensitive)
      let match = portalFields.find(
        portalField =>
          portalField.name.toLowerCase() === templateField.name.toLowerCase() ||
          portalField.label.toLowerCase() === templateField.label.toLowerCase()
      );

      // If no exact match, try to find a partial match
      if (!match) {
        match = portalFields.find(
          portalField =>
            portalField.name.toLowerCase().includes(templateField.name.toLowerCase()) ||
            portalField.label.toLowerCase().includes(templateField.label.toLowerCase()) ||
            templateField.name.toLowerCase().includes(portalField.name.toLowerCase()) ||
            templateField.label.toLowerCase().includes(portalField.label.toLowerCase())
        );
      }

      if (match) {
        suggestions.push({
          templateFieldId: templateField.id,
          portalFieldId: match.id
        });
      }
    });

    setSuggestedMappings(suggestions);
  };

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === templateId) || null;

    setSelectedTemplate(template);
    setMappingData({
      ...mappingData,
      templateId,
      mappings: [] // Reset mappings when template changes
    });

    // Update fields for backward compatibility
    if (template) {
      const fields = template.sections.flatMap(section =>
        section.fields.map(field => ({
          id: field.id,
          name: field.name,
          label: field.label,
          type: field.type
        }))
      );
      setFormFields(fields);
    }
  };

  // Handle portal selection
  const handlePortalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const portalId = e.target.value;
    const portal = portals.find(p => p.id === portalId) || null;

    setSelectedPortal(portal);
    setMappingData({
      ...mappingData,
      portalId,
      mappings: [] // Reset mappings when portal changes
    });
  };

  // Handle portal type change (for backward compatibility)
  const handlePortalTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPortalType = e.target.value as GovernmentPortalType;
    setPortalType(newPortalType);

    try {
      setLoading(true);
      const mappingsResponse = await fetch(`/api/portal/field-mappings?portalType=${newPortalType}`);
      if (!mappingsResponse.ok) {
        throw new Error('Failed to load field mappings');
      }
      const mappingsData = await mappingsResponse.json();
      setFieldMappings(mappingsData.fieldMappings);
    } catch (error: any) {
      setError(error.message || 'An error occurred while loading field mappings');
    } finally {
      setLoading(false);
    }
  };

  // Handle new mapping change
  const handleNewMappingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMapping({
      ...newMapping,
      [name]: value,
    });
  };

  // Handle mapping form changes
  const handleMappingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMappingData({
      ...mappingData,
      [name]: value,
    });
  };

  // Add a field mapping
  const addFieldMapping = (templateFieldId: string, portalFieldId: string) => {
    // Check if mapping already exists
    if (mappingData.mappings.some(m => m.templateFieldId === templateFieldId)) {
      // Update existing mapping
      setMappingData({
        ...mappingData,
        mappings: mappingData.mappings.map(m =>
          m.templateFieldId === templateFieldId
            ? { ...m, portalFieldId }
            : m
        )
      });
    } else {
      // Add new mapping
      setMappingData({
        ...mappingData,
        mappings: [
          ...mappingData.mappings,
          { templateFieldId, portalFieldId }
        ]
      });
    }
  };

  // Remove a field mapping
  const removeFieldMapping = (templateFieldId: string) => {
    setMappingData({
      ...mappingData,
      mappings: mappingData.mappings.filter(m => m.templateFieldId !== templateFieldId)
    });
  };

  // Add transformation rule to a mapping
  const addTransformationRule = (templateFieldId: string, rule: string) => {
    setMappingData({
      ...mappingData,
      mappings: mappingData.mappings.map(m =>
        m.templateFieldId === templateFieldId
          ? { ...m, transformationRule: rule }
          : m
      )
    });
  };

  // Apply suggested mappings
  const applySuggestedMappings = () => {
    // Only apply suggestions for fields that aren't already mapped
    const existingMappedFieldIds = mappingData.mappings.map(m => m.templateFieldId);
    const newSuggestions = suggestedMappings.filter(
      suggestion => !existingMappedFieldIds.includes(suggestion.templateFieldId)
    );

    setMappingData({
      ...mappingData,
      mappings: [...mappingData.mappings, ...newSuggestions]
    });
  };

  // Save mapping
  const saveMapping = async () => {
    if (!mappingData.name) {
      setError('Mapping name is required');
      return;
    }

    if (!mappingData.templateId || !mappingData.portalId) {
      setError('Template and portal must be selected');
      return;
    }

    if (mappingData.mappings.length === 0) {
      setError('At least one field mapping is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const url = existingMappingId
        ? `/api/forms/mappings/${existingMappingId}`
        : '/api/forms/mappings';

      const method = existingMappingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${existingMappingId ? 'update' : 'save'} mapping`);
      }

      const data = await response.json();
      alert(`Mapping ${existingMappingId ? 'updated' : 'saved'} successfully!`);
      router.push(`/admin/forms/mappings/${data.mapping.id}`);
    } catch (error: any) {
      setError(error.message || `An error occurred while ${existingMappingId ? 'updating' : 'saving'} the mapping`);
    } finally {
      setSaving(false);
    }
  };

  // Add new mapping (for backward compatibility)
  const addMapping = async () => {
    if (!newMapping.formField || !newMapping.portalField) {
      setError('Both form field and portal field are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/portal/field-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portalType,
          formField: newMapping.formField,
          portalField: newMapping.portalField,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create field mapping');
      }

      // Reset form and reload mappings
      setNewMapping({ formField: '', portalField: '' });
      await loadFieldMappings();
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating field mapping');
    } finally {
      setSaving(false);
    }
  };

  // Update existing mapping
  const updateMapping = async (id: string, portalField: string) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/portal/field-mappings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portalField,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update field mapping');
      }

      // Reload mappings
      await loadFieldMappings();
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating field mapping');
    } finally {
      setSaving(false);
    }
  };

  // Delete mapping
  const deleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/portal/field-mappings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete field mapping');
      }

      // Reload mappings
      await loadFieldMappings();
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting field mapping');
    } finally {
      setSaving(false);
    }
  };

  // If not authorized, show error
  if (session && session.user && session.user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p>Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  // Determine if we should show the new interface or the legacy interface
  const showNewInterface = templates.length > 0 && portals.length > 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {existingMappingId ? 'Edit Field Mapping' : 'Field Mapping Configuration'}
      </h2>

      <div className="space-y-6">
        {showNewInterface ? (
          <>
            {/* New Enhanced Interface */}
            <div className="space-y-6">
              {/* Mapping Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Mapping Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={mappingData.name}
                      onChange={handleMappingChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Irish Immigration Portal Mapping"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={mappingData.description || ''}
                      onChange={handleMappingChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Brief description of this mapping"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
                      Form Template
                    </label>
                    <select
                      id="templateId"
                      name="templateId"
                      value={mappingData.templateId}
                      onChange={handleTemplateChange}
                      disabled={!!existingMappingId}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                    >
                      <option value="">Select a template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} (v{template.version})
                        </option>
                      ))}
                    </select>
                    {existingMappingId && (
                      <p className="mt-1 text-xs text-gray-500">
                        Template cannot be changed after mapping is created
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="portalId" className="block text-sm font-medium text-gray-700">
                      Government Portal
                    </label>
                    <select
                      id="portalId"
                      name="portalId"
                      value={mappingData.portalId}
                      onChange={handlePortalChange}
                      disabled={!!existingMappingId}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                    >
                      <option value="">Select a portal</option>
                      {portals.map((portal) => (
                        <option key={portal.id} value={portal.id}>
                          {portal.name}
                        </option>
                      ))}
                    </select>
                    {existingMappingId && (
                      <p className="mt-1 text-xs text-gray-500">
                        Portal cannot be changed after mapping is created
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Field Mappings */}
              {selectedTemplate && selectedPortal && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium text-gray-900">Field Mappings</h3>
                    {suggestedMappings.length > 0 && (
                      <button
                        type="button"
                        onClick={applySuggestedMappings}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Apply {suggestedMappings.length} Suggested Mappings
                      </button>
                    )}
                  </div>

                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Form Field
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Portal Field
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Transformation Rule
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedTemplate.sections.flatMap(section =>
                          section.fields.map(field => {
                            const mapping = mappingData.mappings.find(m => m.templateFieldId === field.id);
                            const portalField = mapping ? selectedPortal.fields.find(f => f.id === mapping.portalFieldId) : null;

                            return (
                              <tr key={field.id} className={mapping ? 'bg-green-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium">{field.label}</div>
                                  <div className="text-xs text-gray-500">{field.name} ({field.type})</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <label htmlFor={`portal-field-${field.id}`} className="sr-only">
                                    Portal field for {field.label}
                                  </label>
                                  <select
                                    id={`portal-field-${field.id}`}
                                    value={mapping?.portalFieldId || ''}
                                    onChange={(e) => addFieldMapping(field.id, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    aria-label={`Select portal field for ${field.label}`}
                                  >
                                    <option value="">Select a field</option>
                                    {selectedPortal.fields.map((portalField) => (
                                      <option key={portalField.id} value={portalField.id}>
                                        {portalField.label} ({portalField.name})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {mapping && (
                                    <input
                                      type="text"
                                      value={mapping.transformationRule || ''}
                                      onChange={(e) => addTransformationRule(field.id, e.target.value)}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      placeholder="e.g., toUpperCase()"
                                    />
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {mapping && (
                                    <button
                                      type="button"
                                      onClick={() => removeFieldMapping(field.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/forms/mappings')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMapping}
                  disabled={saving || !mappingData.name || !mappingData.templateId || !mappingData.portalId || mappingData.mappings.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : existingMappingId ? 'Update Mapping' : 'Save Mapping'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Legacy Interface */}
            {/* Portal Type Selection */}
            <div>
              <label htmlFor="portalType" className="block text-sm font-medium text-gray-700">
                Government Portal
              </label>
              <select
                id="portalType"
                name="portalType"
                value={portalType}
                onChange={handlePortalTypeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {Object.values(GovernmentPortalType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Existing Mappings */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Existing Mappings</h3>
              {fieldMappings.length === 0 ? (
                <p className="text-sm text-gray-500">No mappings found for this portal type.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Form Field
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Portal Field
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fieldMappings.map((mapping) => (
                        <tr key={mapping.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {mapping.formField}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <input
                              type="text"
                              value={mapping.portalField}
                              onChange={(e) => {
                                // Update locally first for immediate feedback
                                setFieldMappings(
                                  fieldMappings.map((m) =>
                                    m.id === mapping.id ? { ...m, portalField: e.target.value } : m
                                  )
                                );
                              }}
                              onBlur={(e) => updateMapping(mapping.id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => deleteMapping(mapping.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add New Mapping */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Add New Mapping</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="formField" className="block text-sm font-medium text-gray-700">
                    Form Field
                  </label>
                  <select
                    id="formField"
                    name="formField"
                    value={newMapping.formField}
                    onChange={handleNewMappingChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a field</option>
                    {formFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label} ({field.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="portalField" className="block text-sm font-medium text-gray-700">
                    Portal Field
                  </label>
                  <input
                    type="text"
                    id="portalField"
                    name="portalField"
                    value={newMapping.portalField}
                    onChange={handleNewMappingChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., first_name"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addMapping}
                    disabled={saving || !newMapping.formField || !newMapping.portalField}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add Mapping'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
