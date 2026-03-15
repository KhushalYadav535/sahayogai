'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loanCollateralApi, loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Calculator, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/formatters';

export default function LoanCollateralPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [collateral, setCollateral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    collateralType: 'GOLD' as 'GOLD' | 'PROPERTY' | 'FDR' | 'VEHICLE' | 'OTHER',
    description: '',
    valuationDate: new Date().toISOString().split('T')[0],
    valuationAmount: 0,
    valuerName: '',
    ltvRatio: 75,
    // Gold-specific fields
    goldPurity: '22K' as '18K' | '20K' | '22K' | '24K',
    goldGrossWeight: 0,
    goldNetWeight: 0,
    goldCertRefNumber: '',
    goldRatePerGram: 0,
    // Property-specific fields
    chargeType: '' as 'EQUITABLE_MORTGAGE' | 'REGISTERED_MORTGAGE' | '',
    registrationDate: '',
    subRegistrarOffice: '',
    registrationNumber: '',
  });

  useEffect(() => {
    params.then(p => {
      setApplicationId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const appRes = await loansApi.getApplication(id);
      if (appRes.success) {
        setApplication(appRes.application);
        if (appRes.application.collateral) {
          setCollateral(appRes.application.collateral);
          setFormData({
            ...formData,
            ...appRes.application.collateral,
            valuationDate: appRes.application.collateral.valuationDate
              ? new Date(appRes.application.collateral.valuationDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            registrationDate: appRes.application.collateral.registrationDate
              ? new Date(appRes.application.collateral.registrationDate).toISOString().split('T')[0]
              : '',
          });
        }
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

  const handleCalculateGold = async () => {
    if (!formData.goldNetWeight || !formData.goldRatePerGram || !formData.goldPurity) {
      toast({
        title: 'Error',
        description: 'Please fill all gold details',
        variant: 'destructive',
      });
      return;
    }

    setCalculating(true);
    try {
      const purityMultiplier: Record<string, number> = {
        '24K': 1.0,
        '22K': 0.9167,
        '20K': 0.8333,
        '18K': 0.75,
      };

      const pureGoldWeight = formData.goldNetWeight * (purityMultiplier[formData.goldPurity] || 1);
      const valuationAmount = pureGoldWeight * formData.goldRatePerGram;
      const ltvRatio = formData.ltvRatio || 75;
      const eligibleAmount = (valuationAmount * ltvRatio) / 100;

      const res = await loanCollateralApi.calculateGold({
        purity: formData.goldPurity,
        netWeight: formData.goldNetWeight,
        ratePerGram: formData.goldRatePerGram,
        ltvRatio,
      });

      if (res.success) {
        setCalculationResult({
          valuationAmount,
          eligibleAmount: res.eligibleAmount,
          maxAllowedAmount: res.maxAllowedAmount,
          ltvRatio: res.ltvRatio,
        });
        setFormData(prev => ({
          ...prev,
          valuationAmount,
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate gold value',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!applicationId) return;
    setSaving(true);
    try {
      const payload: any = {
        collateralType: formData.collateralType,
        description: formData.description,
        valuationDate: formData.valuationDate,
        valuationAmount: formData.valuationAmount,
        valuerName: formData.valuerName,
        ltvRatio: formData.ltvRatio,
      };

      if (formData.collateralType === 'GOLD') {
        payload.goldPurity = formData.goldPurity;
        payload.goldGrossWeight = formData.goldGrossWeight;
        payload.goldNetWeight = formData.goldNetWeight;
        payload.goldCertRefNumber = formData.goldCertRefNumber;
        payload.goldRatePerGram = formData.goldRatePerGram;
      }

      if (formData.collateralType === 'PROPERTY') {
        payload.chargeType = formData.chargeType;
        payload.registrationDate = formData.registrationDate || undefined;
        payload.subRegistrarOffice = formData.subRegistrarOffice;
        payload.registrationNumber = formData.registrationNumber;
      }

      const res = await loanCollateralApi.create(applicationId, payload);
      if (res.success) {
        toast({
          title: 'Success',
          description: 'Collateral details saved',
        });
        setCollateral(res.collateral);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save collateral',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold">Collateral Details</h1>
          <p className="text-muted-foreground">Application ID: {applicationId}</p>
        </div>
      </div>

      {/* Gold Calculator */}
      {formData.collateralType === 'GOLD' && (
        <Card>
          <CardHeader>
            <CardTitle>Gold Loan Calculator</CardTitle>
            <CardDescription>Calculate eligible loan amount based on gold valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gold Purity *</Label>
                <Select
                  value={formData.goldPurity}
                  onValueChange={(value: any) => setFormData({ ...formData, goldPurity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24K">24K (100% Pure)</SelectItem>
                    <SelectItem value="22K">22K (91.67% Pure)</SelectItem>
                    <SelectItem value="20K">20K (83.33% Pure)</SelectItem>
                    <SelectItem value="18K">18K (75% Pure)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Net Weight (grams) *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.goldNetWeight || ''}
                  onChange={(e) => setFormData({ ...formData, goldNetWeight: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Gold Rate per Gram (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.goldRatePerGram || ''}
                  onChange={(e) => setFormData({ ...formData, goldRatePerGram: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>LTV Ratio (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.ltvRatio}
                  onChange={(e) => setFormData({ ...formData, ltvRatio: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button
              onClick={handleCalculateGold}
              disabled={calculating}
              className="mt-4"
            >
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Eligible Amount
                </>
              )}
            </Button>
            {calculationResult && (
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Valuation Amount</Label>
                    <p className="font-semibold text-lg">{formatCurrency(calculationResult.valuationAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Eligible Loan Amount</Label>
                    <p className="font-semibold text-lg text-primary">
                      {formatCurrency(calculationResult.eligibleAmount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Max Allowed Amount</Label>
                    <p className="font-semibold">{formatCurrency(calculationResult.maxAllowedAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">LTV Ratio</Label>
                    <p className="font-semibold">{calculationResult.ltvRatio}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Collateral Form */}
      <Card>
        <CardHeader>
          <CardTitle>Collateral Information</CardTitle>
          <CardDescription>Enter collateral details for this loan application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label>Collateral Type *</Label>
              <Select
                value={formData.collateralType}
                onValueChange={(value: any) => setFormData({ ...formData, collateralType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="PROPERTY">Property</SelectItem>
                  <SelectItem value="FDR">Fixed Deposit Receipt (FDR)</SelectItem>
                  <SelectItem value="VEHICLE">Vehicle</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the collateral"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valuation Date *</Label>
                <Input
                  type="date"
                  value={formData.valuationDate}
                  onChange={(e) => setFormData({ ...formData, valuationDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Valuation Amount (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valuationAmount || ''}
                  onChange={(e) => setFormData({ ...formData, valuationAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Valuer Name</Label>
              <Input
                value={formData.valuerName}
                onChange={(e) => setFormData({ ...formData, valuerName: e.target.value })}
                placeholder="Name of the valuer/appraiser"
              />
            </div>

            {/* Gold-specific fields */}
            {formData.collateralType === 'GOLD' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Gold Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Gross Weight (grams)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.goldGrossWeight || ''}
                      onChange={(e) => setFormData({ ...formData, goldGrossWeight: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Certificate Reference Number</Label>
                    <Input
                      value={formData.goldCertRefNumber}
                      onChange={(e) => setFormData({ ...formData, goldCertRefNumber: e.target.value })}
                      placeholder="Gold certificate ref number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Property-specific fields */}
            {formData.collateralType === 'PROPERTY' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Property Charge Details</h3>
                <div>
                  <Label>Charge Type</Label>
                  <Select
                    value={formData.chargeType}
                    onValueChange={(value: any) => setFormData({ ...formData, chargeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select charge type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EQUITABLE_MORTGAGE">Equitable Mortgage</SelectItem>
                      <SelectItem value="REGISTERED_MORTGAGE">Registered Mortgage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.chargeType === 'REGISTERED_MORTGAGE' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Registration Date</Label>
                        <Input
                          type="date"
                          value={formData.registrationDate}
                          onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Registration Number</Label>
                        <Input
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                          placeholder="Registration number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Sub-Registrar Office</Label>
                      <Input
                        value={formData.subRegistrarOffice}
                        onChange={(e) => setFormData({ ...formData, subRegistrarOffice: e.target.value })}
                        placeholder="Sub-registrar office name"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Collateral Details
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Collateral Display */}
      {collateral && (
        <Card>
          <CardHeader>
            <CardTitle>Current Collateral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium">{collateral.collateralType}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valuation Amount</Label>
                <p className="font-semibold">{formatCurrency(collateral.valuationAmount)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">LTV Ratio</Label>
                <p className="font-medium">{collateral.ltvRatio}%</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valuation Date</Label>
                <p>{new Date(collateral.valuationDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
