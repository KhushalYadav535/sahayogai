'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw } from 'lucide-react'

const reportCategories = [
  {
    category: 'NABARD',
    reports: [
      { name: 'NABARD Annual Return', frequency: 'Yearly', lastGenerated: '2024-03-15' },
      { name: 'Credit Disbursement Report', frequency: 'Monthly', lastGenerated: '2025-02-28' },
    ],
  },
  {
    category: 'Registrar',
    reports: [
      { name: 'Registrar Annual Return', frequency: 'Yearly', lastGenerated: '2024-03-20' },
      { name: 'Member List Report', frequency: 'Quarterly', lastGenerated: '2025-01-15' },
    ],
  },
  {
    category: 'Tax / TDS',
    reports: [
      { name: 'TDS Certificate (Form 16A)', frequency: 'Yearly', lastGenerated: '2024-06-30' },
      { name: 'Form 26AS Extract', frequency: 'As Needed', lastGenerated: '2024-12-01' },
    ],
  },
  {
    category: 'AML / Compliance',
    reports: [
      { name: 'STR Report', frequency: 'As Needed', lastGenerated: '2025-02-20' },
      { name: 'AML Transaction Log', frequency: 'Monthly', lastGenerated: '2025-02-28' },
    ],
  },
  {
    category: 'Internal',
    reports: [
      { name: 'NPA Provisioning Report', frequency: 'Monthly', lastGenerated: '2025-02-28' },
      { name: 'Balance Sheet', frequency: 'Monthly', lastGenerated: '2025-03-01' },
      { name: 'Trial Balance', frequency: 'Monthly', lastGenerated: '2025-03-01' },
    ],
  },
]

export default function ComplianceReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Reports Hub</h1>
        <p className="text-muted-foreground mt-1">
          Generate and download regulatory compliance reports
        </p>
      </div>

      {reportCategories.map((cat) => (
        <div key={cat.category}>
          <h2 className="text-lg font-semibold mb-3">{cat.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.reports.map((report) => (
              <Card key={report.name} className="p-4 hover:shadow-lg transition">
                <h3 className="font-semibold text-sm mb-2">{report.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {report.frequency}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last: {report.lastGenerated}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 flex-1">
                    <RefreshCw className="w-3 h-3" />
                    Generate
                  </Button>
                  <Button size="sm" className="gap-1">
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
