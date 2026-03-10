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
import { ShieldCheck, TrendingUp, Users, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex">
      {/* Left: Gradient Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>

        {/* Animated orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 blur-[80px] rounded-full animate-blob" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-white/10 blur-[80px] rounded-full animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-400/10 blur-[80px] rounded-full animate-blob animation-delay-4000" />

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/20">
              <span className="text-white font-bold text-lg">SA</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-4">
              Welcome to<br />Sahayog AI
            </h1>
            <p className="text-blue-100/80 text-lg font-light max-w-md leading-relaxed">
              The intelligent cooperative finance platform trusted by hundreds of societies across India.
            </p>
          </div>

          <div className="space-y-5 mt-4">
            {[
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'Bank-Grade Security', desc: 'End-to-end encryption & RBI compliance' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'AI-Powered Insights', desc: 'Smart analytics & risk detection' },
              { icon: <Users className="w-5 h-5" />, title: 'Member-First Design', desc: 'Self-serve portals & digital passbooks' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-blue-200/70 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SA</span>
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground">Sahayog <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</span></span>
            </div>
          </div>

          <Card className="border-border/40 shadow-lg">
            <CardHeader className="space-y-2 text-center pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Sign in to your account</CardTitle>
              <CardDescription>Enter your credentials to access the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant" className="text-sm font-medium">Tenant ID <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <Input
                    id="tenant"
                    placeholder="Enter tenant ID"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground flex flex-col gap-3">
                <div>
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-primary hover:underline font-semibold">
                    Register Your Society
                  </Link>
                </div>

                <div className="pt-2 border-t border-border/40 mt-1">
                  Are you a society member?{' '}
                  <Link href="/member-portal/login" className="text-primary hover:underline font-semibold">
                    Member Login
                  </Link>
                </div>
              </div>

              {/* Demo credentials */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl text-sm border border-blue-100 dark:border-blue-900/30">
                <p className="font-semibold mb-2 text-foreground text-xs uppercase tracking-wider">Demo Credentials</p>
                <div className="space-y-1">
                  <p className="text-muted-foreground"><span className="font-medium text-foreground/80">Superadmin:</span> sdsiteadmin@sentientdigital.in</p>
                  <p className="text-muted-foreground"><span className="font-medium text-foreground/80">Admin:</span> admin@sentientdigital.in</p>
                  <p className="text-muted-foreground"><span className="font-medium text-foreground/80">Password:</span> Sentient1234@</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
