"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, Lock, CheckSquare, Users, FileText } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & RBAC</h1>
        <p className="text-muted-foreground mt-2">Manage security settings, access control, and compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Multi-Factor Authentication
            </CardTitle>
            <CardDescription>Setup TOTP-based two-factor authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/security/mfa">
              <Button className="w-full">Manage MFA</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Permissions
            </CardTitle>
            <CardDescription>Configure role-based access control permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/security/permissions">
              <Button className="w-full">Manage Permissions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Role Assignments
            </CardTitle>
            <CardDescription>Assign roles to users and track changes</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/security/roles">
              <Button className="w-full">Manage Roles</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              DPDP Compliance
            </CardTitle>
            <CardDescription>Manage data principal rights requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/security/dpdp">
              <Button className="w-full">View Requests</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
