'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CashFlowForecast } from '@/lib/types/ai'
import { formatCurrency } from '@/lib/utils/format'
import { TrendingUp, TrendingDown } from 'lucide-react'

const mockForecastData: CashFlowForecast[] = [
  { date: new Date('2025-03-01'), optimistic: 4200000, base: 3800000, pessimistic: 3200000, confidence: 92 },
  { date: new Date('2025-03-08'), optimistic: 4500000, base: 4000000, pessimistic: 3400000, confidence: 90 },
  { date: new Date('2025-03-15'), optimistic: 5200000, base: 4600000, pessimistic: 3800000, confidence: 88 },
  { date: new Date('2025-03-22'), optimistic: 4800000, base: 4200000, pessimistic: 3500000, confidence: 85 },
  { date: new Date('2025-03-29'), optimistic: 5500000, base: 4900000, pessimistic: 4100000, confidence: 83 },
]

export default function CashFlowForecastPage() {
  const [period, setPeriod] = useState<30 | 60 | 90>(30)

  const chartData = mockForecastData.map((d) => ({
    date: d.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    'Optimistic (Green)': d.optimistic,
    'Base (Blue)': d.base,
    'Pessimistic (Red)': d.pessimistic,
  }))

  const latestBase = mockForecastData[mockForecastData.length - 1].base
  const projectedInflow = latestBase * 1.2
  const projectedOutflow = latestBase * 0.8
  const netPosition = projectedInflow - projectedOutflow
  const liquidityRatio = projectedInflow / projectedOutflow

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Cash Flow Forecast</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered 90-day liquidity forecast with scenario analysis
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {[30, 60, 90].map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p as 30 | 60 | 90)}
          >
            {p} Days
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Projected Inflow</p>
          <p className="text-2xl font-bold">{formatCurrency(projectedInflow, true)}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs mt-2">
            <TrendingUp className="w-4 h-4" />
            +12% vs. current
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Projected Outflow</p>
          <p className="text-2xl font-bold">{formatCurrency(projectedOutflow, true)}</p>
          <div className="flex items-center gap-1 text-amber-600 text-xs mt-2">
            <TrendingDown className="w-4 h-4" />
            -8% vs. current
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Net Position</p>
          <p className={`text-2xl font-bold ${netPosition > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netPosition, true)}
          </p>
          <Badge variant={netPosition > 0 ? 'outline' : 'destructive'} className="mt-2 text-xs">
            {netPosition > 0 ? 'Healthy' : 'Concerns'}
          </Badge>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Liquidity Ratio</p>
          <p className="text-2xl font-bold text-primary">{liquidityRatio.toFixed(2)}x</p>
          <p className="text-xs text-muted-foreground mt-2">Inflow/Outflow</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">90-Day Forecast Scenarios</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Optimistic (Green)"
              stroke="#22c55e"
              fillOpacity={1}
              fill="url(#colorOptimistic)"
            />
            <Area
              type="monotone"
              dataKey="Base (Blue)"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorBase)"
            />
            <Area
              type="monotone"
              dataKey="Pessimistic (Red)"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorPessimistic)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 border-l-4 border-l-primary">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          AI Insights
          <Badge variant="outline" className="text-xs">AI ✦</Badge>
        </h3>
        <ul className="space-y-2 text-sm text-foreground/80">
          <li className="flex gap-2">
            <span className="font-bold text-primary">•</span>
            <span>
              Strong inflow expected March 15-22 due to quarterly loan disbursements and fixed deposit
              maturities
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">•</span>
            <span>
              March 29 shows highest net position (₹1.4Cr) — optimal time for strategic investments or
              provisions
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">•</span>
            <span>
              Pessimistic scenario remains above critical level — society liquidity remains stable even in
              downturn
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">•</span>
            <span>Overall forecast confidence: 90% based on historical transaction patterns</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
