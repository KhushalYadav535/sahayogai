'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/format';
import { ArrowLeft, Calculator, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

function calculateEMI(principal: number, annualRate: number, months: number): {
  emi: number;
  totalInterest: number;
  totalAmount: number;
} {
  if (!principal || !annualRate || !months) {
    return { emi: 0, totalInterest: 0, totalAmount: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalAmount = emi * months;
  const totalInterest = totalAmount - principal;

  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalAmount: Math.round(totalAmount),
  };
}

export default function EMICalculatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('months');

  const principalNum = Number(principal) || 0;
  const rateNum = Number(rate) || 0;
  const tenureNum = Number(tenure) || 0;
  const tenureMonths = tenureUnit === 'years' ? tenureNum * 12 : tenureNum;

  const result = calculateEMI(principalNum, rateNum, tenureMonths);

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
              <h1 className="text-2xl font-bold text-gradient-primary">EMI Calculator</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Calculate your monthly EMI</p>
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
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Loan Amount (Principal)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="principal"
                      type="number"
                      placeholder="Enter loan amount"
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
                  <Label htmlFor="tenure">Loan Tenure</Label>
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
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          {principalNum > 0 && rateNum > 0 && tenureMonths > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass border-white/20 dark:border-white/10 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    EMI Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Monthly EMI</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(result.emi)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-lg font-semibold text-accent">{formatCurrency(result.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Principal Amount</span>
                      <span className="font-semibold">{formatCurrency(principalNum)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Interest</span>
                      <span className="font-semibold">{formatCurrency(result.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t font-bold">
                      <span>Total Amount Payable</span>
                      <span className="text-accent">{formatCurrency(result.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Formula Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-white/20 dark:border-white/10">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Formula:</strong> EMI = P × r × (1+r)^n / ((1+r)^n - 1)
                <br />
                Where P = Principal, r = Monthly Rate, n = Number of Months
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
