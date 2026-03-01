'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Loan, LoanStatus, NPAStatus } from '@/lib/types/loan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock loan data
const mockLoans: Loan[] = [
  {
    id: '1',
    loanId: 'LN-2024-000001',
    tenantId: 'default',
    memberId: '1',
    guarantorIds: [],
    loanType: 'SHORT_TERM' as any,
    principalAmount: 50000,
    interestRate: 12,
    loanTerm: 12,
    status: LoanStatus.ACTIVE,
    applicationDate: new Date('2024-01-15'),
    approvalDate: new Date('2024-01-20'),
    disbursementDate: new Date('2024-01-25'),
    maturityDate: new Date('2025-01-25'),
    emiAmount: 4382,
    repaymentFrequency: 'MONTHLY' as any,
    totalInterest: 5384,
    totalOutstanding: 32500,
    paidPrincipal: 17500,
    paidInterest: 2884,
    lastPaymentDate: new Date('2024-11-15'),
    npaStatus: NPAStatus.STANDARD,
    overdueDays: 0,
    npaDays: 0,
    daysOverdue90: 0,
    aiRiskScore: 35,
    aiRiskScoreExplanation: 'Good repayment history with sufficient savings',
    aiRiskScoredAt: new Date('2024-01-15'),
    restructureCount: 0,
    penalInterestApplied: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-15'),
    createdBy: 'admin',
    updatedBy: 'admin',
    isDeleted: false,
  },
];

const statusColors: Record<LoanStatus, string> = {
  [LoanStatus.APPLICATION]: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  [LoanStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
  [LoanStatus.APPROVED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900',
  [LoanStatus.DISBURSED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900',
  [LoanStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900',
  [LoanStatus.COMPLETED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900',
  [LoanStatus.DEFAULTED]: 'bg-red-100 text-red-800 dark:bg-red-900',
  [LoanStatus.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900',
};

export default function LoansPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState(mockLoans);

  const activeLoans = loans.filter((l) => l.status === LoanStatus.ACTIVE);
  const pendingApprovals = loans.filter(
    (l) => l.status === LoanStatus.APPLICATION || l.status === LoanStatus.UNDER_REVIEW
  );
  const defaultedLoans = loans.filter((l) => l.status === LoanStatus.DEFAULTED);

  const canCreate = hasPermission(Permission.LOAN_CREATE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loans</h1>
          <p className="text-muted-foreground mt-1">
            Manage loan applications, approvals, and repayments
          </p>
        </div>
        {canCreate && (
          <Button className="gap-2" onClick={() => router.push('/dashboard/loans/apply')}>
            <Plus className="w-4 h-4" />
            New Loan Application
          </Button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeLoans.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: ₹{(activeLoans.reduce((sum, l) => sum + l.totalOutstanding, 0) / 100000).toFixed(1)}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingApprovals.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Defaulted Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {defaultedLoans.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed view */}
      <Card>
        <CardHeader>
          <CardTitle>Loans Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="active">
                Active ({activeLoans.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="defaulted">
                Defaulted ({defaultedLoans.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Loans Tab */}
            <TabsContent value="active" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>EMI</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loanId}</TableCell>
                        <TableCell>Member-{loan.memberId}</TableCell>
                        <TableCell>₹{(loan.principalAmount / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-red-600">
                          ₹{(loan.totalOutstanding / 1000).toFixed(0)}K
                        </TableCell>
                        <TableCell>₹{loan.emiAmount}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[loan.status]}`}>
                            {loan.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/loans/${loan.id}`}>
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
            </TabsContent>

            {/* Pending Approvals Tab */}
            <TabsContent value="pending" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loanId}</TableCell>
                        <TableCell>Member-{loan.memberId}</TableCell>
                        <TableCell>₹{(loan.principalAmount / 1000).toFixed(0)}K</TableCell>
                        <TableCell>{loan.applicationDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[loan.status]}`}>
                            {loan.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/loans/${loan.id}`}>
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
            </TabsContent>

            {/* Defaulted Loans Tab */}
            <TabsContent value="defaulted" className="space-y-4">
              {defaultedLoans.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No defaulted loans</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan ID</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Overdue Days</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaultedLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.loanId}</TableCell>
                          <TableCell>Member-{loan.memberId}</TableCell>
                          <TableCell className="text-red-600">
                            ₹{(loan.totalOutstanding / 1000).toFixed(0)}K
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              {loan.overdueDays} days
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/loans/${loan.id}`}>
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
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
