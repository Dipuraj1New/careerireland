'use client';

import React, { useState } from 'react';
import { AIProcessingResults, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';
import FormGenerator from '@/components/forms/FormGenerator';

interface DocumentProcessingResultProps {
  results: AIProcessingResults;
  onReprocess?: (documentType: DocumentType) => void;
}

const DocumentProcessingResult: React.FC<DocumentProcessingResultProps> = ({
  results,
  onReprocess,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'extracted' | 'validation' | 'raw' | 'forms'>('overview');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(results.documentType);

  // Handle tab change
  const handleTabChange = (tab: 'overview' | 'extracted' | 'validation' | 'raw' | 'forms') => {
    setSelectedTab(tab);
  };

  // Handle form generation success
  const [generatedFormUrl, setGeneratedFormUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFormGenerated = (formUrl: string) => {
    setGeneratedFormUrl(formUrl);
    setFormError(null);
  };

  const handleFormError = (error: string) => {
    setFormError(error);
    setGeneratedFormUrl(null);
  };

  // Handle document type change
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocumentType(e.target.value as DocumentType);
  };

  // Handle reprocess
  const handleReprocess = () => {
    if (onReprocess) {
      setIsReprocessing(true);
      onReprocess(selectedDocumentType);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            type="button"
            className={`${
              selectedTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`${
              selectedTab === 'extracted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('extracted')}
          >
            Extracted Data
          </button>
          <button
            type="button"
            className={`${
              selectedTab === 'validation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('validation')}
          >
            Validation
          </button>
          <button
            type="button"
            className={`${
              selectedTab === 'raw'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('raw')}
          >
            Raw Text
          </button>
          <button
            type="button"
            className={`${
              selectedTab === 'forms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('forms')}
          >
            Forms
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Document Processing Results</h3>
                <p className="mt-1 text-sm text-gray-500">
                  AI processing completed in {(results.processingTime / 1000).toFixed(2)} seconds
                </p>
              </div>

              {/* Validation Score */}
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Validation Score: {results.validationResult.score}%
                </div>
                <div className="mt-1">
                  {results.validationResult.isValid ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Invalid
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {DOCUMENT_TYPE_LABELS[results.documentType]} ({results.confidence.toFixed(2)}% confidence)
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Extracted Fields</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Object.keys(results.extractedData).length} fields extracted
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Validation Errors</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {results.validationResult.errors.length} errors
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Validation Warnings</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {results.validationResult.warnings.length} warnings
                  </dd>
                </div>
              </dl>
            </div>

            {/* Reprocess Section */}
            {onReprocess && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-500">Reprocess Document</h4>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex-grow">
                    <label htmlFor="document-type" className="sr-only">Document Type</label>
                    <select
                      id="document-type"
                      aria-label="Document Type"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedDocumentType}
                      onChange={handleDocumentTypeChange}
                      disabled={isReprocessing}
                    >
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
                        <option key={type} value={type}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleReprocess}
                    disabled={isReprocessing}
                  >
                    {isReprocessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Reprocess'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extracted Data Tab */}
        {selectedTab === 'extracted' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Data</h3>

            {Object.keys(results.extractedData).length === 0 ? (
              <p className="text-sm text-gray-500">No data extracted from this document.</p>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Field</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.entries(results.extractedData).map(([field, value]) => (
                      <tr key={field}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {field}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {value || <span className="text-gray-400">Not found</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {results.dataConfidence[field] ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              results.dataConfidence[field] > 80
                                ? 'bg-green-100 text-green-800'
                                : results.dataConfidence[field] > 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {results.dataConfidence[field].toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Validation Tab */}
        {selectedTab === 'validation' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h3>

            <div className="mb-6">
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      results.validationResult.score > 80
                        ? 'bg-green-500'
                        : results.validationResult.score > 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${results.validationResult.score}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {results.validationResult.score}%
                </span>
              </div>
            </div>

            {/* Errors */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Errors</h4>

              {results.validationResult.errors.length === 0 ? (
                <p className="text-sm text-gray-500">No validation errors found.</p>
              ) : (
                <ul className="space-y-2">
                  {results.validationResult.errors.map((error, index) => (
                    <li key={index} className="bg-red-50 p-3 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{error.field}</h3>
                          <div className="mt-1 text-sm text-red-700">
                            <p>{error.message}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warnings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Warnings</h4>

              {results.validationResult.warnings.length === 0 ? (
                <p className="text-sm text-gray-500">No validation warnings found.</p>
              ) : (
                <ul className="space-y-2">
                  {results.validationResult.warnings.map((warning, index) => (
                    <li key={index} className="bg-yellow-50 p-3 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">{warning.field}</h3>
                          <div className="mt-1 text-sm text-yellow-700">
                            <p>{warning.message}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Raw Text Tab */}
        {selectedTab === 'raw' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Raw OCR Text</h3>

            {!results.rawOcrText ? (
              <p className="text-sm text-gray-500">No raw OCR text available.</p>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {results.rawOcrText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Forms Tab */}
        {selectedTab === 'forms' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Forms</h3>

            {generatedFormUrl ? (
              <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Form generated successfully!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <a
                    href={generatedFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Download Form
                  </a>

                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      setGeneratedFormUrl(null);
                      setFormError(null);
                    }}
                  >
                    Generate Another Form
                  </button>
                </div>
              </div>
            ) : (
              <FormGenerator
                documentType={results.documentType}
                extractedData={results.extractedData}
                onFormGenerated={handleFormGenerated}
                onError={handleFormError}
              />
            )}

            {formError && (
              <div className="mt-4 bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {formError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentProcessingResult;
