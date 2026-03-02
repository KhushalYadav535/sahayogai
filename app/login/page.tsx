'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await login({ email, password, tenantId: tenantId || undefined });
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      // Superadmin (platform admin) -> tenant management; others -> dashboard
      const u = JSON.parse(localStorage.getItem('sahayog-user') || '{}');
      router.push(u.role === 'PLATFORM_ADMIN' ? '/admin/tenants' : '/dashboard');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">SA</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Sahayog AI</CardTitle>
          <CardDescription>Cooperative Finance Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant ID (Optional)</Label>
              <Input
                id="tenant"
                placeholder="Enter tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground flex flex-col gap-2">
            <div>
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register Your Society
              </Link>
            </div>

            <div className="pt-2 border-t border-border mt-2">
              Are you a society member?{' '}
              <Link href="/member-portal/login" className="text-primary hover:underline font-medium">
                Member Login
              </Link>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-3 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2 text-foreground">Demo Credentials:</p>
            <p className="text-muted-foreground">Superadmin: sdsiteadmin@sentientdigital.in</p>
            <p className="text-muted-foreground">Admin: admin@sentientdigital.in</p>
            <p className="text-muted-foreground">Password: Sentient1234@</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
