'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { ChartOfAccount, AccountType } from '@/lib/types/accounting'
import { formatCurrency } from '@/lib/utils/format'
import { glApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const getTypeColor = (type: AccountType): string => {
  const colors: Record<AccountType, string> = {
    [AccountType.ASSET]: 'bg-blue-100 text-blue-800',
    [AccountType.LIABILITY]: 'bg-red-100 text-red-800',
    [AccountType.INCOME]: 'bg-green-100 text-green-800',
    [AccountType.EXPENSE]: 'bg-orange-100 text-orange-800',
    [AccountType.EQUITY]: 'bg-purple-100 text-purple-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

interface TreeNodeProps {
  account: ChartOfAccount
  level: number
  children: ChartOfAccount[]
  onHover: (account: ChartOfAccount) => void
  expandedNodes: Set<string>
  onToggleExpand: (code: string) => void
  allAccounts: ChartOfAccount[]
}

function TreeNode({ account, level, children, onHover, expandedNodes, onToggleExpand, allAccounts }: TreeNodeProps) {
  const isExpanded = expandedNodes.has(account.code)
  const hasChildren = children.length > 0

  return (
    <>
      <div
        className="px-3 py-2 hover:bg-muted/50 transition flex items-center gap-2 group"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onMouseEnter={() => onHover(account)}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(account.code)}
            className="p-0.5 hover:bg-muted rounded transition"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-muted-foreground">{account.code}</code>
            <span className="text-sm font-medium truncate">{account.name}</span>
            <Badge className={`text-xs ${getTypeColor(account.type as AccountType)}`}>
              {account.type}
            </Badge>
          </div>
        </div>

        <div className="text-sm font-semibold text-right min-w-fit pl-2">
          {formatCurrency(account.balance, true)}
        </div>
      </div>

      {hasChildren && isExpanded &&
        children.map((child) => (
          <TreeNode
            key={child.code}
            account={child}
            level={level + 1}
            children={allAccounts.filter((a) => a.parent === child.code)}
            onHover={onHover}
            expandedNodes={expandedNodes}
            onToggleExpand={onToggleExpand}
            allAccounts={allAccounts}
          />
        ))}
    </>
  )
}

export default function ChartOfAccountsPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1000', '2000', '4000', '5000', '3000']))
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredAccount, setHoveredAccount] = useState<ChartOfAccount | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: AccountType.ASSET, parentCode: '' })

  const fetchAccounts = () => {
    setLoading(true)
    glApi.coa
      .list()
      .then((res) => {
        const mapped: ChartOfAccount[] = (res.accounts || []).map((a) => ({
          code: a.code,
          name: a.name,
          type: a.type as AccountType,
          parent: a.parent ?? undefined,
          balance: a.balance ?? 0,
          openingBalance: a.openingBalance ?? 0,
          isActive: a.isActive ?? true,
        }))
        setAccounts(mapped)
        if (mapped.length > 0) {
          const roots = [...new Set(mapped.filter((a) => !a.parent).map((a) => a.code))]
          setExpandedNodes((prev) => new Set([...prev, ...roots]))
        }
      })
      .catch(() => {
        setAccounts([])
        toast({ title: 'Error', description: 'Failed to load Chart of Accounts', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleToggleExpand = (code: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const handleExpandAll = () => {
    const allCodes = new Set(accounts.map((a) => a.code))
    setExpandedNodes(allCodes)
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccount.code.trim() || !newAccount.name.trim()) {
      toast({ title: 'Validation', description: 'Code and Name are required', variant: 'destructive' })
      return
    }
    setAddSaving(true)
    try {
      await glApi.coa.create({
        code: newAccount.code.trim(),
        name: newAccount.name.trim(),
        type: newAccount.type,
        parentCode: newAccount.parentCode.trim() || undefined,
      })
      toast({ title: 'Success', description: 'Account added successfully' })
      setAddModalOpen(false)
      setNewAccount({ code: '', name: '', type: AccountType.ASSET, parentCode: '' })
      fetchAccounts()
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setAddSaving(false)
    }
  }

  const rootAccounts = accounts.filter((a) => !a.parent)
  const filteredRoots = searchTerm
    ? rootAccounts.filter(
        (a) =>
          a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rootAccounts
  const filteredAccounts = searchTerm
    ? accounts.filter(
        (a) =>
          a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : accounts

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage accounting structure and master accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExpandAll}>
            <ChevronDown className="w-4 h-4 mr-2" />
            Expand All
          </Button>
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
                <DialogDescription>
                  Add a new GL account to the Chart of Accounts.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Account Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g. 1101"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount((p) => ({ ...p, code: e.target.value }))}
                    disabled={addSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Cash in Hand"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                    disabled={addSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type *</Label>
                  <Select
                    value={newAccount.type}
                    onValueChange={(v) => setNewAccount((p) => ({ ...p, type: v as AccountType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AccountType.ASSET}>Asset</SelectItem>
                      <SelectItem value={AccountType.LIABILITY}>Liability</SelectItem>
                      <SelectItem value={AccountType.EQUITY}>Equity</SelectItem>
                      <SelectItem value={AccountType.INCOME}>Income</SelectItem>
                      <SelectItem value={AccountType.EXPENSE}>Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Code (optional)</Label>
                  <Input
                    id="parent"
                    placeholder="e.g. 1100"
                    value={newAccount.parentCode}
                    onChange={(e) => setNewAccount((p) => ({ ...p, parentCode: e.target.value }))}
                    disabled={addSaving}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddModalOpen(false)}
                    disabled={addSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addSaving}>
                    {addSaving ? 'Adding...' : 'Add Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <Input
          placeholder="Search accounts by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex-1">Account</div>
            <div className="text-right min-w-fit pr-3">Balance</div>
          </div>
        </div>

        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading accounts...</div>
          ) : filteredRoots.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {accounts.length === 0
                ? 'No accounts yet. Click Add Account to create your first account.'
                : 'No accounts match your search.'}
            </div>
          ) : (
            filteredRoots.map((account) => (
              <TreeNode
                key={account.code}
                account={account}
                level={0}
                children={filteredAccounts.filter((a) => a.parent === account.code)}
                onHover={setHoveredAccount}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
                allAccounts={filteredAccounts}
              />
            ))
          )}
        </div>
      </Card>

      {hoveredAccount && (
        <Card className="p-4 bg-blue-50 border-l-4 border-l-blue-500 dark:bg-blue-950/30 dark:border-l-blue-600">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            {hoveredAccount.name}
            <Badge className={`text-xs ${getTypeColor(hoveredAccount.type)}`}>
              {hoveredAccount.type}
            </Badge>
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Code</p>
              <p className="font-mono font-semibold">{hoveredAccount.code}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Current Balance</p>
              <p className="font-semibold">{formatCurrency(hoveredAccount.balance)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Opening Balance</p>
              <p className="font-semibold">{formatCurrency(hoveredAccount.openingBalance)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Change</p>
              <p className={`font-semibold ${hoveredAccount.balance >= hoveredAccount.openingBalance ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(hoveredAccount.balance - hoveredAccount.openingBalance)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
