'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, CheckCircle, AlertTriangle, Lock, Zap, BarChart3, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { jobsApi } from '@/lib/api';

const MONTH_END_TASKS = [
    { id: 'day_verify', label: 'Verify All Day-End Runs Completed', sub: 'Ensure all working days in the month are closed', auto: true },
    { id: 'depreciation', label: 'Post Fixed Asset Depreciation', sub: 'Monthly provision for fixed assets', auto: true },
    { id: 'provision', label: 'NPA Provisioning Journal', sub: 'Provision as per IRAC norms', auto: true },
    { id: 'interest_sub', label: 'Sub-ledger Reconciliation', sub: 'Verify member accounts match GL', auto: true },
    { id: 'dividend', label: 'Dividend Provision', sub: 'Accrue dividend payable (if declared)', auto: false },
    { id: 'audit_prep', label: 'Audit File Preparation', sub: 'Generate monthly audit documents', auto: false },
];

const FY_CLOSE_TASKS = [
    { id: 'close_pl', label: 'Close P&L to Surplus/Deficit', sub: 'Transfer net surplus to reserves', auto: true },
    { id: 'stat_audit', label: 'Statutory Audit Data Package', sub: 'Generate audit evidence bundle', auto: false },
    { id: 'rbi_return', label: 'RBI Return Filing', sub: 'Submit Form A, B, C returns', auto: false },
    { id: 'lock_prev', label: 'Lock Previous FY Ledger', sub: 'Prevent edits to closed year', auto: true },
];

export default function MonthEndPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'month' | 'fy'>('month');
    const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [taskStatus, setTaskStatus] = useState<Record<string, 'done' | 'error'>>({});
    const [approvals, setApprovals] = useState<Record<string, boolean>>({});
    const [locked, setLocked] = useState(false);
    const [apiResult, setApiResult] = useState<{ npaLoansMarked?: number; message?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const tasks = mode === 'month' ? MONTH_END_TASKS : [...MONTH_END_TASKS, ...FY_CLOSE_TASKS];
    const manualTasks = tasks.filter(t => !t.auto);
    const allApproved = manualTasks.every(t => approvals[t.id]);
    const today = new Date();

    const runProcess = async () => {
        setRunState('running');
        setError(null);
        setApiResult(null);
        try {
            const res = await jobsApi.monthEnd();
            if (res.success) {
                setApiResult({ npaLoansMarked: res.npaLoansMarked ?? 0, message: res.message });
                const autoTasks = tasks.filter(t => t.auto);
                autoTasks.forEach((t, i) => setTaskStatus(prev => ({ ...prev, [t.id]: 'done' })));
                setProgress(100);
            } else {
                setError(res.message || 'Month-end failed');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Month-end failed');
        } finally {
            setRunState('done');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold">Month-End & FY Close</h1><p className="text-muted-foreground text-sm">{formatDate(today)}</p></div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setMode('month'); setRunState('idle'); setTaskStatus({}); setProgress(0); setApprovals({}); setApiResult(null); setError(null); }} className={`px-4 py-2 text-sm rounded-lg border font-medium transition-colors ${mode === 'month' ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:border-primary/50'}`}>Monthly Close</button>
                <button onClick={() => { setMode('fy'); setRunState('idle'); setTaskStatus({}); setProgress(0); setApprovals({}); setApiResult(null); setError(null); }} className={`px-4 py-2 text-sm rounded-lg border font-medium transition-colors flex items-center gap-2 ${mode === 'fy' ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:border-primary/50'}`}><Lock className="w-4 h-4" /> FY Close</button>
            </div>

            {mode === 'fy' && <Alert className="border-red-200 bg-red-50 dark:bg-red-950"><AlertTriangle className="h-4 w-4 text-red-600" /><AlertDescription className="text-red-700 font-semibold">FY Close is irreversible! Previous year ledger will be permanently locked.</AlertDescription></Alert>}

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {apiResult && <Alert className="border-green-200 bg-green-50 dark:bg-green-950"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription>{apiResult.message} {apiResult.npaLoansMarked != null && `NPA loans marked: ${apiResult.npaLoansMarked}`}</AlertDescription></Alert>}

            {runState === 'running' && (
                <Card><CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="font-semibold">Running {mode === 'fy' ? 'FY Close' : 'Month-End'} Tasks...</p></div>
                    <Progress value={progress} className="h-3" /><p className="text-sm text-primary">{progress}% complete</p>
                </CardContent></Card>
            )}

            <Card>
                <CardHeader><CardTitle>{mode === 'fy' ? 'FY Close' : 'Month-End'} Checklist</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {tasks.map(task => {
                        const status = taskStatus[task.id];
                        return (
                            <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${status === 'done' ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-border'}`}>
                                <div className="w-6 flex-shrink-0">{status === 'done' ? <CheckCircle className="w-5 h-5 text-green-500" /> : task.auto ? <Zap className="w-5 h-5 text-muted-foreground" /> : <BarChart3 className="w-5 h-5 text-amber-500" />}</div>
                                <div className="flex-1"><p className="text-sm font-medium">{task.label}</p><p className="text-xs text-muted-foreground">{task.sub}</p></div>
                                <div className="flex items-center gap-2">
                                    {task.auto ? <Badge className="bg-blue-100 text-blue-800 text-xs">Auto</Badge> : (
                                        <div className="flex items-center gap-2"><Badge className="bg-amber-100 text-amber-800 text-xs">Manual</Badge>
                                            {runState !== 'idle' && <Checkbox checked={!!approvals[task.id]} onCheckedChange={v => setApprovals(prev => ({ ...prev, [task.id]: !!v }))} />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {runState === 'idle' && <Button className="w-full" size="lg" onClick={runProcess} disabled={locked}><Zap className="w-4 h-4 mr-2" />Run {mode === 'fy' ? 'FY Close Process' : 'Month-End Process'}</Button>}
            {runState === 'done' && !locked && (
                <Button className="w-full" size="lg" disabled={!allApproved} variant={mode === 'fy' ? 'destructive' : 'default'} onClick={() => setLocked(true)}>
                    <Lock className="w-4 h-4 mr-2" />{mode === 'fy' ? 'Lock Financial Year' : 'Confirm Month-End Close'}
                </Button>
            )}
            {locked && <div className="text-center py-4 space-y-2"><CheckCircle className="w-12 h-12 text-green-500 mx-auto" /><p className="font-bold text-lg">{mode === 'fy' ? 'Financial Year Locked' : 'Month-End Complete'}</p></div>}
        </div>
    );
}
