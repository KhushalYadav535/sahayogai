'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Loader2, FileDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { glApi } from '@/lib/api'

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    fromDate: start.toISOString().slice(0, 10),
    toDate: end.toISOString().slice(0, 10),
  }
}

export default function PLStatementPage() {
  const { fromDate: defFrom, toDate: defTo } = getCurrentMonthRange()
  const [fromDate, setFromDate] = useState(defFrom)
  const [toDate, setToDate] = useState(defTo)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [income, setIncome] = useState<{ glCode: string; glName: string; amount: number }[]>([])
  const [expenses, setExpenses] = useState<{ glCode: string; glName: string; amount: number }[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const fetchPl = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await glApi.pl({ fromDate, toDate })
      if (res.success && res.income !== undefined) {
        setIncome(res.income || [])
        setExpenses(res.expenses || [])
        setTotalIncome(res.totalIncome ?? res.income?.reduce((s, i) => s + i.amount, 0) ?? 0)
        setTotalExpenses(res.totalExpenses ?? res.expenses?.reduce((s, e) => s + e.amount, 0) ?? 0)
        setNetProfit(res.netProfit ?? 0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load P&L')
      setIncome([])
      setExpenses([])
      setTotalIncome(0)
      setTotalExpenses(0)
      setNetProfit(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPl()
  }, [fromDate, toDate])

  const handleExport = async (type: 'pdf' | 'excel') => {
    setExporting(type)
    try {
      if (type === 'excel') {
        const rows = [
          ['P&L Statement', `Period: ${fromDate} to ${toDate}`],
          [],
          ['INCOME', 'Amount'],
          ...income.map(i => [i.glName, i.amount]),
          ['Total Income', totalIncome],
          [],
          ['EXPENSES', 'Amount'],
          ...expenses.map(e => [e.glName, e.amount]),
          ['Total Expenses', totalExpenses],
          [],
          ['Net Surplus/(Deficit)', netProfit],
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `PL_Statement_${fromDate}_to_${toDate}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        window.print()
      }
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground mt-1">Income and expense analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')} disabled={loading || !!error || exporting !== null}>
            {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('excel')} disabled={loading || !!error || exporting !== null}>
            {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Excel
          </Button>
          <Button size="sm" onClick={fetchPl} disabled={loading}>Generate Report</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">From Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">To Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-green-500">INCOME</h2>
              <div className="space-y-2">
                {income.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No income entries</p>
                ) : (
                  income.map((item) => (
                    <div key={item.glCode} className="flex justify-between text-sm">
                      <span>{item.glName}</span>
                      <span className="font-mono font-semibold">{formatCurrency(item.amount, true)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-green-500 flex justify-between font-bold text-lg text-green-600">
                <span>Total Income</span>
                <span className="font-mono">{formatCurrency(totalIncome, true)}</span>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-orange-500">EXPENSES</h2>
              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expense entries</p>
                ) : (
                  expenses.map((item) => (
                    <div key={item.glCode} className="flex justify-between text-sm">
                      <span>{item.glName}</span>
                      <span className="font-mono font-semibold">{formatCurrency(item.amount, true)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-orange-500 flex justify-between font-bold text-lg text-orange-600">
                <span>Total Expenses</span>
                <span className="font-mono">{formatCurrency(totalExpenses, true)}</span>
              </div>
            </Card>
          </div>

          <Card className={`p-6 ${netProfit > 0 ? 'bg-green-50 border-l-4 border-l-green-500' : 'bg-red-50 border-l-4 border-l-red-500'}`}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Net Surplus / (Deficit)</span>
              <span className={`text-3xl font-bold font-mono ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit, true)}
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
