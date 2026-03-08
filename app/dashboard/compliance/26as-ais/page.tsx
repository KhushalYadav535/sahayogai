"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, FileText, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export default function A26ASAISPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fy, setFy] = useState("2025-26");
  const [pan, setPan] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.a26asAis({ fy, pan });
      if (res.success) {
        setReport(res);
        toast({ title: "Success", description: "26AS/AIS data generated successfully" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const csv = [
      ["PAN", "Name", "Financial Year", "Interest Amount", "TDS Amount", "Deposit Number", "Deposit Type", "TDS Date"],
      ...report.records.map((r: any) => [r.pan, r.name, r.financialYear, r.interestAmount, r.tdsAmount, r.depositNumber, r.depositType, r.tdsDate]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `26AS-AIS-${fy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">26AS / AIS Support Data</h1>
        <p className="text-muted-foreground mt-2">Generate 26AS and AIS support data for Income Tax Department</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Enter financial year and optionally filter by PAN</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Financial Year</Label>
              <Input value={fy} onChange={(e) => setFy(e.target.value)} placeholder="2025-26" />
            </div>
            <div className="space-y-2">
              <Label>PAN (Optional)</Label>
              <Input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="Filter by PAN" />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto">
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>26AS / AIS Data</CardTitle>
                <CardDescription>
                  Format: {report.format} | Financial Year: {report.financialYear} | Total Records: {report.totalRecords}
                </CardDescription>
              </div>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-muted rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Interest</p>
                  <p className="font-bold">{formatCurrency(report.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total TDS</p>
                  <p className="font-bold">{formatCurrency(report.totalTDS)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Records</p>
                  <p className="font-bold">{report.totalRecords}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Generated</p>
                  <p className="font-bold">{new Date(report.generatedAt).toLocaleDateString()}</p>
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
                    <TableHead>TDS Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.records.map((record: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{record.pan}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.depositNumber}</TableCell>
                        <TableCell>{record.depositType}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.interestAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.tdsAmount)}</TableCell>
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
