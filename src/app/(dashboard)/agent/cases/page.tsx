'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CaseQueue from '@/components/agent/CaseQueue';
import { UserRole } from '@/types/user';

export default function CaseQueuePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    } else if (session.user.role !== UserRole.AGENT && session.user.role !== UserRole.ADMIN) {
      redirect('/dashboard');
    }
    
    setIsLoading(false);
  }, [session, status]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Case Management</h1>
      <CaseQueue userId={session!.user.id} />
    </div>
  );
}
