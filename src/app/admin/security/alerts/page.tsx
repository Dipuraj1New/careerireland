import { Metadata } from 'next';
import SecurityAlerts from '@/components/admin/SecurityAlerts';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export const metadata: Metadata = {
  title: 'Security Alerts | Career Ireland',
  description: 'Manage security alerts for the Career Ireland platform',
};

export default function SecurityAlertsPage() {
  return (
    <AdminLayout>
      <SecurityAlerts />
    </AdminLayout>
  );
}
