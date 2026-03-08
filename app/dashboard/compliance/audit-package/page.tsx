"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, FileText, Archive, CheckCircle } from "lucide-react";

export default function AuditSupportPackagePage() {
  const { toast } = useToast();
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fy, setFy] = useState("2025-26");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.auditSupportPackage(fy);
      if (res.success) {
        setPackageData(res.package);
        toast({ title: "Success", description: "Audit support package generated successfully" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate package", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!packageData) return;
    toast({ title: "Info", description: "ZIP package download would be implemented here" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Support Package</h1>
        <p className="text-muted-foreground mt-2">Generate comprehensive audit support package for statutory auditor</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Package</CardTitle>
          <CardDescription>Enter financial year for audit support package</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Financial Year</Label>
            <Input value={fy} onChange={(e) => setFy(e.target.value)} placeholder="2025-26" />
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            <FileText className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate Package"}
          </Button>
        </CardContent>
      </Card>

      {packageData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Audit Support Package
                </CardTitle>
                <CardDescription>
                  Financial Year: {packageData.financialYear} | Generated: {new Date(packageData.generatedAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Trial Balance</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.trialBalance.entries} entries</p>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Vouchers</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.vouchers.count} vouchers</p>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Members</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.members.count} members</p>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Loans</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.loans.count} loans</p>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Deposits</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.deposits.count} deposits</p>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Transactions</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.transactions.count} transactions</p>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Audit Logs</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{packageData.contents.auditLogs.count} log entries</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
