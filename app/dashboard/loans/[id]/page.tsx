'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RiskScorePanel } from '@/components/ai/risk-score-panel';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, AlertTriangle, TrendingUp, Shield, Users, Zap, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { loansApi } from '@/lib/api';

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  UPCOMING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  DUE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

function mapLoan(l: any) {
  const m = l.member;
  const memberName = m ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : '-';
  const outstanding = Number(l.outstandingPrincipal ?? l.outstanding ?? 0);
  const interestAccrued = Number(l.interestAccrued ?? 0);
  const penalInterest = Number(l.outstandingPenal ?? l.penalInterest ?? 0);
  return {
    id: l.id,
    loanId: l.loanNumber || l.id,
    member: memberName,
    memberId: l.memberId,
    type: (l.loanType || 'SHORT_TERM').toUpperCase().replace(/ /g, '_'),
    amount: Number(l.disbursedAmount ?? l.principalAmount ?? l.amount ?? 0),
    rate: Number(l.interestRate ?? 0),
    tenure: l.tenureMonths ?? l.tenure ?? 0,
    status: (l.status || 'ACTIVE').toUpperCase(),
    outstanding,
    interestAccrued,
    penalInterest,
    totalOutstanding: outstanding + interestAccrued + penalInterest,
    disbursedOn: l.disbursedAt ? new Date(l.disbursedAt) : new Date(),
    maturityDate: l.maturityDate ? new Date(l.maturityDate) : new Date(),
    npaStatus: (l.npaCategory ?? l.npaStatus ?? 'STANDARD').toUpperCase(),
    overdueDays: l.overdueDays ?? 0,
    irac: l.irac ?? null,
    moratoriumEnd: l.moratoriumEnd ? new Date(l.moratoriumEnd) : null,
    emiSchedule: (l.emiSchedule || []).map((e: any, i: number) => ({
      no: e.installmentNo ?? i + 1,
      dueDate: e.dueDate ? new Date(e.dueDate) : new Date(),
      principal: Number(e.principalAmount ?? e.principal ?? 0),
      interest: Number(e.interestAmount ?? e.interest ?? 0),
      total: Number(e.totalAmount ?? e.total ?? 0),
      paid: e.status === 'paid' || e.status === 'PAID' ? Number(e.totalAmount ?? e.total ?? 0) : 0,
      balance: Number(e.outstanding ?? 0),
      status: (e.status || 'UPCOMING').toUpperCase(),
    })),
  };
}

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [loan, setLoan] = useState<ReturnType<typeof mapLoan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectOpen, setCollectOpen] = useState(false);
  const [preCloseOpen, setPreCloseOpen] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<{ no: number; dueDate: Date; principal: number; interest: number; total: number; paid: number; balance: number; status: string } | null>(null);

  useEffect(() => {
    loansApi.get(params.id)
      .then((r) => setLoan(mapLoan(r.loan)))
      .catch(() => setLoan(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading || !loan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">{loading ? 'Loading...' : 'Loan not found'}</p>
      </div>
    );
  }

  const emiSchedule = loan.emiSchedule || [];
  const preCloseAmount = loan.outstanding + Math.round(loan.outstanding * 0.02);
  const riskTrend = (loan as any).riskTrend?.length ? (loan as any).riskTrend : [{ month: 'Current', score: 0 }];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{loan.loanId}</h1>
            <Badge className="bg-green-100 text-green-800">{loan.status}</Badge>
            <Badge variant="outline">{loan.type.replace('_', ' ')}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{loan.member}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Principal Outstanding', value: formatCurrency(loan.outstanding), color: 'text-foreground' },
          { label: 'Interest Accrued', value: formatCurrency(loan.interestAccrued), color: 'text-amber-600' },
          { label: 'Penal Interest', value: formatCurrency(loan.penalInterest), color: 'text-red-600' },
          { label: 'Total Outstanding', value: formatCurrency(loan.totalOutstanding), color: 'text-primary font-bold' },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="emi">EMI Schedule</TabsTrigger>
          <TabsTrigger value="collateral">Collateral</TabsTrigger>
          <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Summary */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Loan Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[['Loan ID', loan.loanId], ['Type', loan.type.replace('_', ' ')], ['Amount', formatCurrency(loan.amount, 0)], ['Interest Rate', loan.rate + '% p.a.'], ['Tenure', loan.tenure + ' months'], ['Disbursed On', formatDate(loan.disbursedOn)], ['Maturity Date', formatDate(loan.maturityDate)]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> NPA Status</CardTitle></CardHeader>
              <CardContent>
                <Badge className="bg-green-100 text-green-800 mb-3">{loan.npaStatus}</Badge>
                <p className="text-sm text-muted-foreground">Overdue Days: <span className="font-semibold text-foreground">0</span></p>
                <p className="text-sm text-muted-foreground mt-1">Provisioning Required: <span className="font-semibold text-foreground">₹0</span></p>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setPreCloseOpen(true)}>Calculate Pre-closure</Button>
            {hasPermission(Permission.LOAN_APPROVE) && <Button variant="outline">Restructure Loan</Button>}
          </div>
        </TabsContent>

        {/* EMI Schedule */}
        <TabsContent value="emi">
          <Card>
            <CardHeader><CardTitle>EMI Repayment Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Total EMI</TableHead>
                      <TableHead className="text-right">Paid</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emiSchedule.map(emi => (
                      <TableRow key={emi.no} className={emi.status === 'OVERDUE' ? 'bg-red-50 dark:bg-red-950' : emi.status === 'PAID' ? 'bg-green-50/30 dark:bg-green-950/20' : ''}>
                        <TableCell>{emi.no}</TableCell>
                        <TableCell>{formatDate(emi.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(emi.principal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(emi.interest)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(emi.total)}</TableCell>
                        <TableCell className="text-right">{emi.paid ? formatCurrency(emi.paid) : '—'}</TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[emi.status]}`}>{emi.status}</span></TableCell>
                        <TableCell>
                          {emi.status === 'OVERDUE' && hasPermission(Permission.LOAN_REPAY) && (
                            <Button size="sm" className="h-6 text-xs" onClick={() => { setSelectedEmi(emi); setCollectOpen(true); }}>Collect</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collateral */}
        <TabsContent value="collateral">
          <Card>
            <CardHeader><CardTitle>Collateral Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center gap-2"><Badge className="bg-amber-100 text-amber-800">GUARANTOR ONLY</Badge></div>
                <p className="text-sm text-muted-foreground">This loan is secured by personal guarantee only. No physical collateral pledged.</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-sm font-semibold mb-2">Gold Valuation (if applicable)</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Weight</p><p className="font-medium">—</p></div>
                  <div><p className="text-xs text-muted-foreground">Purity</p><p className="font-medium">—</p></div>
                  <div><p className="text-xs text-muted-foreground">LTV %</p><p className="font-medium">—</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guarantors */}
        <TabsContent value="guarantors">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Guarantors</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-4">No guarantors registered for this loan.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="ai" className="space-y-4">
          <RiskScorePanel score={{ overall: 65, confidence: 84, modelVersion: '1.0', generatedAt: new Date(), factors: [{ name: 'Repayment History', weight: 0.70, impact: 'DECREASES', value: '5 payments on time' }, { name: 'Income Stability', weight: 0.55, impact: 'INCREASES', value: 'Irregular income pattern' }, { name: 'Loan Utilization', weight: 0.60, impact: 'INCREASES', value: '65% of credit used' }, { name: 'Savings Ratio', weight: 0.65, impact: 'DECREASES', value: 'Healthy savings ratio' }, { name: 'Collateral Value', weight: 0.75, impact: 'DECREASES', value: 'Adequate collateral coverage' }] }} showOverrideButton={hasPermission(Permission.LOAN_APPROVE)} />
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4" /> Risk Score Trend (6 months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={riskTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> NPA Probability</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-amber-600">12%</div>
                <div><p className="text-sm text-muted-foreground">Based on current repayment behaviour</p><p className="text-xs text-muted-foreground">AI ✦ Confidence: 84%</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4" /> Audit Trail</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[{ event: 'Loan Application Submitted', user: 'Loan Officer', ts: '25/01/2024 10:30' }, { event: 'AI Risk Score Computed (65)', user: 'System', ts: '25/01/2024 10:31' }, { event: 'Loan Approved', user: 'Loan Committee', ts: '26/01/2024 14:00' }, { event: 'Disbursement Processed', user: 'Accountant', ts: '26/01/2024 15:45' }].map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div><p className="text-sm font-medium">{e.event}</p><p className="text-xs text-muted-foreground">{e.user} • {e.ts}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pre-closure Modal */}
      <Dialog open={preCloseOpen} onOpenChange={setPreCloseOpen}>
        <DialogContent><DialogHeader><DialogTitle>Pre-closure Calculation</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Outstanding Principal</span><span className="font-medium">{formatCurrency(loan.outstanding)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pre-closure Penalty (2%)</span><span className="font-medium text-red-600">{formatCurrency(Math.round(loan.outstanding * 0.02))}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold text-base"><span>Total Settlement Amount</span><span className="text-primary">{formatCurrency(preCloseAmount)}</span></div>
          </div>
          <Button className="w-full mt-4" onClick={() => setPreCloseOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      {/* EMI Collection Modal */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent><DialogHeader><DialogTitle>Collect EMI #{selectedEmi?.no}</DialogTitle></DialogHeader>
          {selectedEmi && (
            <div className="space-y-3 text-sm">
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950"><AlertTriangle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-800 text-xs">This EMI is overdue. Penal interest may apply.</AlertDescription></Alert>
              <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span>{formatCurrency(selectedEmi.principal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Interest</span><span>{formatCurrency(selectedEmi.interest)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total Due</span><span className="text-primary">{formatCurrency(selectedEmi.total)}</span></div>
              <Button className="w-full" onClick={() => setCollectOpen(false)}>Process Payment</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
