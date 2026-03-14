'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, DollarSign, FileText, Phone, Download, Eye, EyeOff, Loader2, Calendar, ArrowRight, TrendingUp, Sparkles, Bell, ChevronDown, Calculator } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { meApi } from '@/lib/api'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { ChatWidget } from '@/components/ai/chat-widget'
import { MemberPortalNav } from '@/components/member-portal-nav'
import { motion, AnimatePresence } from 'framer-motion'

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function MemberPortalHomePage() {
  const { toast } = useToast()
  const [showBalances, setShowBalances] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showSavings, setShowSavings] = useState(false)
  const [showLoans, setShowLoans] = useState(false)
  const [showDeposits, setShowDeposits] = useState(false)
  const [deposits, setDeposits] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
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

    meApi.deposits()
      .then(res => {
        if (res.success && res.deposits) {
          setDeposits(res.deposits)
        }
      })
      .catch(() => { })

    meApi.loans()
      .then(res => {
        if (res.success && res.loans) {
          setLoans(res.loans)
        }
      })
      .catch(() => { })

    // Load transactions for savings card
    meApi.accounts()
      .then(async (res) => {
        if (res.success && res.accounts?.length) {
          try {
            const passbookRes = await meApi.passbook(res.accounts[0].id)
            if (passbookRes.success && passbookRes.transactions) {
              setTransactions(passbookRes.transactions.slice(0, 10).map((t: any) => ({
                id: t.id,
                date: t.processedAt,
                narration: t.remarks || t.category || 'Transaction',
                type: t.type,
                amount: Number(t.amount),
              })))
            }
          } catch { }
        }
      })
      .catch(() => { })
  }, [toast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const memberName = member ? `${member.firstName} ${member.lastName}` : 'Member'
  const memberInitials = member ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase() : 'M'
  const greeting = new Date().getHours() < 12 ? 'सुप्रभात' : new Date().getHours() < 17 ? 'नमस्ते' : 'शुभ संध्या'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      {/* Decorative bg blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 pt-8 pb-10 px-4"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg ring-2 ring-white/20">
                    {memberInitials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-primary flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">{greeting} 👋</p>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{memberName}</h1>
                  <p className="text-white/50 font-mono text-xs mt-0.5">{member?.memberNumber || 'SAHYOG MEMBER'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setShowBalances(!showBalances)}
                >
                  {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
                  onClick={() => { localStorage.clear(); window.location.href = '/member-portal/login' }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Balance Cards */}
      <div className="max-w-3xl mx-auto px-4 mt-4 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {/* SB Balance - Clickable */}
          <motion.div variants={fadeUp}>
            <Card
              className="glass hover-lift p-5 relative overflow-hidden group cursor-pointer border-white/30 dark:border-white/10 shadow-xl"
              onClick={() => setShowSavings(!showSavings)}
            >
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">Savings</Badge>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showSavings ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Available Balance</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {showBalances ? formatCurrency(summary.sbBalance, true) : '••••••'}
                </h3>
              </div>
            </Card>
          </motion.div>

          {/* Loans - Clickable */}
          <motion.div variants={fadeUp}>
            <Card
              className="glass hover-lift p-5 relative overflow-hidden group cursor-pointer border-white/30 dark:border-white/10 shadow-xl"
              onClick={() => setShowLoans(!showLoans)}
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">{summary.activeLoansCount} Active</Badge>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showLoans ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Loan Outstanding</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {showBalances ? formatCurrency(summary.totalLoanOutstanding, true) : '••••••'}
                </h3>
              </div>
            </Card>
          </motion.div>

          {/* Deposits - Clickable to expand */}
          <motion.div variants={fadeUp}>
            <Card
              className="glass hover-lift p-5 relative overflow-hidden group cursor-pointer border-white/30 dark:border-white/10 shadow-xl"
              onClick={() => setShowDeposits(!showDeposits)}
            >
              <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">{summary.depositsCount} Active</Badge>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showDeposits ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Deposits</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {showBalances ? formatCurrency(summary.totalDepositAmount, true) : '••••••'}
                </h3>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Savings Transaction Table - Expands below cards */}
        <AnimatePresence>
          {showSavings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <Card className="glass border-white/20 dark:border-white/10 shadow-lg mt-3 overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-blue-50/50 dark:bg-blue-950/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-500/50 rounded-full" />
                    Recent Transactions
                  </h3>
                  <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary text-xs">
                    <Link href="/portal/account">View All →</Link>
                  </Button>
                </div>
                {transactions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No recent transactions</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Narration</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((txn: any) => (
                          <TableRow key={txn.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="text-sm">{formatDate(new Date(txn.date))}</TableCell>
                            <TableCell className="text-sm font-medium">{txn.narration}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] shadow-sm ${txn.type === 'credit' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                {txn.type === 'credit' ? 'CR' : 'DR'}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-sm text-right font-semibold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                              {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount, true)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loans Details Table - Expands below cards */}
        <AnimatePresence>
          {showLoans && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <Card className="glass border-white/20 dark:border-white/10 shadow-lg mt-3 overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-amber-50/50 dark:bg-amber-950/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-500/50 rounded-full" />
                    Loan Details
                  </h3>
                  <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary text-xs">
                    <Link href="/portal/loans">View All →</Link>
                  </Button>
                </div>
                {loans.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No active loans</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="text-xs">Loan #</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs text-right">Principal</TableHead>
                          <TableHead className="text-xs text-right">Outstanding</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loans.map((loan: any) => (
                          <TableRow key={loan.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => window.location.href = `/member-portal/loans/${loan.id}`}>
                            <TableCell className="text-sm font-mono font-medium">{loan.loanNumber || loan.id.slice(0, 8).toUpperCase()}</TableCell>
                            <TableCell className="text-sm">{loan.loanType || 'Loan'}</TableCell>
                            <TableCell className="text-sm text-right font-semibold">{formatCurrency(Number(loan.principalAmount || loan.disbursedAmount || 0), true)}</TableCell>
                            <TableCell className="text-sm text-right font-semibold text-primary">{formatCurrency(Number(loan.outstandingPrincipal || 0), true)}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] shadow-sm ${loan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                {loan.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deposit Details Table - Expands below cards */}
        <AnimatePresence>
          {showDeposits && deposits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <Card className="glass border-white/20 dark:border-white/10 shadow-lg mt-3 overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-emerald-50/50 dark:bg-emerald-950/10">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-emerald-500/50 rounded-full" />
                    Deposit Details
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs text-right">Rate</TableHead>
                        <TableHead className="text-xs text-right">Maturity Amt</TableHead>
                        <TableHead className="text-xs">Maturity Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((dep: any) => (
                        <TableRow key={dep.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="text-sm font-medium">
                            {dep.depositType === 'fdr' || dep.depositType === 'fd' ? 'Fixed Deposit' : dep.depositType === 'rd' ? 'Recurring' : dep.depositType || 'Deposit'}
                          </TableCell>
                          <TableCell className="text-sm text-right font-semibold">
                            {formatCurrency(Number(dep.amount || 0), true)}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {dep.interestRate}%
                          </TableCell>
                          <TableCell className="text-sm text-right font-semibold text-emerald-600">
                            {formatCurrency(Number(dep.maturityAmount || 0), true)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {dep.maturityDate ? formatDate(new Date(dep.maturityDate)) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] shadow-sm">
                              {dep.status || 'Active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {showDeposits && deposits.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-white/20 dark:border-white/10 mt-3 p-6 text-center">
              <p className="text-muted-foreground text-sm">No deposit details available</p>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Upcoming EMI Alert */}
      {summary.upcomingEMI > 0 && summary.emiDueDate && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto px-4 mt-6"
        >
          <div className="glass border-l-4 border-l-amber-500 p-4 rounded-xl shadow-lg border-white/20 dark:border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  EMI Due Soon
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 ml-9">
                  Next EMI of <strong className="text-foreground">{formatCurrency(summary.upcomingEMI)}</strong> is due on <strong className="text-foreground">{formatDate(summary.emiDueDate)}</strong>
                </p>
              </div>
              {new Date(summary.emiDueDate) > new Date() ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 animate-pulse">
                  {Math.ceil((new Date(summary.emiDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </Badge>
              ) : (
                <Badge variant="destructive" className="animate-pulse">OVERDUE</Badge>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto px-4 mt-8"
      >
        <h2 className="text-lg font-bold mb-4 px-1 text-foreground flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: 'Pay EMI / Transfer', href: '/portal/pay', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20' },
            { icon: FileText, label: 'Passbook & Txns', href: '/portal/account', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { icon: DollarSign, label: 'My Loans', href: '/portal/loans', color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/20' },
            { icon: Phone, label: 'Society Support', href: '/member-portal/grievance', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/20' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <motion.div key={idx} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                <Link href={action.href}>
                  <Card className="glass hover-lift h-24 flex flex-col items-center justify-center gap-2.5 cursor-pointer border-white/20 dark:border-white/10 group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 text-center leading-tight">{action.label}</span>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* More Features */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-3xl mx-auto px-4 mt-8"
      >
        <h2 className="text-lg font-bold mb-4 px-1 text-foreground flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-accent to-accent/50 rounded-full" />
          More Features
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Calculator, label: 'EMI Calculator', href: '/member-portal/emi-calculator', color: 'from-blue-500 to-blue-600' },
            { icon: TrendingUp, label: 'FDR Simulator', href: '/member-portal/fdr-simulator', color: 'from-purple-500 to-purple-600' },
            { icon: Calendar, label: 'FDR Maturity', href: '/member-portal/deposits/maturity', color: 'from-teal-500 to-teal-600' },
            { icon: FileText, label: 'Share Certificate', href: '/member-portal/shares/certificate', color: 'from-indigo-500 to-indigo-600' },
            { icon: Bell, label: 'Notifications', href: '/member-portal/notifications', color: 'from-rose-500 to-rose-600' },
            { icon: Phone, label: 'Grievance', href: '/member-portal/grievance', color: 'from-slate-500 to-slate-600' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <motion.div key={idx} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                <Link href={action.href}>
                  <Card className="glass hover-lift h-24 flex flex-col items-center justify-center gap-2.5 cursor-pointer border-white/20 dark:border-white/10 group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 text-center leading-tight">{action.label}</span>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-3xl mx-auto px-4 mt-8"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-secondary to-secondary/50 rounded-full" />
            Recent Transactions
          </h2>
          <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary">
            <Link href="/portal/account" className="flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>

        <Card className="glass overflow-hidden border-white/20 dark:border-white/10 shadow-lg">
          {summary.recentTxns.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <FileText className="w-7 h-7 opacity-20" />
              </div>
              <p className="font-medium">No recent transactions</p>
              <p className="text-xs mt-1">Your latest transactions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {summary.recentTxns.map((txn, idx) => (
                <motion.div
                  key={txn.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                      }`}>
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
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Bottom Nav */}
      <MemberPortalNav />

      {/* Sahayog Saathi Chat Widget */}
      <ChatWidget />
    </div>
  )
}
