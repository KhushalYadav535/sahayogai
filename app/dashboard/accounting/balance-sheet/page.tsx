'use client'

import React, { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, PrinterIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { glApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface BSItem {
  glCode: string
  glName: string
  amount: number
}

function escapeCsv(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function BalanceSheetPage() {
  const { toast } = useToast()
  const [asOnDate, setAsOnDate] = useState(getTodayString())
  const [compareYear, setCompareYear] = useState(false)
  const [assets, setAssets] = useState<BSItem[]>([])
  const [liabilities, setLiabilities] = useState<BSItem[]>([])
  const [equity, setEquity] = useState<BSItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReport = useCallback(() => {
    setLoading(true)
    glApi
      .balanceSheet({ asOnDate })
      .then((r) => {
        setAssets(r.assets || [])
        setLiabilities(r.liabilities || [])
        setEquity(r.equity || [])
      })
      .catch(() => {
        setAssets([])
        setLiabilities([])
        setEquity([])
        toast({ title: 'Error', description: 'Failed to load balance sheet', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [asOnDate, toast])

  React.useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const totalAssets = assets.reduce((s, e) => s + e.amount, 0)
  const totalLiabilities = liabilities.reduce((s, e) => s + e.amount, 0)
  const totalEquity = equity.reduce((s, e) => s + e.amount, 0)
  const totalLiabilitiesEquity = totalLiabilities + totalEquity
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01

  const handlePrint = () => {
    window.print()
  }

  const handleExportPdf = () => {
    window.print()
  }

  const handleExportExcel = () => {
    const rows: string[][] = []
    rows.push(['BALANCE SHEET', `As on ${asOnDate}`])
    rows.push([])
    rows.push(['ASSETS', '', ''])
    assets.forEach((a) => rows.push([a.glCode, a.glName, String(a.amount)]))
    rows.push(['', 'Total Assets', String(totalAssets)])
    rows.push([])
    rows.push(['LIABILITIES', '', ''])
    liabilities.forEach((l) => rows.push([l.glCode, l.glName, String(l.amount)]))
    rows.push(['', 'Total Liabilities', String(totalLiabilities)])
    rows.push([])
    rows.push(['EQUITY', '', ''])
    equity.forEach((e) => rows.push([e.glCode, e.glName, String(e.amount)]))
    rows.push(['', 'Total Equity', String(totalEquity)])
    rows.push(['', 'Total Liab. & Equity', String(totalLiabilitiesEquity)])

    const csvContent = rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Balance_Sheet_${period || 'report'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Exported', description: 'Balance sheet downloaded as CSV (opens in Excel)' })
  }

  const hasData = assets.length > 0 || liabilities.length > 0 || equity.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground mt-1">Financial position as on {formatDate(new Date(asOnDate))}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint} disabled={!hasData}>
            <PrinterIcon className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf} disabled={!hasData}>
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel} disabled={!hasData}>
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">As on Date</label>
            <Input type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} />
          </div>
          <Button onClick={fetchReport} disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </Button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compareYear}
              onChange={(e) => setCompareYear(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Compare with Previous Year</span>
          </label>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading balance sheet...</Card>
      ) : !hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          No balance sheet data for this period. Post journal entries to see data.
        </Card>
      ) : (
        <>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ASSETS Column */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-blue-500">ASSETS</h2>
              <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                {assets.map((a) => (
                  <div key={a.glCode} className="flex justify-between text-sm">
                    <span>{a.glName || a.glCode}</span>
                    <span className="font-mono text-right">{formatCurrency(a.amount, true)}</span>
                  </div>
                ))}
              </div>
              <div
                className={`mt-4 pt-4 border-t-2 font-bold flex justify-between text-lg ${isBalanced ? 'text-green-600 border-t-green-500' : 'text-red-600 border-t-red-500'}`}
              >
                <span>TOTAL ASSETS</span>
                <span className="font-mono">{formatCurrency(totalAssets, true)}</span>
              </div>
            </Card>

            {/* LIABILITIES & EQUITY Column */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-red-500">LIABILITIES & EQUITY</h2>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/70 mb-2">Liabilities</h3>
                <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                  {liabilities.map((l) => (
                    <div key={l.glCode} className="flex justify-between text-sm">
                      <span>{l.glName || l.glCode}</span>
                      <span className="font-mono text-right">{formatCurrency(l.amount, true)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/70 mb-2">Equity</h3>
                <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                  {equity.map((e) => (
                    <div key={e.glCode} className="flex justify-between text-sm">
                      <span>{e.glName || e.glCode}</span>
                      <span className="font-mono text-right">{formatCurrency(e.amount, true)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`mt-4 pt-4 border-t-2 font-bold flex justify-between text-lg ${isBalanced ? 'text-green-600 border-t-green-500' : 'text-red-600 border-t-red-500'}`}
              >
                <span>TOTAL LIAB. & EQUITY</span>
                <span className="font-mono">{formatCurrency(totalLiabilitiesEquity, true)}</span>
              </div>
            </Card>
          </div>

          {/* Balance Status */}
          <Card
            className={`p-4 ${isBalanced ? 'bg-green-50 border-l-4 border-l-green-500 dark:bg-green-950/30' : 'bg-red-50 border-l-4 border-l-red-500 dark:bg-red-950/30'}`}
          >
            <p className={`font-semibold ${isBalanced ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {isBalanced
                ? '✓ Balance Sheet is Balanced (Assets = Liabilities + Equity)'
                : '✗ Balance Sheet is NOT Balanced'}
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
