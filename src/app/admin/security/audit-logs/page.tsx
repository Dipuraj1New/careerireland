import { Metadata } from 'next';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export const metadata: Metadata = {
  title: 'Audit Logs | Career Ireland',
  description: 'View and search system audit logs for security and compliance monitoring',
};

export default function AuditLogsPage() {
  return (
    <AdminLayout>
      <AuditLogViewer />
    </AdminLayout>
  );
}
