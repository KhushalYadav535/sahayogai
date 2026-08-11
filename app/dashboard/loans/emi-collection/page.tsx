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
import { ArrowLeft, Search, AlertTriangle, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { membersApi, loansApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function EMICollectionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [memberData, setMemberData] = useState<any>(null);
    const [emis, setEmis] = useState<any[]>([]);
    
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [payMode, setPayMode] = useState('Cash');
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [lastReceiptTotal, setLastReceiptTotal] = useState(0);

    const selectedEMIs = emis.filter(e => selected[e.id]);
    const totalDue = selectedEMIs.reduce((s, e) => s + (Number(e.totalEmi) || 0) + (Number(e.penalAmount) || 0), 0);

    const handleSearch = async () => {
        if (search.length < 2) return;
        setLoading(true);
        setMemberData(null);
        setEmis([]);
        setSelected({});
        setPaid(false);
        try {
            const memberRes = await membersApi.list({ search });
            if (!memberRes.success || memberRes.members.length === 0) {
                toast({ title: 'Not Found', description: 'No member found matching search.' });
                setLoading(false);
                return;
            }
            const member = memberRes.members[0];
            setMemberData(member);
            
            const loansRes = await loansApi.list({ memberId: member.id, status: 'active' });
            if (!loansRes.success || loansRes.loans.length === 0) {
                toast({ title: 'No active loans', description: 'This member has no active loans.' });
                setLoading(false);
                return;
            }
            
            let allEmis: any[] = [];
            for (const loan of loansRes.loans) {
                const loanDetails = await loansApi.get(loan.id);
                if (loanDetails.success && loanDetails.loan.emiSchedule) {
                    const pending = loanDetails.loan.emiSchedule.filter((e: any) => e.status === 'pending');
                    // Add loan info to each EMI for display
                    allEmis = [...allEmis, ...pending.map((e: any) => ({ ...e, loanNumber: loan.loanNumber || loan.id.slice(0,8) }))];
                }
            }
            allEmis.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            setEmis(allEmis);
            if (allEmis.length === 0) {
                toast({ title: 'No pending EMIs', description: 'This member has no pending EMIs.' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to search', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setPaying(true);
        try {
            let totalPaid = 0;
            for (const emi of selectedEMIs) {
                const dueAmount = (Number(emi.totalEmi) || 0) + (Number(emi.penalAmount) || 0);
                await loansApi.payEmi(emi.loanId, { emiId: emi.id, amount: dueAmount, remarks: `Paid via ${payMode}` });
                totalPaid += dueAmount;
            }
            setLastReceiptTotal(totalPaid);
            setReceiptOpen(false);
            setPaid(true);
            toast({ title: 'Success', description: 'EMIs collected successfully' });
        } catch (error: any) {
            toast({ title: 'Payment Failed', description: error.message || 'Error collecting EMI', variant: 'destructive' });
        } finally {
            setPaying(false);
        }
    };

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
                            <Input className="pl-9" placeholder="Search by member name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {memberData && !paid && (
                <>
                    {/* Member card */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-primary/5">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            {memberData.firstName.charAt(0)}
                        </div>
                        <div><p className="font-semibold">{memberData.firstName} {memberData.lastName}</p><p className="text-xs text-muted-foreground">{memberData.memberNumber || memberData.id}</p></div>
                    </div>

                    {/* EMI table */}
                    {emis.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>EMI Schedule</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">
                                                <Checkbox 
                                                    checked={Object.values(selected).filter(Boolean).length === emis.length && emis.length > 0} 
                                                    onCheckedChange={v => { 
                                                        const s: Record<string, boolean> = {}; 
                                                        emis.forEach((e) => { s[e.id] = !!v; }); 
                                                        setSelected(s); 
                                                    }} 
                                                />
                                            </TableHead>
                                            <TableHead>Loan ID</TableHead><TableHead>EMI #</TableHead><TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Interest</TableHead>
                                            <TableHead className="text-right">Penal</TableHead><TableHead className="text-right">Total</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {emis.map((emi) => {
                                            const isOverdue = new Date(emi.dueDate) < new Date();
                                            const overdueDays = isOverdue ? Math.floor((new Date().getTime() - new Date(emi.dueDate).getTime()) / (1000 * 3600 * 24)) : 0;
                                            return (
                                                <TableRow key={emi.id} className={isOverdue ? 'bg-red-50 dark:bg-red-950' : ''}>
                                                    <TableCell><Checkbox checked={!!selected[emi.id]} onCheckedChange={v => setSelected(prev => ({ ...prev, [emi.id]: !!v }))} /></TableCell>
                                                    <TableCell className="font-mono text-xs">{emi.loanNumber}</TableCell>
                                                    <TableCell>{emi.installmentNo}</TableCell>
                                                    <TableCell>{formatDate(emi.dueDate)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(Number(emi.principal) || 0)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(Number(emi.interest) || 0)}</TableCell>
                                                    <TableCell className="text-right text-red-600">{Number(emi.penalAmount) > 0 ? formatCurrency(Number(emi.penalAmount)) : '—'}</TableCell>
                                                    <TableCell className="text-right font-bold">{formatCurrency((Number(emi.totalEmi) || 0) + (Number(emi.penalAmount) || 0))}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {isOverdue ? 'OVERDUE' : 'DUE'}{overdueDays > 0 ? ` (${overdueDays}d)` : ''}
                                                        </span>
                                                        {isOverdue && <p className="text-xs text-red-600 mt-0.5"><AlertTriangle className="inline w-3 h-3 mr-0.5" />Overdue {overdueDays} days</p>}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

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
                    <p className="text-muted-foreground">{formatCurrency(lastReceiptTotal)} collected via {payMode}</p>
                    <p className="text-xs font-mono text-muted-foreground">Ref: PAY-{Date.now().toString().slice(-8)}</p>
                    <Button onClick={() => { setPaid(false); setMemberData(null); setSearch(''); setSelected({}); setEmis([]); }}>New Collection</Button>
                </div>
            )}

            {/* Receipt Modal */}
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Collection Receipt Preview</DialogTitle></DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Member</span><span>{memberData?.firstName} {memberData?.lastName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">EMIs Collected</span><span>{selectedEMIs.length} EMI(s)</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode</span><span>{payMode}</span></div>
                        <div className="flex justify-between border-t border-border pt-2 font-bold text-base"><span>Total Collected</span><span className="text-primary">{formatCurrency(totalDue)}</span></div>
                    </div>
                    <Button className="w-full mt-4" onClick={handlePayment} disabled={paying}>
                        {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Confirm & Post
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
