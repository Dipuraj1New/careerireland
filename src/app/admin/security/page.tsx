import { Metadata } from 'next';
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export const metadata: Metadata = {
  title: 'Security & Compliance Dashboard | Career Ireland',
  description: 'Manage security and compliance for the Career Ireland platform',
};

export default function SecurityPage() {
  return (
    <AdminLayout>
      <SecurityDashboard />
    </AdminLayout>
  );
}
