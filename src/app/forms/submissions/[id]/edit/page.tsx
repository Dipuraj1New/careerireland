'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FormEditor from '../../../../../components/forms/FormEditor';

interface EditFormSubmissionPageProps {
  params: {
    id: string;
  };
}

export default function EditFormSubmissionPage({ params }: EditFormSubmissionPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Form Submission</h1>
          <p className="mt-2 text-sm text-gray-500">
            Make changes to your form submission.
          </p>
        </div>

        <FormEditor formSubmissionId={params.id} />
      </div>
    </div>
  );
}
