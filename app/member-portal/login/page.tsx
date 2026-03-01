'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Globe } from 'lucide-react'

export default function MemberPortalLoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [language, setLanguage] = useState('EN')
  const [timer, setTimer] = useState(0)

  const handleSendOTP = () => {
    if (phone.length === 10) {
      setStep('otp')
      setTimer(30)
    }
  }

  const handleVerifyOTP = () => {
    if (otp.length === 6) {
      window.location.href = '/member-portal/home'
    }
  }

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const labels: Record<string, Record<string, string>> = {
    EN: {
      title: 'Sahayog AI Member Portal',
      subtitle: 'Access your cooperative account',
      phone: 'Mobile Number',
      sendOTP: 'Send OTP',
      otp: 'Enter 6-digit OTP',
      verify: 'Verify OTP',
      resend: 'Resend OTP',
    },
    HI: {
      title: 'सहायोग ऐ सदस्य पोर्टल',
      subtitle: 'अपना सहकारी खाता एक्सेस करें',
      phone: 'मोबाइल नंबर',
      sendOTP: 'ओटीपी भेजें',
      otp: '6 अंकों का ओटीपी दर्ज करें',
      verify: 'ओटीपी सत्यापित करें',
      resend: 'ओटीपी फिर से भेजें',
    },
    MR: {
      title: 'सहायोग ऐ सदस्य पोर्टल',
      subtitle: 'आपले सहकारी खाते एक्सेस करा',
      phone: 'मोबाइल नंबर',
      sendOTP: 'ओटीपी पाठवा',
      otp: '6 अंकांचे ओटीपी प्रविष्ट करा',
      verify: 'ओटीपी सत्यापित करा',
      resend: 'ओटीपी पुन्हा पाठवा',
    },
  }

  const t = labels[language]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-foreground">SA</span>
          </div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Language Selector */}
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          {['EN', 'HI', 'MR'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition ${
                language === lang
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {lang === 'EN' ? 'English' : lang === 'HI' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>

        {/* Phone Step */}
        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t.phone}</label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 10))}
                maxLength={10}
                className="text-lg text-center"
              />
            </div>
            <Button
              onClick={handleSendOTP}
              disabled={phone.length !== 10}
              className="w-full"
            >
              {t.sendOTP}
            </Button>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t.otp}</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <Input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={otp[idx] || ''}
                    onChange={(e) => {
                      const newOtp = otp.split('')
                      newOtp[idx] = e.target.value
                      setOtp(newOtp.join(''))
                    }}
                    className="w-12 h-12 text-center text-xl font-bold"
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6}
              className="w-full"
            >
              {t.verify}
            </Button>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Resend in {timer}s
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('phone')
                    setPhone('')
                    setOtp('')
                  }}
                  className="text-xs"
                >
                  {t.resend}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Secure & Encrypted Connection
        </p>
      </Card>
    </div>
  )
}
