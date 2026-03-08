"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export default function SLRCRRReportPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadReport();
  }, [month]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.slrCrrReport(month);
      if (res.success) {
        setReport(res.report);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "COMPLIANT" ? (
      <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Compliant</Badge>
    ) : (
      <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Non-Compliant</Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLR/CRR Report</h1>
          <p className="text-muted-foreground mt-2">Statutory Liquidity Ratio and Cash Reserve Ratio compliance (UCBs only)</p>
        </div>
        <div className="flex gap-2">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[180px]" />
          </div>
          {report && (
            <Button onClick={() => toast({ title: "Info", description: "PDF download would be implemented here" })}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {report && (
        <>
          {(!report.slr.status.includes("COMPLIANT") || !report.crr.status.includes("COMPLIANT")) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Compliance alert: {!report.slr.status.includes("COMPLIANT") && "SLR"} {!report.slr.status.includes("COMPLIANT") && !report.crr.status.includes("COMPLIANT") && "and"} {!report.crr.status.includes("COMPLIANT") && "CRR"} not meeting RBI requirements.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  SLR (Statutory Liquidity Ratio)
                </CardTitle>
                <CardDescription>Required: {report.slr.required}%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash</span>
                    <span className="font-medium">{formatCurrency(report.slr.cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Government Securities</span>
                    <span className="font-medium">{formatCurrency(report.slr.governmentSecurities)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Liabilities</span>
                    <span className="font-medium">{formatCurrency(report.slr.netLiabilities)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">SLR Ratio</span>
                    <span className="font-bold text-lg">{report.slr.ratio.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(report.slr.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  CRR (Cash Reserve Ratio)
                </CardTitle>
                <CardDescription>Required: {report.crr.required}%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash</span>
                    <span className="font-medium">{formatCurrency(report.crr.cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Liabilities</span>
                    <span className="font-medium">{formatCurrency(report.crr.netLiabilities)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">CRR Ratio</span>
                    <span className="font-bold text-lg">{report.crr.ratio.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(report.crr.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
