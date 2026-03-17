'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { approvalsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/formatters';

const LARGE_CHANGE_THRESHOLD = 0.5; // % — President oversight if avg delta exceeds this
const OVERRIDE_REASON_CODES = [
  { value: 'RATE_ALIGNMENT', label: 'Rate alignment with market' },
  { value: 'BOARD_APPROVED', label: 'Board approved' },
  { value: 'TENURE_STRUCTURE', label: 'Tenure structure update' },
  { value: 'OTHER', label: 'Other' },
];

export default function ApprovalComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || 'interest_scheme';
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    params.then(p => {
      fetchComparison(p.id, source);
    });
  }, [params, source]);

  const fetchComparison = async (id: string, source: string) => {
    try {
      setLoading(true);
      const response = await approvalsApi.getComparison(id, source);
      if (response.success) {
        setComparison(response.comparison);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load comparison',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No comparison data available</p>
        <Link href="/dashboard/approvals">
          <Button variant="outline" className="mt-4">
            Back to Approvals
          </Button>
        </Link>
      </div>
    );
  }

  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Not set</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return formatCurrency(value);
    return String(value);
  };

  const isChanged = (field: string) => {
    return comparison.changes?.some((c: any) => c.field === field);
  };

  // IMP-03: Compute rate deltas for interest_scheme slabs
  const slabDeltas = (() => {
    if (source !== 'interest_scheme' || !comparison?.current?.slabs || !comparison?.proposed?.slabs) return [];
    const current = comparison.current.slabs || [];
    const proposed = comparison.proposed.slabs || [];
    return proposed.map((p: any, i: number) => {
      const cur = current[i] || {};
      const curRate = Number(cur.rate ?? cur.interestRate ?? 0);
      const propRate = Number(p.rate ?? p.interestRate ?? 0);
      const delta = propRate - curRate;
      return { minMonths: p.minMonths ?? p.minTenure ?? '-', maxMonths: p.maxMonths ?? p.maxTenure ?? '-', current: curRate, proposed: propRate, delta };
    });
  })();
  const avgDelta = slabDeltas.length > 0 ? slabDeltas.reduce((s, d) => s + d.delta, 0) / slabDeltas.length : 0;
  const needsPresidentOversight = Math.abs(avgDelta) > LARGE_CHANGE_THRESHOLD;
  const canApproveReject = reasonCode && (reasonCode !== 'OTHER' || reasonText.trim().length >= 20);

  const handleApprove = async () => {
    if (!comparison?.proposed?.id || !canApproveReject) return;
    setActionLoading(true);
    try {
      await approvalsApi.approveScheme(comparison.proposed.id, {
        action: 'APPROVE',
        reasonCode: reasonCode + (reasonText ? ': ' + reasonText : ''),
        reason: reasonText || reasonCode,
      });
      toast({ title: 'Approved', description: 'Interest scheme approved successfully' });
      router.push('/dashboard/approvals');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Approval failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comparison?.proposed?.id || !canApproveReject) return;
    setActionLoading(true);
    try {
      await approvalsApi.approveScheme(comparison.proposed.id, {
        action: 'REJECT',
        reasonCode: reasonCode + (reasonText ? ': ' + reasonText : ''),
        reason: reasonText || reasonCode,
      });
      toast({ title: 'Rejected', description: 'Interest scheme rejected' });
      router.push('/dashboard/approvals');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Rejection failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/approvals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Side-by-Side Comparison</h1>
          <p className="text-muted-foreground">Review changes before approval</p>
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parameter Comparison</CardTitle>
          <CardDescription>
            Current (Active) values on the left, Proposed values on the right
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Field</th>
                  <th className="text-left p-3 font-semibold bg-blue-50 dark:bg-blue-950">Current (Active)</th>
                  <th className="text-left p-3 font-semibold bg-green-50 dark:bg-green-950">Proposed</th>
                </tr>
              </thead>
              <tbody>
                {comparison.changes?.map((change: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      {change.field.replace(/([A-Z])/g, ' $1').trim()}
                      {isChanged(change.field) && (
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Changed</Badge>
                      )}
                    </td>
                    <td className={`p-3 ${isChanged(change.field) ? 'bg-red-50 dark:bg-red-950' : ''}`}>
                      {renderFieldValue(change.current)}
                    </td>
                    <td className={`p-3 ${isChanged(change.field) ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                      {renderFieldValue(change.proposed)}
                    </td>
                  </tr>
                ))}
                {(!comparison.changes || comparison.changes.length === 0) && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                      {comparison.current ? 'No changes detected' : 'New item - no current version'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* IMP-03: Interest scheme — slab rate deltas */}
      {source === 'interest_scheme' && slabDeltas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Delta by Slab</CardTitle>
            <CardDescription>Current vs Proposed rates per tenure band</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Tenure Band</th>
                    <th className="text-right p-2 font-semibold">Current</th>
                    <th className="text-right p-2 font-semibold">Proposed</th>
                    <th className="text-right p-2 font-semibold bg-amber-50 dark:bg-amber-950">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {slabDeltas.map((d, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-2">{d.minMonths}–{d.maxMonths} months</td>
                      <td className="p-2 text-right">{d.current}%</td>
                      <td className="p-2 text-right">{d.proposed}%</td>
                      <td className={`p-2 text-right font-medium ${d.delta > 0 ? 'text-green-600' : d.delta < 0 ? 'text-red-600' : ''}`}>
                        {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm font-medium">Average delta: <span className={avgDelta !== 0 ? 'text-amber-600' : ''}>{avgDelta > 0 ? '+' : ''}{avgDelta.toFixed(2)}%</span></p>
            {needsPresidentOversight && (
              <Alert className="mt-4 border-amber-300 bg-amber-50 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription>President oversight required — average rate change exceeds {LARGE_CHANGE_THRESHOLD}%</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Changes</p>
              <p className="text-2xl font-bold">{comparison.changes?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={
                comparison.proposed?.status === 'PENDING_APPROVAL' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
              }>
                {comparison.proposed?.status || 'Pending'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IMP-03: Approve/Reject with reason code (interest_scheme) */}
      {source === 'interest_scheme' && comparison?.proposed?.id && (
        <Card>
          <CardHeader>
            <CardTitle>Approve or Reject</CardTitle>
            <CardDescription>Reason code is required before action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason Code *</label>
              <select value={reasonCode} onChange={e => setReasonCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="">Select reason...</option>
                {OVERRIDE_REASON_CODES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {reasonCode === 'OTHER' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Narrative (min 20 chars) *</label>
                <Input value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder="Describe reason..." />
              </div>
            )}
            <div className="flex gap-2">
              <Button disabled={!canApproveReject || actionLoading} onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} Approve
              </Button>
              <Button variant="destructive" disabled={!canApproveReject || actionLoading} onClick={handleReject}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
