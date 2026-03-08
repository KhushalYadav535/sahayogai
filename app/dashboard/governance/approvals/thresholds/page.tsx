'use client';

import React, { useState, useEffect } from 'react';
import { governanceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApprovalThresholdsPage() {
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'LOAN',
    level: 1,
    maxAmount: '',
    approverRole: '',
    slaHours: 24,
  });

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      const res = await governanceApi.thresholds.list();
      setThresholds(res.data || []);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await governanceApi.thresholds.create({
        ...formData,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
      });
      toast({ title: 'Success', description: 'Threshold configured successfully' });
      setDialogOpen(false);
      resetForm();
      loadThresholds();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      transactionType: 'LOAN',
      level: 1,
      maxAmount: '',
      approverRole: '',
      slaHours: 24,
    });
  };

  const transactionTypes = ['LOAN', 'GL_ENTRY', 'REFUND', 'MEMBER_STATUS', 'DEPOSIT'];
  const approverRoles = ['LOAN_OFFICER', 'LOAN_COMMITTEE', 'PRESIDENT', 'SECRETARY', 'TREASURER'];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Thresholds</h1>
          <p className="text-muted-foreground mt-1">Configure maker-checker hierarchy by transaction type and amount</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Threshold
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Approval Threshold</DialogTitle>
              <DialogDescription>Set approval level, amount threshold, and approver role</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Transaction Type *</Label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {transactionTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Approval Level (1-4) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Maximum Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <Label>Approver Role *</Label>
                <select
                  value={formData.approverRole}
                  onChange={(e) => setFormData({ ...formData, approverRole: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select role</option>
                  {approverRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>SLA (Hours) *</Label>
                <Input
                  type="number"
                  value={formData.slaHours}
                  onChange={(e) => setFormData({ ...formData, slaHours: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Thresholds</CardTitle>
          <CardDescription>Approval routing matrix by transaction type</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : thresholds.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No thresholds configured</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Max Amount</TableHead>
                  <TableHead>Approver Role</TableHead>
                  <TableHead>SLA (Hours)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholds.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.transactionType}</TableCell>
                    <TableCell>Level {t.level}</TableCell>
                    <TableCell>{t.maxAmount ? `₹${t.maxAmount.toLocaleString()}` : 'Unlimited'}</TableCell>
                    <TableCell>{t.approverRole}</TableCell>
                    <TableCell>{t.slaHours} hours</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
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
