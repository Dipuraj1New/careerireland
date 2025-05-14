'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/user';

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'email' | 'tel' | 'file' | 'radio' | 'time' | 'url';
  required: boolean;
  options?: string[]; // For select, radio fields
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customRule?: string;
  };
  conditional?: {
    dependsOn?: string; // Field name this field depends on
    showWhen?: string; // Value that triggers showing this field
  };
}

interface FormTemplateData {
  name: string;
  description: string;
  sections: FormSection[];
  version: string;
  status: 'draft' | 'active' | 'archived';
  documentTypes?: string[]; // Types of documents this form is for
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormTemplateBuilderProps {
  existingTemplateId?: string;
}

export default function FormTemplateBuilder({ existingTemplateId }: FormTemplateBuilderProps = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [template, setTemplate] = useState<FormTemplateData>({
    name: '',
    description: '',
    sections: [
      {
        id: `section_${Date.now()}`,
        title: 'Default Section',
        fields: []
      }
    ],
    version: '1.0',
    status: 'draft',
  });
  const [currentField, setCurrentField] = useState<FormField>({
    id: '',
    name: '',
    label: '',
    type: 'text',
    required: false,
  });
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [showFieldForm, setShowFieldForm] = useState<boolean>(false);
  const [showSectionForm, setShowSectionForm] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<FormSection>({
    id: '',
    title: '',
    fields: []
  });
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(existingTemplateId ? true : false);

  // Check if user is authorized (admin only)
  useEffect(() => {
    if (session && session.user && session.user.role !== UserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Load document types
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await fetch('/api/documents/types');
        if (!response.ok) {
          throw new Error('Failed to load document types');
        }
        const data = await response.json();
        setDocumentTypes(data.documentTypes.map((type: any) => type.name));
      } catch (error) {
        console.error('Error loading document types:', error);
      }
    };

    loadDocumentTypes();
  }, []);

