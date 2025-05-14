import React from 'react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';

interface DocumentTypeSelectorProps {
  selectedType: DocumentType | '';
  onChange: (type: DocumentType) => void;
  disabled?: boolean;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  selectedType,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
        Document Type
      </label>
      <select
        id="documentType"
        value={selectedType}
        onChange={(e) => onChange(e.target.value as DocumentType)}
        disabled={disabled}
        className={`block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        required
      >
        <option value="" disabled>
          Select document type
        </option>
        {Object.values(DocumentType).map((type) => (
          <option key={type} value={type}>
            {DOCUMENT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DocumentTypeSelector;
