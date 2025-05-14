import { Metadata } from 'next';
import ComplianceReportingInterface from '@/components/compliance/ComplianceReportingInterface';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/user';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Compliance Reporting | Career Ireland',
  description: 'Generate and manage compliance reports for the Career Ireland platform',
};

export default async function ComplianceReportingPage() {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is an admin
  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    redirect('/login?callbackUrl=/admin/compliance/reports');
  }
  
  return (
    <AdminLayout>
      <ComplianceReportingInterface isAdmin={session.user.role === UserRole.ADMIN} />
    </AdminLayout>
  );
}