  // Load existing template if editing
  useEffect(() => {
    const loadTemplate = async () => {
      if (!existingTemplateId || !session) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/forms/templates/${existingTemplateId}`);

        if (!response.ok) {
          throw new Error('Failed to load template');
        }

        const data = await response.json();

        // Convert to our format if needed
        let loadedTemplate = data.template;

        // If the template doesn't have sections, create a default section with all fields
        if (!loadedTemplate.sections && loadedTemplate.fields) {
          loadedTemplate = {
            ...loadedTemplate,
            sections: [
              {
                id: `section_${Date.now()}`,
                title: 'Default Section',
                fields: loadedTemplate.fields
              }
            ],
            fields: undefined
          };
        }

        setTemplate(loadedTemplate);
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading the template');
      } finally {
        setLoading(false);
      }
    };

    if (existingTemplateId && session) {
      loadTemplate();
    }
  }, [existingTemplateId, session]);

  // Generate a unique ID for a field
  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  // Generate a unique ID for a section
  const generateSectionId = () => {
    return `section_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  // Handle template form changes
  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTemplate({
      ...template,
      [name]: value,
    });
  };

  // Handle field form changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setCurrentField({
        ...currentField,
        [name]: checked,
      });
    } else {
      setCurrentField({
        ...currentField,
        [name]: value,
      });
    }
  };

  // Add option to select/radio field
  const addOption = () => {
    const option = prompt('Enter option value:');
    if (option && option.trim()) {
      setCurrentField({
        ...currentField,
        options: [...(currentField.options || []), option.trim()],
      });
    }
  };

  // Remove option from select/radio field
  const removeOption = (index: number) => {
    if (currentField.options) {
      const updatedOptions = [...currentField.options];
      updatedOptions.splice(index, 1);
      setCurrentField({
        ...currentField,
        options: updatedOptions,
      });
    }
  };

  // Handle document type selection
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedTypes = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedTypes.push(options[i].value);
      }
    }
    setTemplate({
      ...template,
      documentTypes: selectedTypes
    });
  };

  // Handle section form changes
  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSection({
      ...currentSection,
      [name]: value,
    });
  };

  // Add or update section
  const saveSection = () => {
    if (!currentSection.title) {
      setError('Section title is required');
      return;
    }

    const updatedSections = [...template.sections];

    if (editingSectionIndex !== null) {
      // Update existing section
      updatedSections[editingSectionIndex] = {
        ...updatedSections[editingSectionIndex],
        title: currentSection.title,
        description: currentSection.description
      };
    } else {
      // Add new section
      updatedSections.push({
        ...currentSection,
        id: generateSectionId(),
        fields: []
      });
    }

    setTemplate({
      ...template,
      sections: updatedSections
    });

    // Reset form
    setCurrentSection({
      id: '',
      title: '',
      fields: []
    });
    setEditingSectionIndex(null);
    setError(null);
    setShowSectionForm(false);
  };

  // Edit section
  const editSection = (index: number) => {
    setCurrentSection({
      ...template.sections[index]
    });
    setEditingSectionIndex(index);
    setShowSectionForm(true);
  };

  // Remove section
  const removeSection = (index: number) => {
    if (template.sections.length <= 1) {
      setError('Template must have at least one section');
      return;
    }

    if (confirm('Are you sure you want to remove this section? All fields in this section will be removed.')) {
      const updatedSections = template.sections.filter((_, i) => i !== index);
      setTemplate({
        ...template,
        sections: updatedSections
      });

      // If we're removing the current section, switch to the first section
      if (currentSectionIndex === index) {
        setCurrentSectionIndex(0);
      } else if (currentSectionIndex > index) {
        // If we're removing a section before the current one, adjust the index
        setCurrentSectionIndex(currentSectionIndex - 1);
      }
    }
  };

  // Move section up
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const updatedSections = [...template.sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[index - 1];
    updatedSections[index - 1] = temp;
    setTemplate({
      ...template,
      sections: updatedSections
    });

    // Adjust current section index if needed
    if (currentSectionIndex === index) {
      setCurrentSectionIndex(index - 1);
    } else if (currentSectionIndex === index - 1) {
      setCurrentSectionIndex(index);
    }
  };

  // Move section down
  const moveSectionDown = (index: number) => {
    if (index === template.sections.length - 1) return;
    const updatedSections = [...template.sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[index + 1];
    updatedSections[index + 1] = temp;
    setTemplate({
      ...template,
      sections: updatedSections
    });

    // Adjust current section index if needed
    if (currentSectionIndex === index) {
      setCurrentSectionIndex(index + 1);
    } else if (currentSectionIndex === index + 1) {
      setCurrentSectionIndex(index);
    }
  };

  // Handle field form changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setCurrentField({
      ...currentField,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Add option to select field
  const addOption = () => {
    const option = prompt('Enter option value:');
    if (option) {
      setCurrentField({
        ...currentField,
        options: [...(currentField.options || []), option],
      });
    }
  };

  // Remove option from select field
  const removeOption = (index: number) => {
    setCurrentField({
      ...currentField,
      options: currentField.options?.filter((_, i) => i !== index),
    });
  };

  // Add or update field
  const saveField = () => {
    if (!currentField.name || !currentField.label) {
      setError('Field name and label are required');
      return;
    }

    // Validate field name (no spaces, only alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(currentField.name)) {
      setError('Field name can only contain letters, numbers, and underscores');
      return;
    }

    // Check for duplicate field names across all sections
    const isDuplicate = template.sections.some(section =>
      section.fields.some(
        (field, index) => field.name === currentField.name &&
          !(currentSectionIndex === template.sections.indexOf(section) && index === editingFieldIndex)
      )
    );

    if (isDuplicate) {
      setError('Field name must be unique across all sections');
      return;
    }

    // If this is a conditional field, validate the dependency
    if (currentField.conditional?.dependsOn) {
      // Check if the dependent field exists in any section
      const dependentFieldExists = template.sections.some(section =>
        section.fields.some(field => field.name === currentField.conditional?.dependsOn)
      );

      if (!dependentFieldExists) {
        setError(`Dependent field "${currentField.conditional.dependsOn}" does not exist`);
        return;
      }
    }

    const updatedSections = [...template.sections];
    const currentSectionFields = [...updatedSections[currentSectionIndex].fields];

    if (editingFieldIndex !== null) {
      // Update existing field
      currentSectionFields[editingFieldIndex] = currentField;
    } else {
      // Add new field
      currentSectionFields.push({
        ...currentField,
        id: generateFieldId(),
      });
    }

    updatedSections[currentSectionIndex].fields = currentSectionFields;

    setTemplate({
      ...template,
      sections: updatedSections,
    });

    // Reset form
    setCurrentField({
      id: '',
      name: '',
      label: '',
      type: 'text',
      required: false,
    });
    setEditingFieldIndex(null);
    setError(null);
    setShowFieldForm(false);
  };

  // Edit field
  const editField = (sectionIndex: number, fieldIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentField({...template.sections[sectionIndex].fields[fieldIndex]});
    setEditingFieldIndex(fieldIndex);
    setShowFieldForm(true);
  };

  // Remove field
  const removeField = (sectionIndex: number, fieldIndex: number) => {
    if (confirm('Are you sure you want to remove this field?')) {
      const updatedSections = [...template.sections];
      updatedSections[sectionIndex].fields = updatedSections[sectionIndex].fields.filter((_, i) => i !== fieldIndex);

      setTemplate({
        ...template,
        sections: updatedSections,
      });
    }
  };

  // Move field up
  const moveFieldUp = (sectionIndex: number, fieldIndex: number) => {
    if (fieldIndex === 0) return;

    const updatedSections = [...template.sections];
    const updatedFields = [...updatedSections[sectionIndex].fields];

    const temp = updatedFields[fieldIndex];
    updatedFields[fieldIndex] = updatedFields[fieldIndex - 1];
    updatedFields[fieldIndex - 1] = temp;

    updatedSections[sectionIndex].fields = updatedFields;

    setTemplate({
      ...template,
      sections: updatedSections,
    });
  };

  // Move field down
  const moveFieldDown = (sectionIndex: number, fieldIndex: number) => {
    const updatedSections = [...template.sections];
    const updatedFields = [...updatedSections[sectionIndex].fields];

    if (fieldIndex === updatedFields.length - 1) return;

    const temp = updatedFields[fieldIndex];
    updatedFields[fieldIndex] = updatedFields[fieldIndex + 1];
    updatedFields[fieldIndex + 1] = temp;

    updatedSections[sectionIndex].fields = updatedFields;

    setTemplate({
      ...template,
      sections: updatedSections,
    });
  };

  // Move field to another section
  const moveFieldToSection = (fromSectionIndex: number, fieldIndex: number, toSectionIndex: number) => {
    if (fromSectionIndex === toSectionIndex) return;

    const updatedSections = [...template.sections];
    const field = {...updatedSections[fromSectionIndex].fields[fieldIndex]};

    // Remove from original section
    updatedSections[fromSectionIndex].fields = updatedSections[fromSectionIndex].fields.filter((_, i) => i !== fieldIndex);

    // Add to target section
    updatedSections[toSectionIndex].fields.push(field);

    setTemplate({
      ...template,
      sections: updatedSections,
    });
  };

  // Save template
  const saveTemplate = async () => {
    if (!template.name) {
      setError('Template name is required');
      return;
    }

    // Check if any section has fields
    const hasFields = template.sections.some(section => section.fields.length > 0);
    if (!hasFields) {
      setError('Template must have at least one field');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const url = existingTemplateId
        ? `/api/forms/templates/${existingTemplateId}`
        : '/api/forms/templates';

      const method = existingTemplateId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${existingTemplateId ? 'update' : 'save'} template`);
      }

      const data = await response.json();
      alert(`Template ${existingTemplateId ? 'updated' : 'saved'} successfully!`);
      router.push(`/admin/forms/templates/${data.template.id}`);
    } catch (error: any) {
      setError(error.message || `An error occurred while ${existingTemplateId ? 'updating' : 'saving'} the template`);
    } finally {
      setSaving(false);
    }
  };

  // Get all field names for conditional field selection
  const getAllFieldNames = () => {
    return template.sections.flatMap(section =>
      section.fields.map(field => field.name)
    ).filter(name => name !== currentField.name); // Exclude current field
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // If not authorized, show loading
  if (!session) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {existingTemplateId ? 'Edit Form Template' : 'Create Form Template'}
      </h2>

      <div className="space-y-6">
        {/* Template Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Template Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={template.name}
                onChange={handleTemplateChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., Irish Visa Application Form"
              />
            </div>

            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                type="text"
                id="version"
                name="version"
                value={template.version}
                onChange={handleTemplateChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., 1.0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={template.description}
              onChange={handleTemplateChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Describe the purpose of this form template"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={template.status}
                onChange={handleTemplateChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="documentTypes" className="block text-sm font-medium text-gray-700">
                Document Types
              </label>
              <select
                id="documentTypes"
                name="documentTypes"
                multiple
                value={template.documentTypes || []}
                onChange={handleDocumentTypeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple types
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">Form Sections</h3>
            <button
              type="button"
              onClick={() => {
                setCurrentSection({
                  id: '',
                  title: '',
                  fields: []
                });
                setEditingSectionIndex(null);
                setShowSectionForm(true);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Section
            </button>
          </div>

          {template.sections.length === 0 ? (
            <p className="text-sm text-gray-500">No sections added yet. Click "Add Section" to start building your form.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-2 border-b border-gray-200">
                {template.sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setCurrentSectionIndex(index)}
                    className={`px-4 py-2 text-sm font-medium ${
                      currentSectionIndex === index
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>

              {template.sections.length > 0 && (
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">
                    {template.sections[currentSectionIndex].title}
                    {template.sections[currentSectionIndex].description && (
                      <span className="ml-2 text-xs text-gray-500">
                        {template.sections[currentSectionIndex].description}
                      </span>
                    )}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => editSection(currentSectionIndex)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit Section
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSectionUp(currentSectionIndex)}
                      disabled={currentSectionIndex === 0}
                      className="text-gray-400 hover:text-gray-500 disabled:opacity-50 text-sm"
                    >
                      Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSectionDown(currentSectionIndex)}
                      disabled={currentSectionIndex === template.sections.length - 1}
                      className="text-gray-400 hover:text-gray-500 disabled:opacity-50 text-sm"
                    >
                      Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(currentSectionIndex)}
                      disabled={template.sections.length <= 1}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fields List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">Fields in {template.sections[currentSectionIndex]?.title || 'Current Section'}</h3>
            <button
              type="button"
              onClick={() => {
                setCurrentField({
                  id: '',
                  name: '',
                  label: '',
                  type: 'text',
                  required: false,
                });
                setEditingFieldIndex(null);
                setShowFieldForm(true);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Field
            </button>
          </div>

          {template.sections[currentSectionIndex]?.fields.length === 0 ? (
            <p className="text-sm text-gray-500">No fields added to this section yet. Click "Add Field" to start building your form.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {template.sections[currentSectionIndex]?.fields.map((field, index) => (
                <li key={field.id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{field.label}</h4>
                      <p className="text-sm text-gray-500">
                        {field.name} ({field.type}) {field.required && <span className="text-red-500">*</span>}
                      </p>
                      {(field.type === 'select' || field.type === 'radio') && field.options && (
                        <p className="text-xs text-gray-400">Options: {field.options.join(', ')}</p>
                      )}
                      {field.conditional?.dependsOn && (
                        <p className="text-xs text-gray-400">
                          Depends on: {field.conditional.dependsOn}
                          {field.conditional.showWhen && ` (when: ${field.conditional.showWhen})`}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => moveFieldUp(currentSectionIndex, index)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFieldDown(currentSectionIndex, index)}
                        disabled={index === template.sections[currentSectionIndex].fields.length - 1}
                        className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => editField(currentSectionIndex, index)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(currentSectionIndex, index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Field Form */}
        {showFieldForm && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingFieldIndex !== null ? 'Edit Field' : 'Add Field'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-name" className="block text-sm font-medium text-gray-700">
                    Field Name
                  </label>
                  <input
                    type="text"
                    id="field-name"
                    name="name"
                    value={currentField.name}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., firstName"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use camelCase, no spaces (e.g., firstName, dateOfBirth)
                  </p>
                </div>

                <div>
                  <label htmlFor="field-label" className="block text-sm font-medium text-gray-700">
                    Field Label
                  </label>
                  <input
                    type="text"
                    id="field-label"
                    name="label"
                    value={currentField.label}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., First Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-type" className="block text-sm font-medium text-gray-700">
                    Field Type
                  </label>
                  <select
                    id="field-type"
                    name="type"
                    value={currentField.type}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Telephone</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="time">Time</option>
                    <option value="url">URL</option>
                    <option value="select">Select (Dropdown)</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="textarea">Text Area</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="field-required" className="block text-sm font-medium text-gray-700">
                    Required
                  </label>
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      id="field-required"
                      name="required"
                      checked={currentField.required}
                      onChange={handleFieldChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="field-required" className="ml-2 text-sm text-gray-700">
                      This field is required
                    </label>
                  </div>
                </div>
              </div>

              {(currentField.type === 'select' || currentField.type === 'radio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="mt-1">
                    {currentField.options && currentField.options.length > 0 ? (
                      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                        {currentField.options.map((option, i) => (
                          <li key={i} className="px-3 py-2 flex justify-between items-center">
                            <span>{option}</span>
                            <button
                              type="button"
                              onClick={() => removeOption(i)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No options added yet.</p>
                    )}
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-placeholder" className="block text-sm font-medium text-gray-700">
                    Placeholder (Optional)
                  </label>
                  <input
                    type="text"
                    id="field-placeholder"
                    name="placeholder"
                    value={currentField.placeholder || ''}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="field-default" className="block text-sm font-medium text-gray-700">
                    Default Value (Optional)
                  </label>
                  <input
                    type="text"
                    id="field-default"
                    name="defaultValue"
                    value={currentField.defaultValue || ''}
                    onChange={handleFieldChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-helpText" className="block text-sm font-medium text-gray-700">
                  Help Text (Optional)
                </label>
                <input
                  type="text"
                  id="field-helpText"
                  name="helpText"
                  value={currentField.helpText || ''}
                  onChange={handleFieldChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Enter your legal first name as it appears on your passport"
                />
              </div>

              {/* Conditional Logic */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Conditional Logic (Optional)</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Make this field appear only when another field has a specific value
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="field-dependsOn" className="block text-sm font-medium text-gray-700">
                      Depends On Field
                    </label>
                    <select
                      id="field-dependsOn"
                      name="conditional.dependsOn"
                      value={currentField.conditional?.dependsOn || ''}
                      onChange={(e) => {
                        setCurrentField({
                          ...currentField,
                          conditional: {
                            ...currentField.conditional,
                            dependsOn: e.target.value || undefined
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">None</option>
                      {getAllFieldNames().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {currentField.conditional?.dependsOn && (
                    <div>
                      <label htmlFor="field-showWhen" className="block text-sm font-medium text-gray-700">
                        Show When Value Is
                      </label>
                      <input
                        type="text"
                        id="field-showWhen"
                        name="conditional.showWhen"
                        value={currentField.conditional?.showWhen || ''}
                        onChange={(e) => {
                          setCurrentField({
                            ...currentField,
                            conditional: {
                              ...currentField.conditional,
                              showWhen: e.target.value
                            }
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., yes, true, or a specific value"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Rules */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Validation Rules (Optional)</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Add validation rules to ensure data quality
                </p>

                <div className="space-y-3">
                  {currentField.type === 'text' && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="field-minLength" className="block text-sm font-medium text-gray-700">
                            Minimum Length
                          </label>
                          <input
                            type="number"
                            id="field-minLength"
                            name="validation.minLength"
                            value={currentField.validation?.minLength || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              setCurrentField({
                                ...currentField,
                                validation: {
                                  ...currentField.validation,
                                  minLength: value
                                }
                              });
                            }}
                            min="0"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="field-maxLength" className="block text-sm font-medium text-gray-700">
                            Maximum Length
                          </label>
                          <input
                            type="number"
                            id="field-maxLength"
                            name="validation.maxLength"
                            value={currentField.validation?.maxLength || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              setCurrentField({
                                ...currentField,
                                validation: {
                                  ...currentField.validation,
                                  maxLength: value
                                }
                              });
                            }}
                            min="0"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="field-pattern" className="block text-sm font-medium text-gray-700">
                          Pattern (RegEx)
                        </label>
                        <input
                          type="text"
                          id="field-pattern"
                          name="validation.pattern"
                          value={currentField.validation?.pattern || ''}
                          onChange={(e) => {
                            setCurrentField({
                              ...currentField,
                              validation: {
                                ...currentField.validation,
                                pattern: e.target.value || undefined
                              }
                            });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="e.g., ^[A-Za-z]+$"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Regular expression pattern for validation
                        </p>
                      </div>
                    </>
                  )}

                  {currentField.type === 'number' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="field-min" className="block text-sm font-medium text-gray-700">
                          Minimum Value
                        </label>
                        <input
                          type="number"
                          id="field-min"
                          name="validation.min"
                          value={currentField.validation?.min || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            setCurrentField({
                              ...currentField,
                              validation: {
                                ...currentField.validation,
                                min: value
                              }
                            });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="field-max" className="block text-sm font-medium text-gray-700">
                          Maximum Value
                        </label>
                        <input
                          type="number"
                          id="field-max"
                          name="validation.max"
                          value={currentField.validation?.max || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            setCurrentField({
                              ...currentField,
                              validation: {
                                ...currentField.validation,
                                max: value
                              }
                            });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="field-customRule" className="block text-sm font-medium text-gray-700">
                      Custom Validation Rule
                    </label>
                    <input
                      type="text"
                      id="field-customRule"
                      name="validation.customRule"
                      value={currentField.validation?.customRule || ''}
                      onChange={(e) => {
                        setCurrentField({
                          ...currentField,
                          validation: {
                            ...currentField.validation,
                            customRule: e.target.value || undefined
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Must match password field"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Description of custom validation rule (will be implemented in validation service)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowFieldForm(false);
                    setCurrentField({
                      id: '',
                      name: '',
                      label: '',
                      type: 'text',
                      required: false,
                    });
                    setEditingFieldIndex(null);
                    setError(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveField}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Form */}
        {showSectionForm && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingSectionIndex !== null ? 'Edit Section' : 'Add Section'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="section-title" className="block text-sm font-medium text-gray-700">
                  Section Title
                </label>
                <input
                  type="text"
                  id="section-title"
                  name="title"
                  value={currentSection.title}
                  onChange={handleSectionChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Personal Information"
                />
              </div>

              <div>
                <label htmlFor="section-description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="section-description"
                  name="description"
                  value={currentSection.description || ''}
                  onChange={handleSectionChange}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Brief description of this section"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionForm(false);
                    setCurrentSection({
                      id: '',
                      title: '',
                      fields: []
                    });
                    setEditingSectionIndex(null);
                    setError(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSection}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingSectionIndex !== null ? 'Update Section' : 'Add Section'}
                </button>
              </div>
            </div>
          </div>
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

        {/* Save Template Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/forms/templates')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveTemplate}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : existingTemplateId ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
