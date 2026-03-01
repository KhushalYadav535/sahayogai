'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, DollarSign, FileText, Phone, Download, Eye, EyeOff } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export default function MemberPortalHomePage() {
  const [showBalances, setShowBalances] = React.useState(true)
  const memberName = 'Rajesh Kumar'
  const sbBalance = 125600
  const activeLoans = 2
  const loanAmount = 550000
  const deposits = 1
  const depositAmount = 500000
  const upcomingEMI = 12500
  const emiDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">नमस्ते, {memberName}</h1>
            <p className="text-muted-foreground">Member ID: #MEM001234</p>
          </div>
          <Button variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="max-w-3xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Savings Account</p>
              <h3 className="text-2xl font-bold">
                {showBalances ? formatCurrency(sbBalance, true) : '***'}
              </h3>
            </div>
            <Wallet className="w-8 h-8 opacity-80" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-amber-100 text-sm mb-1">Active Loans</p>
              <h3 className="text-2xl font-bold">{activeLoans}</h3>
              <p className="text-amber-100 text-sm mt-2">
                {showBalances ? formatCurrency(loanAmount, true) : '***'} total
              </p>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm mb-1">Deposits</p>
              <h3 className="text-2xl font-bold">{deposits}</h3>
              <p className="text-green-100 text-sm mt-2">
                {showBalances ? formatCurrency(depositAmount, true) : '***'} total
              </p>
            </div>
            <FileText className="w-8 h-8 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Upcoming EMI Alert */}
      {upcomingEMI > 0 && (
        <div className="max-w-3xl mx-auto mb-6 bg-amber-50 border-l-4 border-l-amber-500 p-4 rounded">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-amber-900">EMI Due Soon</p>
              <p className="text-sm text-amber-800">
                Next EMI of {formatCurrency(upcomingEMI)} is due on {formatDate(emiDueDate)}
              </p>
            </div>
            <Badge className="bg-amber-100 text-amber-800">5 days left</Badge>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="max-w-3xl mx-auto mb-6">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: 'Pay EMI', href: '#' },
            { icon: FileText, label: 'View Passbook', href: '#' },
            { icon: Download, label: 'New FDR', href: '#' },
            { icon: Phone, label: 'Support', href: '#' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <Button key={idx} variant="outline" className="h-auto py-3 flex-col gap-2">
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
        <Card className="divide-y">
          {[
            { date: '2025-03-01', desc: 'EMI Payment - Loan #LN001', amount: -12500, type: 'debit' },
            { date: '2025-02-28', desc: 'Interest Credited', amount: 450, type: 'credit' },
            { date: '2025-02-25', desc: 'Withdrawal', amount: -25000, type: 'debit' },
            { date: '2025-02-20', desc: 'Deposit Credit', amount: 50000, type: 'credit' },
            { date: '2025-02-15', desc: 'EMI Payment - Loan #LN002', amount: -8500, type: 'debit' },
          ].map((txn, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition">
              <div>
                <p className="font-medium text-sm">{txn.desc}</p>
                <p className="text-xs text-muted-foreground">{txn.date}</p>
              </div>
              <p className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'credit' ? '+' : ''}{formatCurrency(txn.amount, true)}
              </p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
