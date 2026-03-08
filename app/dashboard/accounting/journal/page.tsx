'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { JournalEntry, JournalLine } from '@/lib/types/accounting'
import { StatusBadge } from '@/components/common/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { glApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/providers/auth-provider'
import { UserRole } from '@/lib/types/auth'

const mapVoucherToEntry = (v: any): JournalEntry => {
  const lines: JournalLine[] = (v.glEntries || []).map((e: any) => ({
    accountCode: e.glCode,
    accountName: e.glName,
    debit: Number(e.debit) || 0,
    credit: Number(e.credit) || 0,
  }))
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
  const statusMap: Record<string, JournalEntry['status']> = {
    draft: 'DRAFT',
    pending: 'PENDING_APPROVAL',
    approved: 'PENDING_APPROVAL',
    posted: 'POSTED',
    reversed: 'REJECTED',
  }
  return {
    id: v.id,
    refNumber: v.voucherNumber || `JV-${v.id?.slice(-6)}`,
    date: v.date ? new Date(v.date) : new Date(),
    narration: v.narration || '',
    lines,
    status: statusMap[v.status?.toLowerCase()] || 'DRAFT',
    totalDebit,
    totalCredit,
    createdBy: v.makerUserId ? `User ${v.makerUserId.slice(-6)}` : '—',
    createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
  }
}

export default function JournalEntryPage() {
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const isTenantAdmin = hasRole(UserRole.SOCIETY_ADMIN)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [coaAccounts, setCoaAccounts] = useState<{ code: string; name: string }[]>([])
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([
    { accountCode: '', accountName: '', debit: 0, credit: 0 },
    { accountCode: '', accountName: '', debit: 0, credit: 0 },
  ])
  const [suggestedClassification, setSuggestedClassification] = useState<{ glCode: string; glName: string; confidence: number } | null>(null)
  const [classificationLoading, setClassificationLoading] = useState(false)

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const difference = totalDebit - totalCredit

  useEffect(() => {
    glApi.vouchers
      .list({ voucherType: 'JV', limit: 50 })
      .then((res) => {
        setEntries((res.vouchers || []).map(mapVoucherToEntry))
      })
      .catch(() => {
        setEntries([])
        toast({ title: 'Error', description: 'Failed to load journal entries', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    glApi.coa.list().then((res) => {
      setCoaAccounts((res.accounts || []).map((a) => ({ code: a.code, name: a.name })))
    }).catch(() => setCoaAccounts([]))
  }, [])

  const handleAddRow = () => {
    setLines([...lines, { accountCode: '', accountName: '', debit: 0, credit: 0 }])
  }

  const handleDeleteRow = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const handleAccountSelect = (idx: number, code: string) => {
    const acc = coaAccounts.find((a) => a.code === code)
    const newLines = [...lines]
    newLines[idx].accountCode = code
    newLines[idx].accountName = acc?.name || newLines[idx].accountName || ''
    setLines(newLines)
  }

  const handleSubmit = async () => {
    if (!isBalanced || !narration) return
    const validLines = lines.filter((l) => l.accountCode.trim() && (l.debit > 0 || l.credit > 0))
    if (validLines.length < 2) {
      toast({ title: 'Validation', description: 'Add at least 2 lines: select account, enter Debit in one row and Credit in another. Totals must match.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        voucherType: 'JV' as const,
        date: formDate,
        narration,
        totalAmount: totalDebit,
        entries: validLines.map((l) => ({
          glCode: l.accountCode.trim(),
          glName: (l.accountName || l.accountCode).trim() || l.accountCode.trim(),
          debit: l.debit,
          credit: l.credit,
          narration: undefined,
        })),
      }
      const res = await glApi.vouchers.create(payload)
      const v = res.voucher
      const newEntry: JournalEntry = {
        id: v.id,
        refNumber: v.voucherNumber || `JV-${v.id?.slice(-6)}`,
        date: new Date(formDate),
        narration,
        lines: validLines,
        status: isTenantAdmin ? 'POSTED' : 'PENDING_APPROVAL',
        totalDebit,
        totalCredit,
        createdBy: 'You',
        createdAt: new Date(),
      }
      setEntries([newEntry, ...entries])
      setFormDate(new Date().toISOString().split('T')[0])
      setNarration('')
      setLines([
        { accountCode: '', accountName: '', debit: 0, credit: 0 },
        { accountCode: '', accountName: '', debit: 0, credit: 0 },
      ])
      toast({ title: 'Success', description: `Journal entry ${res.voucher?.voucherNumber || ''} created` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
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
              <div className="relative">
                <Input
                  placeholder="Description of this transaction..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                />
                {classificationLoading && (
                  <div className="absolute right-2 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* AI-005: Auto-Ledger Classification Suggestion */}
              {suggestedClassification && (
                <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>AI Suggestion:</strong> {suggestedClassification.glCode} - {suggestedClassification.glName}
                      <span className="text-muted-foreground ml-2">
                        ({Math.round(suggestedClassification.confidence * 100)}% confidence)
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => {
                        const emptyLineIdx = lines.findIndex(l => !l.accountCode)
                        if (emptyLineIdx >= 0) {
                          const newLines = [...lines]
                          newLines[emptyLineIdx].accountCode = suggestedClassification.glCode
                          newLines[emptyLineIdx].accountName = suggestedClassification.glName
                          setLines(newLines)
                        }
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                      {coaAccounts.length > 0 ? (
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={line.accountCode}
                          onChange={(e) => handleAccountSelect(idx, e.target.value)}
                        >
                          <option value="">Select account...</option>
                          {coaAccounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Code"
                            value={line.accountCode}
                            onChange={(e) => {
                              const newLines = [...lines]
                              newLines[idx].accountCode = e.target.value
                              setLines(newLines)
                            }}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Name"
                            value={line.accountName}
                            onChange={(e) => {
                              const newLines = [...lines]
                              newLines[idx].accountName = e.target.value
                              setLines(newLines)
                            }}
                            className="text-sm"
                          />
                        </div>
                      )}
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
                  <tr className="bg-red-50 dark:bg-red-950/30">
                    <td colSpan={4} className="px-4 py-2 text-center text-sm text-red-600 font-semibold">
                      Difference: {formatCurrency(difference)} — Entry must be balanced to submit
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" onClick={handleAddRow} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Row
          </Button>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {!narration && <span className="text-amber-600">Enter narration. </span>}
              {!isBalanced && narration && <span className="text-amber-600">Debit and Credit must match. </span>}
              {isBalanced && narration && (
                isTenantAdmin
                  ? 'Entry will be posted immediately (no approval required)'
                  : 'Entry will be submitted for maker-checker approval'
              )}
            </p>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isBalanced || !narration || submitting}
              className="gap-2"
            >
              {submitting
                ? 'Submitting...'
                : isTenantAdmin
                  ? 'Submit'
                  : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Entries List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Entries</h2>

        {loading ? (
          <p className="text-muted-foreground py-4">Loading journal entries...</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4">No journal entries yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-semibold text-sm">{entry.refNumber}</span>
                      <StatusBadge status={entry.status as any} />
                    </div>
                    <p className="font-medium">{entry.narration || '—'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(entry.date)} • By {entry.createdBy}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
                <div className="bg-muted/30 rounded p-3 text-sm space-y-1">
                  {entry.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {line.accountCode} {line.accountName && `— ${line.accountName}`}
                      </span>
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
        )}
      </Card>
    </div>
  )
}
