import React from 'react'
import { Badge } from '@/components/ui/badge'

type Status = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'REJECTED' | 'ESCALATED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DORMANT' | 'PENDING' | 'ACKNOWLEDGED' | 'DISMISSED'

interface StatusBadgeProps {
  status: Status
  variant?: 'default' | 'outline' | 'secondary' | 'destructive'
  className?: string
}

const statusStyles: Record<Status, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending Approval' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  POSTED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Posted' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  ESCALATED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Escalated' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
  DORMANT: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Dormant' },
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  ACKNOWLEDGED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Acknowledged' },
  DISMISSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Dismissed' },
}

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.DRAFT
  return (
    <Badge className={`${style.bg} ${style.text} ${className}`} variant={variant}>
      {style.label}
    </Badge>
  )
}
