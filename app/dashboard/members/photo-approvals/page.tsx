"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getToken } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

interface PhotoApproval {
    id: string;
    memberId: string;
    memberName?: string;
    memberNumber?: string;
    purposeCode: string;
    captureMode: string;
    status: string;
    submittedAt?: string;
    makerName?: string;
    imageUrl?: string;
    createdAt: string;
}

export default function PhotoApprovalsPage() {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<PhotoApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoApproval | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        fetchPendingPhotos();
    }, []);

    const fetchPendingPhotos = async () => {
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const response = await fetch(`${API_BASE}/members/photos/pending`, {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPhotos(data.photos || []);
            } else {
                toast.error("Failed to load pending photos");
            }
        } catch (err) {
            console.error("Error fetching pending photos:", err);
            toast.error("Failed to load pending photos");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (photoId: string) => {
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const response = await fetch(`${API_BASE}/members/photo/${photoId}/approve`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (response.ok) {
                toast.success("Photo approved successfully");
                fetchPendingPhotos();
            } else {
                const error = await response.json().catch(() => ({}));
                toast.error(error.message || "Failed to approve photo");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to approve photo");
        }
    };

    const handleReject = async (photoId: string) => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const response = await fetch(`${API_BASE}/members/photo/${photoId}/reject`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token || ""}`,
                },
                body: JSON.stringify({ rejectionReason }),
            });

            if (response.ok) {
                toast.success("Photo rejected");
                setRejectionReason("");
                setIsViewDialogOpen(false);
                fetchPendingPhotos();
            } else {
                toast.error("Failed to reject photo");
            }
        } catch (err) {
            toast.error("Failed to reject photo");
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: "bg-gray-100 text-gray-800",
            PENDING_APPROVAL: "bg-amber-100 text-amber-800",
            APPROVED: "bg-green-100 text-green-800",
            REJECTED: "bg-red-100 text-red-800",
        };
        return (
            <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
                {status.replace("_", " ")}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Photo Approval Queue</h1>
                <p className="text-muted-foreground mt-1">
                    Review and approve member photographs
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>
                        {photos.length} photo{photos.length !== 1 ? "s" : ""} awaiting approval
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : photos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No pending photo approvals
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Capture Mode</TableHead>
                                    <TableHead>Submitted At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {photos.map((photo) => (
                                    <TableRow key={photo.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {photo.memberName || "Unknown"}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {photo.memberNumber}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{photo.purposeCode}</TableCell>
                                        <TableCell>{photo.captureMode}</TableCell>
                                        <TableCell>
                                            {photo.submittedAt
                                                ? new Date(photo.submittedAt).toLocaleDateString()
                                                : "-"}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(photo.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedPhoto(photo);
                                                        setIsViewDialogOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleApprove(photo.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedPhoto(photo);
                                                        setIsViewDialogOpen(true);
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* View Photo Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Photo</DialogTitle>
                        <DialogDescription>
                            Member: {selectedPhoto?.memberName} ({selectedPhoto?.memberNumber})
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPhoto && (
                        <div className="space-y-4">
                            {selectedPhoto.imageUrl ? (
                                <img
                                    src={selectedPhoto.imageUrl}
                                    alt="Member Photo"
                                    className="w-full rounded-lg border"
                                />
                            ) : (
                                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                                    Photo preview not available
                                </div>
                            )}
                            <div>
                                <Label>Rejection Reason (if rejecting)</Label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsViewDialogOpen(false);
                                        setRejectionReason("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (selectedPhoto) {
                                            handleReject(selectedPhoto.id);
                                        }
                                    }}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (selectedPhoto) {
                                            handleApprove(selectedPhoto.id);
                                            setIsViewDialogOpen(false);
                                        }
                                    }}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
