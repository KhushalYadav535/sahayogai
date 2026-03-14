'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils/format';
import { ArrowLeft, TrendingUp, Loader2, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

function calculateFDRInterest(
  principal: number,
  annualRate: number,
  days: number,
  compoundingFreq: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'SIMPLE' = 'QUARTERLY',
  isSeniorCitizen: boolean = false
): {
  totalInterest: number;
  maturityValue: number;
  effectiveRate: number;
} {
  if (!principal || !annualRate || !days) {
    return { totalInterest: 0, maturityValue: principal, effectiveRate: annualRate };
  }

  const effectiveRate = isSeniorCitizen ? annualRate + 0.5 : annualRate;
  const years = days / 365;

  let maturityValue = principal;
  let totalInterest = 0;

  if (compoundingFreq === 'SIMPLE') {
    totalInterest = principal * (effectiveRate / 100) * years;
    maturityValue = principal + totalInterest;
  } else {
    let n = 1;
    if (compoundingFreq === 'MONTHLY') n = 12;
    else if (compoundingFreq === 'QUARTERLY') n = 4;
    else if (compoundingFreq === 'ANNUALLY') n = 1;

    maturityValue = principal * Math.pow(1 + (effectiveRate / 100) / n, n * years);
    totalInterest = maturityValue - principal;
  }

  return {
    totalInterest: Math.round(totalInterest),
    maturityValue: Math.round(maturityValue),
    effectiveRate,
  };
}

export default function FDRSimulatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [tenureUnit, setTenureUnit] = useState<'days' | 'months' | 'years'>('days');
  const [compoundingFreq, setCompoundingFreq] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'SIMPLE'>('QUARTERLY');
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const principalNum = Number(principal) || 0;
  const rateNum = Number(rate) || 0;
  const tenureNum = Number(tenure) || 0;
  const tenureDays = tenureUnit === 'days' ? tenureNum :
    tenureUnit === 'months' ? tenureNum * 30 :
    tenureNum * 365;

  const localResult = calculateFDRInterest(principalNum, rateNum, tenureDays, compoundingFreq, isSeniorCitizen);

  const handleSimulate = async () => {
    if (!principalNum || !rateNum || !tenureDays) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSimulating(true);
    try {
      const res = await meApi.simulateInterest({
        productType: 'FDR',
        principal: principalNum,
        rate: rateNum,
        tenureDays,
        compoundingFreq,
      });

      if (res.success) {
        setSimulationResult(res.simulation);
        toast({ title: 'Success', description: 'Interest simulation completed' });
      }
    } catch (e: any) {
      console.error('Simulation failed:', e);
      toast({ title: 'Simulation Error', description: e.message || 'Using local calculation', variant: 'destructive' });
      setSimulationResult(localResult);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      <MemberPortalNav />
      
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
              <h1 className="text-2xl font-bold text-gradient-primary">FDR Interest Simulator</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Simulate FDR interest calculations</p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-white/20 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  FDR Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="principal"
                      type="number"
                      placeholder="Enter principal amount"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate (Annual %)</Label>
                  <div className="relative">
                    <Input
                      id="rate"
                      type="number"
                      placeholder="Enter interest rate"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tenure"
                      type="number"
                      placeholder="Enter tenure"
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={tenureUnit} onValueChange={(v: any) => setTenureUnit(v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Compounding Frequency</Label>
                  <Select value={compoundingFreq} onValueChange={(v: any) => setCompoundingFreq(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMPLE">Simple Interest</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="senior">Senior Citizen (0.5% premium)</Label>
                  <Switch
                    id="senior"
                    checked={isSeniorCitizen}
                    onCheckedChange={setIsSeniorCitizen}
                  />
                </div>

                {principalNum > 0 && rateNum > 0 && tenureDays > 0 && (
                  <Button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="w-full mt-4"
                  >
                    {simulating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Simulate Interest
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          {(simulationResult || (principalNum > 0 && rateNum > 0 && tenureDays > 0)) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass border-white/20 dark:border-white/10 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Simulation Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Maturity Value</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(simulationResult?.maturityValue || localResult.maturityValue)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(simulationResult?.totalInterest || localResult.totalInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Effective Rate</p>
                      <p className="text-lg font-semibold text-accent">
                        {localResult.effectiveRate.toFixed(2)}% p.a.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Principal Amount</span>
                      <span className="font-semibold">{formatCurrency(principalNum)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Rate</span>
                      <span className="font-semibold">{rateNum}% p.a.</span>
                    </div>
                    {isSeniorCitizen && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Senior Citizen Premium</span>
                        <span className="font-semibold">+0.5%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Interest</span>
                      <span className="font-semibold">
                        {formatCurrency(simulationResult?.totalInterest || localResult.totalInterest)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t font-bold">
                      <span>Maturity Value</span>
                      <span className="text-accent">
                        {formatCurrency(simulationResult?.maturityValue || localResult.maturityValue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-white/20 dark:border-white/10">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground text-center">
                This is an estimate. Actual interest may vary based on the active interest scheme and TDS deductions.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
