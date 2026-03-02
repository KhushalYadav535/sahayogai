'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, CheckCircle, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { jobsApi } from '@/lib/api';

const DAY_END_TASKS = [
    { id: 'interest', label: 'Post Interest Accruals', sub: 'SB, FDR, Loan interest calculations', auto: true },
    { id: 'penal', label: 'Post Penal Interest', sub: 'Overdue EMI penal charges', auto: true },
    { id: 'tds', label: 'TDS Computation', sub: 'Compute TDS on interest > ₹40,000', auto: true },
    { id: 'npa', label: 'NPA Classification', sub: 'IRAC norm classification (STANDARD/SUB/DOUBT)', auto: true },
    { id: 'gl', label: 'GL Reconciliation', sub: 'Verify subsidiary ledger balances', auto: false },
    { id: 'cash', label: 'Cash Position', sub: 'Close cash-in-hand and vault balance', auto: false },
    { id: 'backup', label: 'Day-End Backup', sub: 'Snapshot all account balances', auto: true },
];

export default function DayEndPage() {
    const router = useRouter();
    const today = new Date();
    const [runStep, setRunStep] = useState<'idle' | 'running' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [taskStatus, setTaskStatus] = useState<Record<string, 'pending' | 'done' | 'error'>>({});
    const [approved, setApproved] = useState<Record<string, boolean>>({});
    const [apiResult, setApiResult] = useState<{ sbAccountsProcessed?: number; overdueEmisMarked?: number; dormantAccountsMarked?: number; message?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const manualTasks = DAY_END_TASKS.filter(t => !t.auto);
    const allManualApproved = manualTasks.every(t => approved[t.id]);

    const runDayEnd = async () => {
        setRunStep('running');
        setError(null);
        setApiResult(null);
        setProgress(10);
        try {
            const res = await jobsApi.dayEnd();
            if (res.success) {
                setApiResult({
                    sbAccountsProcessed: res.sbAccountsProcessed ?? 0,
                    overdueEmisMarked: res.overdueEmisMarked ?? 0,
                    dormantAccountsMarked: res.dormantAccountsMarked ?? 0,
                    message: res.message,
                });
                DAY_END_TASKS.forEach((t, i) => {
                    if (t.auto) setTaskStatus(prev => ({ ...prev, [t.id]: 'done' }));
                });
                setProgress(100);
            } else {
                setError(res.message || 'Day-end failed');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Day-end failed');
        } finally {
            setRunStep('done');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold">Day-End Process</h1><p className="text-muted-foreground text-sm">{formatDate(today)} — Close of Business</p></div>
            </div>

            <Alert><AlertDescription>Day-end must be completed before any next-day transactions. Double-entry integrity is verified after all tasks run.</AlertDescription></Alert>

            {error && (
                <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            )}

            {apiResult && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                        {apiResult.message}
                        {apiResult.sbAccountsProcessed != null && ` SB accounts: ${apiResult.sbAccountsProcessed}, Overdue EMIs: ${apiResult.overdueEmisMarked}, Dormant: ${apiResult.dormantAccountsMarked}`}
                    </AlertDescription>
                </Alert>
            )}

            {runStep === 'running' && (
                <Card>
                    <CardContent className="pt-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="font-semibold">Running Day-End Tasks...</p>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <p className="text-sm text-primary font-medium">{progress}% complete</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader><CardTitle>Day-End Checklist</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {DAY_END_TASKS.map(task => {
                        const status = taskStatus[task.id] || 'pending';
                        return (
                            <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${status === 'done' ? 'border-green-200 bg-green-50 dark:bg-green-950' : status === 'error' ? 'border-red-200 bg-red-50' : 'border-border'}`}>
                                <div className="w-6 h-6 flex-shrink-0">
                                    {status === 'done' ? <CheckCircle className="w-5 h-5 text-green-500" /> : status === 'error' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : task.auto ? <Zap className="w-5 h-5 text-muted-foreground" /> : <div className="w-5 h-5 rounded border-2 border-muted-foreground" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{task.label}</p>
                                    <p className="text-xs text-muted-foreground">{task.sub}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {task.auto ? <Badge className="bg-blue-100 text-blue-800 text-xs">Auto</Badge> : (
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-amber-100 text-amber-800 text-xs">Manual</Badge>
                                            {runStep !== 'idle' && <Checkbox checked={!!approved[task.id]} onCheckedChange={v => setApproved(prev => ({ ...prev, [task.id]: !!v }))} />}
                                        </div>
                                    )}
                                    {status === 'done' && <span className="text-xs text-green-600">✓ Done</span>}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {runStep === 'idle' && (
                <Button className="w-full" size="lg" onClick={runDayEnd}><Zap className="w-4 h-4 mr-2" /> Run Day-End Process</Button>
            )}
            {runStep === 'done' && (
                <div className="space-y-4">
                    {!allManualApproved && <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950"><AlertTriangle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-700 text-sm">Please complete all manual verification steps above before confirming close.</AlertDescription></Alert>}
                    <Button className="w-full" size="lg" disabled={!allManualApproved} onClick={() => { setRunStep('idle'); setTaskStatus({}); setProgress(0); setApiResult(null); setError(null); router.push('/dashboard/accounting/journal'); }}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Confirm Day-End Close
                    </Button>
                </div>
            )}
        </div>
    );
}
