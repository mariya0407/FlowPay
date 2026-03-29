import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Assuming the dashboard is the primary destination for all non-admin operational staff 
  // (Employees, Managers, Directors, Finance)
  return (
    <ProtectedRoute allowedRoles={['Employee', 'Manager', 'Finance', 'Director']}>
      {children}
    </ProtectedRoute>
  );
}
