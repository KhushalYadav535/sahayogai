'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loanProductsApi, interestApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function NewLoanProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [interestSchemes, setInterestSchemes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    productName: '',
    category: 'PERSONAL' as 'PERSONAL' | 'GOLD' | 'HOUSING' | 'AGRICULTURE' | 'VEHICLE' | 'EDUCATION' | 'OTHER',
    targetSegment: '',
    description: '',
    interestSchemeId: '',
    eligibilityRulesetId: '', // LN-P02: Eligibility Ruleset link
    documentationChecklistId: '', // LN-P02: Documentation Checklist link
    repaymentStructure: 'STANDARD_EMI' as 'STANDARD_EMI' | 'BULLET' | 'STEP_UP' | 'IRREGULAR',
    processingFeeType: 'PERCENTAGE' as 'FLAT' | 'PERCENTAGE',
    processingFeeValue: 0,
    documentationCharge: 0,
    insurancePremiumType: '' as 'FLAT' | 'PERCENTAGE' | '',
    insurancePremiumValue: 0,
    stampDutyPercent: 0,
  });

  useEffect(() => {
    fetchInterestSchemes();
  }, []);

  const fetchInterestSchemes = async () => {
    try {
      const response = await interestApi.schemes.list();
      if (response.success) {
        const loanSchemes = (response.schemes || []).filter(
          (s: any) => s.productType === 'Loan' && s.status === 'ACTIVE'
        );
        setInterestSchemes(loanSchemes);
      }
    } catch (error) {
      console.error('Error fetching interest schemes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = { ...formData };
      if (!payload.interestSchemeId) delete payload.interestSchemeId;
      if (!payload.targetSegment) delete payload.targetSegment;
      if (!payload.description) delete payload.description;
      if (!payload.insurancePremiumType) {
        delete payload.insurancePremiumType;
        delete payload.insurancePremiumValue;
      }
      if (!payload.stampDutyPercent) delete payload.stampDutyPercent;

      const response = await loanProductsApi.create(payload);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Loan product created successfully',
        });
        router.push('/dashboard/loans/products');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create loan product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loans/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Loan Product</h1>
          <p className="text-muted-foreground">Create a new loan product configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Product name, category, and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="HOUSING">Housing</SelectItem>
                      <SelectItem value="AGRICULTURE">Agriculture</SelectItem>
                      <SelectItem value="VEHICLE">Vehicle</SelectItem>
                      <SelectItem value="EDUCATION">Education</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetSegment">Target Segment</Label>
                  <Input
                    id="targetSegment"
                    value={formData.targetSegment}
                    onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    placeholder="e.g., Salaried, Self-employed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Interest & Repayment */}
          <Card>
            <CardHeader>
              <CardTitle>Interest & Repayment</CardTitle>
              <CardDescription>Link interest scheme and configure repayment structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestSchemeId">Interest Scheme</Label>
                  <Select
                    value={formData.interestSchemeId}
                    onValueChange={(value) => setFormData({ ...formData, interestSchemeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {interestSchemes.map((scheme) => (
                        <SelectItem key={scheme.id} value={scheme.id}>
                          {scheme.schemeCode} - {scheme.schemeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repaymentStructure">Repayment Structure *</Label>
                  <Select
                    value={formData.repaymentStructure}
                    onValueChange={(value: any) => setFormData({ ...formData, repaymentStructure: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD_EMI">Standard EMI</SelectItem>
                      <SelectItem value="BULLET">Bullet</SelectItem>
                      <SelectItem value="STEP_UP">Step-Up</SelectItem>
                      <SelectItem value="IRREGULAR">Irregular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* LN-P02: Eligibility Ruleset and Documentation Checklist */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligibilityRulesetId">Eligibility Ruleset</Label>
                  <Input
                    id="eligibilityRulesetId"
                    value={formData.eligibilityRulesetId}
                    onChange={(e) => setFormData({ ...formData, eligibilityRulesetId: e.target.value })}
                    placeholder="e.g., loan.eligibility.rules.default"
                  />
                  <p className="text-xs text-muted-foreground">Reference to eligibility rules metadata</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentationChecklistId">Documentation Checklist</Label>
                  <Input
                    id="documentationChecklistId"
                    value={formData.documentationChecklistId}
                    onChange={(e) => setFormData({ ...formData, documentationChecklistId: e.target.value })}
                    placeholder="Checklist ID (optional)"
                  />
                  <p className="text-xs text-muted-foreground">Link to product-specific checklist</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>Configure processing fees and charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processingFeeType">Processing Fee Type *</Label>
                  <Select
                    value={formData.processingFeeType}
                    onValueChange={(value: any) => setFormData({ ...formData, processingFeeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processingFeeValue">
                    Processing Fee Value * ({formData.processingFeeType === 'PERCENTAGE' ? '%' : '₹'})
                  </Label>
                  <Input
                    id="processingFeeValue"
                    type="number"
                    step="0.01"
                    value={formData.processingFeeValue}
                    onChange={(e) => setFormData({ ...formData, processingFeeValue: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentationCharge">Documentation Charge (₹)</Label>
                  <Input
                    id="documentationCharge"
                    type="number"
                    step="0.01"
                    value={formData.documentationCharge}
                    onChange={(e) => setFormData({ ...formData, documentationCharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstOnFees">GST on Fees (%)</Label>
                  <Input
                    id="gstOnFees"
                    type="number"
                    step="0.01"
                    value={18}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Platform-scope, statutory (18%)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurancePremiumType">Insurance Premium Type</Label>
                  <Select
                    value={formData.insurancePremiumType}
                    onValueChange={(value: any) => setFormData({ ...formData, insurancePremiumType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Not applicable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not applicable</SelectItem>
                      <SelectItem value="FLAT">Flat Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.insurancePremiumType && (
                  <div className="space-y-2">
                    <Label htmlFor="insurancePremiumValue">
                      Insurance Premium Value ({formData.insurancePremiumType === 'PERCENTAGE' ? '%' : '₹'})
                    </Label>
                    <Input
                      id="insurancePremiumValue"
                      type="number"
                      step="0.01"
                      value={formData.insurancePremiumValue}
                      onChange={(e) => setFormData({ ...formData, insurancePremiumValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stampDutyPercent">Stamp Duty (%)</Label>
                <Input
                  id="stampDutyPercent"
                  type="number"
                  step="0.01"
                  value={formData.stampDutyPercent}
                  onChange={(e) => setFormData({ ...formData, stampDutyPercent: parseFloat(e.target.value) || 0 })}
                  placeholder="State-specific"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/loans/products">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
