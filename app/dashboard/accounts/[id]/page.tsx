'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { sbApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { TableSkeleton } from '@/components/common/skeleton-loaders';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft, Printer, AlertTriangle, CheckCircle, TrendingUp, Info, Loader2 } from 'lucide-react';

interface DepositModalProps { open: boolean; onClose: () => void; onSuccess: () => void; accountId: string; accountNo: string; }
function DepositModal({ open, onClose, onSuccess, accountId, accountNo }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [denominations, setDenominations] = useState({ '2000': '', '500': '', '200': '', '100': '' });
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  
  const totalDenom = Object.entries(denominations).reduce((s, [k, v]) => s + (parseInt(k) * (parseInt(v) || 0)), 0);
  
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await sbApi.deposit(accountId, { amount: Number(amount), remarks: narration || 'Cash Deposit' });
      setStep('success');
      setTimeout(() => { onSuccess(); onClose(); setStep('form'); setAmount(''); setNarration(''); }, 2000);
    } catch (e) {
      console.error(e);
      alert('Deposit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDown className="w-5 h-5 text-green-500" /> Cash Deposit</DialogTitle></DialogHeader>
        {step === 'form' && (
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Amount (₹) *</label>
              <Input className="mt-1 text-xl font-bold" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} type="number" /></div>
            <div><label className="text-sm font-medium">Denomination Breakdown (Optional)</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {Object.keys(denominations).map(d => (
                  <div key={d}><label className="text-xs text-muted-foreground">₹{d} ×</label>
                    <Input className="mt-1" type="number" min="0" value={denominations[d as keyof typeof denominations]} onChange={e => setDenominations(prev => ({ ...prev, [d]: e.target.value }))} /></div>
                ))}
              </div>
              {totalDenom > 0 && <p className="text-xs text-muted-foreground mt-1">Denomination total: {formatCurrency(totalDenom)}</p>}
            </div>
            <div><label className="text-sm font-medium">Narration *</label><Input className="mt-1" placeholder="Purpose of deposit" value={narration} onChange={e => setNarration(e.target.value)} /></div>
            {Number(amount) > 10000 && <Alert><Info className="h-4 w-4" /><AlertDescription className="text-xs">Will require Checker approval (above ₹10,000)</AlertDescription></Alert>}
            <Button className="w-full" disabled={!amount || !narration} onClick={() => setStep('preview')}>Preview Voucher</Button>
          </div>
        )}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">CR — Account {accountNo}</span><span className="font-bold text-green-600">+ {formatCurrency(Number(amount))}</span></div>
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">DR — Cash in Hand (GL)</span><span className="font-bold text-red-600">- {formatCurrency(Number(amount))}</span></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Narration: {narration}</p>
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={submitting} onClick={() => setStep('form')}>Edit</Button>
                <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deposit'}
                </Button>
            </div>
          </div>
        )}
        {step === 'success' && (
          <div className="text-center py-6"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="font-bold text-lg">Deposit Successful!</p><p className="text-muted-foreground">₹{Number(amount).toLocaleString()} credited</p></div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface WithdrawModalProps { open: boolean; onClose: () => void; balance: number; onSuccess: () => void; accountId: string; accountNo: string; }
function WithdrawModal({ open, onClose, balance, onSuccess, accountId, accountNo }: WithdrawModalProps) {
  const MIN_BAL = 500; const DAILY_LIMIT = 50000;
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);

  const numAmt = Number(amount);
  const afterBalance = balance - numAmt;
  const minBalBreach = afterBalance < MIN_BAL;
  const limitBreach = numAmt > DAILY_LIMIT;
  const canProceed = numAmt > 0 && !minBalBreach && !limitBreach && !!narration;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await sbApi.withdraw(accountId, { amount: numAmt, remarks: narration || 'Cash Withdrawal' });
      setStep('success');
      setTimeout(() => { onSuccess(); onClose(); setStep('form'); setAmount(''); setNarration(''); }, 2000);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Withdrawal failed');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUp className="w-5 h-5 text-red-500" /> Cash Withdrawal</DialogTitle></DialogHeader>
        {step === 'form' && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Available Balance</span><span className="font-bold">{formatCurrency(balance)}</span></div>
            <div><label className="text-sm font-medium">Amount (₹) *</label><Input className="mt-1 text-xl font-bold" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} type="number" /></div>
            {numAmt > 0 && (
              <div className="space-y-2">
                {minBalBreach && <Alert className="border-red-200 bg-red-50 dark:bg-red-950"><AlertTriangle className="h-4 w-4 text-red-600" /><AlertDescription className="text-red-700 text-xs">Would breach minimum balance (₹{MIN_BAL.toLocaleString()}). Balance after: {formatCurrency(afterBalance)}</AlertDescription></Alert>}
                {limitBreach && <Alert className="border-red-200 bg-red-50 dark:bg-red-950"><AlertTriangle className="h-4 w-4 text-red-600" /><AlertDescription className="text-red-700 text-xs">Exceeds daily withdrawal limit (₹{DAILY_LIMIT.toLocaleString()})</AlertDescription></Alert>}
                {!minBalBreach && !limitBreach && <p className="text-xs text-muted-foreground">Balance after withdrawal: <span className="font-semibold">{formatCurrency(afterBalance)}</span></p>}
              </div>
            )}
            <div><label className="text-sm font-medium">Narration *</label><Input className="mt-1" placeholder="Reason for withdrawal" value={narration} onChange={e => setNarration(e.target.value)} /></div>
            <Button className="w-full" disabled={!canProceed} onClick={() => setStep('preview')}>Preview Voucher</Button>
          </div>
        )}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">DR — Account {accountNo}</span><span className="font-bold text-red-600">- {formatCurrency(numAmt)}</span></div>
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">CR — Cash in Hand (GL)</span><span className="font-bold text-green-600">+ {formatCurrency(numAmt)}</span></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Narration: {narration}</p>
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={submitting} onClick={() => setStep('form')}>Edit</Button>
                <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal'}
                </Button>
            </div>
          </div>
        )}
        {step === 'success' && (
          <div className="text-center py-6"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="font-bold text-lg">Withdrawal Successful!</p><p className="text-muted-foreground">₹{numAmt.toLocaleString()} debited</p></div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const fetchAccount = async () => {
    try {
      const res = await sbApi.get(params.id);
      if (res.success && res.account) {
        setAccount(res.account);
        setTransactions(res.account.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [params.id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (!account) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Account not found.</p>
        </div>
    );
  }

  const balance = Number(account.balance) || 0;
  const memberName = account.member ? `${account.member.firstName} ${account.member.lastName}` : `Member ID: ${account.memberId}`;

  // Dormancy warning (last transaction > 1 year ago)
  let dormancyWarning = false;
  if (account.lastActivityAt) {
      const ms = new Date().getTime() - new Date(account.lastActivityAt).getTime();
      const months = ms / (1000 * 60 * 60 * 24 * 30);
      dormancyWarning = months > 12 && account.status !== "dormant";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-2xl font-bold">Account Detail</h1><p className="text-muted-foreground text-sm">{memberName}</p></div>
      </div>

      {/* Balance Hero */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Number</p>
              <p className="text-2xl font-bold font-mono">{account.accountNumber}</p>
              <p className="text-sm text-muted-foreground capitalize">{account.accountType} Account</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(balance)}</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <Badge className={balance >= 500 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {balance >= 500 ? '✓ Above Min Balance' : '⚠ Below Min Balance'}
                </Badge>
                <Badge className={account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800 uppercase'}>{account.status.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dormancy Warning */}
      {dormancyWarning && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>Account approaching dormancy — last transaction was over 12 months ago.</AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {hasPermission(Permission.ACCOUNT_DEPOSIT) && account.status === 'active' && (
          <Button onClick={() => setDepositOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
            <ArrowDown className="w-4 h-4" /> Deposit
          </Button>
        )}
        {hasPermission(Permission.ACCOUNT_WITHDRAW) && account.status === 'active' && (
          <Button onClick={() => setWithdrawOpen(true)} variant="destructive" className="gap-2">
            <ArrowUp className="w-4 h-4" /> Withdraw
          </Button>
        )}
        <Button variant="outline" className="gap-2" onClick={() => router.push('/dashboard/accounts/transfer')}>
          <ArrowRightLeft className="w-4 h-4" /> Transfer
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print Passbook
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="passbook">Passbook</TabsTrigger>
          <TabsTrigger value="interest">Interest History</TabsTrigger>
          <TabsTrigger value="deposits">Linked Deposits</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transactions</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Export PDF</Button>
                  <Button variant="outline" size="sm">Export Excel</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <TableSkeleton rows={5} cols={6} /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>TXN ID</TableHead>
                        <TableHead>Narration</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No transactions found.</TableCell>
                          </TableRow>
                      )}
                      {transactions.map((txn, i) => {
                        const isDebit = txn.type === 'debit';
                        const isCredit = txn.type === 'credit';
                        return (
                          <TableRow key={txn.id || i}>
                            <TableCell className="text-sm">{new Date(txn.processedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="font-mono text-xs truncate max-w-[120px]">{txn.id}</TableCell>
                            <TableCell className="text-sm">{txn.remarks || txn.category}</TableCell>
                            <TableCell className="text-right font-medium text-red-600">{isDebit ? formatCurrency(txn.amount) : '—'}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">{isCredit ? formatCurrency(txn.amount) : '—'}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(txn.balanceAfter)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passbook">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between"><span>Passbook View</span><Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button></CardTitle></CardHeader>
            <CardContent>
              <div className="print-area">
                <div className="text-center mb-4 print:block hidden">
                  <h2 className="text-xl font-bold">Sahayog AI Cooperative Society</h2>
                  <p className="text-sm">Member Passbook — {memberName}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Narration</TableHead>
                      <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn, i) => {
                      const isDebit = txn.type === 'debit';
                      const isCredit = txn.type === 'credit';
                      return (
                      <TableRow key={txn.id || i}>
                        <TableCell className="text-sm">{new Date(txn.processedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{txn.remarks || txn.category}</TableCell>
                        <TableCell className="text-right text-red-600">{isDebit ? formatCurrency(txn.amount) : '—'}</TableCell>
                        <TableCell className="text-right text-green-600">{isCredit ? formatCurrency(txn.amount) : '—'}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(txn.balanceAfter)}</TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interest">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Interest History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                   <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Interest payout history is generated at month end.</TableCell></TableRow>
                </TableHeader>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader><CardTitle>Linked Deposits</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-4 text-center">No linked deposits for this account.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} onSuccess={fetchAccount} accountId={account.id} accountNo={account.accountNumber} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balance={balance} onSuccess={fetchAccount} accountId={account.id} accountNo={account.accountNumber} />
    </div>
  );
}
