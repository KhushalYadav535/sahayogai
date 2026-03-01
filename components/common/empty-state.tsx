import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </Card>
  )
}
