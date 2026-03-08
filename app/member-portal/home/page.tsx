'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, DollarSign, FileText, Phone, Download, Eye, EyeOff, Loader2, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { meApi } from '@/lib/api'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { ChatWidget } from '@/components/ai/chat-widget'

export default function MemberPortalHomePage() {
  const { toast } = useToast()
  const [showBalances, setShowBalances] = useState(true)
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<{ id: string; firstName: string; lastName: string; memberNumber: string } | null>(null)

  const [summary, setSummary] = useState({
    sbBalance: 0,
    activeLoansCount: 0,
    totalLoanOutstanding: 0,
    depositsCount: 0,
    totalDepositAmount: 0,
    upcomingEMI: 0,
    emiDueDate: null as string | null,
    recentTxns: [] as any[],
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sahayog_member')
        if (stored) setMember(JSON.parse(stored))
      }
    } catch { }

    meApi.summary()
      .then(res => {
        if (res.success && res.summary) {
          setSummary(res.summary)
        }
      })
      .catch((err) => {
        console.error("Failed to load summary", err)
        toast({ title: "Error loading dashboard", description: "Showing limited offline data.", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const memberName = member ? `${member.firstName} ${member.lastName}` : 'Member'
  const memberInitials = member ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase() : 'M'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4 pb-20 pt-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-md">
              {memberInitials}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">नमस्ते, {memberName}</h1>
              <p className="text-muted-foreground font-mono text-sm mt-1">{member?.memberNumber || 'SAHYOG MEMBER'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { localStorage.clear(); window.location.href = '/member-portal/login' }}>
            Logout
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="max-w-3xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* SB Balance */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <p className="text-blue-100 text-sm mb-1 font-medium">Savings Account</p>
              <h3 className="text-3xl font-bold">
                {showBalances ? formatCurrency(summary.sbBalance, true) : '••••••'}
              </h3>
            </div>
            <Wallet className="w-8 h-8 opacity-80" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0 transition-all font-medium"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showBalances ? 'Hide Balance' : 'Show Balance'}
          </Button>
        </Card>

        {/* Loans */}
        <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-2 relative z-10">
            <div>
              <p className="text-amber-100 text-sm mb-1 font-medium">Active Loans</p>
              <h3 className="text-3xl font-bold">{summary.activeLoansCount}</h3>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 relative z-10">
            <p className="text-amber-100 text-xs">Total Outstanding</p>
            <p className="text-lg font-bold">
              {showBalances ? formatCurrency(summary.totalLoanOutstanding, true) : '••••••'}
            </p>
          </div>
        </Card>

        {/* Deposits */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-2 relative z-10">
            <div>
              <p className="text-emerald-100 text-sm mb-1 font-medium">Active Deposits</p>
              <h3 className="text-3xl font-bold">{summary.depositsCount}</h3>
            </div>
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 relative z-10">
            <p className="text-emerald-100 text-xs">Total Amount</p>
            <p className="text-lg font-bold">
              {showBalances ? formatCurrency(summary.totalDepositAmount, true) : '••••••'}
            </p>
          </div>
        </Card>
      </div>

      {/* Upcoming EMI Alert */}
      {summary.upcomingEMI > 0 && summary.emiDueDate && (
        <div className="max-w-3xl mx-auto mb-8 bg-amber-50/80 backdrop-blur-sm border-l-4 border-l-amber-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-amber-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> EMI Due Soon
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Next EMI of <strong>{formatCurrency(summary.upcomingEMI)}</strong> is due on <strong>{formatDate(summary.emiDueDate)}</strong>
              </p>
            </div>
            {new Date(summary.emiDueDate) > new Date() ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {Math.ceil((new Date(summary.emiDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
              </Badge>
            ) : (
              <Badge variant="destructive">OVERDUE</Badge>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="max-w-3xl mx-auto mb-8">
        <h2 className="text-lg font-semibold mb-3 px-1 text-foreground/80">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: 'Pay EMI / Transfer', href: '/portal/pay' },
            { icon: FileText, label: 'Passbook & Txns', href: '/portal/account' },
            { icon: DollarSign, label: 'My Loans', href: '/portal/loans' },
            { icon: Phone, label: 'Society Support', href: '/member-portal/grievance' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <Button key={idx} variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-accent/50 hover:border-primary/50 transition-all shadow-sm" asChild>
                <Link href={action.href}>
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Additional Features */}
      <div className="max-w-3xl mx-auto mb-8">
        <h2 className="text-lg font-semibold mb-3 px-1 text-foreground/80">More Features</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: 'FDR Maturity', href: '/member-portal/deposits/maturity' },
            { icon: FileText, label: 'Share Certificate', href: '/member-portal/shares/certificate' },
            { icon: Phone, label: 'Notifications', href: '/member-portal/notifications' },
            { icon: FileText, label: 'Grievance', href: '/member-portal/grievance' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <Button key={idx} variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-accent/50 hover:border-primary/50 transition-all shadow-sm" asChild>
                <Link href={action.href}>
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-semibold text-foreground/80">Recent Transactions</h2>
          <Button variant="link" size="sm" asChild className="h-auto p-0"><Link href="/portal/account">View All</Link></Button>
        </div>

        <Card className="overflow-hidden shadow-sm border-border/50">
          {summary.recentTxns.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
              <FileText className="w-8 h-8 mb-2 opacity-20" />
              No recent transactions found
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {summary.recentTxns.map((txn, idx) => (
                <div key={txn.id || idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                      {txn.type === 'credit' ? <Download className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{txn.desc}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(txn.date)}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-base ${txn.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount, true)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Sahayog Saathi Chat Widget */}
      <ChatWidget />
    </div>
  )
}

