'use client';

/**
 * BRD v5.0 LN-F06: Member Self-Service Portal Loan Application
 * Members can submit loan applications via Self-Service Portal
 * Self-service applications follow same validation rules and enter APPLIED state
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { meApi, loansApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { formatCurrency } from '@/lib/utils/format';

export default function MemberLoanApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [member, setMember] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    amountRequested: '',
    tenureMonths: '',
    purpose: '',
    employmentType: 'SALARIED' as 'SALARIED' | 'SELF_EMPLOYED' | 'FARMER' | 'BUSINESS' | 'OTHER',
    monthlyIncome: '',
    existingLiabilities: '',
    propertyAssetDesc: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get member profile
      const memberRes = await meApi.profile();
      if (memberRes.success && memberRes.member) {
        setMember(memberRes.member);
      }

      // Get active loan products via member API (BRD v5.0 LN-F06)
      const productsRes = await meApi.products();
      if (productsRes.success) {
        setProducts(productsRes.products || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setSubmitting(true);
    try {
      const applicationData: any = {
        memberId: member.id,
        productId: formData.productId || undefined,
        loanType: products.find(p => p.id === formData.productId)?.category?.toLowerCase() || 'personal',
        amountRequested: parseFloat(formData.amountRequested),
        purpose: formData.purpose || 'General',
        tenureMonths: parseInt(formData.tenureMonths),
        moratoriumMonths: 0,
        employmentType: formData.employmentType,
        monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        existingLiabilities: formData.existingLiabilities || undefined,
        propertyAssetDesc: formData.propertyAssetDesc || undefined,
        guarantorIds: [], // Members can add guarantors later via Loan Officer
      };

      const res = await loansApi.createApplication(applicationData);
      if (res.success && res.application?.id) {
        setApplicationId(res.application.id);
        setSubmitted(true);
        toast({
          title: 'Success',
          description: 'Loan application submitted successfully. It will be reviewed by Loan Officer.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MemberPortalNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (submitted && applicationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MemberPortalNav />
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                <h2 className="text-2xl font-bold">Application Submitted Successfully</h2>
                <p className="text-muted-foreground">
                  Your loan application has been submitted and is now in <strong>APPLIED</strong> status.
                  A Loan Officer will review your application shortly.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Application ID:</strong> {applicationId.slice(-8)}
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    You will receive updates via SMS/email once your application is reviewed.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => router.push('/member-portal/loans')}>
                    View My Loans
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/member-portal/home')}>
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemberPortalNav />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Apply for Loan</CardTitle>
            <CardDescription>
              Submit your loan application online. All applications are subject to verification and approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {member && (
              <Alert className="mb-6">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Application will be pre-filled with your KYC details: <strong>{member.firstName} {member.lastName}</strong> (Member ID: {member.memberNumber})
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Loan Product Selection */}
              <div className="space-y-2">
                <Label htmlFor="productId">Loan Product *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.productName} ({product.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount and Tenure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountRequested">Requested Amount (₹) *</Label>
                  <Input
                    id="amountRequested"
                    type="number"
                    min="1000"
                    step="1000"
                    value={formData.amountRequested}
                    onChange={(e) => setFormData({ ...formData, amountRequested: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenureMonths">Tenure (Months) *</Label>
                  <Input
                    id="tenureMonths"
                    type="number"
                    min="1"
                    max="360"
                    value={formData.tenureMonths}
                    onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Loan *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={3}
                  required
                  placeholder="Describe the purpose of this loan"
                />
              </div>

              {/* Employment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALARIED">Salaried</SelectItem>
                      <SelectItem value="SELF_EMPLOYED">Self-Employed</SelectItem>
                      <SelectItem value="FARMER">Farmer</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Monthly Income (₹)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    min="0"
                    value={formData.monthlyIncome}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Existing Liabilities */}
              <div className="space-y-2">
                <Label htmlFor="existingLiabilities">Existing Liabilities</Label>
                <Textarea
                  id="existingLiabilities"
                  value={formData.existingLiabilities}
                  onChange={(e) => setFormData({ ...formData, existingLiabilities: e.target.value })}
                  rows={2}
                  placeholder="List any existing loans, EMIs, or financial obligations (optional)"
                />
              </div>

              {/* Property/Asset Description */}
              <div className="space-y-2">
                <Label htmlFor="propertyAssetDesc">Property/Asset Description (for secured loans)</Label>
                <Textarea
                  id="propertyAssetDesc"
                  value={formData.propertyAssetDesc}
                  onChange={(e) => setFormData({ ...formData, propertyAssetDesc: e.target.value })}
                  rows={2}
                  placeholder="Describe property or assets offered as collateral (optional)"
                />
              </div>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Note:</strong> After submission, you may be required to provide additional documents.
                  A Loan Officer will contact you for verification.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
