'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TemplateMigrationTool from '@/components/forms/TemplateMigrationTool';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { UserRole } from '@/types/user';

interface TemplateMigrationPageProps {
  params: {
    id: string;
  };
}

export default function TemplateMigrationPage({ params }: TemplateMigrationPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Check if user is authenticated and has admin role
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/admin/forms/templates');
    return null;
  }
  
  if (session?.user?.role !== UserRole.ADMIN) {
    router.push('/dashboard');
    return null;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/forms/templates/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Template
        </Button>
        
        <h1 className="text-2xl font-bold">Template Migration</h1>
        <p className="text-gray-500">
          Migrate form submissions between different versions of this template
        </p>
      </div>
      
      <TemplateMigrationTool templateId={params.id} />
    </div>
  );
}
