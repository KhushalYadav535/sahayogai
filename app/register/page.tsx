'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [societyName, setSocietyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!societyName || !adminName || !email || !password) {
            toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
            return;
        }

        try {
            setIsLoading(true);
            const res = await authApi.registerTenant({
                societyName,
                adminName,
                email,
                password
            });

            if (res.success) {
                toast({
                    title: 'Registration Successful',
                    description: `Society registered with Tenant ID/Code: ${res.tenant?.code}. You can now log in.`,
                });
                router.push('/login');
            }
        } catch (error) {
            toast({
                title: 'Registration Failed',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl" />

            <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
                <CardHeader className="space-y-2 text-center pb-6 border-b border-border/20">
                    <div className="flex items-center justify-center mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-inner">
                            <span className="text-primary-foreground font-bold text-xl tracking-tight">SA</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Register Society</CardTitle>
                    <CardDescription className="text-sm">Create a new cooperative workspace</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="societyName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Society Name</Label>
                            <Input id="societyName" className="bg-muted/30" placeholder="e.g. Sahayog Credit Coop" value={societyName} onChange={(e) => setSocietyName(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Full Name</Label>
                            <Input id="adminName" className="bg-muted/30" placeholder="John Doe" value={adminName} onChange={(e) => setAdminName(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Email</Label>
                            <Input id="email" type="email" className="bg-muted/30" placeholder="admin@society.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                            <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
                        </div>
                        <Button type="submit" className="w-full h-12 text-base font-medium shadow-sm" disabled={isLoading}>
                            {isLoading ? 'Registering...' : 'Complete Registration'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-muted-foreground pt-4 border-t border-border/40">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-semibold tracking-tight">
                            Log In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
