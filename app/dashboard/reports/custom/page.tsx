'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/formatters';
import { Plus, Play, Download, Trash2, Save, BarChart3, FileText, Loader2 } from 'lucide-react';
import { reportsApi } from '@/lib/api';

const MODULES = ['Members', 'Loans', 'Deposits'];
const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'contains', 'starts with'];

interface Column { field: string; label: string; enabled: boolean; type: string; }
interface Filter { field: string; op: string; value: string; }

const MODULE_FIELDS: Record<string, Column[]> = {
    Members: [
        { field: 'member_id', label: 'Member ID', enabled: true, type: 'text' },
        { field: 'member_number', label: 'Member Number', enabled: true, type: 'text' },
        { field: 'name', label: 'Name', enabled: true, type: 'text' },
        { field: 'status', label: 'Status', enabled: true, type: 'text' },
        { field: 'join_date', label: 'Join Date', enabled: false, type: 'date' },
        { field: 'kyc_status', label: 'KYC Status', enabled: false, type: 'text' },
    ],
    Loans: [
        { field: 'loan_id', label: 'Loan ID', enabled: true, type: 'text' },
        { field: 'loan_number', label: 'Loan Number', enabled: true, type: 'text' },
        { field: 'member_name', label: 'Member', enabled: true, type: 'text' },
        { field: 'loan_type', label: 'Type', enabled: true, type: 'text' },
        { field: 'outstanding', label: 'Outstanding', enabled: true, type: 'currency' },
        { field: 'dpd', label: 'Days Past Due', enabled: true, type: 'number' },
        { field: 'npa_class', label: 'NPA Class', enabled: false, type: 'text' },
        { field: 'disbursement_date', label: 'Disbursed On', enabled: false, type: 'date' },
    ],
    Deposits: [
        { field: 'deposit_id', label: 'Deposit ID', enabled: true, type: 'text' },
        { field: 'deposit_number', label: 'Deposit Number', enabled: true, type: 'text' },
        { field: 'member_name', label: 'Member', enabled: true, type: 'text' },
        { field: 'type', label: 'Type', enabled: true, type: 'text' },
        { field: 'principal', label: 'Principal', enabled: true, type: 'currency' },
        { field: 'maturity_date', label: 'Maturity Date', enabled: false, type: 'date' },
        { field: 'status', label: 'Status', enabled: false, type: 'text' },
    ],
};

export default function CustomReportBuilderPage() {
    const [module, setModule] = useState('Loans');
    const [columns, setColumns] = useState<Column[]>(MODULE_FIELDS['Loans']);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [reportName, setReportName] = useState('');
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [saveOpen, setSaveOpen] = useState(false);
    const [savedReports, setSavedReports] = useState<{ id: string; name: string; module: string; lastRun: string; rows: number }[]>([]);

    const handleModuleChange = (m: string) => {
        setModule(m);
        setColumns(MODULE_FIELDS[m] || []);
        setFilters([]);
        setResults(null);
    };

    const toggleColumn = (i: number) => {
        setColumns(prev => prev.map((c, idx) => idx === i ? { ...c, enabled: !c.enabled } : c));
    };

    const addFilter = () => setFilters(prev => [...prev, { field: columns[0]?.field || '', op: '=', value: '' }]);
    const removeFilter = (i: number) => setFilters(prev => prev.filter((_, idx) => idx !== i));

    const handleRun = async () => {
        setRunning(true);
        try {
            const res = await reportsApi.custom({ module, limit: 500 });
            if (res.success && res.rows) {
                setResults(res.rows);
                setSavedReports(prev => {
                    const rest = prev.filter(r => !(r.module === module && r.name === (reportName || `${module} Report`)));
                    return [...rest, { id: 'SR-' + Date.now(), name: reportName || `${module} Report`, module, lastRun: new Date().toLocaleDateString('en-IN'), rows: res.rows.length }];
                });
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        } finally {
            setRunning(false);
        }
    };

    const handleExportCsv = () => {
        if (!results || results.length === 0) return;
        const enabledCols = columns.filter(c => c.enabled);
        const header = enabledCols.map(c => c.label);
        const rows = results.map(r => enabledCols.map(c => (r as any)[c.field] ?? ''));
        const csv = [header.join(','), ...rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const enabledCols = columns.filter(c => c.enabled);

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Custom Report Builder</h1>
                    <p className="text-muted-foreground text-sm">Build ad-hoc reports across Members, Loans, and Deposits</p></div>
            </div>

            {savedReports.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Saved Reports</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-3 flex-wrap">
                            {savedReports.map(r => (
                                <button key={r.id} onClick={() => handleModuleChange(r.module)} className="flex flex-col items-start p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left">
                                    <span className="font-medium text-sm">{r.name}</span>
                                    <span className="text-xs text-muted-foreground">{r.module} · Last run {r.lastRun} · {r.rows} rows</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">1. Select Module</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {MODULES.map(m => (
                                <button key={m} onClick={() => handleModuleChange(m)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${module === m ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/40'}`}>{m}</button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">2. Choose Columns</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {columns.map((col, i) => (
                                <div key={col.field} className="flex items-center justify-between py-1">
                                    <span className="text-sm">{col.label}</span>
                                    <Switch checked={col.enabled} onCheckedChange={() => toggleColumn(i)} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center justify-between">
                                3. Add Filters (optional)
                                <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 p-1" onClick={addFilter}><Plus className="w-3 h-3" /> Add</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {filters.length === 0 && <p className="text-xs text-muted-foreground">No filters — all records returned</p>}
                            {filters.map((f, i) => (
                                <div key={i} className="flex gap-1 items-center">
                                    <select className="text-xs border border-border rounded px-1.5 py-1 bg-background flex-1" value={f.field} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, field: e.target.value } : ff))}>
                                        {columns.map(c => <option key={c.field} value={c.field}>{c.label}</option>)}
                                    </select>
                                    <select className="text-xs border border-border rounded px-1.5 py-1 bg-background" value={f.op} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, op: e.target.value } : ff))}>
                                        {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <Input className="h-7 text-xs flex-1" value={f.value} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, value: e.target.value } : ff))} />
                                    <button onClick={() => removeFilter(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button className="flex-1 gap-2" onClick={handleRun} disabled={running}><Play className="w-4 h-4" />{running ? 'Running...' : 'Run Report'}</Button>
                        <Button variant="outline" className="gap-1" onClick={() => setSaveOpen(true)}><Save className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {results !== null ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span>Results — {results.length} rows</span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExportCsv} disabled={results.length === 0}><Download className="w-3 h-3" /> CSV</Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {enabledCols.map(c => <TableHead key={c.field}>{c.label}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.map((row, i) => (
                                            <TableRow key={i}>
                                                {enabledCols.map(c => (
                                                    <TableCell key={c.field} className="text-sm">
                                                        {c.type === 'currency' ? formatCurrency((row as Record<string, unknown>)[c.field] as number) : String((row as Record<string, unknown>)[c.field] ?? '—')}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full flex items-center justify-center min-h-64">
                            <CardContent className="text-center pt-10 text-muted-foreground">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Select module and columns, then click <strong>Run Report</strong></p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Save Report</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><label className="text-sm font-medium">Report Name</label><Input className="mt-1" placeholder="e.g. Monthly NPA List" value={reportName} onChange={e => setReportName(e.target.value)} /></div>
                        <Button className="w-full" disabled={!reportName} onClick={() => { setSavedReports(prev => [...prev, { id: 'SR-' + Date.now(), name: reportName, module, lastRun: new Date().toLocaleDateString('en-IN'), rows: results?.length || 0 }]); setSaveOpen(false); }}>Save Report</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
