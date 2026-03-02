'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { AlertTriangle, Eye, CheckCircle, Clock, Send } from 'lucide-react';

const mockSTRs = [
    { id: 'STR-2026-001', member: 'Rajesh Kumar', memberId: 'MEM-202401-0001', amount: 480000, type: 'Cash Deposit', txDate: new Date('2026-02-25'), reason: 'Multiple cash deposits just below ₹5L threshold in 7 days', status: 'DRAFT', riskLevel: 'HIGH', aiConfidence: 92 },
    { id: 'STR-2026-002', member: 'Unknown', memberId: 'External', amount: 210000, type: 'Transfer In', txDate: new Date('2026-02-20'), reason: 'Unidentified transfer from foreign account', status: 'SUBMITTED', riskLevel: 'MEDIUM', aiConfidence: 76 },
    { id: 'STR-2026-003', member: 'Priya Sharma', memberId: 'MEM-202401-0002', amount: 950000, type: 'Cash Withdrawal', txDate: new Date('2026-02-18'), reason: 'Large cash withdrawal inconsistent with member profile', status: 'FILED', riskLevel: 'HIGH', aiConfidence: 88 },
];

export default function STRQueuePage() {
    const [selected, setSelected] = useState<typeof mockSTRs[0] | null>(null);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filed, setFiled] = useState<string[]>([]);

    const handleFile = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        if (selected) { setFiled(prev => [...prev, selected.id]); }
        setSubmitting(false);
        setSelected(null);
    };

    const riskColors: Record<string, string> = { HIGH: 'bg-red-100 text-red-800', MEDIUM: 'bg-amber-100 text-amber-800', LOW: 'bg-green-100 text-green-800' };
    const statusColors: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', SUBMITTED: 'bg-amber-100 text-amber-800', FILED: 'bg-green-100 text-green-800' };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-600" /> STR Queue</h1>
                <p className="text-muted-foreground text-sm">Suspicious Transaction Reports — File to FIU-IND within 7 days</p></div>

            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">1 unsubmitted STR requires action. FIU-IND reporting deadline: <strong>7 days from detection</strong>.</AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
                {[['Draft', mockSTRs.filter(s => s.status === 'DRAFT').length, 'text-gray-600'], ['Submitted', mockSTRs.filter(s => s.status === 'SUBMITTED').length, 'text-amber-600'], ['Filed to FIU', mockSTRs.filter(s => s.status === 'FILED' || filed.includes(s.id)).length, 'text-green-600']].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-2xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>STR Records</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>STR ID</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead><TableHead>TX Date</TableHead>
                                <TableHead>AI Risk</TableHead><TableHead>AI Conf.</TableHead>
                                <TableHead>Status</TableHead><TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockSTRs.map(str => (
                                <TableRow key={str.id} className={str.riskLevel === 'HIGH' && str.status === 'DRAFT' ? 'bg-red-50 dark:bg-red-950' : ''}>
                                    <TableCell className="font-mono text-xs">{str.id}</TableCell>
                                    <TableCell><p className="font-medium text-sm">{str.member}</p><p className="text-xs text-muted-foreground">{str.memberId}</p></TableCell>
                                    <TableCell className="text-sm">{str.type}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(str.amount, 0)}</TableCell>
                                    <TableCell className="text-sm">{formatDate(str.txDate)}</TableCell>
                                    <TableCell><Badge className={riskColors[str.riskLevel]}>{str.riskLevel}</Badge></TableCell>
                                    <TableCell><span className="text-sm font-medium text-primary">{str.aiConfidence}% ✦</span></TableCell>
                                    <TableCell><Badge className={filed.includes(str.id) ? 'bg-green-100 text-green-800' : statusColors[str.status]}>{filed.includes(str.id) ? 'FILED' : str.status}</Badge></TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => setSelected(str)}>
                                            <Eye className="w-3.5 h-3.5" /> Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>STR Review — {selected?.id}</DialogTitle></DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[['Member', selected.member], ['Amount', formatCurrency(selected.amount, 0)], ['Transaction Type', selected.type], ['Date', formatDate(selected.txDate)]].map(([k, v]) => (
                                    <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>
                                ))}
                            </div>
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">AI ✦ DETECTION REASON</p>
                                <p className="text-sm">{selected.reason}</p>
                                <p className="text-xs text-primary mt-1">Confidence: {selected.aiConfidence}%</p>
                            </div>
                            <div><label className="text-sm font-medium">Compliance Officer Remarks</label><Textarea className="mt-1" value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Add your findings and justification..." /></div>
                            <div className="flex gap-2">
                                <Button className="flex-1 gap-2" disabled={!remarks || submitting} onClick={handleFile}><Send className="w-4 h-4" />{submitting ? 'Filing...' : 'File to FIU-IND'}</Button>
                                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
