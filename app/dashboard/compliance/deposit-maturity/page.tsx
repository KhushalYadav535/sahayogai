"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export default function DepositMaturitySchedulePage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [depositType, setDepositType] = useState<string>("all");

  useEffect(() => {
    loadReport();
  }, [from, to, depositType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.depositMaturitySchedule({
        from,
        to,
        depositType: depositType !== "all" ? depositType : undefined,
      });
      if (res.success) {
        setReport(res.report);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load schedule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const csv = [
      ["Deposit Number", "Member", "Type", "Principal", "Interest Rate", "Maturity Date", "Maturity Amount", "Days to Maturity"],
      ...report.records.map((r: any) => [
        r.depositNumber,
        r.member.name,
        r.depositType,
        r.principal,
        r.interestRate,
        new Date(r.maturityDate).toLocaleDateString(),
        r.maturityAmount,
        r.daysToMaturity,
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deposit-maturity-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deposit Maturity Schedule</h1>
          <p className="text-muted-foreground mt-2">View upcoming deposit maturities</p>
        </div>
        {report && (
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Deposit Type</Label>
              <Select value={depositType} onValueChange={setDepositType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="FD">Fixed Deposit</SelectItem>
                  <SelectItem value="RD">Recurring Deposit</SelectItem>
                  <SelectItem value="MIS">Monthly Income Scheme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Maturity Schedule
            </CardTitle>
            <CardDescription>
              Total Deposits: {report.totalDeposits} | Total Maturity Amount: {formatCurrency(report.totalMaturityAmount)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deposit Number</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest Rate</TableHead>
                    <TableHead>Maturity Date</TableHead>
                    <TableHead className="text-right">Maturity Amount</TableHead>
                    <TableHead className="text-right">Days to Maturity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No deposits found
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.records.map((record: any) => (
                      <TableRow key={record.depositId}>
                        <TableCell className="font-mono">{record.depositNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.member.name}</p>
                            <p className="text-xs text-muted-foreground">{record.member.memberNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.depositType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(record.principal)}</TableCell>
                        <TableCell className="text-right">{record.interestRate}%</TableCell>
                        <TableCell>{new Date(record.maturityDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(record.maturityAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={record.daysToMaturity < 30 ? "destructive" : record.daysToMaturity < 90 ? "default" : "outline"}>
                            {record.daysToMaturity} days
                          </Badge>
                        </TableCell>
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
