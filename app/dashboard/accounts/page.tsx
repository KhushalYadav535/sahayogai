'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { sbApi, depositsApi } from '@/lib/api';
import { Permission } from '@/lib/types/auth';
import { SavingsAccount, FixedDeposit, SavingsAccountStatus } from '@/lib/types/account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, TrendingUp, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


const statusColors: Record<SavingsAccountStatus, string> = {
  [SavingsAccountStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900',
  [SavingsAccountStatus.DORMANT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
  [SavingsAccountStatus.FROZEN]: 'bg-red-100 text-red-800 dark:bg-red-900',
  [SavingsAccountStatus.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900',
};

function mapSbAccount(a: any): SavingsAccount & { member?: any } {
  return {
    id: a.id,
    accountNumber: a.accountNumber,
    memberId: a.memberId,
    tenantId: a.tenantId,
    status: (a.status?.toUpperCase() || 'ACTIVE') as SavingsAccountStatus,
    openingDate: a.openedAt ? new Date(a.openedAt) : new Date(),
    currentBalance: Number(a.balance) || 0,
    minBalance: 500,
    interestRate: Number(a.interestRate) || 4,
    interestAccrued: 0,
    lastInterestCreditDate: new Date(),
    isDormant: false,
    lastTransactionDate: new Date(),
    createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
    isDeleted: false,
    member: a.member,
  };
}

export default function AccountsPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sbApi.list(),
      depositsApi.list({ depositType: 'fd', status: 'active' }),
    ])
      .then(([sbRes, depRes]) => {
        setSavingsAccounts((sbRes.accounts || []).map(mapSbAccount));
        setFixedDeposits((depRes.deposits || []).map((d: any) => ({
          id: d.id,
          depositId: d.depositNumber || d.id,
          memberId: d.memberId,
          tenantId: d.tenantId,
          depositType: (d.depositType || 'FDR') as any,
          principalAmount: Number(d.principal) || 0,
          interestRate: Number(d.interestRate) || 0,
          tenure: d.tenureMonths || 0,
          openingDate: d.openedAt ? new Date(d.openedAt) : new Date(),
          maturityDate: d.maturityDate ? new Date(d.maturityDate) : new Date(),
          createdDate: d.createdAt ? new Date(d.createdAt) : new Date(),
          totalInterest: 0,
          maturityAmount: 0,
          interestFrequency: 'QUARTERLY' as any,
          interestAccrued: 0,
          interestPaid: 0,
          status: (d.status || 'ACTIVE') as any,
          isRenewed: false,
          renewalCount: 0,
          isTDSApplicable: true,
          tdsAmount: 0,
          panProvided: true,
          isSeniorCitizen: false,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
          createdBy: 'admin',
          updatedBy: 'admin',
        })));
      })
      .catch(() => { setSavingsAccounts([]); setFixedDeposits([]); })
      .finally(() => setLoading(false));
  }, []);

  const totalSavingsBalance = savingsAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalDepositAmount = fixedDeposits.reduce((sum, dep) => sum + dep.principalAmount, 0);
  const canCreateAccount = hasPermission(Permission.ACCOUNT_CREATE);
  const canDeposit = hasPermission(Permission.ACCOUNT_DEPOSIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings & Deposits</h1>
          <p className="text-muted-foreground mt-1">
            Manage savings accounts, fixed deposits, and transactions
          </p>
        </div>
        {canCreateAccount && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/accounts/open')}>
              <Plus className="w-4 h-4 mr-2" />
              Open Account
            </Button>
            <Button onClick={() => router.push('/dashboard/deposits/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Deposit
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/accounts/dividend')}>
              <Plus className="w-4 h-4 mr-2" />
              Bulk Dividend
            </Button>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Savings Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ₹{(totalSavingsBalance / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {savingsAccounts.length} active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deposits Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              ₹{(totalDepositAmount / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {fixedDeposits.length} active deposits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed view */}
      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="savings">Savings Accounts</TabsTrigger>
          <TabsTrigger value="deposits">Fixed Deposits & RDs</TabsTrigger>
        </TabsList>

        {/* Savings Accounts Tab */}
        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Savings Accounts</CardTitle>
              <CardDescription>
                Active savings accounts and transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Interest Accrued</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingsAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.accountNumber}</TableCell>
                        <TableCell>{account.member ? `${account.member.firstName} ${account.member.lastName}` : `Member-${account.memberId}`}</TableCell>
                        <TableCell className="font-semibold">
                          ₹{(account.currentBalance / 1000).toFixed(0)}K
                        </TableCell>
                        <TableCell>{account.interestRate}% p.a.</TableCell>
                        <TableCell className="text-green-600">
                          ₹{account.interestAccrued.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[account.status]}`}>
                            {account.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canDeposit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/accounts/${account.id}/deposit`)}
                              >
                                <TrendingUp className="w-4 h-4" />
                              </Button>
                            )}
                            <Link href={`/dashboard/accounts/${account.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixed Deposits & Recurring Deposits</CardTitle>
              <CardDescription>
                Active deposits with interest and maturity details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deposit ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Maturity Date</TableHead>
                      <TableHead>Total Interest</TableHead>
                      <TableHead>Maturity Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fixedDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-medium">{deposit.depositId}</TableCell>
                        <TableCell>Member-{deposit.memberId}</TableCell>
                        <TableCell>₹{(deposit.principalAmount / 100000).toFixed(1)}L</TableCell>
                        <TableCell>{deposit.interestRate}% p.a.</TableCell>
                        <TableCell>{deposit.maturityDate.toLocaleDateString()}</TableCell>
                        <TableCell className="text-green-600">
                          ₹{(deposit.totalInterest / 1000).toFixed(0)}K
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{(deposit.maturityAmount / 100000).toFixed(1)}L
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/accounts/deposit/${deposit.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
