import { Metadata } from 'next';
import ComplianceMonitoringDashboard from '@/components/compliance/ComplianceMonitoringDashboard';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/user';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Compliance Monitoring | Career Ireland',
  description: 'Monitor compliance status and requirements for the Career Ireland platform',
};

export default async function ComplianceMonitoringPage() {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is an admin
  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    redirect('/login?callbackUrl=/admin/compliance/monitoring');
  }
  
  return (
    <AdminLayout>
      <ComplianceMonitoringDashboard isAdmin={session.user.role === UserRole.ADMIN} />
    </AdminLayout>
  );
}
