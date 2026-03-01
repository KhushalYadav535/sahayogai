'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiskScorePanel } from '@/components/ai/risk-score-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Calendar, DollarSign, TrendingDown, Lock, User } from 'lucide-react';

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [preClosureAmount, setPreClosureAmount] = useState('');

  const principalOutstanding = 32500;
  const interestAccrued = 1250;
  const penalInterest = 0;
  const totalOutstanding = principalOutstanding + interestAccrued + penalInterest;
  const emiAmount = 4382;

  const mockEMIs = [
    { no: 1, dueDate: new Date('2024-12-15'), principal: 4000, interest: 382, total: 4382, paid: 4382, balance: 46000, status: 'PAID' },
    { no: 2, dueDate: new Date('2025-01-15'), principal: 4050, interest: 332, total: 4382, paid: 4382, balance: 41950, status: 'PAID' },
    { no: 3, dueDate: new Date('2025-02-15'), principal: 4100, interest: 282, total: 4382, paid: 0, balance: 37850, status: 'DUE' },
    { no: 4, dueDate: new Date('2025-03-15'), principal: 4150, interest: 232, total: 4382, paid: 0, balance: 33700, status: 'UPCOMING' },
    { no: 5, dueDate: new Date('2025-04-15'), principal: 4200, interest: 182, total: 4382, paid: 0, balance: 29500, status: 'UPCOMING' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">LN-2024-00001</h1>
          <p className="text-muted-foreground mt-1">Short Term Loan - Rajesh Kumar</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800 border-0">ACTIVE</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
            <p className="text-2xl font-bold">₹50,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
            <p className="text-2xl font-bold">12%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Tenure</p>
            <p className="text-2xl font-bold">12 Months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">EMI Amount</p>
            <p className="text-2xl font-bold">₹{emiAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Principal Outstanding</span>
              <span className="font-semibold">₹{principalOutstanding.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Interest Accrued</span>
              <span className="font-semibold">₹{interestAccrued.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Penal Interest</span>
              <span className="font-semibold">₹{penalInterest.toLocaleString()}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Total Outstanding</span>
              <span className="font-bold text-lg">₹{totalOutstanding.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pre-Closure Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Calculate Pre-closure Amount</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pre-Closure Settlement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Outstanding Amount</p>
                    <p className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Pre-Closure Penalty (2%)</p>
                    <p className="text-lg font-semibold">₹{Math.round(totalOutstanding * 0.02).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-3 rounded">
                    <p className="text-sm text-muted-foreground mb-1">Total Settlement Amount</p>
                    <p className="text-2xl font-bold text-green-800">₹{(totalOutstanding + Math.round(totalOutstanding * 0.02)).toLocaleString()}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="schedule">EMI Schedule</TabsTrigger>
          <TabsTrigger value="collateral">Collateral</TabsTrigger>
          <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Application Date</p>
                <p className="font-semibold">15-Jan-2024</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Approval Date</p>
                <p className="font-semibold">20-Jan-2024</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Disbursement Date</p>
                <p className="font-semibold">25-Jan-2024</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Maturity Date</p>
                <p className="font-semibold">25-Jan-2025</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Payment Date</p>
                <p className="font-semibold">15-Nov-2024</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Repayment Frequency</p>
                <p className="font-semibold">Monthly</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMI Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>EMI Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">EMI</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEMIs.map((emi) => (
                    <TableRow key={emi.no} className={emi.status === 'PAID' ? 'bg-green-50' : emi.status === 'OVERDUE' ? 'bg-red-50' : ''}>
                      <TableCell className="font-semibold">{emi.no}</TableCell>
                      <TableCell>{emi.dueDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">₹{emi.principal.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{emi.interest.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">₹{emi.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{emi.paid.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{emi.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          emi.status === 'PAID' ? 'bg-green-50 text-green-800' :
                          emi.status === 'DUE' ? 'bg-blue-50 text-blue-800' :
                          'bg-gray-50 text-gray-800'
                        }>
                          {emi.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collateral Tab */}
        <TabsContent value="collateral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collateral Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Collateral Type</p>
                <Badge variant="outline">FDR Lien</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">FDR Number</p>
                <p className="font-semibold">FDR-2024-001</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">FDR Amount</p>
                <p className="font-semibold">₹60,000</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lien Status</p>
                <Badge className="bg-green-100 text-green-800 border-0">ACTIVE</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guarantors Tab */}
        <TabsContent value="guarantors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guarantors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">Priya Sharma</p>
                    <p className="text-sm text-muted-foreground">MEM-2024-002</p>
                  </div>
                  <Badge variant="outline">PRIMARY</Badge>
                </div>
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Exposure</span>
                    <span className="font-semibold">₹80,000 (across 2 loans)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Exposure %</span>
                    <span className="font-semibold">40%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <RiskScorePanel
            score={{
              overall: 35,
              factors: [
                { name: 'Repayment History', score: 40 },
                { name: 'Income Stability', score: 50 },
                { name: 'Collateral Coverage', score: 35 },
                { name: 'Guarantee Support', score: 30 },
                { name: 'Cash Reserve', score: 25 },
              ],
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Risk Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Score trend chart would appear here</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NPA Probability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current NPA Risk</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '15%'}}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">15% probability</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Warning Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>No activity in savings account for 45 days</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Strong guarantor profile with good history</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
