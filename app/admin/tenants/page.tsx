'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Building2, Plus, Search, Eye, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { tenantsApi, setApiToken } from '@/lib/api';


const planColors: Record<string, string> = {
    PROFESSIONAL: 'bg-purple-100 text-purple-800',
    pro: 'bg-purple-100 text-purple-800',
    STARTER: 'bg-blue-100 text-blue-800',
    starter: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-green-100 text-green-800',
    TRIAL: 'bg-amber-100 text-amber-800',
};

function mapTenant(t: any) {
    const creds = t.credits || {};
    return {
        id: t.id,
        name: t.name,
        regNo: t.regNumber || t.code || '-',
        state: t.state || '-',
        members: t._count?.members ?? t.members ?? 0,
        status: (t.status || 'active').toUpperCase(),
        plan: (t.plan || 'starter').toUpperCase().replace('enterprise', 'PROFESSIONAL'),
        credits: creds.txCredits ?? 0,
        mrr: t.mrr ?? 0,
    };
}

export default function TenantsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tenants, setTenants] = useState<ReturnType<typeof mapTenant>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        tenantsApi.list(token || undefined)
            .then((r) => setTenants((r.tenants || []).map(mapTenant)))
            .catch(() => setTenants([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = tenants.filter(t =>
        (statusFilter === 'all' || t.status === statusFilter) &&
        (t.name.toLowerCase().includes(search.toLowerCase()) || t.regNo.includes(search))
    );

    const totalMRR = tenants.filter(t => t.status === 'ACTIVE').reduce((s, t) => s + t.mrr, 0);
    const totalMembers = tenants.reduce((s, t) => s + t.members, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Tenant Management</h1>
                    <p className="text-muted-foreground text-sm">Multi-tenant cooperative society instances</p></div>
                <Button onClick={() => router.push('/admin/tenants/new')} className="gap-2"><Plus className="w-4 h-4" /> Onboard Tenant</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[['Total Tenants', tenants.length, 'text-foreground'], ['Active', tenants.filter(t => t.status === 'ACTIVE').length, 'text-green-600'], ['Total Members', totalMembers, 'text-blue-600'], ['Monthly Revenue', formatCurrency(totalMRR, 0), 'text-primary']].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-40"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                {['all', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${statusFilter === s ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{s === 'all' ? 'All' : s}</button>)}
            </div>

            <Card>
                <CardContent className="pt-4">
                    {loading && <p className="text-sm text-muted-foreground py-4">Loading tenants...</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Society Name</TableHead><TableHead>Reg No</TableHead><TableHead>State</TableHead>
                                <TableHead className="text-right">Members</TableHead><TableHead>Plan</TableHead>
                                <TableHead className="text-right">Credits</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{t.regNo}</TableCell>
                                    <TableCell>{t.state}</TableCell>
                                    <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Users className="w-3.5 h-3.5 text-muted-foreground" />{t.members}</div></TableCell>
                                    <TableCell><Badge className={planColors[t.plan as keyof typeof planColors] || 'bg-gray-100 text-gray-700'}>{t.plan}</Badge></TableCell>
                                    <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Wallet className="w-3.5 h-3.5 text-muted-foreground" />{t.credits}</div></TableCell>
                                    <TableCell><Badge className={t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : t.status === 'TRIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>{t.status}</Badge></TableCell>
                                    <TableCell><Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => router.push('/admin/tenants/' + t.id)}><Eye className="w-3.5 h-3.5" /> View</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
