'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { membersApi, sbApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  status: string;
  member?: { firstName: string; lastName: string };
}

interface MemberOption {
  id: string;
  name: string;
  memberNumber: string;
}

export default function TransferPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [sourceMemberId, setSourceMemberId] = useState('');
  const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);

  const [destMemberId, setDestMemberId] = useState('');
  const [destAccounts, setDestAccounts] = useState<Account[]>([]);
  const [destAccount, setDestAccount] = useState<Account | null>(null);

  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState('');

  // Load members on mount
  useEffect(() => {
    membersApi.list({ limit: 200, status: 'active' })
      .then(res => setMembers((res.members || []).map((m: any) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        memberNumber: m.memberNumber || m.memberId || m.id,
      }))))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, []);

  const loadAccountsForMember = async (memberId: string, which: 'source' | 'dest') => {
    try {
      const res = await sbApi.list({ memberId, limit: 20 });
      const accs: Account[] = (res.accounts || []).map((a: any) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        balance: Number(a.balance) || 0,
        status: a.status || 'ACTIVE',
        member: a.member,
      }));
      if (which === 'source') { setSourceAccounts(accs); setSourceAccount(accs[0] || null); }
      else { setDestAccounts(accs); setDestAccount(accs[0] || null); }
    } catch {
      if (which === 'source') { setSourceAccounts([]); setSourceAccount(null); }
      else { setDestAccounts([]); setDestAccount(null); }
    }
  };

  const handleSourceMemberSelect = (id: string) => {
    setSourceMemberId(id);
    setSourceAccount(null);
    setSourceAccounts([]);
    if (id) loadAccountsForMember(id, 'source');
  };

  const handleDestMemberSelect = (id: string) => {
    setDestMemberId(id);
    setDestAccount(null);
    setDestAccounts([]);
    if (id) loadAccountsForMember(id, 'dest');
  };

  const transferAmount = parseFloat(amount) || 0;
  const sourceBalance = sourceAccount?.balance || 0;

  const handleTransfer = async () => {
    if (!sourceAccount || !destAccount || !amount || !narration) return;
    setSubmitting(true);
    try {
      await sbApi.transfer({
        fromAccountId: sourceAccount.id,
        toAccountId: destAccount.id,
        amount: transferAmount,
        remarks: narration,
      });
      const id = `TXF-${Date.now().toString(36).toUpperCase()}`;
      setReceiptId(id);
      setShowSuccess(true);
      toast({ title: 'Transfer successful', description: `₹${transferAmount.toLocaleString()} transferred.` });
    } catch (e: any) {
      toast({ title: 'Transfer failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSourceMemberId(''); setDestMemberId('');
    setSourceAccount(null); setDestAccount(null);
    setSourceAccounts([]); setDestAccounts([]);
    setAmount(''); setNarration(''); setShowPreview(false); setShowSuccess(false);
  };

  if (showSuccess) {
    return (
      <div className="p-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <CheckCircle className="w-6 h-6" />
              Transfer Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-green-900 rounded-lg p-4 border border-green-200 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Receipt ID</span><span className="font-semibold font-mono">{receiptId}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Amount</span><span className="font-semibold">₹{transferAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">From</span><span className="font-semibold">{sourceAccount?.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">To</span><span className="font-semibold">{destAccount?.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Time</span><span className="font-semibold">{new Date().toLocaleString('en-IN')}</span></div>
            </div>
            <Button className="w-full" onClick={reset}><RefreshCw className="w-4 h-4 mr-2" />New Transfer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Inter-Account Transfer</h1>
        <p className="text-muted-foreground mt-2">Transfer funds between two member accounts</p>
      </div>

      {loadingMembers ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading members…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Account */}
          <Card>
            <CardHeader><CardTitle>From Account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Member</Label>
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                  value={sourceMemberId}
                  onChange={e => handleSourceMemberSelect(e.target.value)}
                >
                  <option value="">— Select a member —</option>
                  {members.filter(m => m.id !== destMemberId).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberNumber})</option>
                  ))}
                </select>
              </div>
              {sourceMemberId && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Account</Label>
                  {sourceAccounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active SB accounts found</p>
                  ) : (
                    <select
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                      value={sourceAccount?.id || ''}
                      onChange={e => setSourceAccount(sourceAccounts.find(a => a.id === e.target.value) || null)}
                    >
                      {sourceAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.accountNumber} — ₹{a.balance.toLocaleString()}</option>
                      ))}
                    </select>
                  )}
                  {sourceAccount && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">Balance: ₹{sourceAccount.balance.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dest Account */}
          <Card>
            <CardHeader><CardTitle>To Account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Member</Label>
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                  value={destMemberId}
                  onChange={e => handleDestMemberSelect(e.target.value)}
                >
                  <option value="">— Select a member —</option>
                  {members.filter(m => m.id !== sourceMemberId).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberNumber})</option>
                  ))}
                </select>
              </div>
              {destMemberId && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Account</Label>
                  {destAccounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active SB accounts found</p>
                  ) : (
                    <select
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                      value={destAccount?.id || ''}
                      onChange={e => setDestAccount(destAccounts.find(a => a.id === e.target.value) || null)}
                    >
                      {destAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.accountNumber} — ₹{a.balance.toLocaleString()}</option>
                      ))}
                    </select>
                  )}
                  {destAccount && (
                    <div className="mt-2 bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200">
                      <p className="text-xs text-green-700 font-medium">Balance: ₹{destAccount.balance.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Details */}
      {sourceAccount && destAccount && (
        <Card>
          <CardHeader><CardTitle>Transfer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input id="amount" type="number" placeholder="0" value={amount} onChange={e => { setAmount(e.target.value); setShowPreview(false); }} />
              {transferAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: ₹{sourceBalance.toLocaleString()} | After transfer: ₹{(sourceBalance - transferAmount).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="narration">Narration *</Label>
              <Input id="narration" placeholder="e.g., Transfer to savings" value={narration} onChange={e => { setNarration(e.target.value); setShowPreview(false); }} />
            </div>

            {transferAmount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Atomic Voucher Preview</p>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1 mt-2">
                  <p>DR: {sourceAccount.accountNumber} — ₹{transferAmount.toLocaleString()}</p>
                  <p>CR: {destAccount.accountNumber} — ₹{transferAmount.toLocaleString()}</p>
                </div>
              </div>
            )}

            {transferAmount > sourceBalance && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">Transfer amount exceeds available balance</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>Reset</Button>
              {!showPreview ? (
                <Button
                  className="ml-auto"
                  disabled={!amount || !narration || transferAmount <= 0 || transferAmount > sourceBalance}
                  onClick={() => setShowPreview(true)}
                >
                  Review
                </Button>
              ) : (
                <Button
                  className="ml-auto"
                  disabled={submitting}
                  onClick={handleTransfer}
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</> : 'Confirm Transfer'}
                </Button>
              )}
            </div>

            {showPreview && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                  Ready to transfer ₹{transferAmount.toLocaleString()} from {sourceAccount.accountNumber} → {destAccount.accountNumber}. Click "Confirm Transfer" to proceed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
