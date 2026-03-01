'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Check, X, ArrowUp } from 'lucide-react'
import { ApprovalItem, ApprovalType, ApprovalStatus } from '@/lib/types/approval'
import { StatusBadge } from '@/components/common/status-badge'
import { formatCurrency, formatDate, formatTimeAgo } from '@/lib/utils/format'

const mockApprovals: ApprovalItem[] = [
  {
    id: '1',
    type: ApprovalType.LOAN_APPROVAL,
    status: ApprovalStatus.PENDING_APPROVAL,
    description: 'Loan application for ₹2,50,000',
    makerName: 'Raj Patel',
    makerRole: 'Loan Officer',
    amount: 250000,
    createdAt: new Date(Date.now() - 30 * 60000),
    slaDeadline: new Date(Date.now() + 3 * 60 * 60000),
    entityId: 'LN001',
    entityType: 'Loan',
    diffData: { status: 'PENDING -> APPROVED', approvalDate: formatDate(new Date()) },
  },
  {
    id: '2',
    type: ApprovalType.JOURNAL_ENTRY,
    status: ApprovalStatus.PENDING_APPROVAL,
    description: 'Interest accrual posting for Feb 2025',
    makerName: 'Priya Singh',
    makerRole: 'Accountant',
    amount: 125600,
    createdAt: new Date(Date.now() - 2 * 60 * 60000),
    slaDeadline: new Date(Date.now() + 30 * 60000),
    entityId: 'JE002',
    entityType: 'JournalEntry',
  },
  {
    id: '3',
    type: ApprovalType.MEMBER_KYC,
    status: ApprovalStatus.PENDING_APPROVAL,
    description: 'KYC update for member Rajesh Kumar',
    makerName: 'Secretary',
    makerRole: 'Secretary',
    createdAt: new Date(Date.now() - 5 * 60 * 60000),
    slaDeadline: new Date(Date.now() + 4 * 60 * 60000),
    entityId: 'MEM123',
    entityType: 'Member',
  },
  {
    id: '4',
    type: ApprovalType.DEPOSIT_CREATION,
    status: ApprovalStatus.APPROVED,
    description: 'Fixed deposit opening ₹5,00,000',
    makerName: 'Amit Kumar',
    makerRole: 'Accountant',
    amount: 500000,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000),
    slaDeadline: new Date(Date.now() - 20 * 60 * 60000),
    entityId: 'DEP045',
    entityType: 'Deposit',
  },
]

const getSLAColor = (deadline: Date): 'green' | 'amber' | 'red' => {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  const hours = diff / (1000 * 60 * 60)
  
  if (hours > 4) return 'green'
  if (hours > 1) return 'amber'
  return 'red'
}

