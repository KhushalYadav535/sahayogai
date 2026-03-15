'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Bot, TrendingUp, Users, FileText, Loader2, CreditCard, Shield, DollarSign } from 'lucide-react';
import { loansApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoanApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [copilot, setCopilot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    params.then(p => {
      setApplicationId(p.id);
      fetchApplication(p.id);
    });
  }, [params]);

  const fetchApplication = async (id: string) => {
    setLoading(true);
    try {
      const res = await loansApi.getApplication(id);
      if (res.success) {
        setApplication(res.application);
        fetchCopilot(id);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load application', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCopilot = async (id: string) => {
    setCopilotLoading(true);
    try {
      const res = await loansApi.getCopilot(id);
      if (res.success) {
        setCopilot(res);
      }
    } catch (e) {
      console.error('Failed to load copilot', e);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!applicationId) return;
    setActionLoading(true);
    try {
      const res = await loansApi.approveApplication(applicationId, { remarks: 'Approved via AI Co-Pilot' });
      if (res.success) {
        toast({ title: 'Success', description: 'Application approved' });
        fetchApplication(applicationId);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to approve', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!applicationId) return;
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setActionLoading(true);
    try {
      const res = await loansApi.rejectApplication(applicationId, { remarks: reason });
      if (res.success) {
        toast({ title: 'Success', description: 'Application rejected' });
        fetchApplication(applicationId);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to reject', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const riskScore = Number(application.riskScore) || 50;
  const riskCategory = application.riskCategory || 'AMBER';
  const riskColor = riskCategory === 'GREEN' ? 'green' : riskCategory === 'AMBER' ? 'yellow' : 'red';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Loan Application Review</h1>
            <p className="text-muted-foreground">Application #{application.id.slice(-8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* BRD v5.0 Section 4.6.2: Status Flow - APPLIED → UNDER_REVIEW */}
          {application.status === 'APPLIED' && (
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const response = await loansApi.updateStatus(application.id, { status: 'UNDER_REVIEW', remarks: 'Moved to review by Loan Officer' });
                  if (response.success) {
                    toast({ title: 'Success', description: 'Application moved to Under Review' });
                    fetchApplication(application.id);
                  }
                } catch (error: any) {
                  toast({ title: 'Error', description: error.message || 'Failed to update status', variant: 'destructive' });
                } finally {
                  setActionLoading(false);
                }
              }} 
              disabled={actionLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Start Review
            </Button>
          )}
          {application.status === 'pending' && (
            <>
              <Button variant="outline" onClick={handleReject} disabled={actionLoading}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* BRD v5.0: Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/dashboard/loans/applications/${application.id}/documents`}>
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Documents</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/dashboard/loans/applications/${application.id}/collateral`}>
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Collateral</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/dashboard/loans/applications/${application.id}/can`}>
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">CAN & Sanction</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/dashboard/loans/applications/${application.id}/disburse`}>
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Disbursement</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Application Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Member</p>
                  <p className="font-semibold">
                    {application.member?.firstName} {application.member?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{application.member?.memberNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Type</p>
                  <p className="font-semibold">{application.loanType}</p>
                  {application.loanSubType && (
                    <p className="text-xs text-muted-foreground">{application.loanSubType}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Requested</p>
                  <p className="font-semibold text-lg">{formatCurrency(application.amountRequested)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tenure</p>
                  <p className="font-semibold">{application.tenureMonths} months</p>
                </div>
                {application.purpose && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p>{application.purpose}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Applied On</p>
                  <p>{formatDate(application.appliedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={application.status === 'approved' ? 'bg-green-100 text-green-800' : application.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                    {application.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI-002: AI Loan Underwriting Co-Pilot Panel */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Co-Pilot
              </CardTitle>
              <CardDescription>AI-powered underwriting assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {copilotLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : copilot ? (
                <>
                  {/* Risk Score Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">AI Risk Score</p>
                      <Badge className={`${riskColor === 'green' ? 'bg-green-100 text-green-800' : riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {copilot.riskScore}/100 ({copilot.riskCategory})
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${riskColor === 'green' ? 'bg-green-500' : riskColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${copilot.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Flags */}
                  {copilot.riskFlags && copilot.riskFlags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Risk Flags</p>
                      <div className="space-y-1">
                        {copilot.riskFlags.map((flag: string, idx: number) => (
                          <Alert key={idx} variant="destructive" className="py-2">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="text-xs">{flag}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {copilot.recommendations && copilot.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">AI Recommendations</p>
                      <div className="space-y-2">
                        {copilot.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="p-2 bg-muted rounded text-xs">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Repayment Capacity */}
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">Computed Repayment Capacity</p>
                    <p className="font-semibold">{formatCurrency(copilot.repaymentCapacity)}/month</p>
                    {copilot.recommendedAmount < application.amountRequested && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: {formatCurrency(copilot.recommendedAmount)}
                      </p>
                    )}
                  </div>

                  {/* Comparable Loans */}
                  {copilot.comparableLoans && copilot.comparableLoans.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Comparable Past Loans</p>
                      <div className="space-y-1 text-xs">
                        {copilot.comparableLoans.slice(0, 3).map((loan: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-1">
                            <span>{formatCurrency(loan.amount)} / {loan.tenure}m</span>
                            <Badge className={loan.outcome === 'GOOD' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {loan.outcome}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI-016: Human Override Option */}
                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Note:</strong> AI recommendations are advisory. You can override with reason code.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click to load AI recommendations
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
