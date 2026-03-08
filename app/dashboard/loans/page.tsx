'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { loansApi } from '@/lib/api';
import { Permission } from '@/lib/types/auth';
import { LoanStatus, NPAStatus } from '@/lib/types/loan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, AlertCircle, CheckCircle, Eye, Loader2, RefreshCw, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  application: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
  approved: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900',
  disbursed: 'bg-purple-100 text-purple-800',
  active: 'bg-green-100 text-green-800 dark:bg-green-900',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900',
  defaulted: 'bg-red-100 text-red-800 dark:bg-red-900',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900',
  'written-off': 'bg-slate-100 text-slate-800',
};

function memberName(loan: any) {
  if (loan.member) return `${loan.member.firstName} ${loan.member.lastName}`;
  return loan.memberId;
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function LoansPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loanRes, appRes] = await Promise.all([
        loansApi.list({ limit: 100 }),
        loansApi.applications({}),
      ]);
      setLoans(loanRes.loans || []);
      setApplications(appRes.applications || []);
    } catch {
      setLoans([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeLoans = loans.filter(l => l.status === 'active');
  const defaultedLoans = loans.filter(l => l.status === 'defaulted' || l.status === 'written-off');
  const pendingApps = applications.filter(a => a.status === 'pending' || a.status === 'under_review');

  const totalOutstanding = activeLoans.reduce((s, l) => s + (Number(l.outstandingPrincipal) || 0), 0);

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
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex gap-2">
            {canCreate && (
              <>
                <Button className="gap-2" onClick={() => router.push('/dashboard/loans/new')}>
                  <Plus className="w-4 h-4" />
                  New Loan Application
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => router.push('/dashboard/loans/group-loans')}>
                  <Users className="w-4 h-4" />
                  Group Loans (JLG)
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push('/dashboard/loans/npa-recovery')}>
              NPA Recovery
            </Button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeLoans.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding: {fmt(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingApps.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting decision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Defaulted / Written-Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{defaultedLoans.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Loans Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="grid grid-cols-3 w-full mb-4">
                <TabsTrigger value="active">Active ({activeLoans.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
                <TabsTrigger value="defaulted">Defaulted ({defaultedLoans.length})</TabsTrigger>
              </TabsList>

              {/* Active Loans */}
              <TabsContent value="active">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan #</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Disbursed</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeLoans.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No active loans</TableCell></TableRow>
                      ) : activeLoans.map(loan => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-mono text-xs">{loan.loanNumber}</TableCell>
                          <TableCell className="font-medium">{memberName(loan)}</TableCell>
                          <TableCell className="text-sm capitalize">{loan.loanType}</TableCell>
                          <TableCell>{fmt(Number(loan.disbursedAmount) || 0)}</TableCell>
                          <TableCell className="text-red-600">{fmt(Number(loan.outstandingPrincipal) || 0)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[loan.status] || 'bg-gray-100 text-gray-800'}>
                              {loan.status?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/loans/${loan.id}`}>
                              <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Pending Applications */}
              <TabsContent value="pending">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application ID</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount Requested</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApps.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending applications</TableCell></TableRow>
                      ) : pendingApps.map(app => (
                        <TableRow key={app.id}>
                          <TableCell className="font-mono text-xs">{app.id.slice(0, 8)}…</TableCell>
                          <TableCell className="font-medium">{app.member ? `${app.member.firstName} ${app.member.lastName}` : app.memberId}</TableCell>
                          <TableCell className="text-sm capitalize">{app.loanType}</TableCell>
                          <TableCell>{fmt(Number(app.amountRequested) || 0)}</TableCell>
                          <TableCell className="text-sm">{new Date(app.appliedAt).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[app.status] || 'bg-gray-100 text-gray-800'}>
                              {app.status?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/loans/applications/${app.id}`}>
                              <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Defaulted */}
              <TabsContent value="defaulted">
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
                          <TableHead>Loan #</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {defaultedLoans.map(loan => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-mono text-xs">{loan.loanNumber}</TableCell>
                            <TableCell className="font-medium">{memberName(loan)}</TableCell>
                            <TableCell className="text-red-600">{fmt(Number(loan.outstandingPrincipal) || 0)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <Badge className={statusColors[loan.status] || 'bg-gray-100'}>{loan.status?.toUpperCase()}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link href={`/dashboard/loans/${loan.id}`}>
                                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
      )}
    </div>
  );
}
