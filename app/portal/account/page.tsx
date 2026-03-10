'use client';

import React, { useState, useEffect } from 'react';
import { meApi } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowUpRight, ArrowDownLeft, Search, Loader2, FileText, Download, Wallet, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

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

                const acc = accRes.accounts[0];
                if (isMounted) {
                    setAccountData({
                        id: acc.id,
                        accountNo: acc.accountNumber || acc.accountNo || 'N/A',
                        balance: Number(acc.balance) || 0,
                        minBalance: 1000,
                    });
                }

                const passbookRes = await meApi.passbook(acc.id);
                if (passbookRes.success && passbookRes.transactions && isMounted) {
                    setTransactions(passbookRes.transactions.map((t: any) => ({
                        id: t.id,
                        date: new Date(t.processedAt),
                        narration: t.remarks || t.category || 'Transaction',
                        type: t.type === 'credit' ? 'CR' : 'DR',
                        amount: Number(t.amount),
                        balance: Number(t.balanceAfter || 0),
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

    const handleDownloadPassbook = (format: 'csv' | 'pdf' = 'csv') => {
        if (!transactions.length) {
            toast({ title: "No data", description: "No transactions to download.", variant: "destructive" });
            return;
        }

        if (format === 'csv') {
            const headers = ["Date", "Narration", "Type", "Amount", "Balance"];
            const rows = transactions.map(t => [
                formatDate(t.date),
                `"${t.narration.replace(/"/g, '""')}"`,
                t.type,
                t.amount.toString(),
                t.balance.toString()
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
        } else {
            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Digital Passbook - ${accountData?.accountNo || 'Member'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
    .account-info { margin-bottom: 20px; }
    .account-info p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #1e40af; color: white; }
    .credit { color: #059669; }
    .debit { color: #dc2626; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Digital Passbook</h1>
    <p>Account Number: ${accountData?.accountNo || 'N/A'}</p>
  </div>
  <div class="account-info">
    <p><strong>Available Balance:</strong> ${formatCurrency(accountData?.balance || 0, true)}</p>
    <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Narration</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(t => `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td>${t.narration}</td>
          <td>${t.type}</td>
          <td class="${t.type === 'CR' ? 'credit' : 'debit'}">${t.type === 'CR' ? '+' : '-'}${formatCurrency(t.amount, true)}</td>
          <td>${formatCurrency(t.balance, true)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>This is a system-generated passbook. For official purposes, please contact your society.</p>
  </div>
</body>
</html>
            `;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Passbook_${accountData?.accountNo || 'Member'}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "Downloaded", description: "Passbook downloaded successfully." });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading account...</p>
                </div>
            </div>
        );
    }

    const filteredTx = transactions.filter(t => t.narration.toLowerCase().includes(searchTx.toLowerCase()));

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="space-y-6 max-w-3xl mx-auto p-4 pt-8">
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-gradient-primary"
                >
                    Savings Account
                </motion.h1>

                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative rounded-2xl overflow-hidden shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 p-6 text-primary-foreground">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-primary-foreground/70">Available Balance</p>
                            <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
                        </div>
                        <p className="text-4xl md:text-5xl font-bold mt-2 tracking-tight">
                            {accountData ? formatCurrency(accountData.balance, true) : '₹0.00'}
                        </p>
                        <div className="flex items-center gap-4 mt-6 text-sm font-medium bg-white/10 backdrop-blur-sm w-fit px-4 py-2 rounded-xl border border-white/10">
                            <span>A/C: {accountData?.accountNo || '...'}</span>
                            <span className="opacity-30">•</span>
                            <span>Min Bal: {formatCurrency(accountData?.minBalance || 1000, true)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <motion.div whileTap={{ scale: 0.97 }}>
                        <Button asChild variant="outline" className="h-14 w-full gap-2 glass border-white/20 dark:border-white/10 hover-lift">
                            <Link href="/portal/pay">
                                <ArrowUpRight className="w-5 h-5 text-primary" /> Transfer
                            </Link>
                        </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
                        <Button variant="outline" onClick={() => handleDownloadPassbook('csv')} className="h-14 w-full gap-2 glass border-white/20 dark:border-white/10 hover-lift">
                            <Download className="w-5 h-5 text-primary" /> CSV
                        </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
                        <Button variant="outline" onClick={() => handleDownloadPassbook('pdf')} className="h-14 w-full gap-2 glass border-white/20 dark:border-white/10 hover-lift">
                            <FileText className="w-5 h-5 text-primary" /> Passbook
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Transactions */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="glass border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
                            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-lg">
                                <span className="flex items-center gap-2">
                                    <span className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                                    Transaction History
                                </span>
                                <div className="relative w-full sm:w-auto focus-glow rounded-lg">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9 h-9 text-sm w-full sm:w-64 bg-background/50 border-border/50"
                                        placeholder="Search narrations..."
                                        value={searchTx}
                                        onChange={e => setSearchTx(e.target.value)}
                                    />
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredTx.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                                        <Search className="w-7 h-7 opacity-20" />
                                    </div>
                                    <p className="font-medium">No transactions found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {filteredTx.map((tx, idx) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + idx * 0.03 }}
                                            className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors"
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'CR' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                                {tx.type === 'CR' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{tx.narration}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{formatDate(tx.date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-base ${tx.type === 'CR' ? 'text-emerald-600' : 'text-foreground'}`}>
                                                    {tx.type === 'CR' ? '+' : '-'}{formatCurrency(tx.amount, true)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <MemberPortalNav />
        </div>
    );
}
