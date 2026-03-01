'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { User, LoginCredentials, SignupData, Permission, UserRole, ROLE_PERMISSIONS } from '@/lib/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  setupMFA: (method: 'TOTP' | 'SMS') => Promise<string>;
  verifyMFA: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to restore session from localStorage or API
        const storedUser = localStorage.getItem('sahayog-user');
        const storedToken = localStorage.getItem('sahayog-token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
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
      // TODO: Replace with actual API call
      // For now, creating a mock user for demo purposes
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        role: UserRole.SOCIETY_ADMIN,
        tenantId: credentials.tenantId || 'default',
        permissions: ROLE_PERMISSIONS[UserRole.SOCIETY_ADMIN],
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem('sahayog-user', JSON.stringify(mockUser));
      localStorage.setItem('sahayog-token', 'mock-token-' + Date.now());
      setUser(mockUser);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        role: UserRole.MEMBER,
        tenantId: data.tenantId || 'default',
        permissions: ROLE_PERMISSIONS[UserRole.MEMBER],
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem('sahayog-user', JSON.stringify(mockUser));
      localStorage.setItem('sahayog-token', 'mock-token-' + Date.now());
      setUser(mockUser);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
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
