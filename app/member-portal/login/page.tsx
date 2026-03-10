'use client'

import React, { useState, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setMemberToken } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Phone, Calendar, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

const labels = {
  EN: {
    title: 'Member Portal',
    subtitle: 'Access your cooperative account securely',
    phoneLabel: 'Registered Mobile Number',
    phonePlaceholder: '10-digit mobile number',
    dobLabel: 'Date of Birth',
    loginBtn: 'Login',
    loggingIn: 'Verifying…',
    phoneHint: 'Mobile number registered with your society',
    dobHint: 'As provided at the time of joining',
  },
  HI: {
    title: 'सदस्य पोर्टल',
    subtitle: 'अपना सहकारी खाता सुरक्षित रूप से एक्सेस करें',
    phoneLabel: 'पंजीकृत मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का नंबर',
    dobLabel: 'जन्म तिथि',
    loginBtn: 'लॉगिन करें',
    loggingIn: 'जाँच हो रहा है…',
    phoneHint: 'सोसायटी में दर्ज मोबाइल नंबर',
    dobHint: 'सदस्यता के समय दी गई जन्म तिथि',
  },
  MR: {
    title: 'सदस्य पोर्टल',
    subtitle: 'आपले सहकारी खाते सुरक्षितपणे एक्सेस करा',
    phoneLabel: 'नोंदणीकृत मोबाइल नंबर',
    phonePlaceholder: '10 अंकी नंबर',
    dobLabel: 'जन्मतारीख',
    loginBtn: 'लॉगिन करा',
    loggingIn: 'सत्यापन होत आहे…',
    phoneHint: 'सोसायटीमध्ये नोंदवलेला मोबाइल नंबर',
    dobHint: 'सभासदत्वाच्या वेळी दिलेली जन्मतारीख',
  },
}

function MemberLoginContent() {
  const { toast } = useToast()
  const [lang, setLang] = useState<'EN' | 'HI' | 'MR'>('EN')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const t = labels[lang]

  const canLogin = phone.length === 10 && dob.length === 10 && !loading

  const handleLogin = async () => {
    if (!canLogin) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/me/login-dob`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, dateOfBirth: dob }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ title: data.message || 'Login failed', variant: 'destructive' })
        return
      }
      setMemberToken(data.token)
      localStorage.setItem('sahayog_member_token', data.token)
      localStorage.setItem('sahayog_member', JSON.stringify(data.member))
      window.location.href = '/member-portal/home'
    } catch {
      toast({ title: 'Connection error. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      {/* Floating Blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-40 -right-20 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm space-y-5 relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse-glow relative">
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-secondary animate-float" />
            <span className="text-2xl font-bold text-primary-foreground tracking-tight">SA</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient-primary">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">{t.subtitle}</p>
        </motion.div>

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex gap-2 p-1 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50"
        >
          {(['EN', 'HI', 'MR'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${lang === l
                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {l === 'EN' ? 'English' : l === 'HI' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="glass p-6 shadow-2xl border-white/20 dark:border-white/10">
            <div className="space-y-5">

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {t.phoneLabel}
                </label>
                <div className="focus-glow rounded-lg">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && canLogin && handleLogin()}
                    className="text-xl text-center font-mono tracking-widest h-13 bg-background/50 border-border/50"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground ml-1">{t.phoneHint}</p>
                <AnimatePresence>
                  {phone.length > 0 && phone.length < 10 && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-amber-500 ml-1 font-medium"
                    >
                      {10 - phone.length} more digits needed
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                  </div>
                  {t.dobLabel}
                </label>
                <div className="focus-glow rounded-lg">
                  <Input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canLogin && handleLogin()}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-13 text-base bg-background/50 border-border/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground ml-1">{t.dobHint}</p>
              </div>

              {/* Login Button */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-13 text-base gap-2 shadow-lg shadow-primary/20"
                  onClick={handleLogin}
                  disabled={!canLogin}
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" />{t.loggingIn}</>
                    : <><ShieldCheck className="w-5 h-5" />{t.loginBtn}</>
                  }
                </Button>
              </motion.div>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Encrypted & Secure
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground"
        >
          Problems logging in? Contact your society manager.
        </motion.p>
      </motion.div>
    </div>
  )
}

export default function MemberPortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        <div className="w-full max-w-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-2xl w-20 mx-auto" />
            <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <MemberLoginContent />
    </Suspense>
  )
}