const getSLABadgeClass = (color: 'green' | 'amber' | 'red'): string => {
  const classes: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
  }
  return classes[color]
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(mockApprovals)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [comments, setComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = () => {
    if (selectedApproval && comments) {
      setApprovals(
        approvals.map((a) =>
          a.id === selectedApproval.id
            ? { ...a, status: ApprovalStatus.APPROVED, comments }
            : a
        )
      )
      setShowApproveModal(false)
      setComments('')
      setSelectedApproval(null)
    }
  }

  const handleReject = () => {
    if (selectedApproval && rejectionReason) {
      setApprovals(
        approvals.map((a) =>
          a.id === selectedApproval.id
            ? { ...a, status: ApprovalStatus.REJECTED, rejectionReason }
            : a
        )
      )
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedApproval(null)
    }
  }

  const handleEscalate = (approval: ApprovalItem) => {
    setApprovals(
      approvals.map((a) =>
        a.id === approval.id
          ? { ...a, status: ApprovalStatus.ESCALATED }
          : a
      )
    )
  }

  const pending = approvals.filter((a) => a.status === ApprovalStatus.PENDING_APPROVAL)
  const approved = approvals.filter((a) => a.status === ApprovalStatus.APPROVED)
  const rejected = approvals.filter((a) => a.status === ApprovalStatus.REJECTED)
  const escalated = approvals.filter((a) => a.status === ApprovalStatus.ESCALATED)

  const pendingCount = pending.length

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <Card className="p-4 bg-amber-50 border-l-4 border-l-amber-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              {pendingCount} item{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-sm text-amber-800 mt-1">Please review and take action within the SLA</p>
          </div>
        </Card>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Approvals Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve pending transactions and entries
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejected.length})
          </TabsTrigger>
          <TabsTrigger value="escalated">
            Escalated ({escalated.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending approvals</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Maker</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">SLA</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((approval) => {
                    const slaColor = getSLAColor(approval.slaDeadline)
                    return (
                      <tr key={approval.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {approval.type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{approval.description}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium text-xs">{approval.makerName}</p>
                            <p className="text-xs text-muted-foreground">{approval.makerRole}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {approval.amount ? formatCurrency(approval.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatTimeAgo(approval.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${getSLABadgeClass(slaColor)}`}>
                            {Math.ceil((approval.slaDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60))}h left
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-green-600 hover:text-green-600"
                              onClick={() => {
                                setSelectedApproval(approval)
                                setShowApproveModal(true)
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:text-red-600"
                              onClick={() => {
                                setSelectedApproval(approval)
                                setShowRejectModal(true)
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-purple-600 hover:text-purple-600"
                              onClick={() => handleEscalate(approval)}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3">
          {approved.map((approval) => (
            <Card key={approval.id} className="p-4 opacity-75">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{approval.type}</Badge>
                    <StatusBadge status={ApprovalStatus.APPROVED} />
                  </div>
                  <p className="font-medium">{approval.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    By {approval.makerName} • {formatTimeAgo(approval.createdAt)}
                  </p>
                </div>
                {approval.amount && (
                  <p className="font-bold text-lg">{formatCurrency(approval.amount)}</p>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected">
          {rejected.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No rejected items</p>
            </Card>
          ) : (
            rejected.map((approval) => (
              <Card key={approval.id} className="p-4 border-l-4 border-l-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive">{approval.type}</Badge>
                      <StatusBadge status={ApprovalStatus.REJECTED} />
                    </div>
                    <p className="font-medium">{approval.description}</p>
                    {approval.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {approval.rejectionReason}
                      </p>
                    )}
                  </div>
                  {approval.amount && (
                    <p className="font-bold text-lg">{formatCurrency(approval.amount)}</p>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="escalated">
          {escalated.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No escalated items</p>
            </Card>
          ) : (
            escalated.map((approval) => (
              <Card key={approval.id} className="p-4 border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">{approval.type}</Badge>
                      <StatusBadge status={ApprovalStatus.ESCALATED} />
                    </div>
                    <p className="font-medium">{approval.description}</p>
                  </div>
                  {approval.amount && (
                    <p className="font-bold text-lg">{formatCurrency(approval.amount)}</p>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Modal */}
      {showApproveModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Approve Request</h3>

            <div className="bg-muted p-3 rounded-lg mb-4">
              <p className="text-sm font-medium">{selectedApproval.description}</p>
              {selectedApproval.amount && (
                <p className="text-sm text-muted-foreground mt-1">
                  Amount: {formatCurrency(selectedApproval.amount)}
                </p>
              )}
              {selectedApproval.diffData && (
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  {Object.entries(selectedApproval.diffData).map(([key, value]) => (
                    <p key={key}>{key}: {JSON.stringify(value)}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Comments (optional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add approval comments..."
                className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!comments}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Request</h3>

            <div className="bg-muted p-3 rounded-lg mb-4">
              <p className="text-sm font-medium">{selectedApproval.description}</p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Reason *</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">Select reason...</option>
                <option value="INSUFFICIENT_DOCUMENTATION">Insufficient Documentation</option>
                <option value="DATA_MISMATCH">Data Mismatch</option>
                <option value="COMPLIANCE_ISSUE">Compliance Issue</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason}
                variant="destructive"
              >
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
