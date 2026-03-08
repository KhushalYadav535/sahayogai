"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { securityApi } from "@/lib/api";
import { Permission, UserRole } from "@/lib/types/auth";
import { useAuth } from "@/components/providers/auth-provider";
import { CheckSquare, Save } from "lucide-react";

const ALL_PERMISSIONS: { category: string; permissions: Permission[] }[] = [
  {
    category: "Member Management",
    permissions: [Permission.MEMBER_VIEW, Permission.MEMBER_CREATE, Permission.MEMBER_EDIT, Permission.MEMBER_KYC, Permission.MEMBER_DELETE],
  },
  {
    category: "Loans",
    permissions: [Permission.LOAN_VIEW, Permission.LOAN_CREATE, Permission.LOAN_APPROVE, Permission.LOAN_DISBURSE, Permission.LOAN_REPAY],
  },
  {
    category: "Savings & Deposits",
    permissions: [Permission.ACCOUNT_VIEW, Permission.ACCOUNT_CREATE, Permission.ACCOUNT_DEPOSIT, Permission.ACCOUNT_WITHDRAW, Permission.DEPOSIT_VIEW, Permission.DEPOSIT_CREATE],
  },
  {
    category: "Financial Accounting",
    permissions: [Permission.GL_VIEW, Permission.GL_ENTRY_CREATE, Permission.GL_ENTRY_APPROVE],
  },
  {
    category: "Governance",
    permissions: [Permission.GOVERNANCE_VIEW, Permission.GOVERNANCE_EDIT, Permission.AGM_MANAGE],
  },
  {
    category: "Compliance",
    permissions: [Permission.COMPLIANCE_VIEW, Permission.COMPLIANCE_EDIT, Permission.STR_GENERATE],
  },
  {
    category: "Reports",
    permissions: [Permission.REPORT_VIEW, Permission.REPORT_EXPORT],
  },
  {
    category: "System",
    permissions: [Permission.USER_MANAGE, Permission.TENANT_MANAGE, Permission.CONFIG_MANAGE],
  },
];

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

export default function PermissionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [matrices, setMatrices] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const res = await securityApi.permissions.list();
      if (res.success) {
        setMatrices(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
      // If API fails, still show available roles so user can create permission matrices
      setMatrices([]);
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    const matrix = matrices.find((m) => m.role === role);
    setSelectedPermissions(matrix?.permissions || []);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) => (prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]));
  };

  const handleSave = async () => {
    if (!selectedRole) {
      toast({ title: "Error", description: "Please select a role", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await securityApi.permissions.update({
        role: selectedRole,
        permissions: selectedPermissions,
      });
      if (res.success) {
        toast({ title: "Success", description: "Permissions updated successfully" });
        loadPermissions();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update permissions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Filter roles based on user context
  // Tenant admin should only see tenant-level roles, not platform-level roles
  const isPlatformAdmin = user?.role === UserRole.PLATFORM_ADMIN || user?.role === "superadmin";
  const isTenantAdmin = user?.role === UserRole.SOCIETY_ADMIN || user?.role === "admin";
  
  let availableRoles = Object.keys(ROLE_NAMES);
  
  // If user is tenant admin, filter out platform-level roles
  if (isTenantAdmin && !isPlatformAdmin) {
    // Remove platform admin and society admin (current user is already society admin)
    availableRoles = availableRoles.filter(
      role => role !== "superadmin" && role !== "admin"
    );
  }
  
  const roles = availableRoles;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role-Based Access Control</h1>
        <p className="text-muted-foreground mt-2">Configure permissions for each role</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Select a role to configure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles available</p>
            ) : (
              roles.map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleRoleSelect(role)}
                >
                  {ROLE_NAMES[role] || role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")}
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Permissions for {selectedRole ? ROLE_NAMES[selectedRole] || selectedRole : "Select Role"}</span>
              {selectedRole && (
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </CardTitle>
            <CardDescription>Select permissions to grant to this role</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <div className="space-y-6">
                {ALL_PERMISSIONS.map((category) => (
                  <div key={category.category} className="space-y-3">
                    <h3 className="font-semibold text-lg">{category.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <Label htmlFor={permission} className="text-sm cursor-pointer">
                            {permission.replace(":", " ").replace(/_/g, " ")}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a role from the left to configure permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
