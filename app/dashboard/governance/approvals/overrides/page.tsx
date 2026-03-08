'use client';

import React, { useState, useEffect } from 'react';
import { governanceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OverridesPage() {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');

  useEffect(() => {
    loadOverrides();
  }, [transactionTypeFilter]);

  const loadOverrides = async () => {
    try {
      const res = await governanceApi.overrides.list({
        transactionType: transactionTypeFilter || undefined,
      });
      setOverrides(res.data || []);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Approval Overrides</h1>
        <p className="text-muted-foreground mt-1">Track all instances where standard approval workflows were bypassed</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Transaction Types</option>
                <option value="LOAN">Loan</option>
                <option value="GL_ENTRY">GL Entry</option>
                <option value="REFUND">Refund</option>
                <option value="MEMBER_STATUS">Member Status</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Override Records</CardTitle>
          <CardDescription>Total: {overrides.length} overrides</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : overrides.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No overrides found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Override ID</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Rule Bypassed</TableHead>
                  <TableHead>Original Approver</TableHead>
                  <TableHead>Override Authorizer</TableHead>
                  <TableHead>Reason Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.overrideId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{o.transactionType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{o.ruleBypassed}</TableCell>
                    <TableCell>{o.originalApprover}</TableCell>
                    <TableCell>{o.overrideAuthorizer}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800">{o.reasonCode}</Badge>
                    </TableCell>
                    <TableCell>{o.amount ? `₹${o.amount.toLocaleString()}` : '-'}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
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
