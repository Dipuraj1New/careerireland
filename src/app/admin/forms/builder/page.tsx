'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../../../types/user';
import FormTemplateBuilder from '../../../../components/forms/FormTemplateBuilder';
import FieldMappingInterface from '../../../../components/forms/FieldMappingInterface';
import ValidationRuleConfig from '../../../../components/forms/ValidationRuleConfig';
import TemplateTestingTool from '../../../../components/forms/TemplateTestingTool';

export default function FormBuilderPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'builder' | 'mapping' | 'validation' | 'testing'>('builder');
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Check if user is authorized (admin only)
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <p className="text-center">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-pink-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-2xl font-bold text-center text-red-600">Access Denied</h2>
                  <p className="text-center">Only administrators can access this page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Form Builder Interface</h1>
          <p className="mt-2 text-sm text-gray-500">
            Create and manage form templates, configure field mappings, set validation rules, and test your forms.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('builder')}
              className={`${
                activeTab === 'builder'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Template Builder
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              disabled={!templateId}
              className={`${
                activeTab === 'mapping'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                !templateId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Field Mapping
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              disabled={!templateId}
              className={`${
                activeTab === 'validation'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                !templateId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Validation Rules
            </button>
            <button
              onClick={() => setActiveTab('testing')}
              disabled={!templateId}
              className={`${
                activeTab === 'testing'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                !templateId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Template Testing
            </button>
          </nav>
        </div>

        {/* Template ID Selection (only shown when a template is needed) */}
        {activeTab !== 'builder' && (
          <div className="mb-6">
            {templateId ? (
              <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-md">
                <div>
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">Current Template ID:</span> {templateId}
                  </p>
                </div>
                <button
                  onClick={() => setTemplateId(null)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Change Template
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Template Required</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please enter a template ID to continue:</p>
                      <div className="mt-2 flex">
                        <input
                          type="text"
                          placeholder="Enter template ID"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e) => {
                            // Update locally for immediate feedback
                            const value = e.target.value.trim();
                            if (value) {
                              setTemplateId(value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Component */}
        <div>
          {activeTab === 'builder' && (
            <div>
              <FormTemplateBuilder />
            </div>
          )}

          {activeTab === 'mapping' && templateId && (
            <div>
              <FieldMappingInterface templateId={templateId} />
            </div>
          )}

          {activeTab === 'validation' && templateId && (
            <div>
              <ValidationRuleConfig templateId={templateId} />
            </div>
          )}

          {activeTab === 'testing' && templateId && (
            <div>
              <TemplateTestingTool templateId={templateId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
