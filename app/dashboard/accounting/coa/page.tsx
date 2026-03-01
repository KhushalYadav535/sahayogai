'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { ChartOfAccount, AccountType } from '@/lib/types/accounting'
import { formatCurrency } from '@/lib/utils/format'

const mockAccounts: ChartOfAccount[] = [
  {
    code: '1000',
    name: 'Assets',
    type: AccountType.ASSET,
    balance: 5000000,
    openingBalance: 4500000,
    isActive: true,
  },
  {
    code: '1100',
    name: 'Cash & Bank',
    type: AccountType.ASSET,
    parent: '1000',
    balance: 1250000,
    openingBalance: 1000000,
    isActive: true,
  },
  {
    code: '1101',
    name: 'Cash in Hand',
    type: AccountType.ASSET,
    parent: '1100',
    balance: 250000,
    openingBalance: 200000,
    isActive: true,
  },
  {
    code: '1102',
    name: 'Bank Accounts',
    type: AccountType.ASSET,
    parent: '1100',
    balance: 1000000,
    openingBalance: 800000,
    isActive: true,
  },
  {
    code: '1200',
    name: 'Loans & Advances',
    type: AccountType.ASSET,
    parent: '1000',
    balance: 3750000,
    openingBalance: 3500000,
    isActive: true,
  },
  {
    code: '2000',
    name: 'Liabilities',
    type: AccountType.LIABILITY,
    balance: 2000000,
    openingBalance: 1800000,
    isActive: true,
  },
  {
    code: '2100',
    name: 'Members Deposits',
    type: AccountType.LIABILITY,
    parent: '2000',
    balance: 1500000,
    openingBalance: 1400000,
    isActive: true,
  },
  {
    code: '3000',
    name: 'Equity',
    type: AccountType.EQUITY,
    balance: 3000000,
    openingBalance: 2700000,
    isActive: true,
  },
  {
    code: '4000',
    name: 'Income',
    type: AccountType.INCOME,
    balance: 450000,
    openingBalance: 400000,
    isActive: true,
  },
  {
    code: '4100',
    name: 'Interest Income',
    type: AccountType.INCOME,
    parent: '4000',
    balance: 350000,
    openingBalance: 300000,
    isActive: true,
  },
  {
    code: '5000',
    name: 'Expenses',
    type: AccountType.EXPENSE,
    balance: 200000,
    openingBalance: 150000,
    isActive: true,
  },
]

const getTypeColor = (type: AccountType): string => {
  const colors: Record<AccountType, string> = {
    [AccountType.ASSET]: 'bg-blue-100 text-blue-800',
    [AccountType.LIABILITY]: 'bg-red-100 text-red-800',
    [AccountType.INCOME]: 'bg-green-100 text-green-800',
    [AccountType.EXPENSE]: 'bg-orange-100 text-orange-800',
    [AccountType.EQUITY]: 'bg-purple-100 text-purple-800',
  }
  return colors[type]
}

interface TreeNodeProps {
  account: ChartOfAccount
  level: number
  children: ChartOfAccount[]
  onHover: (account: ChartOfAccount) => void
  expandedNodes: Set<string>
  onToggleExpand: (code: string) => void
}

function TreeNode({ account, level, children, onHover, expandedNodes, onToggleExpand }: TreeNodeProps) {
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
            <Badge className={`text-xs ${getTypeColor(account.type)}`}>
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
            children={mockAccounts.filter((a) => a.parent === child.code)}
            onHover={onHover}
            expandedNodes={expandedNodes}
            onToggleExpand={onToggleExpand}
          />
        ))}
    </>
  )
}

export default function ChartOfAccountsPage() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1000', '2000', '4000', '5000']))
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredAccount, setHoveredAccount] = useState<ChartOfAccount | null>(null)

  const rootAccounts = mockAccounts.filter((a) => !a.parent)

  const handleToggleExpand = (code: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(code)) {
      newExpanded.delete(code)
    } else {
      newExpanded.add(code)
    }
    setExpandedNodes(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage accounting structure and master accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <ChevronDown className="w-4 h-4 mr-2" />
            Expand All
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search accounts by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* COA Tree */}
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex-1">Account</div>
            <div className="text-right min-w-fit pr-3">Balance</div>
          </div>
        </div>

        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {rootAccounts.map((account) => (
            <TreeNode
              key={account.code}
              account={account}
              level={0}
              children={mockAccounts.filter((a) => a.parent === account.code)}
              onHover={setHoveredAccount}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      </Card>

      {/* Hover Details Card */}
      {hoveredAccount && (
        <Card className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
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
