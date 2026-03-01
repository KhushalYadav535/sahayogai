'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, PrinterIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const balanceSheetData = {
  asOnDate: new Date('2025-03-01'),
  assets: {
    'Current Assets': {
      'Cash in Hand': 350000,
      'Bank Accounts': 1300000,
      'Investments': 500000,
    },
    'Fixed Assets': {
      'Building': 1000000,
      'Equipment': 400000,
    },
    'Loans & Advances': {
      'Short-term Loans': 1500000,
      'Long-term Loans': 2250000,
    },
  },
  liabilities: {
    'Current Liabilities': {
      'Members Deposits': 1700000,
      'Payables': 250000,
    },
    'Long-term Liabilities': {
      'Term Deposits': 800000,
    },
  },
  equity: {
    'Share Capital': 2000000,
    'Accumulated Surplus': 1200000,
    'Reserve Fund': 500000,
  },
}

export default function BalanceSheetPage() {
  const [asOnDate, setAsOnDate] = useState('2025-03-01')
  const [compareYear, setCompareYear] = useState(false)

  const totalAssets = Object.values(balanceSheetData.assets).reduce(
    (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
    0
  )

  const totalLiabilities = Object.values(balanceSheetData.liabilities).reduce(
    (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
    0
  )

  const totalEquity = Object.values(balanceSheetData.equity).reduce((sum, v) => sum + v, 0)
  const totalLiabilitiesEquity = totalLiabilities + totalEquity
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground mt-1">Financial position as on {formatDate(new Date(asOnDate))}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <PrinterIcon className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            PDF
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSETS Column */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-blue-500">ASSETS</h2>

          {Object.entries(balanceSheetData.assets).map(([category, items]) => {
            const categoryTotal = Object.values(items).reduce((sum, v) => sum + v, 0)
            return (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/70 mb-2">{category}</h3>
                <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                  {Object.entries(items).map(([item, value]) => (
                    <div key={item} className="flex justify-between text-sm">
                      <span>{item}</span>
                      <span className="font-mono text-right">{formatCurrency(value, true)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 mt-2">
                    <span>{category}</span>
                    <span className="font-mono text-right">{formatCurrency(categoryTotal, true)}</span>
                  </div>
                </div>
              </div>
            )
          })}

          <div className={`mt-4 pt-4 border-t-2 font-bold flex justify-between text-lg ${isBalanced ? 'text-green-600 border-t-green-500' : 'text-red-600 border-t-red-500'}`}>
            <span>TOTAL ASSETS</span>
            <span className="font-mono">{formatCurrency(totalAssets, true)}</span>
          </div>
        </Card>

        {/* LIABILITIES & EQUITY Column */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-red-500">LIABILITIES & EQUITY</h2>

          {/* Liabilities */}
          {Object.entries(balanceSheetData.liabilities).map(([category, items]) => {
            const categoryTotal = Object.values(items).reduce((sum, v) => sum + v, 0)
            return (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-semibold text-foreground/70 mb-2">{category}</h3>
                <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                  {Object.entries(items).map(([item, value]) => (
                    <div key={item} className="flex justify-between text-sm">
                      <span>{item}</span>
                      <span className="font-mono text-right">{formatCurrency(value, true)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 mt-2">
                    <span>{category}</span>
                    <span className="font-mono text-right">{formatCurrency(categoryTotal, true)}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Equity */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground/70 mb-2">Equity</h3>
            <div className="space-y-1 pl-4 border-l-2 border-gray-200">
              {Object.entries(balanceSheetData.equity).map(([item, value]) => (
                <div key={item} className="flex justify-between text-sm">
                  <span>{item}</span>
                  <span className="font-mono text-right">{formatCurrency(value, true)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 mt-2">
                <span>Total Equity</span>
                <span className="font-mono text-right">{formatCurrency(totalEquity, true)}</span>
              </div>
            </div>
          </div>

          <div className={`mt-4 pt-4 border-t-2 font-bold flex justify-between text-lg ${isBalanced ? 'text-green-600 border-t-green-500' : 'text-red-600 border-t-red-500'}`}>
            <span>TOTAL LIAB. & EQUITY</span>
            <span className="font-mono">{formatCurrency(totalLiabilitiesEquity, true)}</span>
          </div>
        </Card>
      </div>

      {/* Balance Status */}
      <Card className={`p-4 ${isBalanced ? 'bg-green-50 border-l-4 border-l-green-500' : 'bg-red-50 border-l-4 border-l-red-500'}`}>
        <p className={`font-semibold ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
          {isBalanced
            ? '✓ Balance Sheet is Balanced (Assets = Liabilities + Equity)'
            : '✗ Balance Sheet is NOT Balanced'}
        </p>
      </Card>
    </div>
  )
}
