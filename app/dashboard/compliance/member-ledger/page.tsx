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
import { membersApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MemberLedgerPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

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

  const handleGenerate = async () => {
    if (!memberId) {
      toast({ title: "Error", description: "Please select a member", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await complianceApi.memberLedger({ memberId, from, to });
      if (res.success) {
        setReport(res.report);
        toast({ title: "Success", description: "Member ledger generated successfully" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate ledger", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const csv = [
      ["Date", "Type", "Description", "Debit", "Credit", "Balance", "Reference"],
      ...report.entries.map((e: any) => [
        new Date(e.date).toLocaleDateString(),
        e.type,
        e.description,
        e.debit,
        e.credit,
        e.balance,
        e.reference,
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-ledger-${report.member.memberNumber}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Member Ledger</h1>
        <p className="text-muted-foreground mt-2">Generate comprehensive ledger for a member</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Ledger</CardTitle>
          <CardDescription>Select member and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.memberNumber} - {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !memberId}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate Ledger"}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ledger for {report.member.name}</CardTitle>
                <CardDescription>
                  Member Number: {report.member.memberNumber} | Period: {new Date(report.period.from).toLocaleDateString()} to {new Date(report.period.to).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-muted rounded">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Debit</p>
                  <p className="font-bold">{formatCurrency(report.totalDebit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Credit</p>
                  <p className="font-bold">{formatCurrency(report.totalCredit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Balance</p>
                  <p className="font-bold">{formatCurrency(report.totalCredit - report.totalDebit)}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.entries.map((entry: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.type}</Badge>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</TableCell>
                        <TableCell className="text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(entry.balance)}</TableCell>
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
