'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, CheckCircle, Loader2, MessageSquare, Mail, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    sms: { emiReminders: true, depositMaturity: true, transactionAlerts: true, generalUpdates: false },
    email: { emiReminders: true, depositMaturity: true, transactionAlerts: false, generalUpdates: true },
    push: { emiReminders: true, depositMaturity: true, transactionAlerts: true, generalUpdates: true },
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
      toast({ title: "Error", description: err.message || "Failed to save preferences. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading preferences...</p>
        </div>
      </div>
    );
  }

  const notifOptions = [
    { key: 'emiReminders' as const, label: 'EMI Reminders', desc: 'Get reminders before EMI due dates' },
    { key: 'depositMaturity' as const, label: 'Deposit Maturity', desc: 'Alerts for upcoming deposit maturities' },
    { key: 'transactionAlerts' as const, label: 'Transaction Alerts', desc: 'Alerts for account transactions' },
    { key: 'generalUpdates' as const, label: 'General Updates', desc: 'Society announcements and updates' },
  ];

  const sections = [
    { channel: 'sms' as const, title: 'SMS Notifications', desc: 'Receive notifications via SMS', Icon: Smartphone, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { channel: 'email' as const, title: 'Email Notifications', desc: 'Receive notifications via Email', Icon: Mail, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
    { channel: 'push' as const, title: 'Push Notifications', desc: 'Receive push notifications in the app', Icon: Bell, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted/50 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Notification Preferences</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage how you receive notifications</p>
          </div>
        </motion.div>

        {/* Notification Cards */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
          {sections.map(({ channel, title, desc, Icon, color, shadow }) => (
            <motion.div key={channel} variants={fadeUp}>
              <Card className="glass border-white/20 dark:border-white/10 shadow-lg overflow-hidden hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${shadow}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-bold">{title}</p>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">{desc}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 -mt-2">
                  {notifOptions.map(({ key, label, desc: optDesc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/20 transition-colors">
                      <div className="space-y-0.5">
                        <Label htmlFor={`${channel}-${key}`} className="font-semibold text-sm cursor-pointer">{label}</Label>
                        <p className="text-xs text-muted-foreground">{optDesc}</p>
                      </div>
                      <Switch
                        id={`${channel}-${key}`}
                        checked={preferences[channel][key]}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            [channel]: { ...preferences[channel], [key]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-4"
        >
          <Button variant="outline" onClick={() => router.back()} className="h-12 px-6">
            Cancel
          </Button>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSave} disabled={saving} className="h-12 px-8 shadow-lg shadow-primary/20">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Save Preferences</>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <MemberPortalNav />
    </div>
  );
}
