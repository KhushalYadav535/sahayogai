'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Lock } from 'lucide-react'
import { TrialBalance } from '@/lib/types/accounting'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const mockTrialBalance: TrialBalance[] = [
  {
    accountCode: '1101',
    accountName: 'Cash in Hand',
    openingDr: 200000,
    openingCr: 0,
    periodDr: 150000,
    periodCr: 0,
    closingDr: 350000,
    closingCr: 0,
  },
  {
    accountCode: '1102',
    accountName: 'Bank Accounts',
    openingDr: 800000,
    openingCr: 0,
    periodDr: 500000,
    periodCr: 0,
    closingDr: 1300000,
    closingCr: 0,
  },
  {
    accountCode: '2100',
    accountName: 'Members Deposits',
    openingDr: 0,
    openingCr: 1400000,
    periodDr: 0,
    periodCr: 300000,
    closingDr: 0,
    closingCr: 1700000,
  },
  {
    accountCode: '4100',
    accountName: 'Interest Income',
    openingDr: 0,
    openingCr: 300000,
    periodDr: 0,
    periodCr: 125600,
    closingDr: 0,
    closingCr: 425600,
  },
]

export default function TrialBalancePage() {
  const [fromDate, setFromDate] = useState('2025-01-01')
  const [toDate, setToDate] = useState('2025-03-01')
  const [isFrozen, setIsFrozen] = useState(false)

  const totalDr = mockTrialBalance.reduce((sum, tb) => sum + tb.closingDr, 0)
  const totalCr = mockTrialBalance.reduce((sum, tb) => sum + tb.closingCr, 0)
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-muted-foreground mt-1">
            Verify that debits equal credits before closing period
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">From Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">To Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full">Generate Report</Button>
          </div>
        </div>
      </Card>

      {/* Trial Balance Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Account Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Account Name</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Opening Dr</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Opening Cr</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Period Dr</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Period Cr</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Closing Dr</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Closing Cr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTrialBalance.map((tb) => (
                <tr key={tb.accountCode} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-sm">{tb.accountCode}</td>
                  <td className="px-4 py-3 text-sm">{tb.accountName}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(tb.openingDr)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(tb.openingCr)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(tb.periodDr)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(tb.periodCr)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(tb.closingDr)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(tb.closingCr)}</td>
                </tr>
              ))}
              <tr className={`bg-muted/50 font-bold ${isBalanced ? 'border-b-4 border-b-green-500' : 'border-b-4 border-b-red-500'}`}>
                <td colSpan={2} className="px-4 py-3">
                  TOTALS
                </td>
                <td className="px-4 py-3 text-right" />
                <td className="px-4 py-3 text-right" />
                <td className="px-4 py-3 text-right" />
                <td className="px-4 py-3 text-right" />
                <td className="px-4 py-3 text-right">{formatCurrency(totalDr)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(totalCr)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Balance Status */}
        <div className={`p-4 ${isBalanced ? 'bg-green-50 border-t-4 border-t-green-500' : 'bg-red-50 border-t-4 border-t-red-500'}`}>
          <p className={`font-semibold ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
            {isBalanced ? '✓ Trial Balance is Balanced' : '✗ Trial Balance is NOT Balanced'}
          </p>
          {!isBalanced && (
            <p className="text-sm text-red-700 mt-1">
              Difference: {formatCurrency(Math.abs(totalDr - totalCr))}
            </p>
          )}
        </div>
      </Card>

      {/* Freeze Period */}
      {isBalanced && (
        <Card className="p-6 bg-blue-50 border-l-4 border-l-blue-500">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Freeze Period
          </h3>
          <p className="text-sm text-foreground/80 mb-4">
            Once you freeze this period, no more journal entries can be posted to this period. This action is final.
          </p>
          <Button
            onClick={() => setIsFrozen(!isFrozen)}
            className={isFrozen ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {isFrozen ? 'Period is Frozen' : 'Freeze Period'}
          </Button>
        </Card>
      )}
    </div>
  )
}
