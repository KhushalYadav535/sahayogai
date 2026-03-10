'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, CheckCircle, Loader2, AlertCircle, MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

export default function GrievancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.subject || !formData.description) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await meApi.submitGrievance(formData);
      if (res.success) {
        setSubmitted(true);
        toast({ title: "Success", description: res.message || "Grievance submitted successfully" });
        setTimeout(() => {
          router.push('/member-portal/home');
        }, 3000);
      }
    } catch (err: any) {
      console.error("Failed to submit grievance", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit grievance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-accent/5" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <Card className="glass max-w-md w-full border-white/20 dark:border-white/10 shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  className="relative"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-secondary animate-float" style={{ left: 'calc(50% + 20px)' }} />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Grievance Submitted!</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your grievance has been submitted successfully. Our team will review it and get back to you soon.
                  </p>
                </div>
                <Button onClick={() => router.push('/member-portal/home')} className="w-full h-12 shadow-lg shadow-primary/20">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-2xl mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted/50 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Submit Grievance</h1>
            <p className="text-muted-foreground text-sm mt-0.5">We're here to help resolve your concerns</p>
          </div>
        </motion.div>

        {/* Info Alert */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Alert className="glass border-white/20 dark:border-white/10 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
            <AlertDescription className="text-sm">
              Please provide detailed information about your grievance. Our team will review and respond within 2-3 business days.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-white/20 dark:border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                Grievance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-semibold">Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger id="category" className="h-12 bg-background/50 border-border/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account Related</SelectItem>
                      <SelectItem value="loan">Loan Related</SelectItem>
                      <SelectItem value="deposit">Deposit Related</SelectItem>
                      <SelectItem value="service">Service Issue</SelectItem>
                      <SelectItem value="billing">Billing/Charges</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="font-semibold">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger id="priority" className="h-12 bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-semibold">Subject *</Label>
                  <div className="focus-glow rounded-lg">
                    <Input
                      id="subject"
                      placeholder="Brief description of your grievance"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="h-12 bg-background/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold">Description *</Label>
                  <div className="focus-glow rounded-lg">
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your grievance..."
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      minLength={10}
                      className="bg-background/50 border-border/50 resize-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 10 characters required</p>
                </div>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full h-13 text-base shadow-lg shadow-primary/20" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Grievance
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <MemberPortalNav />
    </div>
  );
}
