'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DocumentVerificationView from '@/components/agent/DocumentVerificationView';

export default function DocumentVerificationPage() {
  const params = useParams();
  const documentId = params.id as string;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DocumentVerificationView documentId={documentId} />
    </div>
  );
}
