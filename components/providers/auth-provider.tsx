'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { User, LoginCredentials, SignupData, Permission, UserRole, ROLE_PERMISSIONS } from '@/lib/types/auth';
import { authApi, setApiToken } from '@/lib/api';

// Backend roles → frontend UserRole
const ROLE_MAP: Record<string, UserRole> = {
  superadmin: UserRole.PLATFORM_ADMIN,
  admin: UserRole.SOCIETY_ADMIN,
  president: UserRole.PRESIDENT,
  secretary: UserRole.SECRETARY,
  accountant: UserRole.ACCOUNTANT,
  senior_accountant: UserRole.SENIOR_ACCOUNTANT,
  loan_officer: UserRole.LOAN_OFFICER,
  compliance_officer: UserRole.COMPLIANCE_OFFICER,
  auditor: UserRole.AUDITOR,
  member: UserRole.MEMBER,
  staff: UserRole.ACCOUNTANT, // legacy alias
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  impersonate: (tenantId: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  setupMFA: (method: 'TOTP' | 'SMS') => Promise<string>;
  verifyMFA: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapApiUserToUser(apiUser: { id: string; email: string; name: string; role: string; tenantId: string | null }): User {
  const role = ROLE_MAP[apiUser.role] || UserRole.SOCIETY_ADMIN;
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    role,
    tenantId: apiUser.tenantId || '',
    permissions: ROLE_PERMISSIONS[role],
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('sahayog-user');
        const storedToken = localStorage.getItem('sahayog-token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setApiToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('sahayog-user');
        localStorage.removeItem('sahayog-token');
      } finally {
        setIsLoading(false);
        setMounted(true);
      }
    };
    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({
        email: credentials.email,
        password: credentials.password,
        tenantId: credentials.tenantId,
      });
      if (!res.success || !res.token || !res.user) throw new Error('Invalid response');
      const u = mapApiUserToUser(res.user);
      setApiToken(res.token);
      localStorage.setItem('sahayog-user', JSON.stringify(u));
      localStorage.setItem('sahayog-token', res.token);
      setUser(u);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'staff',
        tenantId: data.tenantId,
      });
      const loginRes = await authApi.login({ email: data.email, password: data.password, tenantId: data.tenantId });
      if (!loginRes.success || !loginRes.token || !loginRes.user) throw new Error('Login after signup failed');
      const u = mapApiUserToUser(loginRes.user);
      setApiToken(loginRes.token);
      localStorage.setItem('sahayog-user', JSON.stringify(u));
      localStorage.setItem('sahayog-token', loginRes.token);
      setUser(u);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const impersonate = useCallback(async (tenantId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sahayog-token');
      const res = await authApi.impersonate(tenantId, token || undefined);
      if (!res.success || !res.token || !res.user) throw new Error('Impersonation failed');
      const u = mapApiUserToUser(res.user);
      setApiToken(res.token);
      localStorage.setItem('sahayog-user', JSON.stringify(u));
      localStorage.setItem('sahayog-token', res.token);
      setUser(u);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Impersonation failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setApiToken(null);
      localStorage.removeItem('sahayog-user');
      localStorage.removeItem('sahayog-token');
      setUser(null);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Logout failed');
    }
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  const setupMFA = useCallback(async (method: 'TOTP' | 'SMS'): Promise<string> => {
    // TODO: Implement actual MFA setup
    return 'mock-secret';
  }, []);

  const verifyMFA = useCallback(async (code: string) => {
    // TODO: Implement actual MFA verification
    if (user) {
      const updatedUser = { ...user, mfaEnabled: true, mfaMethod: 'TOTP' };
      setUser(updatedUser);
      localStorage.setItem('sahayog-user', JSON.stringify(updatedUser));
    }
  }, [user]);

  // Always provide the context, even before mounting
  // The isLoading state will handle the initial loading period
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || !mounted,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        impersonate,
        hasPermission,
        hasRole,
        setupMFA,
        verifyMFA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
