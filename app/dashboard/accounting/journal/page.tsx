'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { JournalEntry, JournalLine } from '@/lib/types/accounting'
import { StatusBadge } from '@/components/common/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    refNumber: 'JE-2025-001',
    date: new Date('2025-03-01'),
    narration: 'Interest accrual for Feb 2025',
    status: 'POSTED',
    lines: [
      { accountCode: '1101', accountName: 'Cash in Hand', debit: 125600, credit: 0 },
      { accountCode: '4100', accountName: 'Interest Income', debit: 0, credit: 125600 },
    ],
    totalDebit: 125600,
    totalCredit: 125600,
    createdBy: 'Priya Singh',
    createdAt: new Date('2025-03-01'),
    postedBy: 'Senior Accountant',
    postedAt: new Date('2025-03-01'),
  },
]

export default function JournalEntryPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries)
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([
    { accountCode: '', accountName: '', debit: 0, credit: 0 },
    { accountCode: '', accountName: '', debit: 0, credit: 0 },
  ])

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const difference = totalDebit - totalCredit

  const handleAddRow = () => {
    setLines([...lines, { accountCode: '', accountName: '', debit: 0, credit: 0 }])
  }

  const handleDeleteRow = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!isBalanced || !narration) return

    const newEntry: JournalEntry = {
      id: Math.random().toString(),
      refNumber: `JE-${new Date().getFullYear()}-${entries.length + 1}`,
      date: new Date(formDate),
      narration,
      lines,
      status: 'PENDING_APPROVAL',
      totalDebit,
      totalCredit,
      createdBy: 'Current User',
      createdAt: new Date(),
    }

    setEntries([newEntry, ...entries])
    setFormDate(new Date().toISOString().split('T')[0])
    setNarration('')
    setLines([
      { accountCode: '', accountName: '', debit: 0, credit: 0 },
      { accountCode: '', accountName: '', debit: 0, credit: 0 },
    ])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Journal Entries</h1>
        <p className="text-muted-foreground mt-1">
          Record financial transactions with maker-checker validation
        </p>
      </div>

      {/* Entry Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">New Journal Entry</h2>

        <div className="space-y-4 mb-6">
          {/* Date & Narration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Entry Date</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Narration</label>
              <Input
                placeholder="Description of this transaction..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>
          </div>

          {/* Journal Lines Table */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Account</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Debit (₹)</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Credit (₹)</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <Input
                        placeholder="Select account..."
                        value={line.accountCode}
                        onChange={(e) => {
                          const newLines = [...lines]
                          newLines[idx].accountCode = e.target.value
                          setLines(newLines)
                        }}
                        className="text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={line.debit || ''}
                        onChange={(e) => {
                          const newLines = [...lines]
                          newLines[idx].debit = parseFloat(e.target.value) || 0
                          newLines[idx].credit = 0
                          setLines(newLines)
                        }}
                        className="text-right text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={line.credit || ''}
                        onChange={(e) => {
                          const newLines = [...lines]
                          newLines[idx].credit = parseFloat(e.target.value) || 0
                          newLines[idx].debit = 0
                          setLines(newLines)
                        }}
                        className="text-right text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(idx)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(totalDebit)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(totalCredit)}</td>
                  <td className="px-4 py-2 text-center" />
                </tr>
                {!isBalanced && (
                  <tr className="bg-red-50">
                    <td colSpan={4} className="px-4 py-2 text-center text-sm text-red-600 font-semibold">
                      Difference: {formatCurrency(difference)} - Entry must be balanced to submit
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </Button>

          {/* Submit Area */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Entry will be submitted for maker-checker approval
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!isBalanced || !narration}
              className="gap-2"
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      </Card>

      {/* Entries List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Entries</h2>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-semibold text-sm">{entry.refNumber}</span>
                    <StatusBadge status={entry.status as any} />
                  </div>
                  <p className="font-medium">{entry.narration}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(entry.date)} • By {entry.createdBy}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>

              {/* Mini ledger lines preview */}
              <div className="bg-muted/30 rounded p-3 text-sm space-y-1">
                {entry.lines.map((line, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">{line.accountName}</span>
                    <span>
                      {line.debit > 0 && <span className="text-green-600">{formatCurrency(line.debit)} Dr</span>}
                      {line.credit > 0 && <span className="text-blue-600">{formatCurrency(line.credit)} Cr</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
