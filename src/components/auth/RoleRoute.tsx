import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Permission } from '@/types/auth';
import { UserRole } from '@/types/database';
import { hasPermission } from '@/lib/permissions';

interface RoleRouteProps {
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export function RoleRoute({ allowedRoles, requiredPermission }: RoleRouteProps) {
  const { currentRole, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(currentRole, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
