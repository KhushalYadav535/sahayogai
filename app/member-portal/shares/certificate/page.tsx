'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowLeft, FileText, Download, Loader2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4 pb-20 pt-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Share Certificate</h1>
              <p className="text-muted-foreground text-sm">Member #{certificateData.member.memberNumber}</p>
            </div>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
        </div>

        {/* Certificate Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">SHARE CERTIFICATE</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Member Info */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Member Number</p>
                  <p className="font-bold text-lg">{certificateData.member.memberNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="font-bold text-lg">
                    {certificateData.member.firstName} {certificateData.member.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">
                    {certificateData.member.dateOfBirth
                      ? formatDate(new Date(certificateData.member.dateOfBirth))
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{certificateData.member.phone || 'N/A'}</p>
                </div>
              </div>
              {certificateData.member.address && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{certificateData.member.address}</p>
                </div>
              )}
            </div>

            {/* Share Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 rounded-lg border border-emerald-200 dark:border-emerald-800 mb-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Shares</p>
                  <p className="text-4xl font-bold text-emerald-700">{certificateData.totalShares}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Share Value</p>
                  <p className="text-4xl font-bold text-emerald-700">
                    {formatCurrency(certificateData.totalShareValue, true)}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Ledger */}
            <div>
              <h3 className="font-semibold mb-4">Share Transaction History</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No share transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificateData.shareLedger.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(new Date(tx.date))}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                tx.transactionType === 'purchase'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.transactionType === 'transfer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }
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
      </div>
    </div>
  );
}
