'use client';

import React, { useState, useEffect } from 'react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';
import formGenerationService, { FormTemplate } from '@/services/ai/formGenerationService';

interface FormGeneratorProps {
  documentType: DocumentType;
  extractedData: Record<string, string | null>;
  onFormGenerated: (formUrl: string) => void;
  onError: (error: string) => void;
}

const FormGenerator: React.FC<FormGeneratorProps> = ({
  documentType,
  extractedData,
  onFormGenerated,
  onError,
}) => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [additionalData, setAdditionalData] = useState<Record<string, string>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Load available templates when document type changes
  useEffect(() => {
    const availableTemplates = formGenerationService.getTemplatesForDocumentType(documentType);
    setTemplates(availableTemplates);
    
    // Reset selected template if current selection is not available
    if (availableTemplates.length > 0) {
      if (!availableTemplates.some(t => t.id === selectedTemplate)) {
        setSelectedTemplate(availableTemplates[0].id);
      }
    } else {
      setSelectedTemplate('');
    }
  }, [documentType]);
  
  // Handle template selection change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    setMissingFields([]);
  };
  
  // Handle additional data input change
  const handleInputChange = (field: string, value: string) => {
    setAdditionalData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Remove field from missing fields if it's now provided
    if (value && missingFields.includes(field)) {
      setMissingFields(prev => prev.filter(f => f !== field));
    }
  };
  
  // Handle form generation
  const handleGenerateForm = async () => {
    if (!selectedTemplate) {
      onError('Please select a form template');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call API to generate form
      const response = await fetch('/api/forms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          extractedData,
          additionalData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if there are missing fields
        if (errorData.missingFields && errorData.missingFields.length > 0) {
          setMissingFields(errorData.missingFields);
          throw new Error('Please provide all required fields');
        }
        
        throw new Error(errorData.error || 'Failed to generate form');
      }
      
      const data = await response.json();
      
      // Call the onFormGenerated callback with the form URL
      onFormGenerated(data.formUrl);
    } catch (error) {
      onError(error.message || 'An error occurred while generating the form');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Get the currently selected template
  const currentTemplate = templates.find(t => t.id === selectedTemplate);
  
  // Check which fields are missing from the extracted data
  const getMissingRequiredFields = () => {
    if (!currentTemplate) return [];
    
    return currentTemplate.requiredFields.filter(
      field => !extractedData[field] && !additionalData[field]
    );
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Form</h2>
      
      {templates.length === 0 ? (
        <div className="text-sm text-gray-500 mb-4">
          No form templates available for {DOCUMENT_TYPE_LABELS[documentType]} documents.
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
              Select Form Template
            </label>
            <select
              id="template"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              disabled={isGenerating}
            >
              <option value="" disabled>Select a template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>
          
          {currentTemplate && (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Extracted Data</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  {currentTemplate.requiredFields.concat(currentTemplate.optionalFields).map(field => {
                    const label = currentTemplate.fieldMappings[field] || field;
                    const value = extractedData[field] || 'Not available';
                    const isMissing = !extractedData[field] && currentTemplate.requiredFields.includes(field);
                    
                    return (
                      <div key={field} className="grid grid-cols-3 gap-2 mb-1">
                        <div className="font-medium">{label}:</div>
                        <div className={`col-span-2 ${isMissing ? 'text-red-500' : ''}`}>
                          {value}
                          {isMissing && ' (Required)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {getMissingRequiredFields().length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Information Needed</h3>
                  <div className="space-y-3">
                    {getMissingRequiredFields().map(field => {
                      const label = currentTemplate.fieldMappings[field] || field;
                      
                      return (
                        <div key={field}>
                          <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                            {label} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id={field}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              missingFields.includes(field)
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                            value={additionalData[field] || ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            disabled={isGenerating}
                          />
                          {missingFields.includes(field) && (
                            <p className="mt-1 text-sm text-red-600">This field is required</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleGenerateForm}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Form...
                    </>
                  ) : (
                    'Generate Form'
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FormGenerator;
