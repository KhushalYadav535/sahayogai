'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole, Permission } from '@/lib/types/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || null;
  }

  // Check role access
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(requiredRoles)) {
      return (
        fallback || (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You do not have the required role to access this page.
              </p>
            </div>
          </div>
        )
      );
    }
  }

  // Check permission access
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return (
        fallback || (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You do not have the required permissions to access this page.
              </p>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
}
