'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { TableSkeleton } from '@/components/common/skeleton-loaders';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft, Printer, AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react';

const mockAccount = {
  accountNo: 'SB-001234',
  memberId: '1',
  memberName: 'Rajesh Kumar',
  type: 'Savings',
  balance: 25000,
  minimumBalance: 1000,
  status: 'ACTIVE',
  openedDate: new Date('2023-01-10'),
  isDormant: false,
  dormancyWarning: false,
};

const mockTransactions = [
  { date: new Date('2025-02-25'), txnId: 'TXN-001', narration: 'Cash Deposit', debit: null, credit: 5000, balance: 25000 },
  { date: new Date('2025-02-20'), txnId: 'TXN-002', narration: 'EMI Debit LN-2024-000001', debit: 4382, credit: null, balance: 20000 },
  { date: new Date('2025-02-15'), txnId: 'TXN-003', narration: 'Interest Credit', debit: null, credit: 312, balance: 24382 },
  { date: new Date('2025-02-10'), txnId: 'TXN-004', narration: 'Cash Withdrawal', debit: 2000, credit: null, balance: 24070 },
  { date: new Date('2025-02-01'), txnId: 'TXN-005', narration: 'Opening Balance', debit: null, credit: 25760, balance: 26070 },
];

const mockInterestHistory = [
  { creditDate: new Date('2025-01-31'), period: 'Jan 2025', days: 31, avgBalance: 24500, rate: 4.0, interest: 83.5, status: 'POSTED' },
  { creditDate: new Date('2024-12-31'), period: 'Dec 2024', days: 31, avgBalance: 22000, rate: 4.0, interest: 75.1, status: 'POSTED' },
  { creditDate: new Date('2024-11-30'), period: 'Nov 2024', days: 30, avgBalance: 21000, rate: 4.0, interest: 69.0, status: 'POSTED' },
];

interface DepositModalProps { open: boolean; onClose: () => void; onSuccess: (amount: number) => void; }
function DepositModal({ open, onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [denominations, setDenominations] = useState({ '2000': '', '500': '', '200': '', '100': '' });
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const totalDenom = Object.entries(denominations).reduce((s, [k, v]) => s + (parseInt(k) * (parseInt(v) || 0)), 0);
  const handleSubmit = () => { setStep('success'); setTimeout(() => { onSuccess(Number(amount)); onClose(); setStep('form'); setAmount(''); setNarration(''); }, 2000); };
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
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">CR — Account {mockAccount.accountNo}</span><span className="font-bold text-green-600">+ {formatCurrency(Number(amount))}</span></div>
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">DR — Cash in Hand (GL)</span><span className="font-bold text-red-600">- {formatCurrency(Number(amount))}</span></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Narration: {narration}</p>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep('form')}>Edit</Button><Button className="flex-1" onClick={handleSubmit}>Confirm Deposit</Button></div>
          </div>
        )}
        {step === 'success' && (
          <div className="text-center py-6"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="font-bold text-lg">Deposit Successful!</p><p className="text-muted-foreground">₹{Number(amount).toLocaleString()} credited</p></div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface WithdrawModalProps { open: boolean; onClose: () => void; balance: number; onSuccess: (amount: number) => void; }
function WithdrawModal({ open, onClose, balance, onSuccess }: WithdrawModalProps) {
  const MIN_BAL = 1000; const DAILY_LIMIT = 50000;
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const numAmt = Number(amount);
  const afterBalance = balance - numAmt;
  const minBalBreach = afterBalance < MIN_BAL;
  const limitBreach = numAmt > DAILY_LIMIT;
  const canProceed = numAmt > 0 && !minBalBreach && !limitBreach && !!narration;
  const handleSubmit = () => { setStep('success'); setTimeout(() => { onSuccess(numAmt); onClose(); setStep('form'); setAmount(''); setNarration(''); }, 2000); };
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
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">DR — Account {mockAccount.accountNo}</span><span className="font-bold text-red-600">- {formatCurrency(numAmt)}</span></div>
              <div className="p-3 bg-muted/30 flex justify-between text-sm"><span className="font-medium">CR — Cash in Hand (GL)</span><span className="font-bold text-green-600">+ {formatCurrency(numAmt)}</span></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Narration: {narration}</p>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep('form')}>Edit</Button><Button className="flex-1" onClick={handleSubmit}>Confirm Withdrawal</Button></div>
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
  const [balance, setBalance] = useState(mockAccount.balance);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [loading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-2xl font-bold">Account Detail</h1><p className="text-muted-foreground text-sm">{mockAccount.memberName}</p></div>
      </div>

      {/* Balance Hero */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Number</p>
              <p className="text-2xl font-bold font-mono">{params.id}</p>
              <p className="text-sm text-muted-foreground">{mockAccount.type} Account</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(balance)}</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <Badge className={balance >= mockAccount.minimumBalance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {balance >= mockAccount.minimumBalance ? '✓ Above Min Balance' : '⚠ Below Min Balance'}
                </Badge>
                <Badge className="bg-green-100 text-green-800">{mockAccount.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dormancy Warning */}
      {mockAccount.dormancyWarning && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>Account approaching dormancy — last transaction was over 12 months ago.</AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {hasPermission(Permission.ACCOUNT_DEPOSIT) && (
          <Button onClick={() => setDepositOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
            <ArrowDown className="w-4 h-4" /> Deposit
          </Button>
        )}
        {hasPermission(Permission.ACCOUNT_WITHDRAW) && (
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
                      {mockTransactions.map((txn, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{formatDate(txn.date)}</TableCell>
                          <TableCell className="font-mono text-xs">{txn.txnId}</TableCell>
                          <TableCell className="text-sm">{txn.narration}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">{txn.debit ? formatCurrency(txn.debit) : '—'}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{txn.credit ? formatCurrency(txn.credit) : '—'}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(txn.balance)}</TableCell>
                        </TableRow>
                      ))}
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
                  <p className="text-sm">Member Passbook — {mockAccount.memberName}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Narration</TableHead>
                      <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((txn, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{formatDate(txn.date)}</TableCell>
                        <TableCell className="text-sm">{txn.narration}</TableCell>
                        <TableCell className="text-right text-red-600">{txn.debit ? formatCurrency(txn.debit) : '—'}</TableCell>
                        <TableCell className="text-right text-green-600">{txn.credit ? formatCurrency(txn.credit) : '—'}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(txn.balance)}</TableCell>
                      </TableRow>
                    ))}
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
                  <TableRow>
                    <TableHead>Credit Date</TableHead><TableHead>Period</TableHead><TableHead>Days</TableHead>
                    <TableHead className="text-right">Avg Balance</TableHead><TableHead className="text-right">Rate %</TableHead>
                    <TableHead className="text-right">Interest</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInterestHistory.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatDate(row.creditDate)}</TableCell>
                      <TableCell>{row.period}</TableCell>
                      <TableCell>{row.days}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.avgBalance, 0)}</TableCell>
                      <TableCell className="text-right">{row.rate}%</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(row.interest)}</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800 text-xs">{row.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
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
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} onSuccess={(amt) => setBalance(b => b + amt)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balance={balance} onSuccess={(amt) => setBalance(b => b - amt)} />
    </div>
  );
}
