'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loanSanctionApi, loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, CheckCircle, XCircle, ArrowUp, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function CreditAppraisalNotePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [can, setCan] = useState<any>(null);
  const [authorityMatrix, setAuthorityMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isSanctionDialogOpen, setIsSanctionDialogOpen] = useState(false);
  const [sanctionAction, setSanctionAction] = useState<'APPROVE' | 'REJECT' | 'ESCALATE'>('APPROVE');
  const [sanctionReason, setSanctionReason] = useState('');
  const [exceptionJustification, setExceptionJustification] = useState('');

  useEffect(() => {
    params.then(p => {
      setApplicationId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const [appRes, canRes, matrixRes] = await Promise.all([
        loansApi.getApplication(id),
        loanSanctionApi.getCAN(id).catch(() => ({ success: false })),
        loanSanctionApi.getAuthorityMatrix(),
      ]);

      if (appRes.success) {
        setApplication(appRes.application);
      }

      if (canRes.success) {
        setCan(canRes.can);
      }

      if (matrixRes.success) {
        setAuthorityMatrix(matrixRes.matrix || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCAN = async () => {
    if (!applicationId) return;
    setGenerating(true);
    try {
      const response = await loanSanctionApi.generateCAN(applicationId);
      if (response.success) {
        setCan(response.can);
        toast({
          title: 'Success',
          description: 'Credit Appraisal Note generated',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate CAN',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitForSanction = async () => {
    if (!applicationId) return;
    try {
      const response = await loanSanctionApi.submitForSanction(applicationId, {
        recommendation: 'RECOMMEND',
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Application submitted for sanction',
        });
        fetchData(applicationId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit for sanction',
        variant: 'destructive',
      });
    }
  };

  const handleSanction = async () => {
    if (!applicationId) return;
    try {
      const response = await loanSanctionApi.sanction(applicationId, {
        action: sanctionAction,
        reason: sanctionReason || undefined,
        exceptionJustification: exceptionJustification || undefined,
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: `Application ${sanctionAction.toLowerCase()}d`,
        });
        setIsSanctionDialogOpen(false);
        fetchData(applicationId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process sanction',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentLevel = authorityMatrix.find((m: any) => 
    application && Number(application.amountRequested) <= m.maxAmount
  ) || authorityMatrix[authorityMatrix.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/loans/applications/${applicationId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Credit Appraisal Note</h1>
          <p className="text-muted-foreground">Application ID: {applicationId}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {!can && (
          <Button onClick={handleGenerateCAN} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate CAN
              </>
            )}
          </Button>
        )}
        {can && application?.status === 'UNDER_REVIEW' && (
          <Button onClick={handleSubmitForSanction}>
            Submit for Sanction
          </Button>
        )}
        {can && application?.status === 'PENDING_SANCTION' && (
          <Button onClick={() => setIsSanctionDialogOpen(true)}>
            Process Sanction
          </Button>
        )}
        {/* BRD v5.0 LN-CAN05: Download Sanction Letter PDF */}
        {application?.sanctionLetter && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await loanSanctionApi.getSanctionLetterPDF(applicationId!);
                if (response.success) {
                  // Generate PDF using browser print API
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head><title>Sanction Letter</title></head>
                        <body style="font-family: Arial; padding: 40px;">
                          <h1>Loan Sanction Letter</h1>
                          <p><strong>Loan Number:</strong> ${response.pdfData.loanNumber}</p>
                          <p><strong>Member:</strong> ${response.pdfData.memberName} (${response.pdfData.memberNumber})</p>
                          <p><strong>Sanctioned Amount:</strong> ₹${response.pdfData.sanctionedAmount.toLocaleString('en-IN')}</p>
                          <p><strong>Tenure:</strong> ${response.pdfData.approvedTenure} months</p>
                          <p><strong>EMI Amount:</strong> ₹${Number(response.pdfData.emiAmount).toLocaleString('en-IN')}</p>
                          <p><strong>First EMI Date:</strong> ${new Date(response.pdfData.firstEmiDate).toLocaleDateString()}</p>
                          <p><strong>Total Interest Outgo:</strong> ₹${response.pdfData.totalInterestOutgo.toLocaleString('en-IN')}</p>
                          <hr/>
                          <p>Generated on: ${new Date(response.pdfData.generatedAt).toLocaleString()}</p>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }
                  toast({
                    title: 'Success',
                    description: 'Sanction letter PDF opened',
                  });
                }
              } catch (error: any) {
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to generate PDF',
                  variant: 'destructive',
                });
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sanction Letter
          </Button>
        )}
      </div>

      {/* CAN Content */}
      {can ? (
        <div className="space-y-6">
          {/* Member Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Member Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {can.memberProfileSummary && Object.entries(can.memberProfileSummary).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <Label className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Risk Score */}
          <Card>
            <CardHeader>
              <CardTitle>AI Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Risk Score</span>
                  <Badge className={
                    can.aiRiskScore >= 70 ? 'bg-green-100 text-green-800' :
                    can.aiRiskScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {can.aiRiskScore}/100
                  </Badge>
                </div>
                {can.aiRiskExplanation && (
                  <p className="text-sm text-muted-foreground">{can.aiRiskExplanation}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BRD v5.0 LN-CAN06: Credit Bureau Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Bureau Checks</CardTitle>
              <CardDescription>CIBIL and Experian credit reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!applicationId) return;
                      try {
                        const response = await loansApi.checkCibil(applicationId);
                        if (response.success) {
                          toast({
                            title: 'CIBIL Check Complete',
                            description: `Score: ${response.cibilScore}`,
                          });
                          fetchData(applicationId);
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'CIBIL check failed',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Check CIBIL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!applicationId) return;
                      try {
                        const response = await loansApi.checkExperian(applicationId);
                        if (response.success) {
                          toast({
                            title: 'Experian Check Complete',
                            description: `Score: ${response.experianScore}`,
                          });
                          fetchData(applicationId);
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Experian check failed',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Check Experian
                  </Button>
                </div>
                {application?.cibilScore && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-sm font-medium">CIBIL Score: {application.cibilScore}</p>
                    {application.cibilReportId && (
                      <p className="text-xs text-muted-foreground">Report ID: {application.cibilReportId}</p>
                    )}
                  </div>
                )}
                {application?.experianScore && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-sm font-medium">Experian Score: {application.experianScore}</p>
                    {application.experianReportId && (
                      <p className="text-xs text-muted-foreground">Report ID: {application.experianReportId}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Proposed Loan Terms */}
          {can.proposedLoanTerms && (
            <Card>
              <CardHeader>
                <CardTitle>Proposed Loan Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(can.proposedLoanTerms).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <Label className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Officer Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Officer Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={
                can.loanOfficerRecommendation === 'RECOMMEND' ? 'bg-green-100 text-green-800' :
                can.loanOfficerRecommendation === 'HOLD' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }>
                {can.loanOfficerRecommendation}
              </Badge>
            </CardContent>
          </Card>

          {/* Sanction Status */}
          <Card>
            <CardHeader>
              <CardTitle>Sanction Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Sanction Level</span>
                  <Badge>Level {can.sanctionLevel}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge className={
                    can.sanctionStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    can.sanctionStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {can.sanctionStatus}
                  </Badge>
                </div>
                {can.exceptionGranted && (
                  <Alert>
                    <AlertDescription>
                      Exception granted: {can.exceptionJustification}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Credit Appraisal Note not generated yet</p>
            <Button onClick={handleGenerateCAN} className="mt-4" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate CAN
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sanction Dialog */}
      <Dialog open={isSanctionDialogOpen} onOpenChange={setIsSanctionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Sanction</DialogTitle>
            <DialogDescription>
              Application Amount: ₹{application?.amountRequested?.toLocaleString('en-IN')} | 
              Sanction Level: {currentLevel?.level} ({currentLevel?.approverRole})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={sanctionAction} onValueChange={(value: any) => setSanctionAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                  <SelectItem value="ESCALATE">Escalate to Next Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sanctionAction === 'REJECT' && (
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={sanctionReason}
                  onChange={(e) => setSanctionReason(e.target.value)}
                  placeholder="Enter rejection reason"
                  required
                />
              </div>
            )}
            {sanctionAction === 'APPROVE' && (
              <div>
                <Label>Exception Justification (Optional)</Label>
                <Textarea
                  value={exceptionJustification}
                  onChange={(e) => setExceptionJustification(e.target.value)}
                  placeholder="If granting exception to eligibility rules, provide justification"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSanctionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSanction}
              disabled={sanctionAction === 'REJECT' && !sanctionReason}
            >
              {sanctionAction === 'APPROVE' ? 'Approve' : sanctionAction === 'REJECT' ? 'Reject' : 'Escalate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
