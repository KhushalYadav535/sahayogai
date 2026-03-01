'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState as useStateAlias } from 'react';

interface Account {
  accountNo: string;
  holderName: string;
  balance: number;
  status: string;
}

const mockMembers = [
  { id: '1', name: 'Rajesh Kumar', memberId: 'MEM-2024-001' },
  { id: '2', name: 'Priya Sharma', memberId: 'MEM-2024-002' },
  { id: '3', name: 'Amit Patel', memberId: 'MEM-2024-003' },
];

const mockAccounts: Record<string, Account[]> = {
  '1': [
    { accountNo: 'SB-001234', holderName: 'Rajesh Kumar', balance: 25000, status: 'ACTIVE' },
  ],
  '2': [
    { accountNo: 'SB-001235', holderName: 'Priya Sharma', balance: 15000, status: 'ACTIVE' },
  ],
  '3': [
    { accountNo: 'SB-001236', holderName: 'Amit Patel', balance: 8500, status: 'ACTIVE' },
  ],
};

export default function TransferPage() {
  const [sourceMemeberId, setSourceMemberId] = useState('');
  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
  const [destMemberId, setDestMemberId] = useState('');
  const [destAccount, setDestAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [otp, setOtp] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const sourceBalance = sourceAccount?.balance || 0;
  const destBalance = destAccount?.balance || 0;
  const transferAmount = parseInt(amount) || 0;

  const handleSourceMemberSelect = (memberId: string) => {
    setSourceMemberId(memberId);
    const accounts = mockAccounts[memberId];
    if (accounts && accounts.length > 0) {
      setSourceAccount(accounts[0]);
    }
  };

  const handleDestMemberSelect = (memberId: string) => {
    setDestMemberId(memberId);
    const accounts = mockAccounts[memberId];
    if (accounts && accounts.length > 0) {
      setDestAccount(accounts[0]);
    }
  };

  const handleTransfer = () => {
    if (sourceAccount && destAccount && amount && narration && otp === '123456') {
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="p-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="w-6 h-6" />
              Transfer Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Receipt ID</span>
                <span className="font-semibold">RECV-2024-00156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount Transferred</span>
                <span className="font-semibold">₹{transferAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">From</h4>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{sourceAccount?.accountNo}</Badge>
                <span>{sourceAccount?.holderName}</span>
              </div>
              <p className="text-xs text-muted-foreground">New Balance: ₹{(sourceBalance - transferAmount).toLocaleString()}</p>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>

            <div className="bg-white rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">To</h4>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{destAccount?.accountNo}</Badge>
                <span>{destAccount?.holderName}</span>
              </div>
              <p className="text-xs text-muted-foreground">New Balance: ₹{(destBalance + transferAmount).toLocaleString()}</p>
            </div>

            <Button className="w-full" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Account */}
        <Card>
          <CardHeader>
            <CardTitle>From Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Member</Label>
              <div className="space-y-2">
                {mockMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSourceMemberSelect(member.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      sourceMemeberId === member.id
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary'
                    }`}
                  >
                    <p className="font-semibold text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.memberId}</p>
                  </button>
                ))}
              </div>
            </div>

            {sourceAccount && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-medium mb-2">Selected Account</p>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{sourceAccount.accountNo}</p>
                  <p className="text-sm">Balance: ₹{sourceAccount.balance.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Destination Account */}
        <Card>
          <CardHeader>
            <CardTitle>To Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Member</Label>
              <div className="space-y-2">
                {mockMembers
                  .filter((m) => m.id !== sourceMemeberId)
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleDestMemberSelect(member.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        destMemberId === member.id
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary'
                      }`}
                    >
                      <p className="font-semibold text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.memberId}</p>
                    </button>
                  ))}
              </div>
            </div>

            {destAccount && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-medium mb-2">Selected Account</p>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{destAccount.accountNo}</p>
                  <p className="text-sm">Balance: ₹{destAccount.balance.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Details */}
      {sourceAccount && destAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {transferAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: ₹{sourceBalance.toLocaleString()} | Remaining: ₹{(sourceBalance - transferAmount).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="narration">Narration *</Label>
              <Input
                id="narration"
                placeholder="e.g., Transfer to savings"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>

            {transferAmount > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                <p className="text-sm font-semibold text-blue-900">Atomic Voucher</p>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>DR: {sourceAccount.accountNo} - ₹{transferAmount.toLocaleString()}</p>
                  <p>CR: {destAccount.accountNo} - ₹{transferAmount.toLocaleString()}</p>
                </div>
              </div>
            )}

            {transferAmount > sourceBalance && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  Transfer amount exceeds available balance
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="otp">OTP (Enter: 123456) *</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSourceMemberId('');
                  setDestMemberId('');
                  setSourceAccount(null);
                  setDestAccount(null);
                  setAmount('');
                  setNarration('');
                  setOtp('');
                }}
              >
                Reset
              </Button>
              <Button
                className="ml-auto"
                disabled={!sourceAccount || !destAccount || !amount || !narration || !otp || transferAmount > sourceBalance}
                onClick={() => setShowPreview(true)}
              >
                {showPreview ? 'Confirm Transfer' : 'Review'}
              </Button>
            </div>

            {showPreview && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  Ready to transfer ₹{transferAmount.toLocaleString()}. Click "Confirm Transfer" to proceed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {showPreview && sourceAccount && destAccount && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full">
            Edit
          </Button>
          <Button onClick={handleTransfer} className="w-full">
            Confirm Transfer
          </Button>
        </div>
      )}
    </div>
  );
}
