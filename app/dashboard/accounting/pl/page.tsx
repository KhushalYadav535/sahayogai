'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

const plData = {
  income: {
    'Interest Income': 425600,
    'Loan Processing Fees': 45000,
    'Deposit Fees': 12500,
  },
  expense: {
    'Staff Salaries': 150000,
    'Office Rent': 25000,
    'Administrative Expenses': 35000,
    'Bad Debts': 8000,
  },
}

export default function PLStatementPage() {
  const [fromDate, setFromDate] = useState('2025-01-01')
  const [toDate, setToDate] = useState('2025-03-01')

  const totalIncome = Object.values(plData.income).reduce((s, v) => s + v, 0)
  const totalExpense = Object.values(plData.expense).reduce((s, v) => s + v, 0)
  const netSurplus = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground mt-1">Income and expense analysis</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-green-500">INCOME</h2>
          <div className="space-y-2">
            {Object.entries(plData.income).map(([item, value]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span className="font-mono font-semibold">{formatCurrency(value, true)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-green-500 flex justify-between font-bold text-lg text-green-600">
            <span>Total Income</span>
            <span className="font-mono">{formatCurrency(totalIncome, true)}</span>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 pb-3 border-b-2 border-orange-500">EXPENSES</h2>
          <div className="space-y-2">
            {Object.entries(plData.expense).map(([item, value]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span className="font-mono font-semibold">{formatCurrency(value, true)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-orange-500 flex justify-between font-bold text-lg text-orange-600">
            <span>Total Expenses</span>
            <span className="font-mono">{formatCurrency(totalExpense, true)}</span>
          </div>
        </Card>
      </div>

      <Card className={`p-6 ${netSurplus > 0 ? 'bg-green-50 border-l-4 border-l-green-500' : 'bg-red-50 border-l-4 border-l-red-500'}`}>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Net Surplus / (Deficit)</span>
          <span className={`text-3xl font-bold font-mono ${netSurplus > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netSurplus, true)}
          </span>
        </div>
      </Card>
    </div>
  )
}
