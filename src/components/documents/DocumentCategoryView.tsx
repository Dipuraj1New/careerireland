import React, { useState, useEffect } from 'react';
import { Document, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';

interface DocumentCategoryViewProps {
  documents: Document[];
  onSelectDocument: (document: Document) => void;
}

const DocumentCategoryView: React.FC<DocumentCategoryViewProps> = ({
  documents,
  onSelectDocument,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categorizedDocuments, setCategorizedDocuments] = useState<Record<string, Document[]>>({});
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});

  // Categorize documents by type
  useEffect(() => {
    const categorized: Record<string, Document[]> = { all: [...documents] };
    const counts: Record<string, number> = { all: documents.length };

    // Group documents by type
    documents.forEach((doc) => {
      const category = doc.type;
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(doc);
      counts[category] = (counts[category] || 0) + 1;
    });

    setCategorizedDocuments(categorized);
    setDocumentCounts(counts);
  }, [documents]);

  // Get all available categories
  const categories = Object.keys(categorizedDocuments).filter(
    (category) => category !== 'all'
  );

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Document Categories</h2>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Category Sidebar */}
        <div className="w-full md:w-64 border-r border-gray-200">
          <ul className="py-2">
            <li
              className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                selectedCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''
              }`}
              onClick={() => handleCategoryChange('all')}
            >
              <div className="flex justify-between items-center">
                <span>All Documents</span>
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                  {documentCounts.all || 0}
                </span>
              </div>
            </li>
            {categories.map((category) => (
              <li
                key={category}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                  selectedCategory === category ? 'bg-blue-50 text-blue-700 font-medium' : ''
                }`}
                onClick={() => handleCategoryChange(category)}
              >
                <div className="flex justify-between items-center">
                  <span>{DOCUMENT_TYPE_LABELS[category as DocumentType]}</span>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {documentCounts[category] || 0}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Document List */}
        <div className="flex-1 p-4">
          {categorizedDocuments[selectedCategory]?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents in this category
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedDocuments[selectedCategory]?.map((document) => (
                <div
                  key={document.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectDocument(document)}
                >
                  <div className="flex items-center mb-2">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {document.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        document.status
                      )}`}
                    >
                      {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(document.createdAt.toString())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default DocumentCategoryView;
