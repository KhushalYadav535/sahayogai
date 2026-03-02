'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auditLogApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Search, FileText, Shield, RefreshCw } from 'lucide-react';

type LogEntry = {
    id: string;
    ts: string;
    user: string;
    role: string;
    action: string;
    resource: string;
    detail: string;
    ip: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newData?: any;
};

const ACTION_COLORS: Record<string, string> = {
    LOGIN: 'bg-gray-100 text-gray-700',
    MEMBER_UPDATE: 'bg-blue-100 text-blue-800',
    UPDATE_MEMBER: 'bg-blue-100 text-blue-800',
    CREATE_MEMBER: 'bg-green-100 text-green-800',
    JOURNAL_CREATE: 'bg-purple-100 text-purple-800',
    LOAN_CREATE: 'bg-green-100 text-green-800',
    LOAN_DISBURSED: 'bg-green-100 text-green-800',
    DAY_END: 'bg-gray-100 text-gray-700',
    PARAM_CHANGE: 'bg-orange-100 text-orange-800',
    CONFIG_UPDATE: 'bg-orange-100 text-orange-800',
    LOGIN_FAILED: 'bg-red-100 text-red-800',
    REVERSAL: 'bg-amber-100 text-amber-800',
    KYC_VERIFIED: 'bg-teal-100 text-teal-800',
    KYC_REJECTED: 'bg-red-100 text-red-800',
};

const PER_PAGE = 20;

export default function AuditLogPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selected, setSelected] = useState<LogEntry | null>(null);
    const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);

    const fetchLogs = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const res = await auditLogApi.list({
                search: search || undefined,
                userFilter: userFilter !== 'all' ? userFilter : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                page: pg,
                limit: PER_PAGE,
            });
            setLogs(res.logs);
            setTotal(res.total);
            // Collect unique users for filter dropdown from current response
            if (pg === 1) {
                const names = Array.from(new Set(res.logs.map(l => l.user).filter(Boolean))) as string[];
                setUniqueUsers(prev => Array.from(new Set([...prev, ...names])));
            }
        } catch {
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [search, userFilter, dateFrom, dateTo]);

    useEffect(() => {
        setPage(1);
        fetchLogs(1);
    }, [fetchLogs]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchLogs(newPage);
    };

    const totalPages = Math.ceil(total / PER_PAGE);

    // CSV export — fetch all records with current filter and download
    const handleExportCsv = async () => {
        try {
            const res = await auditLogApi.list({
                search: search || undefined,
                userFilter: userFilter !== 'all' ? userFilter : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                page: 1,
                limit: 10000,
            });
            const rows = res.logs;
            const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Detail', 'IP'];
            const csv = [
                headers.join(','),
                ...rows.map(l =>
                    [
                        new Date(l.ts).toLocaleString('en-IN'),
                        l.user,
                        l.role,
                        l.action,
                        l.resource,
                        `"${(l.detail || '').replace(/"/g, '""')}"`,
                        l.ip,
                    ].join(',')
                ),
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {/* ignore */ }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Audit Log Viewer</h1>
                    <p className="text-muted-foreground text-sm">Immutable system audit trail</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search action, resource..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={userFilter} onValueChange={v => setUserFilter(v)}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="All users" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" placeholder="From" />
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" placeholder="To" />
                <Button variant="outline" className="gap-2" onClick={() => fetchLogs(page)}>
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
                    <FileText className="w-4 h-4" /> Export CSV
                </Button>
            </div>

            <Card>
                <CardContent className="pt-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">Loading audit log...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No audit log entries found.</p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Resource</TableHead>
                                        <TableHead>IP</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs whitespace-nowrap">{new Date(log.ts).toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="font-medium text-sm">{log.user}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{log.role}</TableCell>
                                            <TableCell>
                                                <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs max-w-[140px] truncate">{log.resource}</TableCell>
                                            <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelected(log)}>
                                                    <Search className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-muted-foreground">{total} total records</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Prev</Button>
                                    <span className="text-sm self-center">{page} / {totalPages || 1}</span>
                                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>Next</Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
                <DialogContent><DialogHeader><DialogTitle>Audit Entry Detail</DialogTitle></DialogHeader>
                    {selected && (
                        <div className="space-y-2 text-sm divide-y divide-border">
                            {([
                                ['Timestamp', new Date(selected.ts).toLocaleString('en-IN')],
                                ['User', selected.user],
                                ['Role', selected.role],
                                ['Action', selected.action],
                                ['Resource', selected.resource],
                                ['IP Address', selected.ip],
                                ['Detail', selected.detail || '—'],
                            ] as [string, string][]).map(([k, v]) => (
                                <div key={k} className="flex justify-between pt-2">
                                    <span className="text-muted-foreground">{k}</span>
                                    <span className="font-medium text-right max-w-xs break-all">{v}</span>
                                </div>
                            ))}
                            {selected.newData && (
                                <div className="pt-2">
                                    <p className="text-muted-foreground mb-1">Change Data</p>
                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(selected.newData, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
