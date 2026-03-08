'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loansApi, membersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';

export default function GroupLoansPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [groupLoans, setGroupLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    groupName: '',
    groupType: 'JLG' as 'JLG' | 'SHG' | 'OTHER',
    selectedMembers: [] as string[],
    loanAmounts: {} as Record<string, string>,
  });

  useEffect(() => {
    Promise.all([
      loansApi.listGroupLoans(),
      membersApi.list({ limit: 1000 }),
    ]).then(([groupRes, membersRes]) => {
      if (groupRes.success) setGroupLoans(groupRes.groupLoans || []);
      if (membersRes.success) setMembers(membersRes.members || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAddMember = (memberId: string) => {
    if (formData.selectedMembers.length >= 10) {
      toast({ title: 'Error', description: 'Maximum 10 members allowed in JLG', variant: 'destructive' });
      return;
    }
    if (formData.selectedMembers.includes(memberId)) {
      toast({ title: 'Error', description: 'Member already added', variant: 'destructive' });
      return;
    }
    setFormData({
      ...formData,
      selectedMembers: [...formData.selectedMembers, memberId],
      loanAmounts: { ...formData.loanAmounts, [memberId]: '' },
    });
  };

  const handleRemoveMember = (memberId: string) => {
    setFormData({
      ...formData,
      selectedMembers: formData.selectedMembers.filter(id => id !== memberId),
      loanAmounts: Object.fromEntries(Object.entries(formData.loanAmounts).filter(([id]) => id !== memberId)),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedMembers.length < 4) {
      toast({ title: 'Error', description: 'JLG must have at least 4 members', variant: 'destructive' });
      return;
    }
    if (formData.selectedMembers.length > 10) {
      toast({ title: 'Error', description: 'JLG cannot have more than 10 members', variant: 'destructive' });
      return;
    }

    const amounts = formData.selectedMembers.map(id => parseFloat(formData.loanAmounts[id] || '0'));
    if (amounts.some(amt => amt <= 0 || amt > 100000)) {
      toast({ title: 'Error', description: 'Each member loan must be between ₹1 and ₹1,00,000', variant: 'destructive' });
      return;
    }

    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    if (total > 1000000) {
      toast({ title: 'Error', description: 'Total group loan cannot exceed ₹10,00,000', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await loansApi.createGroupLoan({
        groupName: formData.groupName,
        groupType: formData.groupType,
        memberIds: formData.selectedMembers,
        individualLoanAmounts: amounts,
      });
      if (res.success) {
        toast({ title: 'Success', description: `Group loan ${res.groupCode} created successfully` });
        setDialogOpen(false);
        setFormData({ groupName: '', groupType: 'JLG', selectedMembers: [], loanAmounts: {} });
        // Reload list
        loansApi.listGroupLoans().then(r => {
          if (r.success) setGroupLoans(r.groupLoans || []);
        });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to create group loan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/loans">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Group Loans (JLG/SHG)</h1>
            <p className="text-muted-foreground mt-1">Manage Joint Liability Group and Self Help Group loans</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Group Loan (JLG)</DialogTitle>
              <DialogDescription>
                Create a Joint Liability Group with 4-10 members. Each member can get up to ₹1,00,000, total group limit ₹10,00,000.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Group Name *</Label>
                <Input
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder="e.g., Village Farmers JLG"
                  required
                />
              </div>
              <div>
                <Label>Group Type *</Label>
                <select
                  value={formData.groupType}
                  onChange={(e) => setFormData({ ...formData, groupType: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="JLG">Joint Liability Group (JLG)</option>
                  <option value="SHG">Self Help Group (SHG)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <Label>Add Members (4-10 required)</Label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                  {members.filter(m => m.status === 'active').map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <span className="text-sm">{m.firstName} {m.lastName} ({m.memberNumber})</span>
                      {formData.selectedMembers.includes(m.id) ? (
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveMember(m.id)}>
                          Remove
                        </Button>
                      ) : (
                        <Button type="button" size="sm" onClick={() => handleAddMember(m.id)}>
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.selectedMembers.length}/10 members
                </p>
              </div>
              {formData.selectedMembers.length > 0 && (
                <div>
                  <Label>Individual Loan Amounts</Label>
                  <div className="space-y-2 mt-2">
                    {formData.selectedMembers.map(memberId => {
                      const member = members.find(m => m.id === memberId);
                      return (
                        <div key={memberId} className="flex items-center gap-2">
                          <span className="text-sm w-40 truncate">{member?.firstName} {member?.lastName}</span>
                          <Input
                            type="number"
                            min="1"
                            max="100000"
                            step="0.01"
                            value={formData.loanAmounts[memberId] || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              loanAmounts: { ...formData.loanAmounts, [memberId]: e.target.value },
                            })}
                            placeholder="Loan amount (₹)"
                            className="flex-1"
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      Total: ₹{formData.selectedMembers.reduce((sum, id) => sum + (parseFloat(formData.loanAmounts[id] || '0') || 0), 0).toLocaleString()} / ₹10,00,000 max
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Requirements:</strong> Members must be from same village/area, no two members from same family,
                  all members must be active, individual loans max ₹1,00,000, total group max ₹10,00,000.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || formData.selectedMembers.length < 4}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Loans</CardTitle>
          <CardDescription>Total: {groupLoans.length} groups</CardDescription>
        </CardHeader>
        <CardContent>
          {groupLoans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No group loans found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Code</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Total Loan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupLoans.map((gl) => (
                  <TableRow key={gl.id}>
                    <TableCell className="font-mono">{gl.groupCode}</TableCell>
                    <TableCell>{gl.groupName}</TableCell>
                    <TableCell><Badge>{gl.groupType}</Badge></TableCell>
                    <TableCell>{gl.members?.length || 0} members</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{Number(gl.totalLoanAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={gl.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {gl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/loans/group-loans/${gl.id}`)}
                      >
                        View
                      </Button>
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
