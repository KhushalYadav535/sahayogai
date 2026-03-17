'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Loader2, FileDown, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FEATURES = [
  'loan_risk_scoring',
  'interest_anomaly_detection',
  'duplicate_detection',
  'fraud_scoring',
];

export default function AIAuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [feature, setFeature] = useState('__all__');
  const [overrideCategory, setOverrideCategory] = useState('__all__');

  useEffect(() => {
    loadLogs();
  }, [page, fromDate, toDate, feature, overrideCategory]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await aiApi.auditLog({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        feature: feature === '__all__' ? undefined : feature,
        overrideCategory: overrideCategory === '__all__' ? undefined : overrideCategory,
        page,
        limit: 50,
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load audit log', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Date', 'Feature', 'Model', 'Override', 'Override Code', 'Success', 'Explanation'];
    const rows = logs.map(l => [
      formatDate(new Date(l.createdAt)),
      l.feature,
      l.modelVersion || '',
      l.humanOverride ? 'Yes' : 'No',
      l.overrideReasonCode || '',
      l.success ? 'Yes' : 'No',
      (l.explanationText || '').slice(0, 100),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ai-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: 'Exported', description: 'CSV downloaded' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">AI Audit Log</h1>
          <p className="text-muted-foreground text-sm">IMP-20 — Searchable AI decision history for Compliance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Filters</CardTitle>
          <CardDescription>Filter by date range, AI component, override category, model version</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">From Date</label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">To Date</label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">AI Component</label>
            <Select value={feature} onValueChange={setFeature}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {FEATURES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Override Category</label>
            <Select value={overrideCategory} onValueChange={setOverrideCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="GUARANTOR_STRENGTH">Guarantor Strength</SelectItem>
                <SelectItem value="COLLATERAL_SECURED">Collateral Secured</SelectItem>
                <SelectItem value="BOARD_DIRECTION">Board Direction</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <FileDown className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{total} Records</CardTitle>
          <CardDescription>AI decisions, overrides, and model invocations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No audit log entries found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Override</TableHead>
                      <TableHead>Override Code</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Explanation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{formatDate(new Date(l.createdAt))}</TableCell>
                        <TableCell><Badge variant="outline">{l.feature}</Badge></TableCell>
                        <TableCell>{l.modelVersion || '—'}</TableCell>
                        <TableCell>{l.humanOverride ? <Badge className="bg-amber-100 text-amber-800">Yes</Badge> : '—'}</TableCell>
                        <TableCell>{l.overrideReasonCode || '—'}</TableCell>
                        <TableCell>{l.success ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <Badge variant="destructive">No</Badge>}</TableCell>
                        <TableCell className="max-w-xs truncate">{l.explanationText || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 50) || 1}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
