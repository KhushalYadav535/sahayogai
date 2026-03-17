'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { anomalyAlertsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// IMP-14: Resolution codes per BRD INT-012
const RESOLUTION_CODES = [
  { value: 'RECALCULATED_CORRECT', label: 'Recalculated — interest was correct (false positive)' },
  { value: 'ERROR_FOUND_CORRECTED', label: 'Error found and corrected' },
  { value: 'REFERRED_TO_COMPLIANCE', label: 'Referred to Compliance Officer' },
  { value: 'BACKDATED_TRANSACTION_CAUSED', label: 'Backdated transaction caused — no error' },
];

export default function AnomalyAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [resolutionCode, setResolutionCode] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [mode, setMode] = useState<'resolve' | 'escalate' | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await anomalyAlertsApi.list({ limit: 50 });
      if (res.success && res.alerts) setAlerts(res.alerts);
    } catch (e: any) {
      toast({ title: 'Error', description: 'Failed to load anomaly alerts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selected?.id || !resolutionCode || !resolutionNote || resolutionNote.length < 10) return;
    setActionLoading(true);
    try {
      await anomalyAlertsApi.resolve(selected.id, { resolutionCode, resolutionNote });
      toast({ title: 'Resolved', description: 'Anomaly alert resolved' });
      setSelected(null);
      setMode(null);
      setResolutionCode('');
      setResolutionNote('');
      loadAlerts();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Resolution failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selected?.id || !escalationReason || escalationReason.length < 10) return;
    setActionLoading(true);
    try {
      await anomalyAlertsApi.escalate(selected.id, { escalationReason });
      toast({ title: 'Escalated', description: 'Alert escalated to Compliance Officer' });
      setSelected(null);
      setMode(null);
      setEscalationReason('');
      loadAlerts();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Escalation failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">AI Anomaly Alerts</h1>
          <p className="text-muted-foreground text-sm">INT-012 — Resolve or escalate interest anomalies</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">No pending anomaly alerts</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{alerts.length} Pending Alert{alerts.length !== 1 ? 's' : ''}</CardTitle>
            <CardDescription>Select an alert to investigate and resolve with a reason code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{a.accountType} — Account {a.accountId?.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Expected: {formatCurrency(a.expectedInterest || 0)} | Actual: {formatCurrency(a.actualInterest || 0)} | Dev: {a.deviationPct?.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{a.explanationText}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(a); setMode('resolve'); setResolutionCode(''); setResolutionNote(''); }}>
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelected(a); setMode('escalate'); setEscalationReason(''); }}>
                      Escalate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected && mode === 'resolve'} onOpenChange={(o) => !o && setSelected(null) && setMode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Anomaly</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Alert><AlertDescription>Account {selected.accountType} — Deviation: {selected.deviationPct?.toFixed(2)}%</AlertDescription></Alert>
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Code *</label>
                <select value={resolutionCode} onChange={e => setResolutionCode(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select...</option>
                  {RESOLUTION_CODES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Note * (min 10 chars)</label>
                <Input value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Describe resolution..." />
              </div>
              <Button className="w-full" disabled={!resolutionCode || resolutionNote.length < 10 || actionLoading} onClick={handleResolve}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resolve'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected && mode === 'escalate'} onOpenChange={(o) => !o && setSelected(null) && setMode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalate to Compliance</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Alert variant="destructive"><AlertDescription>Anomaly too complex — escalated to Compliance Officer (24h SLA)</AlertDescription></Alert>
              <div>
                <label className="text-sm font-medium mb-2 block">Escalation Reason * (min 10 chars)</label>
                <Input value={escalationReason} onChange={e => setEscalationReason(e.target.value)} placeholder="Explain why escalating..." />
              </div>
              <Button className="w-full" variant="destructive" disabled={escalationReason.length < 10 || actionLoading} onClick={handleEscalate}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Escalate'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
