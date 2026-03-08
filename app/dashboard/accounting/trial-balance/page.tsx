'use client'

import React, { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Lock } from 'lucide-react'
import { TrialBalance } from '@/lib/types/accounting'
import { formatCurrency } from '@/lib/utils/formatters'
import { glApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

function mapGlRows(rows: any[]): TrialBalance[] {
  return (rows || []).map(r => ({
    accountCode: r.glCode,
    accountName: r.glName,
    openingDr: 0,
    openingCr: 0,
    periodDr: r.totalDebit ?? 0,
    periodCr: r.totalCredit ?? 0,
    closingDr: (r.net ?? 0) > 0 ? r.net : 0,
    closingCr: (r.net ?? 0) < 0 ? -r.net : 0,
  }))
}

function escapeCsv(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    fromDate: start.toISOString().slice(0, 10),
    toDate: end.toISOString().slice(0, 10),
  }
}

export default function TrialBalancePage() {
  const { toast } = useToast()
  const { fromDate: defFrom, toDate: defTo } = getCurrentMonthRange()
  const [fromDate, setFromDate] = useState(defFrom)
  const [toDate, setToDate] = useState(defTo)
  const [isFrozen, setIsFrozen] = useState(false)
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReport = useCallback(() => {
    setLoading(true)
    const period = fromDate.substring(0, 7) // YYYY-MM
    glApi.trialBalance({ fromDate, toDate, period })
      .then(r => {
        setTrialBalance(r.rows?.length ? mapGlRows(r.rows) : [])
        setIsFrozen(r.isFrozen || false)
      })
      .catch(() => {
        setTrialBalance([])
        setIsFrozen(false)
        toast({ title: 'Error', description: 'Failed to load trial balance', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [fromDate, toDate, toast])

  React.useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExportExcel = () => {
    const headers = ['Account Code', 'Account Name', 'Opening Dr', 'Opening Cr', 'Period Dr', 'Period Cr', 'Closing Dr', 'Closing Cr']
    const rows = trialBalance.map(tb => [
      tb.accountCode,
      tb.accountName,
      tb.openingDr,
      tb.openingCr,
      tb.periodDr,
      tb.periodCr,
      tb.closingDr,
      tb.closingCr,
    ])
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Trial_Balance_${fromDate}_to_${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Exported', description: 'Trial balance downloaded as CSV (opens in Excel)' })
  }

  const handleExportPdf = () => {
    window.print()
  }

  const totalDr = trialBalance.reduce((sum, tb) => sum + tb.closingDr, 0)
  const totalCr = trialBalance.reduce((sum, tb) => sum + tb.closingCr, 0)
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
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf} disabled={trialBalance.length === 0}>
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel} disabled={trialBalance.length === 0}>
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
            <Button className="w-full" onClick={fetchReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
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
              {(loading ? [] : trialBalance).map((tb) => (
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

      {/* Freeze Period Status */}
      {isFrozen && (
        <Card className="p-6 bg-amber-50 border-l-4 border-l-amber-500">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-800">
            <Lock className="w-5 h-5" />
            Period is Frozen
          </h3>
          <p className="text-sm text-amber-700">
            This period has been closed. No new journal entries can be posted. Only audit adjustment entries are allowed.
          </p>
        </Card>
      )}
    </div>
  )
}
