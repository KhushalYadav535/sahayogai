'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowLeft, FileText, Download, Loader2, Award, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

export default function ShareCertificatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState<any>(null);

  useEffect(() => {
    loadCertificate();
  }, []);

  const loadCertificate = async () => {
    try {
      const res = await meApi.shareCertificate();
      if (res.success) {
        setCertificateData(res);
      } else {
        toast({ title: "Error", description: "Failed to load share certificate", variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to load share certificate", err);
      toast({ title: "Error", description: "Failed to load share certificate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificateData) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Share Certificate - ${certificateData.member.memberNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: white; }
    .certificate { border: 3px solid #1e40af; padding: 40px; text-align: center; }
    .header { font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #1e40af; }
    .member-info { text-align: left; margin: 30px 0; }
    .member-info p { margin: 10px 0; }
    .share-details { font-size: 32px; font-weight: bold; color: #059669; margin: 30px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">SHARE CERTIFICATE</div>
    <div class="member-info">
      <p><strong>Member Number:</strong> ${certificateData.member.memberNumber}</p>
      <p><strong>Name:</strong> ${certificateData.member.firstName} ${certificateData.member.lastName}</p>
      <p><strong>Date of Birth:</strong> ${certificateData.member.dateOfBirth ? formatDate(new Date(certificateData.member.dateOfBirth)) : 'N/A'}</p>
      <p><strong>Address:</strong> ${certificateData.member.address || 'N/A'}</p>
    </div>
    <div class="share-details">
      Total Shares: ${certificateData.totalShares}<br>
      Total Share Value: ${formatCurrency(certificateData.totalShareValue, true)}
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Transaction</th>
          <th>Shares</th>
          <th>Face Value</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${certificateData.shareLedger.map((tx: any) => `
          <tr>
            <td>${formatDate(new Date(tx.date))}</td>
            <td>${tx.transactionType.toUpperCase()}</td>
            <td>${tx.shares}</td>
            <td>${formatCurrency(tx.faceValue, true)}</td>
            <td>${formatCurrency(tx.amount, true)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="footer">
      <p>This is a system-generated certificate. For official purposes, please contact your society.</p>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Share_Certificate_${certificateData.member.memberNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Downloaded", description: "Share certificate downloaded successfully" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No share certificate data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted/50 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Share Certificate</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Member #{certificateData.member.memberNumber}</p>
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={handleDownload} className="gap-2 shadow-lg shadow-primary/20">
              <Download className="w-4 h-4" />
              Download Certificate
            </Button>
          </motion.div>
        </motion.div>

        {/* Certificate Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/20 dark:border-white/10 shadow-2xl overflow-hidden relative">
            {/* Golden glow border effect */}
            <div className="absolute inset-0 rounded-lg ring-1 ring-amber-300/30 dark:ring-amber-600/20 pointer-events-none" />

            <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/30">
              <div className="text-center py-4">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative inline-block"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-500 animate-pulse" />
                </motion.div>
                <CardTitle className="text-2xl mt-4 text-gradient-primary">SHARE CERTIFICATE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Member Info */}
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Member Number</p>
                    <p className="font-bold text-lg">{certificateData.member.memberNumber}</p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Name</p>
                    <p className="font-bold text-lg">
                      {certificateData.member.firstName} {certificateData.member.lastName}
                    </p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Date of Birth</p>
                    <p className="font-medium">
                      {certificateData.member.dateOfBirth
                        ? formatDate(new Date(certificateData.member.dateOfBirth))
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Phone</p>
                    <p className="font-medium">{certificateData.member.phone || 'N/A'}</p>
                  </div>
                </div>
                {certificateData.member.address && (
                  <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Address</p>
                    <p className="font-medium">{certificateData.member.address}</p>
                  </div>
                )}
              </div>

              {/* Share Summary */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass p-6 rounded-2xl border border-emerald-200/30 dark:border-emerald-800/20 mb-8 relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="grid grid-cols-2 gap-6 text-center relative z-10">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Total Shares</p>
                    <p className="text-4xl font-bold text-gradient-accent">{certificateData.totalShares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Total Share Value</p>
                    <p className="text-4xl font-bold text-gradient-accent">
                      {formatCurrency(certificateData.totalShareValue, true)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Share Ledger */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  Share Transaction History
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Face Value</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificateData.shareLedger.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            No share transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        certificateData.shareLedger.map((tx: any) => (
                          <TableRow key={tx.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell>{formatDate(new Date(tx.date))}</TableCell>
                            <TableCell>
                              <Badge
                                className={`shadow-sm ${tx.transactionType === 'purchase'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : tx.transactionType === 'transfer'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  }`}
                              >
                                {tx.transactionType.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{tx.shares}</TableCell>
                            <TableCell className="text-right">{formatCurrency(tx.faceValue, true)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(tx.amount, true)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {tx.remarks || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <MemberPortalNav />
    </div>
  );
}
