'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    sms: {
      emiReminders: true,
      depositMaturity: true,
      transactionAlerts: true,
      generalUpdates: false,
    },
    email: {
      emiReminders: true,
      depositMaturity: true,
      transactionAlerts: false,
      generalUpdates: true,
    },
    push: {
      emiReminders: true,
      depositMaturity: true,
      transactionAlerts: true,
      generalUpdates: true,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await meApi.getNotificationPreferences();
      if (res.success && res.preferences) {
        setPreferences(res.preferences);
      }
    } catch (err) {
      console.error("Failed to load preferences", err);
      toast({ title: "Error", description: "Failed to load notification preferences", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await meApi.updateNotificationPreferences(preferences);
      if (res.success) {
        toast({ title: "Success", description: res.message || "Notification preferences updated successfully" });
      }
    } catch (err: any) {
      console.error("Failed to save preferences", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4 pb-20 pt-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Notification Preferences</h1>
            <p className="text-muted-foreground text-sm">Manage how you receive notifications</p>
          </div>
        </div>

        {/* SMS Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>Receive notifications via SMS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-emi">EMI Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminders before EMI due dates</p>
              </div>
              <Switch
                id="sms-emi"
                checked={preferences.sms.emiReminders}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    sms: { ...preferences.sms, emiReminders: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-deposit">Deposit Maturity</Label>
                <p className="text-xs text-muted-foreground">Alerts for upcoming deposit maturities</p>
              </div>
              <Switch
                id="sms-deposit"
                checked={preferences.sms.depositMaturity}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    sms: { ...preferences.sms, depositMaturity: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-transaction">Transaction Alerts</Label>
                <p className="text-xs text-muted-foreground">Alerts for account transactions</p>
              </div>
              <Switch
                id="sms-transaction"
                checked={preferences.sms.transactionAlerts}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    sms: { ...preferences.sms, transactionAlerts: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-general">General Updates</Label>
                <p className="text-xs text-muted-foreground">Society announcements and updates</p>
              </div>
              <Switch
                id="sms-general"
                checked={preferences.sms.generalUpdates}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    sms: { ...preferences.sms, generalUpdates: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>Receive notifications via Email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-emi">EMI Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminders before EMI due dates</p>
              </div>
              <Switch
                id="email-emi"
                checked={preferences.email.emiReminders}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    email: { ...preferences.email, emiReminders: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-deposit">Deposit Maturity</Label>
                <p className="text-xs text-muted-foreground">Alerts for upcoming deposit maturities</p>
              </div>
              <Switch
                id="email-deposit"
                checked={preferences.email.depositMaturity}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    email: { ...preferences.email, depositMaturity: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-transaction">Transaction Alerts</Label>
                <p className="text-xs text-muted-foreground">Alerts for account transactions</p>
              </div>
              <Switch
                id="email-transaction"
                checked={preferences.email.transactionAlerts}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    email: { ...preferences.email, transactionAlerts: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-general">General Updates</Label>
                <p className="text-xs text-muted-foreground">Society announcements and updates</p>
              </div>
              <Switch
                id="email-general"
                checked={preferences.email.generalUpdates}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    email: { ...preferences.email, generalUpdates: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>Receive push notifications in the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-emi">EMI Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminders before EMI due dates</p>
              </div>
              <Switch
                id="push-emi"
                checked={preferences.push.emiReminders}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    push: { ...preferences.push, emiReminders: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-deposit">Deposit Maturity</Label>
                <p className="text-xs text-muted-foreground">Alerts for upcoming deposit maturities</p>
              </div>
              <Switch
                id="push-deposit"
                checked={preferences.push.depositMaturity}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    push: { ...preferences.push, depositMaturity: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-transaction">Transaction Alerts</Label>
                <p className="text-xs text-muted-foreground">Alerts for account transactions</p>
              </div>
              <Switch
                id="push-transaction"
                checked={preferences.push.transactionAlerts}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    push: { ...preferences.push, transactionAlerts: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-general">General Updates</Label>
                <p className="text-xs text-muted-foreground">Society announcements and updates</p>
              </div>
              <Switch
                id="push-general"
                checked={preferences.push.generalUpdates}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    push: { ...preferences.push, generalUpdates: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
