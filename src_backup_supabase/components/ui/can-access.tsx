import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Permission } from '@/types/auth';
import { hasAllPermissions, hasAnyPermission, hasPermission } from '@/lib/permissions';

interface CanAccessProps {
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function CanAccess({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}: CanAccessProps) {
  const { currentRole } = useAuth();

  if (permission && !hasPermission(currentRole, permission)) {
    return <>{fallback}</>;
  }

  if (anyPermissions && !hasAnyPermission(currentRole, anyPermissions)) {
    return <>{fallback}</>;
  }

  if (allPermissions && !hasAllPermissions(currentRole, allPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
