'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Download, Plus, ArrowDown, ArrowUp, Send, Printer, TrendingUp } from 'lucide-react';

interface Transaction {
  date: Date;
  txnId: string;
  narration: string;
  debit?: number;
  credit?: number;
  balance: number;
}

const mockTransactions: Transaction[] = [
  {
    date: new Date('2024-11-15'),
    txnId: 'TXN-2024-00001',
    narration: 'EMI Payment - Loan LN-2024-00001',
    debit: 4382,
    balance: 20618,
  },
  {
    date: new Date('2024-11-10'),
    txnId: 'TXN-2024-00002',
    narration: 'Interest Credit - Monthly',
    credit: 25,
    balance: 25000,
  },
  {
    date: new Date('2024-11-08'),
    txnId: 'TXN-2024-00003',
    narration: 'Salary Deposit',
    credit: 35000,
    balance: 24975,
  },
  {
    date: new Date('2024-11-05'),
    txnId: 'TXN-2024-00004',
    narration: 'Cash Withdrawal',
    debit: 5000,
    balance: -10025,
  },
];

const mockInterestHistory = [
  {
    creditDate: new Date('2024-11-30'),
    period: 'November 2024',
    days: 30,
    avgBalance: 24500,
    rate: 4.5,
    interest: 30.625,
    accrualStatus: 'CREDITED',
  },
  {
    creditDate: new Date('2024-10-31'),
    period: 'October 2024',
    days: 31,
    avgBalance: 23200,
    rate: 4.5,
    interest: 29.85,
    accrualStatus: 'CREDITED',
  },
];

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const balance = 20618;
  const minimumBalance = 1000;
  const isDormant = false;

  return (
    <div className="space-y-6 p-6">
      {/* Balance Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Account Balance</p>
                <p className="text-5xl font-bold text-primary">₹{balance.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                <p className="font-mono font-semibold text-lg">{params.id}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-50 text-green-800">SAVINGS ACCOUNT</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-800">ACTIVE</Badge>
              <Badge variant="outline">{balance >= minimumBalance ? '✓ Above Minimum' : '⚠ Below Minimum'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Minimum Balance</p>
              <p className="font-semibold">₹{minimumBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Opened Date</p>
              <p className="font-semibold">10-Jan-2023</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Holder Name</p>
              <p className="font-semibold">Rajesh Kumar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dormancy Alert */}
      {isDormant && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This account is approaching dormancy due to no activity in the last 2 years. Account will be frozen if no activity within 30 days.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Deposit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Deposit</DialogTitle>
              <DialogDescription>Record a cash deposit to {params.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deposit-amount">Amount (₹) *</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Denomination Breakdown (Optional)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[2000, 500, 200, 100].map((denom) => (
                    <div key={denom}>
                      <Label className="text-xs text-muted-foreground">₹{denom}</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="deposit-narration">Narration *</Label>
                <Input id="deposit-narration" placeholder="e.g., Cash deposit by customer" />
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">Voucher Preview</p>
                <p className="text-xs text-blue-800 mt-1">DR: Cash, CR: Savings Account - ₹{depositAmount}</p>
              </div>
              <Button className="w-full">Submit Deposit</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ArrowDown className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Withdrawal</DialogTitle>
              <DialogDescription>Withdraw cash from {params.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  Available Balance: ₹{balance.toLocaleString()}
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="withdraw-amount">Amount (₹) *</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              {parseInt(withdrawAmount) > balance - minimumBalance && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    Withdrawal would breach minimum balance. Max allowed: ₹{(balance - minimumBalance).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="withdraw-narration">Narration *</Label>
                <Input id="withdraw-narration" placeholder="e.g., Personal withdrawal" />
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">Voucher Preview</p>
                <p className="text-xs text-blue-800 mt-1">DR: Savings Account, CR: Cash - ₹{withdrawAmount}</p>
              </div>
              <Button className="w-full" disabled={parseInt(withdrawAmount) > balance - minimumBalance}>
                Submit Withdrawal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Transfer
        </Button>

        <Button variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Passbook
        </Button>

        <Button variant="outline" size="sm" className="ml-auto">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="passbook">Passbook</TabsTrigger>
          <TabsTrigger value="interest">Interest History</TabsTrigger>
          <TabsTrigger value="deposits">Linked Deposits</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {mockTransactions.map((txn) => (
                    <TableRow key={txn.txnId}>
                      <TableCell className="text-sm">{txn.date.toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{txn.txnId}</TableCell>
                      <TableCell className="text-sm">{txn.narration}</TableCell>
                      <TableCell className="text-right text-sm">
                        {txn.debit ? `₹${txn.debit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {txn.credit ? `₹${txn.credit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{txn.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passbook Tab */}
        <TabsContent value="passbook" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Passbook</CardTitle>
                  <CardDescription>Account {params.id}</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span>Date</span>
                  <span>Narration</span>
                  <span className="text-right">Debit</span>
                  <span className="text-right">Credit</span>
                  <span className="text-right">Balance</span>
                </div>
                {mockTransactions.map((txn) => (
                  <div key={txn.txnId} className="flex justify-between py-2 border-b">
                    <span>{txn.date.toLocaleDateString()}</span>
                    <span className="text-xs">{txn.narration}</span>
                    <span className="text-right">{txn.debit ? `₹${txn.debit}` : '-'}</span>
                    <span className="text-right">{txn.credit ? `₹${txn.credit}` : '-'}</span>
                    <span className="text-right font-semibold">₹{txn.balance}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interest History Tab */}
        <TabsContent value="interest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interest History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead className="text-right">Avg Balance</TableHead>
                    <TableHead className="text-right">Rate %</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInterestHistory.map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{record.period}</TableCell>
                      <TableCell className="text-right">{record.days}</TableCell>
                      <TableCell className="text-right">₹{record.avgBalance.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{record.rate}%</TableCell>
                      <TableCell className="text-right font-semibold">₹{record.interest.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          {record.accrualStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linked Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Linked Deposits (FDR/RD)</CardTitle>
              <CardDescription>Deposits linked to this account for sweep/maturity credit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No linked deposits found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
