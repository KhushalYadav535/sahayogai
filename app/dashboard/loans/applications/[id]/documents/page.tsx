'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loanDocumentsApi, loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, FileText, AlertTriangle, Loader2 } from 'lucide-react';
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

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function LoanApplicationDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifyReason, setVerifyReason] = useState('');

  useEffect(() => {
    params.then(p => {
      setApplicationId(p.id);
      fetchDocuments(p.id);
    });
  }, [params]);

  const fetchDocuments = async (id: string) => {
    try {
      setLoading(true);
      const response = await loanDocumentsApi.getDocuments(id);
      if (response.success) {
        setDocuments(response.documents || []);
        setReadiness(response.readiness);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (doc: any, file: File) => {
    if (!applicationId) return;
    setUploading(doc.id);
    try {
      await loanDocumentsApi.uploadDocument(applicationId, doc.checklistId, file);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      fetchDocuments(applicationId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleVerify = async () => {
    if (!applicationId || !selectedDoc) return;
    try {
      await loanDocumentsApi.updateDocumentStatus(applicationId, selectedDoc.id, {
        status: verifyStatus,
        reason: verifyReason || undefined,
      });
      toast({
        title: 'Success',
        description: `Document ${verifyStatus.toLowerCase()}`,
      });
      setIsVerifyDialogOpen(false);
      setSelectedDoc(null);
      setVerifyReason('');
      fetchDocuments(applicationId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update document status',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'UNDER_REVIEW':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'SUBMITTED':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Document Collection</h1>
          <p className="text-muted-foreground">Application ID: {applicationId}</p>
        </div>
      </div>

      {/* Readiness Indicator */}
      {readiness && (
        <Card>
          <CardHeader>
            <CardTitle>Document Readiness</CardTitle>
            <CardDescription>
              {readiness.ready
                ? 'All mandatory documents are verified. Ready for disbursement.'
                : `${readiness.verifiedCount} of ${readiness.mandatoryCount} mandatory documents verified`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{readiness.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={readiness.percentage} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-primary">{readiness.verified}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{readiness.mandatory}</p>
                  <p className="text-xs text-muted-foreground">Mandatory</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{readiness.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              {readiness.blockingDocuments && readiness.blockingDocuments.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="font-semibold text-red-800 mb-2">Blocking Documents:</p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {readiness.blockingDocuments.map((doc: any, idx: number) => (
                        <li key={idx}>{doc.documentName} ({doc.status})</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>Upload and verify documents for this loan application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.documentName}</p>
                      {doc.isMandatory && (
                        <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                      )}
                      <Badge className={statusColors[doc.status] || statusColors.PENDING}>
                        {doc.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Category: {doc.category.replace('_', ' ')}
                    </p>
                    {doc.uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                    {doc.verifiedAt && (
                      <p className="text-xs text-green-600">
                        Verified: {new Date(doc.verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                    {doc.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Rejection: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === 'PENDING' || doc.status === 'REJECTED' ? (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(doc, file);
                        }}
                        disabled={uploading === doc.id}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading === doc.id}
                        asChild
                      >
                        <span>
                          {uploading === doc.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  ) : doc.status === 'SUBMITTED' || doc.status === 'UNDER_REVIEW' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setIsVerifyDialogOpen(true);
                      }}
                    >
                      Verify
                    </Button>
                  ) : null}
                  {doc.fileUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              {selectedDoc?.documentName} - {selectedDoc?.category}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={verifyStatus === 'VERIFIED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerifyStatus('VERIFIED')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify
                </Button>
                <Button
                  variant={verifyStatus === 'REJECTED' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setVerifyStatus('REJECTED')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
            {verifyStatus === 'REJECTED' && (
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <textarea
                  className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background"
                  rows={3}
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={verifyStatus === 'REJECTED' && !verifyReason}>
              {verifyStatus === 'VERIFIED' ? 'Verify' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
