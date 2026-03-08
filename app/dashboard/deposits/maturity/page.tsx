'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Calendar, RefreshCw, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { depositsApi } from '@/lib/api';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function MaturityProcessingPage() {
    const router = useRouter();
    const [days, setDays] = useState(30);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [maturityDialog, setMaturityDialog] = useState<{ open: boolean; deposit: any | null; action: 'credit_to_sb' | 'auto_renew' | null }>({
        open: false,
        deposit: null,
        action: null,
    });

    useEffect(() => {
        fetchMaturing();
    }, [days]);

    const fetchMaturing = async () => {
        setLoading(true);
        try {
            const res = await depositsApi.getMaturing(days);
            setDeposits(res.deposits || []);
        } catch {
            setDeposits([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMature = async () => {
        if (!maturityDialog.deposit || !maturityDialog.action) return;
        
        setProcessing(maturityDialog.deposit.id);
        try {
            await depositsApi.mature(maturityDialog.deposit.id, { action: maturityDialog.action });
            alert('Deposit matured successfully');
            setMaturityDialog({ open: false, deposit: null, action: null });
            fetchMaturing();
        } catch (e: any) {
            alert(e.message || 'Failed to process maturity');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Maturity Processing</h1>
                    <p className="text-muted-foreground text-sm">Process deposits maturing soon</p>
                </div>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                        <Label>Show deposits maturing in:</Label>
                        {[7, 15, 30, 60].map(d => (
                            <Button
                                key={d}
                                variant={days === d ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDays(d)}
                            >
                                {d} days
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Maturing Deposits */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Deposits Maturing in Next {days} Days</CardTitle>
                        <Badge className="bg-primary text-primary-foreground">{deposits.length} deposits</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground py-8 text-center">Loading...</p>
                    ) : deposits.length === 0 ? (
                        <div className="py-12 text-center">
                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No deposits maturing in the next {days} days</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {deposits.map(d => {
                                const maturityDate = d.maturityDate ? new Date(d.maturityDate) : null;
                                const daysUntilMaturity = maturityDate 
                                    ? Math.floor((maturityDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                    : 0;
                                const memberName = d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Unknown';
                                
                                return (
                                    <div key={d.id} className="p-4 border border-border rounded-lg hover:bg-muted/50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-mono font-bold">{d.depositNumber}</span>
                                                    <Badge variant="outline">{d.depositType.toUpperCase()}</Badge>
                                                    <Badge className={daysUntilMaturity <= 7 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                                                        {daysUntilMaturity} days
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-1">{memberName}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Principal</p>
                                                        <p className="font-medium">{formatCurrency(Number(d.principal), 0)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Maturity Amount</p>
                                                        <p className="font-medium text-primary">{formatCurrency(Number(d.maturityAmount) || 0)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Maturity Date</p>
                                                        <p className="font-medium">{maturityDate ? formatDate(maturityDate) : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Rate</p>
                                                        <p className="font-medium">{Number(d.interestRate)}% p.a.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setMaturityDialog({ open: true, deposit: d, action: null })}
                                                disabled={processing === d.id}
                                                className="ml-4"
                                            >
                                                {processing === d.id ? 'Processing...' : 'Process Maturity'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Maturity Action Dialog */}
            <Dialog open={maturityDialog.open} onOpenChange={(open) => setMaturityDialog({ open, deposit: null, action: null })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Maturity</DialogTitle>
                    </DialogHeader>
                    {maturityDialog.deposit && (
                        <div className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Deposit {maturityDialog.deposit.depositNumber} is maturing. Choose action:
                                </AlertDescription>
                            </Alert>

                            <RadioGroup
                                value={maturityDialog.action || ''}
                                onValueChange={(value) => setMaturityDialog({ ...maturityDialog, action: value as any })}
                            >
                                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                                    <RadioGroupItem value="credit_to_sb" id="credit_to_sb" />
                                    <Label htmlFor="credit_to_sb" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            <div>
                                                <p className="font-medium">Credit to SB Account</p>
                                                <p className="text-xs text-muted-foreground">Principal + Interest will be credited to member's SB account</p>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                {maturityDialog.deposit.depositType === 'fd' && (
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                                        <RadioGroupItem value="auto_renew" id="auto_renew" />
                                        <Label htmlFor="auto_renew" className="flex-1 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4" />
                                                <div>
                                                    <p className="font-medium">Auto-Renew</p>
                                                    <p className="text-xs text-muted-foreground">Create new FDR with same tenure at current rate</p>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                )}
                            </RadioGroup>

                            {maturityDialog.action && (
                                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Principal</span>
                                        <span className="font-medium">{formatCurrency(Number(maturityDialog.deposit.principal), 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Interest</span>
                                        <span className="font-medium text-green-600">{formatCurrency(Number(maturityDialog.deposit.accruedInterest) || 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 font-bold">
                                        <span>Total</span>
                                        <span className="text-primary">{formatCurrency(Number(maturityDialog.deposit.maturityAmount) || 0)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setMaturityDialog({ open: false, deposit: null, action: null })}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleMature}
                                    disabled={!maturityDialog.action || processing === maturityDialog.deposit.id}
                                >
                                    {processing === maturityDialog.deposit.id ? 'Processing...' : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
