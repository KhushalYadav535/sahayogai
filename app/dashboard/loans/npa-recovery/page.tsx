'use client';

import React, { useState, useEffect } from 'react';
import { loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export default function NPARecoveryPage() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loansApi.recoveryReport().then(res => {
      if (res.success) {
        setReport(res);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loans">
          <button className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">NPA Recovery Report</h1>
          <p className="text-muted-foreground mt-1">Track recovery from written-off loans</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Write-Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(report?.totalWriteOff || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recovered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(report?.totalRecovered || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recovery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report && report.totalWriteOff > 0
                ? `${((report.totalRecovered / report.totalWriteOff) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recovery Details</CardTitle>
          <CardDescription>Written-off loans and recovery status</CardDescription>
        </CardHeader>
        <CardContent>
          {!report || !report.report || report.report.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No written-off loans found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Number</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Write-Off Date</TableHead>
                  <TableHead className="text-right">Write-Off Amount</TableHead>
                  <TableHead className="text-right">Recovered</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Recovery %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.report.map((r: any) => (
                  <TableRow key={r.loanNumber}>
                    <TableCell className="font-mono">{r.loanNumber}</TableCell>
                    <TableCell>{r.member ? `${r.member.firstName} ${r.member.lastName}` : '-'}</TableCell>
                    <TableCell>{r.writeOffDate ? formatDate(new Date(r.writeOffDate)) : '-'}</TableCell>
                    <TableCell className="text-right font-semibold">₹{r.writeOffAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{r.recoveredAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{r.outstandingRecovery.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={r.recoveryPercent >= 50 ? 'bg-green-100 text-green-800' : r.recoveryPercent >= 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {r.recoveryPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
