'use client'

import React, { useState, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setMemberToken } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Phone, Calendar, Loader2, ShieldCheck } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

const labels = {
  EN: {
    title: 'Member Portal',
    subtitle: 'Access your cooperative account',
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
    subtitle: 'अपना सहकारी खाता एक्सेस करें',
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
    subtitle: 'आपले सहकारी खाते एक्सेस करा',
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">SA</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Language Selector */}
        <div className="flex gap-2">
          {(['EN', 'HI', 'MR'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${lang === l
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              {l === 'EN' ? 'English' : l === 'HI' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>

        {/* Login Card */}
        <Card className="p-6 shadow-lg border border-border/50">
          <div className="space-y-5">

            {/* Mobile Number */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                {t.phoneLabel}
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && canLogin && handleLogin()}
                className="text-xl text-center font-mono tracking-widest h-12"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">{t.phoneHint}</p>
              {phone.length > 0 && phone.length < 10 && (
                <p className="text-xs text-amber-500 mt-0.5">{10 - phone.length} more digits needed</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {t.dobLabel}
              </label>
              <Input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canLogin && handleLogin()}
                max={new Date().toISOString().split('T')[0]}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">{t.dobHint}</p>
            </div>

            {/* Login Button */}
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleLogin}
              disabled={!canLogin}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />{t.loggingIn}</>
                : <><ShieldCheck className="w-4 h-4" />{t.loginBtn}</>
              }
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              🔒 Encrypted & Secure
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Problems logging in? Contact your society manager.
        </p>
      </div>
    </div>
  )
}

export default function MemberPortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        <div className="w-full max-w-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-2xl w-16 mx-auto" />
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
