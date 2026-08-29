import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/database';

interface RoleGuardProps {
  roles: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ roles, fallback = null, children }: RoleGuardProps) {
  const { currentRole } = useAuth();

  if (!currentRole || !roles.includes(currentRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
