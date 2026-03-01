'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, TrendingUp, AlertCircle, Zap, Link as LinkIcon } from 'lucide-react'
import { AIAlert } from '@/lib/types/ai'
import { formatTimeAgo, formatCurrency } from '@/lib/utils/format'

const mockAlerts: AIAlert[] = [
  {
    id: '1',
    type: 'FRAUD',
    severity: 'CRITICAL',
    affectedEntity: {
      type: 'TRANSACTION',
      id: 'TXN001',
      name: 'Large unusual withdrawal',
    },
    explanation: 'Member withdrew ₹2.5L at 2 AM, unusual time and amount for this member',
    confidence: 98,
    timestamp: new Date(Date.now() - 30 * 60000),
    status: 'PENDING',
  },
  {
    id: '2',
    type: 'NPA_PREDICTION',
    severity: 'HIGH',
    affectedEntity: {
      type: 'MEMBER',
      id: 'MEM002',
      name: 'Rajesh Kumar',
    },
    explanation: 'Member has missed 2 EMI payments and income has decreased 40% YoY',
    confidence: 87,
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    status: 'PENDING',
  },
  {
    id: '3',
    type: 'INTEREST_ANOMALY',
    severity: 'MEDIUM',
    affectedEntity: {
      type: 'TRANSACTION',
      id: 'TXN003',
      name: 'Interest calculation error',
    },
    explanation: 'Interest accrual is 15% higher than expected for this FD product',
    confidence: 76,
    timestamp: new Date(Date.now() - 5 * 60 * 60000),
    status: 'ACKNOWLEDGED',
  },
  {
    id: '4',
    type: 'CASH_FLOW_WARNING',
    severity: 'MEDIUM',
    affectedEntity: {
      type: 'MEMBER',
      id: 'MEM004',
      name: 'Society Treasury',
    },
    explanation: 'Projected outflows exceed inflows by ₹5L in next 7 days',
    confidence: 82,
    timestamp: new Date(Date.now() - 1 * 60 * 60000),
    status: 'PENDING',
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'HIGH':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'FRAUD':
      return <AlertTriangle className="w-5 h-5" />
    case 'NPA_PREDICTION':
      return <TrendingUp className="w-5 h-5 rotate-180" />
    case 'INTEREST_ANOMALY':
      return <AlertCircle className="w-5 h-5" />
    case 'CASH_FLOW_WARNING':
      return <Zap className="w-5 h-5" />
    default:
      return <AlertTriangle className="w-5 h-5" />
  }
}

export default function AIAlertsPage() {
  const [alerts, setAlerts] = useState<AIAlert[]>(mockAlerts)
  const [filter, setFilter] = useState<'all' | 'fraud' | 'interest' | 'npa' | 'cashflow'>('all')

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'fraud') return alert.type === 'FRAUD'
    if (filter === 'interest') return alert.type === 'INTEREST_ANOMALY'
    if (filter === 'npa') return alert.type === 'NPA_PREDICTION'
    if (filter === 'cashflow') return alert.type === 'CASH_FLOW_WARNING'
    return true
  })

  const pendingAlerts = filteredAlerts.filter((a) => a.status === 'PENDING')
  const acknowledgedAlerts = filteredAlerts.filter((a) => a.status === 'ACKNOWLEDGED')

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)))
  }

  const handleDismiss = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'DISMISSED' } : a)))
  }

  const handleEscalate = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'ESCALATED' } : a)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Alerts</h1>
        <p className="text-muted-foreground mt-1">
          {pendingAlerts.length} pending alerts requiring attention
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All' },
          { id: 'fraud', label: 'Fraud Alerts' },
          { id: 'interest', label: 'Interest Anomalies' },
          { id: 'npa', label: 'NPA Predictions' },
          { id: 'cashflow', label: 'Cash Flow Warnings' },
        ].map((btn) => (
          <Button
            key={btn.id}
            variant={filter === btn.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(btn.id as any)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Pending Alerts Tab */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({acknowledgedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending alerts</p>
            </Card>
          ) : (
            pendingAlerts.map((alert) => (
              <Card key={alert.id} className="p-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg h-fit ${getSeverityColor(alert.severity)}`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.confidence}% confidence
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium text-sm mb-1">
                        {alert.affectedEntity.name}
                      </p>
                      <p className="text-sm text-foreground/80">{alert.explanation}</p>
                    </div>

                    {/* Entity Link */}
                    {alert.affectedEntity.type === 'MEMBER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                      >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        View Member Profile
                      </Button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-fit">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEscalate(alert.id)}
                    >
                      Escalate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-3">
          {acknowledgedAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No acknowledged alerts</p>
            </Card>
          ) : (
            acknowledgedAlerts.map((alert) => (
              <Card key={alert.id} className="p-4 opacity-75">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg h-fit ${getSeverityColor(alert.severity)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <p className="font-medium text-sm mb-1">{alert.affectedEntity.name}</p>
                    <p className="text-sm text-foreground/80">{alert.explanation}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
