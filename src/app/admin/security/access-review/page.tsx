import { Metadata } from 'next';
import AccessReviewDashboard from '@/components/security/AccessReviewDashboard';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/user';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Access Review | Career Ireland',
  description: 'Manage user access reviews for the Career Ireland platform',
};

export default async function AccessReviewPage() {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is an admin
  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    redirect('/login?callbackUrl=/admin/security/access-review');
  }
  
  return (
    <AdminLayout>
      <AccessReviewDashboard isAdmin={session.user.role === UserRole.ADMIN} />
    </AdminLayout>
  );
}
