'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { AIModel } from '@/lib/types/ai'
import { formatDate } from '@/lib/utils/format'
import { ZapOff, Eye, RotateCcw } from 'lucide-react'

const mockModels: AIModel[] = [
  {
    id: '1',
    name: 'Loan Risk Scorer',
    type: 'RISK_SCORER',
    version: '2.5',
    deployedDate: new Date('2025-01-15'),
    accuracy: 94.2,
    status: 'ACTIVE',
    lastBiasAudit: new Date('2025-02-01'),
  },
  {
    id: '2',
    name: 'Fraud Detector',
    type: 'FRAUD_DETECTOR',
    version: '1.8',
    deployedDate: new Date('2024-11-20'),
    accuracy: 96.8,
    status: 'ACTIVE',
    lastBiasAudit: new Date('2025-02-15'),
  },
  {
    id: '3',
    name: 'NPA Predictor',
    type: 'NPA_PREDICTOR',
    version: '2.1',
    deployedDate: new Date('2024-12-10'),
    accuracy: 91.5,
    status: 'ACTIVE',
    lastBiasAudit: new Date('2025-01-20'),
  },
  {
    id: '4',
    name: 'Automated Ledger Entry',
    type: 'AUTO_LEDGER',
    version: '1.3',
    deployedDate: new Date('2024-10-05'),
    accuracy: 98.1,
    status: 'ACTIVE',
    lastBiasAudit: new Date('2024-12-15'),
  },
  {
    id: '5',
    name: 'Anomaly Detector',
    type: 'ANOMALY_DETECTOR',
    version: '2.0',
    deployedDate: new Date('2025-01-01'),
    accuracy: 89.3,
    status: 'ACTIVE',
    lastBiasAudit: new Date('2025-02-01'),
  },
]

const performanceTrendData = [
  { month: 'Oct', accuracy: 92.1 },
  { month: 'Nov', accuracy: 93.5 },
  { month: 'Dec', accuracy: 94.8 },
  { month: 'Jan', accuracy: 95.2 },
  { month: 'Feb', accuracy: 96.1 },
  { month: 'Mar', accuracy: 96.8 },
]

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>(mockModels)
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)

  const handleRollback = (modelId: string) => {
    // Simulate rollback
    setModels(
      models.map((m) =>
        m.id === modelId
          ? { ...m, version: (parseFloat(m.version) - 0.1).toFixed(1), accuracy: m.accuracy - 2 }
          : m
      )
    )
    setShowRollbackConfirm(null)
  }

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-800'
      : status === 'INACTIVE'
        ? 'bg-gray-100 text-gray-800'
        : 'bg-amber-100 text-amber-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Model Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI models, versions, and performance metrics
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Platform Admin Only
        </Badge>
      </div>

      {/* Performance Trend Card */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Overall Model Performance Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={performanceTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[85, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              dot={{ fill: '#3b82f6', r: 5 }}
              name="Average Accuracy"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Models Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Model Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Version</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Deployed</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Accuracy</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 text-sm font-medium">{model.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{model.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{model.version}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(model.deployedDate)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${model.accuracy}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{model.accuracy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={getStatusColor(model.status)}>{model.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedModel(model)}
                        className="h-7 px-2"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRollbackConfirm(model.id)}
                        className="h-7 px-2 text-amber-600 hover:text-amber-600"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Last Bias Audit Card */}
      <Card className="p-6 bg-blue-50 border-l-4 border-l-blue-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ZapOff className="w-5 h-5" />
          Quarterly Bias Audit Status
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-foreground/80">
            Last comprehensive bias audit: <span className="font-semibold">Feb 15, 2025</span>
          </p>
          <Button size="sm">Run Bias Audit Now</Button>
        </div>
      </Card>

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedModel.name}</h3>
                <p className="text-sm text-muted-foreground">Version {selectedModel.version}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModel(null)}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-medium">{selectedModel.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(selectedModel.status)}>
                  {selectedModel.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deployed Date</p>
                <p className="font-medium">{formatDate(selectedModel.deployedDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                <p className="font-medium">{selectedModel.accuracy}%</p>
              </div>
            </div>

            {/* Mini Sparkline */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">Performance Trend</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="accuracy" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Button onClick={() => setSelectedModel(null)} className="w-full">
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Rollback Confirmation */}
      <AlertDialog open={showRollbackConfirm !== null} onOpenChange={() => setShowRollbackConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback Model Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will rollback the model to the previous version. Current version users will see immediate
              changes in behavior. Accuracy may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-3 rounded-lg my-4">
            <p className="text-sm">
              <strong>Current:</strong> v{models.find((m) => m.id === showRollbackConfirm)?.version}{' '}
              (
              {models.find((m) => m.id === showRollbackConfirm)?.accuracy}% accuracy)
            </p>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRollback(showRollbackConfirm!)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Proceed with Rollback
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
