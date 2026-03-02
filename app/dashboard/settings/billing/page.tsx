'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { platformBillingApi } from '@/lib/api';

export default function TenantBillingPage() {
    const router = useRouter();
    const [billing, setBilling] = useState<{ plan: string; mrr: number; arr: number; isOverride: boolean } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        platformBillingApi.getMyBilling()
            .then((r) => setBilling(r.billing))
            .catch(() => setBilling(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-muted-foreground">Loading billing...</p>
            </div>
        );
    }

    if (!billing) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <p className="text-muted-foreground">Unable to load billing information.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6" /> Billing & Plan</h1>
                    <p className="text-muted-foreground text-sm">Your subscription amount as set by the platform administrator.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Plan</CardTitle></CardHeader>
                    <CardContent>
                        <Badge className="bg-purple-100 text-purple-800 text-sm">{billing.plan || 'Starter'}</Badge>
                        {billing.isOverride && <p className="text-xs text-muted-foreground mt-2">Custom amount applied</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Monthly (MRR)</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(billing.mrr, 0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Annual (ARR)</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(billing.arr, 0)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Billing amounts are configured by the platform administrator. For changes to your plan or billing, please contact support.</p>
                </CardContent>
            </Card>
        </div>
    );
}
