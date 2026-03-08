'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, CheckCircle, AlertTriangle, Lock, Zap, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { jobsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ACC-006: Month-End Checklist as per BRD
const MONTH_END_TASKS = [
    { id: 'day_end_completed', label: 'All Day-End Processes Completed', sub: 'Ensure all working days in the month are closed', auto: true },
    { id: 'suspense_cleared', label: 'Suspense Accounts Cleared', sub: 'All suspense entries must be cleared', auto: false },
    { id: 'sb_interest_credited', label: 'SB Interest Credited', sub: 'If monthly crediting is configured', auto: true },
    { id: 'tds_posted', label: 'TDS Computed and Posted', sub: 'TDS liability entries posted', auto: true },
    { id: 'provision_posted', label: 'Loan Loss Provision Posted', sub: 'NPA provision entries as per IRAC norms', auto: true },
    { id: 'bank_recon_completed', label: 'Bank Reconciliation Completed', sub: 'Bank statements matched with GL', auto: false },
    { id: 'pending_items_resolved', label: 'Pending Maker-Checker Items Resolved', sub: 'All pending vouchers approved', auto: false },
    { id: 'trial_balance_frozen', label: 'Trial Balance Reviewed and Frozen', sub: 'Month-end TB frozen', auto: false },
];

const FY_CLOSE_TASKS = [
    { id: 'close_pl', label: 'Close P&L to Surplus/Deficit', sub: 'Transfer net surplus to reserves', auto: true },
    { id: 'stat_audit', label: 'Statutory Audit Data Package', sub: 'Generate audit evidence bundle', auto: false },
    { id: 'rbi_return', label: 'RBI Return Filing', sub: 'Submit Form A, B, C returns', auto: false },
    { id: 'lock_prev', label: 'Lock Previous FY Ledger', sub: 'Prevent edits to closed year', auto: true },
];

export default function MonthEndPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mode, setMode] = useState<'month' | 'fy'>('month');
    const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [checklist, setChecklist] = useState<Record<string, { status: 'complete' | 'incomplete' | 'not_applicable'; details?: string }>>({});
    const [checklistLoading, setChecklistLoading] = useState(false);
    const [canClose, setCanClose] = useState(false);
    const [approvals, setApprovals] = useState<Record<string, boolean>>({});
    const [locked, setLocked] = useState(false);
    const [apiResult, setApiResult] = useState<{ npaLoansMarked?: number; message?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7));

    const tasks = mode === 'month' ? MONTH_END_TASKS : [...MONTH_END_TASKS, ...FY_CLOSE_TASKS];
    const manualTasks = tasks.filter(t => !t.auto);
    const allApproved = manualTasks.every(t => approvals[t.id]);
    const today = new Date();

    const fetchChecklist = async () => {
        setChecklistLoading(true);
        try {
            const res = await jobsApi.monthEndChecklist(currentPeriod);
            if (res.success) {
                setChecklist(res.checklist || {});
                setCanClose(res.canClose || false);
            }
        } catch (e) {
            console.error('Failed to fetch checklist', e);
        } finally {
            setChecklistLoading(false);
        }
    };

    useEffect(() => {
        fetchChecklist();
    }, [currentPeriod]);

    const runProcess = async () => {
        if (!canClose && !confirm('Some checklist items are incomplete. Continue anyway?')) {
            return;
        }
        setRunState('running');
        setError(null);
        setApiResult(null);
        try {
            const res = await jobsApi.monthEnd({ period: currentPeriod, force: !canClose });
            if (res.success) {
                setApiResult({ npaLoansMarked: res.npaLoansMarked ?? 0, message: res.message });
                // Mark auto tasks as done
                tasks.filter(t => t.auto).forEach(t => {
                    if (checklist[t.id]?.status === 'complete') {
                        setChecklist(prev => ({ ...prev, [t.id]: { ...prev[t.id], status: 'complete' } }));
                    }
                });
                setProgress(100);
                fetchChecklist(); // Refresh checklist
            } else {
                setError(res.message || 'Month-end failed');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Month-end failed');
        } finally {
            setRunState('done');
        }
    };

    const handleClose = async () => {
        if (!canClose) {
            toast({ title: 'Error', description: 'Cannot close: checklist incomplete', variant: 'destructive' });
            return;
        }
        if (!allApproved) {
            toast({ title: 'Error', description: 'All manual tasks must be approved', variant: 'destructive' });
            return;
        }
        try {
            const res = await jobsApi.monthEndClose({
                period: currentPeriod,
                approvedBy: 'Current User', // TODO: Get from auth context
            });
            if (res.success) {
                setLocked(true);
                toast({ title: 'Success', description: res.message });
                fetchChecklist();
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message || 'Failed to close period', variant: 'destructive' });
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{mode === 'fy' ? 'FY Close' : 'Month-End'} Checklist</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            type="month"
                            value={currentPeriod}
                            onChange={(e) => setCurrentPeriod(e.target.value)}
                            className="w-40"
                        />
                        <Button size="sm" variant="outline" onClick={fetchChecklist} disabled={checklistLoading}>
                            <RefreshCw className={`w-4 h-4 ${checklistLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {checklistLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        tasks.map(task => {
                            const itemStatus = checklist[task.id]?.status || 'incomplete';
                            const isComplete = itemStatus === 'complete' || itemStatus === 'not_applicable';
                            return (
                                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isComplete ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-amber-200 bg-amber-50 dark:bg-amber-950'}`}>
                                    <div className="w-6 flex-shrink-0">
                                        {isComplete ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{task.label}</p>
                                        <p className="text-xs text-muted-foreground">{task.sub}</p>
                                        {checklist[task.id]?.details && (
                                            <p className="text-xs mt-1 text-muted-foreground italic">{checklist[task.id].details}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {task.auto ? (
                                            <Badge className={`text-xs ${isComplete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {itemStatus === 'not_applicable' ? 'N/A' : itemStatus === 'complete' ? 'Complete' : 'Incomplete'}
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-amber-100 text-amber-800 text-xs">Manual</Badge>
                                                {runState === 'done' && (
                                                    <Checkbox
                                                        checked={!!approvals[task.id]}
                                                        onCheckedChange={v => setApprovals(prev => ({ ...prev, [task.id]: !!v }))}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {!canClose && !checklistLoading && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Cannot close period: Some checklist items are incomplete. Please complete all required items before closing.
                    </AlertDescription>
                </Alert>
            )}
            {runState === 'idle' && (
                <Button className="w-full" size="lg" onClick={runProcess} disabled={locked || checklistLoading}>
                    <Zap className="w-4 h-4 mr-2" />
                    Run {mode === 'fy' ? 'FY Close Process' : 'Month-End Process'}
                </Button>
            )}
            {runState === 'done' && !locked && (
                <Button
                    className="w-full"
                    size="lg"
                    disabled={!canClose || !allApproved}
                    variant={mode === 'fy' ? 'destructive' : 'default'}
                    onClick={handleClose}
                >
                    <Lock className="w-4 h-4 mr-2" />
                    {mode === 'fy' ? 'Lock Financial Year' : 'Confirm Month-End Close'}
                </Button>
            )}
            {locked && (
                <div className="text-center py-4 space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-lg">{mode === 'fy' ? 'Financial Year Locked' : 'Month-End Complete'}</p>
                    <p className="text-sm text-muted-foreground">Period {currentPeriod} is now closed</p>
                </div>
            )}
        </div>
    );
}
