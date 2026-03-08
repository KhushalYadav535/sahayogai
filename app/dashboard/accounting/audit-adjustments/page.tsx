'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, FileText, Plus, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { glApi, loansApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AuditAdjustmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isAuditor = hasRole(UserRole.AUDITOR);
  const isAdmin = hasRole(UserRole.SOCIETY_ADMIN) || hasRole(UserRole.PLATFORM_ADMIN);

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coaAccounts, setCoaAccounts] = useState<{ code: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    narration: '',
    entries: [
      { glCode: '', glName: '', debit: 0, credit: 0, narration: '' },
      { glCode: '', glName: '', debit: 0, credit: 0, narration: '' },
    ] as Array<{ glCode: string; glName: string; debit: number; credit: number; narration: string }>,
    auditAccessStartDate: new Date().toISOString().split('T')[0],
    auditAccessEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    glApi.vouchers.list({ voucherType: 'AUDIT_ADJ', limit: 100 }).then(res => {
      if (res.success) setVouchers(res.vouchers || []);
    }).catch(() => {}).finally(() => setLoading(false));

    glApi.coa.list().then(res => {
      if (res.success) setCoaAccounts((res.accounts || []).map((a: any) => ({ code: a.code, name: a.name })));
    }).catch(() => {});
  }, []);

  const totalDebit = formData.entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = formData.entries.reduce((sum, e) => sum + e.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAccountSelect = (idx: number, code: string) => {
    const acc = coaAccounts.find(a => a.code === code);
    const newEntries = [...formData.entries];
    newEntries[idx].glCode = code;
    newEntries[idx].glName = acc?.name || '';
    setFormData({ ...formData, entries: newEntries });
  };

  const handleAddRow = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { glCode: '', glName: '', debit: 0, credit: 0, narration: '' }],
    });
  };

  const handleRemoveRow = (idx: number) => {
    if (formData.entries.length > 2) {
      setFormData({
        ...formData,
        entries: formData.entries.filter((_, i) => i !== idx),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast({ title: 'Error', description: 'Debit and Credit totals must match', variant: 'destructive' });
      return;
    }
    if (!formData.narration.trim()) {
      toast({ title: 'Error', description: 'Narration is required', variant: 'destructive' });
      return;
    }
    if (formData.entries.filter(e => e.glCode && (e.debit > 0 || e.credit > 0)).length < 2) {
      toast({ title: 'Error', description: 'At least 2 valid entries required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await glApi.vouchers.create({
        voucherType: 'AUDIT_ADJ',
        date: formData.date,
        narration: formData.narration,
        totalAmount: totalDebit,
        entries: formData.entries.filter(e => e.glCode && (e.debit > 0 || e.credit > 0)).map(e => ({
          glCode: e.glCode,
          glName: e.glName,
          debit: e.debit,
          credit: e.credit,
          narration: e.narration || undefined,
        })),
        isAuditAdjustment: true,
        auditAccessStartDate: formData.auditAccessStartDate,
        auditAccessEndDate: formData.auditAccessEndDate,
      });
      if (res.success) {
        toast({ title: 'Success', description: `Audit adjustment ${res.voucher?.voucherNumber || ''} created` });
        setDialogOpen(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          narration: '',
          entries: [
            { glCode: '', glName: '', debit: 0, credit: 0, narration: '' },
            { glCode: '', glName: '', debit: 0, credit: 0, narration: '' },
          ],
          auditAccessStartDate: new Date().toISOString().split('T')[0],
          auditAccessEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        // Reload vouchers
        glApi.vouchers.list({ voucherType: 'AUDIT_ADJ', limit: 100 }).then(r => {
          if (r.success) setVouchers(r.vouchers || []);
        });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to create audit adjustment', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuditor && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Access denied. Only auditors and admins can create audit adjustment entries.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounting">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Audit Adjustment Entries
            </h1>
            <p className="text-muted-foreground mt-1">Create adjustment entries for closed periods (ACC-010)</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Audit Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Audit Adjustment Entry</DialogTitle>
              <DialogDescription>
                Audit adjustments can be posted to closed periods. All entries require maker-checker approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entry Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Access Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.auditAccessStartDate}
                    onChange={(e) => setFormData({ ...formData, auditAccessStartDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Access End Date *</Label>
                  <Input
                    type="date"
                    value={formData.auditAccessEndDate}
                    onChange={(e) => setFormData({ ...formData, auditAccessEndDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Narration *</Label>
                <Textarea
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  placeholder="Describe the reason for this audit adjustment..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Journal Entries *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddRow}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Row
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead>Narration</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.entries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <select
                              value={entry.glCode}
                              onChange={(e) => handleAccountSelect(idx, e.target.value)}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                              required
                            >
                              <option value="">Select Account</option>
                              {coaAccounts.map(acc => (
                                <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry.debit || ''}
                              onChange={(e) => {
                                const newEntries = [...formData.entries];
                                newEntries[idx].debit = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, entries: newEntries });
                              }}
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry.credit || ''}
                              onChange={(e) => {
                                const newEntries = [...formData.entries];
                                newEntries[idx].credit = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, entries: newEntries });
                              }}
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={entry.narration}
                              onChange={(e) => {
                                const newEntries = [...formData.entries];
                                newEntries[idx].narration = e.target.value;
                                setFormData({ ...formData, entries: newEntries });
                              }}
                              placeholder="Optional"
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            {formData.entries.length > 2 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveRow(idx)}
                              >
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center mt-2 p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Total:</span>
                  <div className="flex gap-4">
                    <span className={`text-sm ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Debit: ₹{totalDebit.toLocaleString()}
                    </span>
                    <span className={`text-sm ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Credit: ₹{totalCredit.toLocaleString()}
                    </span>
                    {Math.abs(totalDebit - totalCredit) >= 0.01 && (
                      <span className="text-sm text-red-600 font-semibold">
                        Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> Audit adjustments are tagged with AUDIT_ADJ and require maker-checker approval.
                  Access will be automatically revoked after the end date.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !isBalanced}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Audit Adjustment'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Adjustment Entries</CardTitle>
          <CardDescription>Entries tagged with AUDIT_ADJ for closed periods</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : vouchers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit adjustment entries found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Access Period</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono">{v.voucherNumber}</TableCell>
                    <TableCell>{formatDate(v.date)}</TableCell>
                    <TableCell className="max-w-xs truncate">{v.narration || '—'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{Number(v.totalAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {v.auditAccessStartDate && v.auditAccessEndDate ? (
                        <>
                          {formatDate(v.auditAccessStartDate)} to {formatDate(v.auditAccessEndDate)}
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={v.status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {v.status}
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
