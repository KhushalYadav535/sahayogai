"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { securityApi } from "@/lib/api";
import { FileText, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function DPDPPage() {
  const { toast } = useToast();
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [openFulfillDialog, setOpenFulfillDialog] = useState(false);

  useEffect(() => {
    loadAccessRequests();
  }, []);

  const loadAccessRequests = async () => {
    try {
      const res = await securityApi.dpdp.accessRequest.list();
      if (res.success) {
        setAccessRequests(res.data);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  const handleFulfill = async (id: string) => {
    setLoading(true);
    try {
      const res = await securityApi.dpdp.accessRequest.fulfill(id);
      if (res.success) {
        toast({ title: "Success", description: "Data access request fulfilled" });
        setOpenFulfillDialog(false);
        setSelectedRequest(null);
        loadAccessRequests();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to fulfill request", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULFILLED":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Fulfilled</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DPDP Act 2023 Compliance</h1>
        <p className="text-muted-foreground mt-2">Manage data principal rights requests (Access, Correction, Erasure)</p>
      </div>

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList>
          <TabsTrigger value="access">Data Access Requests</TabsTrigger>
          <TabsTrigger value="correction">Correction Requests</TabsTrigger>
          <TabsTrigger value="erasure">Erasure Requests</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Data Access Requests
              </CardTitle>
              <CardDescription>Members can request access to their personal data. Requests must be fulfilled within 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fulfilled At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No access requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    accessRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.member?.firstName} {request.member?.lastName} ({request.member?.memberNumber})
                        </TableCell>
                        <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{request.fulfilledAt ? new Date(request.fulfilledAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          {request.status === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setOpenFulfillDialog(true);
                              }}
                            >
                              Fulfill
                            </Button>
                          )}
                          {request.status === "FULFILLED" && request.responseData && (
                            <Button size="sm" variant="outline" onClick={() => {
                              const blob = new Blob([JSON.stringify(request.responseData, null, 2)], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `data-access-${request.id}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correction">
          <Card>
            <CardHeader>
              <CardTitle>Data Correction Requests</CardTitle>
              <CardDescription>Members can request corrections to their personal data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Correction requests will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="erasure">
          <Card>
            <CardHeader>
              <CardTitle>Data Erasure Requests</CardTitle>
              <CardDescription>Members can request deletion or anonymization of their personal data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Erasure requests will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle>Consent Management</CardTitle>
              <CardDescription>Track and manage member consent for data processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Consent records will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openFulfillDialog} onOpenChange={setOpenFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Data Access Request</DialogTitle>
            <DialogDescription>This will generate and provide all member data to the requester.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Member: {selectedRequest.member?.firstName} {selectedRequest.member?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">Requested: {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenFulfillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedRequest && handleFulfill(selectedRequest.id)} disabled={loading}>
              Fulfill Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
