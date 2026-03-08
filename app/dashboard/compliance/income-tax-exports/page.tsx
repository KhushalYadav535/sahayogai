"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, FileText, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { membersApi } from "@/lib/api";

export default function IncomeTaxExportsPage() {
  const { toast } = useToast();
  const [exportData, setExportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fy, setFy] = useState("2025-26");
  const [format, setFormat] = useState("CSV");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (memberId || fy) {
      loadExport();
    }
  }, [fy, format, memberId]);

  const loadMembers = async () => {
    try {
      const res = await membersApi.list();
      if (res.success) {
        setMembers(res.members || []);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  };

  const loadExport = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.incomeTaxExports({ fy, format, memberId: memberId || undefined });
      if (res.success) {
        setExportData(res.export);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load export", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;
    const csv = [
      ["PAN", "Name", "Address", "Financial Year", "Deposit Number", "Deposit Type", "Interest Amount", "TDS Amount", "Net Amount", "TDS Date"],
      ...exportData.records.map((r: any) => [
        r.pan,
        r.name,
        r.address,
        r.financialYear,
        r.depositNumber,
        r.depositType,
        r.interestAmount,
        r.tdsAmount,
        r.netAmount,
        new Date(r.tdsDate).toLocaleDateString(),
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-tax-export-${fy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Income Tax Reporting Exports</h1>
        <p className="text-muted-foreground mt-2">Export income tax data for members and IT Department</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Parameters</CardTitle>
          <CardDescription>Configure export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Financial Year</Label>
              <Input value={fy} onChange={(e) => setFy(e.target.value)} placeholder="2025-26" />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="XML">XML</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member (Optional)</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Members</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.memberNumber} - {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {exportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Income Tax Export</CardTitle>
                <CardDescription>
                  Format: {exportData.format} | Financial Year: {exportData.financialYear} | Total Records: {exportData.totalRecords}
                </CardDescription>
              </div>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download {exportData.format}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-muted rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Interest</p>
                  <p className="font-bold">{formatCurrency(exportData.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total TDS</p>
                  <p className="font-bold">{formatCurrency(exportData.totalTDS)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Records</p>
                  <p className="font-bold">{exportData.totalRecords}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Generated</p>
                  <p className="font-bold">{new Date(exportData.generatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PAN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Deposit Number</TableHead>
                    <TableHead>Deposit Type</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>TDS Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportData.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    exportData.records.map((record: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{record.pan}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.depositNumber}</TableCell>
                        <TableCell>{record.depositType}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.interestAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.tdsAmount)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(record.netAmount)}</TableCell>
                        <TableCell>{new Date(record.tdsDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
