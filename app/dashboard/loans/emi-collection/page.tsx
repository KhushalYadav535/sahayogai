'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Search, AlertTriangle, CreditCard, CheckCircle } from 'lucide-react';

const mockMemberEMIs = {
    member: { id: '1', name: 'Rajesh Kumar', memberId: 'MEM-202401-0001' },
    emis: [
        { loanId: 'LN-2024-000001', emiNo: 6, dueDate: new Date('2024-08-25'), principal: 4167, interest: 325, penal: 150, total: 4642, status: 'OVERDUE', overdueDays: 15 },
        { loanId: 'LN-2024-000001', emiNo: 7, dueDate: new Date('2024-09-25'), principal: 4167, interest: 282, penal: 0, total: 4449, status: 'DUE', overdueDays: 0 },
    ],
};

export default function EMICollectionPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [memberFound, setMemberFound] = useState(false);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [payMode, setPayMode] = useState('Cash');
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [paid, setPaid] = useState(false);

    const selectedEMIs = mockMemberEMIs.emis.filter((_, i) => selected[i]);
    const totalDue = selectedEMIs.reduce((s, e) => s + e.total, 0);

    const handleSearch = () => { if (search.length > 1) setMemberFound(true); };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6" /> EMI Collection</h1>
                    <p className="text-muted-foreground text-sm">Search member and collect outstanding EMIs</p></div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Search by member name or loan ID..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></div>
                        <Button onClick={handleSearch}>Search</Button>
                    </div>
                </CardContent>
            </Card>

            {memberFound && !paid && (
                <>
                    {/* Member card */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-primary/5">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">R</div>
                        <div><p className="font-semibold">{mockMemberEMIs.member.name}</p><p className="text-xs text-muted-foreground">{mockMemberEMIs.member.memberId}</p></div>
                    </div>

                    {/* EMI table */}
                    <Card>
                        <CardHeader><CardTitle>EMI Schedule</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10"><Checkbox checked={Object.values(selected).every(Boolean) && Object.keys(selected).length === mockMemberEMIs.emis.length} onCheckedChange={v => { const s: Record<number, boolean> = {}; mockMemberEMIs.emis.forEach((_, i) => { s[i] = !!v; }); setSelected(s); }} /></TableHead>
                                        <TableHead>Loan ID</TableHead><TableHead>EMI #</TableHead><TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Interest</TableHead>
                                        <TableHead className="text-right">Penal</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockMemberEMIs.emis.map((emi, i) => (
                                        <TableRow key={i} className={emi.status === 'OVERDUE' ? 'bg-red-50 dark:bg-red-950' : ''}>
                                            <TableCell><Checkbox checked={!!selected[i]} onCheckedChange={v => setSelected(prev => ({ ...prev, [i]: !!v }))} /></TableCell>
                                            <TableCell className="font-mono text-xs">{emi.loanId}</TableCell>
                                            <TableCell>{emi.emiNo}</TableCell>
                                            <TableCell>{formatDate(emi.dueDate)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(emi.principal)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(emi.interest)}</TableCell>
                                            <TableCell className="text-right text-red-600">{emi.penal ? formatCurrency(emi.penal) : '—'}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(emi.total)}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emi.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {emi.status}{emi.overdueDays > 0 ? ` (${emi.overdueDays}d)` : ''}
                                                </span>
                                                {emi.status === 'OVERDUE' && <p className="text-xs text-red-600 mt-0.5"><AlertTriangle className="inline w-3 h-3 mr-0.5" />Overdue {emi.overdueDays} days</p>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Payment Panel */}
                    {selectedEMIs.length > 0 && (
                        <Card>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{selectedEMIs.length} EMI(s) selected</p>
                                    <p className="text-xl font-bold text-primary">{formatCurrency(totalDue)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Payment Mode</label>
                                    <div className="flex gap-2 mt-2">
                                        {['Cash', 'UPI', 'Bank Transfer'].map(m => (
                                            <button key={m} onClick={() => setPayMode(m)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${payMode === m ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => setReceiptOpen(true)}>Preview Receipt & Confirm</Button>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {paid && (
                <div className="text-center py-10 space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-xl font-bold">Payment Collected!</h2>
                    <p className="text-muted-foreground">{formatCurrency(totalDue)} collected via {payMode}</p>
                    <p className="text-xs font-mono text-muted-foreground">Ref: PAY-{Date.now().toString().slice(-8)}</p>
                    <Button onClick={() => { setPaid(false); setMemberFound(false); setSearch(''); setSelected({}); }}>New Collection</Button>
                </div>
            )}

            {/* Receipt Modal */}
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent><DialogHeader><DialogTitle>Collection Receipt Preview</DialogTitle></DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Member</span><span>{mockMemberEMIs.member.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">EMIs Collected</span><span>{selectedEMIs.length} EMI(s)</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode</span><span>{payMode}</span></div>
                        <div className="flex justify-between border-t border-border pt-2 font-bold text-base"><span>Total Collected</span><span className="text-primary">{formatCurrency(totalDue)}</span></div>
                    </div>
                    <Button className="w-full mt-4" onClick={() => { setReceiptOpen(false); setPaid(true); }}>Confirm & Post</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
