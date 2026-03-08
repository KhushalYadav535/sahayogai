"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, FileText, Shield, TrendingUp, Users, Building2, Receipt } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";

const reportCategories = [
  {
    category: "Regulatory Reports",
    icon: <Building2 className="w-5 h-5" />,
    reports: [
      { name: "NABARD Annual Performance Report", ref: "COM-001", href: "/dashboard/compliance/nabard-report", frequency: "Annual", regulatoryBody: "NABARD / DCCB" },
      { name: "Registrar Annual Return (Form A)", ref: "COM-002", href: "/dashboard/compliance/registrar-return", frequency: "Annual", regulatoryBody: "State Registrar" },
      { name: "SLR/CRR Report", ref: "COM-012", href: "/dashboard/compliance/slr-crr", frequency: "Monthly", regulatoryBody: "RBI" },
    ],
  },
  {
    category: "Tax & TDS Reports",
    icon: <Receipt className="w-5 h-5" />,
    reports: [
      { name: "TDS Return (Form 26Q)", ref: "COM-003", href: "/dashboard/compliance/tds-26q", frequency: "Quarterly", regulatoryBody: "Income Tax Dept." },
      { name: "26AS / AIS Support Data", ref: "COM-004", href: "/dashboard/compliance/26as-ais", frequency: "Annual", regulatoryBody: "Income Tax Dept." },
      { name: "Income Tax Reporting Exports", ref: "COM-017", href: "/dashboard/compliance/income-tax-exports", frequency: "Annual", regulatoryBody: "Members / IT Dept." },
      { name: "GST Invoice", ref: "COM-013", href: "/dashboard/compliance/gst-invoice", frequency: "Per Transaction", regulatoryBody: "GST Dept." },
    ],
  },
  {
    category: "AML & Compliance",
    icon: <Shield className="w-5 h-5" />,
    reports: [
      { name: "STR / SAR (PMLA)", ref: "COM-005", href: "/dashboard/compliance/str", frequency: "As Triggered", regulatoryBody: "FIU-IND" },
      { name: "KYC/AML Compliance Log", ref: "COM-006", href: "/dashboard/compliance/aml", frequency: "On Demand", regulatoryBody: "RBI / PMLA" },
    ],
  },
  {
    category: "Member Reports",
    icon: <Users className="w-5 h-5" />,
    reports: [
      { name: "Member Due Report", ref: "COM-008", href: "/dashboard/compliance/member-due", frequency: "On Demand", regulatoryBody: "Internal" },
      { name: "Member Ledger", ref: "COM-009", href: "/dashboard/compliance/member-ledger", frequency: "On Demand", regulatoryBody: "Internal / Audit" },
      { name: "Member List", ref: "COM-010", href: "/dashboard/compliance/member-list", frequency: "On Demand", regulatoryBody: "Internal" },
    ],
  },
  {
    category: "Loan & Deposit Reports",
    icon: <TrendingUp className="w-5 h-5" />,
    reports: [
      { name: "Loan Schedule Report", ref: "COM-014", href: "/dashboard/compliance/loan-schedule", frequency: "On Demand", regulatoryBody: "Internal / Audit" },
      { name: "Deposit Maturity Schedule", ref: "COM-015", href: "/dashboard/compliance/deposit-maturity", frequency: "On Demand", regulatoryBody: "Internal" },
    ],
  },
  {
    category: "Audit & Support",
    icon: <FileText className="w-5 h-5" />,
    reports: [
      { name: "Audit Support Package", ref: "COM-011", href: "/dashboard/compliance/audit-package", frequency: "Annual", regulatoryBody: "Statutory Auditor" },
    ],
  },
];

export default function ComplianceReportsPage() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (reportRef: string) => {
    setGenerating(reportRef);
    try {
      // This would call the appropriate API based on reportRef
      toast({ title: "Generating", description: `Generating ${reportRef} report...` });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({ title: "Success", description: "Report generated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Reports Hub</h1>
          <p className="text-muted-foreground mt-1">Generate and download regulatory compliance reports</p>
        </div>
        <Link href="/dashboard/compliance/dashboard">
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            View Dashboard
          </Button>
        </Link>
      </div>

      {reportCategories.map((cat) => (
        <div key={cat.category}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {cat.icon}
            {cat.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.reports.map((report) => (
              <Card key={report.ref} className="p-4 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm flex-1">{report.name}</h3>
                  <Badge variant="outline" className="text-xs ml-2">{report.ref}</Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{report.regulatoryBody}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={report.href} className="flex-1">
                    <Button size="sm" variant="outline" className="gap-1 w-full">
                      <FileText className="w-3 h-3" />
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => handleGenerate(report.ref)}
                    disabled={generating === report.ref}
                  >
                    {generating === report.ref ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
