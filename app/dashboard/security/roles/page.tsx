"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { securityApi, usersApi } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@/lib/types/auth";
import { Users, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ROLE_NAMES: Record<string, string> = {
  superadmin: "Platform Admin",
  admin: "Society Admin",
  president: "President",
  secretary: "Secretary",
  accountant: "Accountant",
  senior_accountant: "Senior Accountant",
  loan_officer: "Loan Officer",
  compliance_officer: "Compliance Officer",
  auditor: "Auditor",
  member: "Member",
  staff: "Staff",
};

export default function RolesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, assignmentsRes] = await Promise.all([usersApi.list(), securityApi.roles.assignments()]);
      if (usersRes.success) setUsers(usersRes.users);
      if (assignmentsRes.success) setAssignments(assignmentsRes.data);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({ title: "Error", description: "Please select user and role", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await securityApi.roles.assign({
        userId: selectedUserId,
        role: selectedRole,
        reason: reason || undefined,
      });
      if (res.success) {
        toast({ title: "Success", description: "Role assigned successfully" });
        setOpenDialog(false);
        setSelectedUserId("");
        setSelectedRole("");
        setReason("");
        loadData();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to assign role", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Assignments</h1>
          <p className="text-muted-foreground mt-2">Manage user roles and track assignment history</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
              <DialogDescription>Assign a role to a user. This action will be logged.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Filter roles based on user context
                      const isPlatformAdmin = user?.role === UserRole.PLATFORM_ADMIN || user?.role === "superadmin";
                      const isTenantAdmin = user?.role === UserRole.SOCIETY_ADMIN || user?.role === "admin";
                      
                      let availableRoles = Object.entries(ROLE_NAMES);
                      
                      // If user is tenant admin, filter out platform-level roles
                      if (isTenantAdmin && !isPlatformAdmin) {
                        availableRoles = availableRoles.filter(
                          ([role]) => role !== "superadmin" && role !== "admin"
                        );
                      }
                      
                      return availableRoles.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for role assignment" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={loading}>
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assignment History
          </CardTitle>
          <CardDescription>Recent role assignment changes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.user?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">{ROLE_NAMES[assignment.assignedRole] || assignment.assignedRole}</span>
                    </TableCell>
                    <TableCell>{assignment.assigner?.name || "Unknown"}</TableCell>
                    <TableCell>{assignment.reason || "-"}</TableCell>
                    <TableCell>{new Date(assignment.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
