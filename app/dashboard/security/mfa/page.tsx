"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { securityApi } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Shield, CheckCircle, XCircle, Copy, Download } from "lucide-react";

export default function MFASetupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<{ mfaEnabled: boolean; mfaMethod: string | null; backupCodesRemaining: number } | null>(null);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[]; manualEntryKey: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await securityApi.mfa.status();
      if (res.success) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error("Failed to load MFA status:", err);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await securityApi.mfa.setup();
      if (res.success) {
        setSetupData(res.data);
        toast({ title: "MFA Setup", description: "Scan QR code or enter secret manually" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to setup MFA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      toast({ title: "Error", description: "Please enter verification code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await securityApi.mfa.verify({ code: verificationCode });
      if (res.success) {
        toast({ title: "Success", description: "MFA enabled successfully" });
        setSetupData(null);
        setVerificationCode("");
        loadStatus();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Invalid verification code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("Are you sure you want to disable MFA? This will reduce your account security.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await securityApi.mfa.disable();
      if (res.success) {
        toast({ title: "Success", description: "MFA disabled successfully" });
        loadStatus();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to disable MFA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.manualEntryKey);
      toast({ title: "Copied", description: "Secret copied to clipboard" });
    }
  };

  const downloadBackupCodes = () => {
    if (setupData) {
      const content = `Sahayog AI - MFA Backup Codes\n\nKeep these codes safe. Each code can only be used once.\n\n${setupData.backupCodes.join("\n")}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mfa-backup-codes.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Multi-Factor Authentication</h1>
        <p className="text-muted-foreground mt-2">Secure your account with TOTP-based two-factor authentication</p>
      </div>

      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MFA Status</p>
                {status.mfaEnabled ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled ({status.mfaMethod})
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
              {status.mfaEnabled && (
                <div>
                  <p className="text-sm text-muted-foreground">Backup Codes</p>
                  <p className="text-lg font-semibold">{status.backupCodesRemaining} remaining</p>
                </div>
              )}
            </div>

            {!status.mfaEnabled && (
              <Button onClick={handleSetup} disabled={loading} className="w-full">
                Setup MFA
              </Button>
            )}

            {status.mfaEnabled && (
              <Button onClick={handleDisable} disabled={loading} variant="destructive" className="w-full">
                Disable MFA
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <img src={setupData.qrCodeUrl} alt="QR Code" className="w-64 h-64 border rounded" />
            </div>

            <div className="space-y-2">
              <Label>Manual Entry Key</Label>
              <div className="flex gap-2">
                <Input value={setupData.manualEntryKey} readOnly className="font-mono" />
                <Button onClick={copySecret} variant="outline" size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use this if you cannot scan the QR code</p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Important:</strong> Save your backup codes securely. Each code can only be used once if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <Button onClick={downloadBackupCodes} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded">
                {setupData.backupCodes.map((code, idx) => (
                  <code key={idx} className="text-sm font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Enter Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-center text-2xl tracking-widest"
                />
                <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6}>
                  Verify & Enable
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
