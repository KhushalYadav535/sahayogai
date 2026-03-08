'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Plus, Search, PiggyBank } from 'lucide-react';
import { depositsApi } from '@/lib/api';

export default function DepositsPage() {
    const [deposits, setDeposits] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await depositsApi.list({ status: statusFilter || undefined, depositType: typeFilter || undefined, limit: 50 });
                setDeposits(res.deposits || []);
                setTotal(res.total || 0);
            } catch {
                setDeposits([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [statusFilter, typeFilter]);

    const filtered = search
        ? deposits.filter(
            d =>
                d.depositNumber?.toLowerCase().includes(search.toLowerCase()) ||
                `${(d.member?.firstName || '')} ${(d.member?.lastName || '')}`.toLowerCase().includes(search.toLowerCase()) ||
                d.member?.memberNumber?.toLowerCase().includes(search.toLowerCase())
        )
        : deposits;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Deposits</h1>
                    <p className="text-muted-foreground text-sm">FDR, RD & MIS accounts</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/dashboard/deposits/analytics">Analytics</Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/dashboard/deposits/maturity">Maturity</Link>
                    </Button>
                    <Button asChild className="gap-2">
                        <Link href="/dashboard/deposits/new"><Plus className="w-4 h-4" />New Deposit</Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Search deposit no, member..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="h-10 rounded-md border border-input bg-background px-3" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All status</option>
                            <option value="active">Active</option>
                            <option value="matured">Matured</option>
                            <option value="prematurely_closed">Prematurely Closed</option>
                        </select>
                        <select className="h-10 rounded-md border border-input bg-background px-3" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="">All types</option>
                            <option value="fd">FDR</option>
                            <option value="rd">RD</option>
                            <option value="mis">MIS</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground py-8 text-center">Loading...</p>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No deposits found</p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link href="/dashboard/deposits/new">Create first deposit</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">Deposit No</th>
                                        <th className="text-left py-3 px-2">Member</th>
                                        <th className="text-left py-3 px-2">Type</th>
                                        <th className="text-right py-3 px-2">Principal</th>
                                        <th className="text-right py-3 px-2">Rate</th>
                                        <th className="text-left py-3 px-2">Maturity</th>
                                        <th className="text-right py-3 px-2">Maturity Amt</th>
                                        <th className="text-left py-3 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(d => (
                                        <tr key={d.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2">
                                                <Link href={`/dashboard/deposits/${d.id}`} className="font-mono font-medium text-primary hover:underline">
                                                    {d.depositNumber}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2">{d.member ? `${d.member.firstName} ${d.member.lastName}` : '-'}</td>
                                            <td className="py-3 px-2"><Badge variant="outline">{String(d.depositType || '').toUpperCase()}</Badge></td>
                                            <td className="py-3 px-2 text-right">{formatCurrency(Number(d.principal), 0)}</td>
                                            <td className="py-3 px-2 text-right">{Number(d.interestRate)}%</td>
                                            <td className="py-3 px-2">{d.maturityDate ? formatDate(new Date(d.maturityDate)) : '-'}</td>
                                            <td className="py-3 px-2 text-right font-medium">{d.maturityAmount ? formatCurrency(Number(d.maturityAmount)) : '-'}</td>
                                            <td className="py-3 px-2"><Badge className={d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-muted'}>{d.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
