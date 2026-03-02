'use client';

import React, { useState, useEffect } from 'react';
import { meApi } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowUpRight, ArrowDownLeft, BookOpen, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PortalAccountPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchTx, setSearchTx] = useState('');
    const [accountData, setAccountData] = useState<{ id: string; accountNo: string; balance: number; minBalance: number } | null>(null);
    const [transactions, setTransactions] = useState<Array<{ id: string; date: Date; narration: string; type: string; amount: number; balance: number }>>([]);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const accRes = await meApi.accounts();
                if (!accRes.success || !accRes.accounts?.length) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const acc = accRes.accounts[0]; // Assuming primary SB account
                if (isMounted) {
                    setAccountData({
                        id: acc.id,
                        accountNo: acc.accountNumber || acc.accountNo || 'N/A',
                        balance: Number(acc.balance) || 0,
                        minBalance: 1000,
                    });
                }

                // Fetch Passbook / Transactions
                const passbookRes = await meApi.passbook(acc.id);
                if (passbookRes.success && passbookRes.transactions && isMounted) {
                    setTransactions(passbookRes.transactions.map((t: any) => ({
                        id: t.id,
                        date: new Date(t.processedAt),
                        narration: t.remarks || t.category || 'Transaction',
                        type: t.type === 'credit' ? 'CR' : 'DR',
                        amount: Number(t.amount),
                        balance: Number(t.balanceAfter || 0), // Assuming balanceAfter might be returned by the backend passbook endpoint eventually, defaulting to 0 for now.
                    })));
                }
            } catch (err) {
                console.error("Failed to load account details", err);
                toast({ title: "Error", description: "Could not load account details", variant: "destructive" });
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, [toast]);

    const handleDownloadPassbook = () => {
        if (!transactions.length) {
            toast({ title: "No data", description: "No transactions to download.", variant: "destructive" });
            return;
        }

        const headers = ["Date", "Narration", "Type", "Amount"];
        const rows = transactions.map(t => [
            formatDate(t.date),
            `"${t.narration.replace(/"/g, '""')}"`, // escape quotes in CSV
            t.type,
            t.amount.toString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Passbook_${accountData?.accountNo || 'Member'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Downloaded", description: "Passbook downloaded successfully." });
    };

    if (loading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const filteredTx = transactions.filter(t => t.narration.toLowerCase().includes(searchTx.toLowerCase()));

    return (
        <div className="space-y-6 max-w-3xl mx-auto p-4 pb-20 pt-8">
            <h1 className="text-2xl font-bold mb-6">Savings Account</h1>

            {/* Balance Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-xl overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-sm font-medium opacity-90 text-primary-foreground/80">Available Balance</p>
                    <p className="text-4xl md:text-5xl font-bold mt-2 tracking-tight">
                        {accountData ? formatCurrency(accountData.balance, true) : '₹0.00'}
                    </p>
                    <div className="flex items-center gap-4 mt-6 text-sm font-medium opacity-100 bg-black/10 w-fit px-3 py-1.5 rounded-full">
                        <span>A/C: {accountData?.accountNo || '...'}</span>
                        <span className="opacity-50">•</span>
                        <span>Min Bal: {formatCurrency(accountData?.minBalance || 1000, true)}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6">
                <Button asChild className="h-14 text-sm md:text-base gap-2 bg-background text-foreground border shadow-sm hover:bg-accent hover:text-accent-foreground transition-all">
                    <Link href="/portal/pay">
                        <ArrowUpRight className="w-5 h-5 text-primary" /> Transfer funds
                    </Link>
                </Button>
                <Button variant="outline" onClick={handleDownloadPassbook} className="h-14 text-sm md:text-base gap-2 bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-all">
                    <BookOpen className="w-5 h-5 text-primary" /> Download passbook
                </Button>
            </div>

            {/* Transactions */}
            <Card className="mt-8 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-lg">
                        <span>Transaction History</span>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                className="pl-9 h-9 text-sm w-full sm:w-64 bg-background border-border/50 focus-visible:ring-primary/20"
                                placeholder="Search narrations..."
                                value={searchTx}
                                onChange={e => setSearchTx(e.target.value)}
                            />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredTx.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                            <Search className="w-8 h-8 mb-2 opacity-20" />
                            No transactions found
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {filteredTx.map(tx => (
                                <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'CR' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                        {tx.type === 'CR' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate text-foreground/90">{tx.narration}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{formatDate(tx.date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-base ${tx.type === 'CR' ? 'text-emerald-600' : 'text-foreground'}`}>
                                            {tx.type === 'CR' ? '+' : '-'}{formatCurrency(tx.amount, true)}
                                        </p>
                                        {/* Optional: Add running balance here if available from backend */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
