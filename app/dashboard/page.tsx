'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Banknote, Wallet, TrendingUp } from 'lucide-react';
import { dashboardApi, setApiToken } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ memberCount: number; activeLoansOutstanding: number; totalSavings: number; totalDeposits: number } | null>(null);
  const [activities, setActivities] = useState<{ id: string; type: string; category: string; amount: number; memberName: string; processedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
    if (token) setApiToken(token);
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }
    Promise.all([dashboardApi.getStats(token || undefined), dashboardApi.getActivity(10, token || undefined)])
      .then(([statsRes, actRes]) => {
        if (statsRes.stats) setStats(statsRes.stats);
        if (actRes.activities) setActivities(actRes.activities);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.tenantId]);

  const kpiCards = stats
    ? [
        {
          title: 'Total Members',
          value: stats.memberCount.toLocaleString('en-IN'),
          icon: <Users className="w-8 h-8" />,
          change: '',
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Active Loans',
          value: formatCurrency(stats.activeLoansOutstanding, 0),
          icon: <Banknote className="w-8 h-8" />,
          change: '',
          color: 'text-green-600 dark:text-green-400',
        },
        {
          title: 'Total Savings',
          value: formatCurrency(stats.totalSavings, 0),
          icon: <Wallet className="w-8 h-8" />,
          change: '',
          color: 'text-purple-600 dark:text-purple-400',
        },
        {
          title: 'Total Deposits',
          value: formatCurrency(stats.totalDeposits, 0),
          icon: <TrendingUp className="w-8 h-8" />,
          change: '',
          color: 'text-orange-600 dark:text-orange-400',
        },
      ]
    : [
        { title: 'Total Members', value: '—', icon: <Users className="w-8 h-8" />, change: '', color: 'text-blue-600 dark:text-blue-400' },
        { title: 'Active Loans', value: '—', icon: <Banknote className="w-8 h-8" />, change: '', color: 'text-green-600 dark:text-green-400' },
        { title: 'Total Savings', value: '—', icon: <Wallet className="w-8 h-8" />, change: '', color: 'text-purple-600 dark:text-purple-400' },
        { title: 'Total Deposits', value: '—', icon: <TrendingUp className="w-8 h-8" />, change: '', color: 'text-orange-600 dark:text-orange-400' },
      ];

  const roleGreeting: Record<UserRole, string> = {
    [UserRole.PLATFORM_ADMIN]: 'Platform Administration Dashboard',
    [UserRole.SOCIETY_ADMIN]: 'Society Administration Dashboard',
    [UserRole.PRESIDENT]: 'Executive Dashboard - Governance Oversight',
    [UserRole.SECRETARY]: 'Member Services & Governance Dashboard',
    [UserRole.ACCOUNTANT]: 'Daily Transactions & GL Entry Dashboard',
    [UserRole.SENIOR_ACCOUNTANT]: 'Approval & Review Dashboard',
    [UserRole.LOAN_OFFICER]: 'Loan Portfolio & Collection Dashboard',
    [UserRole.COMPLIANCE_OFFICER]: 'AML & Compliance Monitoring Dashboard',
    [UserRole.AUDITOR]: 'Audit & Anomaly Review Dashboard',
    [UserRole.MEMBER]: 'Member Account Dashboard',
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {roleGreeting[user?.role || UserRole.MEMBER]}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                </div>
                <div className={`${card.color} opacity-80`}>
                  {card.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {card.value}
              </div>
              {card.change && <p className="text-xs text-muted-foreground">{card.change}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest transactions and events in your cooperative
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recent transactions</p>
            ) : (
              activities.map((a) => {
                const label = a.category === 'deposit' ? 'Member Deposit' : a.category === 'withdrawal' ? 'Withdrawal' : a.category === 'transfer' ? 'Transfer' : a.category === 'interest' ? 'Interest' : a.category === 'emi' ? 'EMI Payment' : a.category;
                const isCredit = a.type === 'credit';
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 pb-4 border-b border-border last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(a.amount, 0)} from {a.memberName}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(a.amount, 0)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started for new members */}
      {user?.role === UserRole.MEMBER && (
        <Card className="bg-accent/10 border-accent">
          <CardHeader>
            <CardTitle className="text-accent">Getting Started</CardTitle>
            <CardDescription>
              Learn how to make the most of your cooperative membership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['View Account', 'Apply for Loan', 'Manage Deposits'].map(
                (action, index) => (
                  <button
                    key={index}
                    className="p-4 rounded-lg border border-accent/50 hover:bg-accent/20 transition-colors text-left"
                  >
                    <p className="font-medium text-sm text-foreground">{action}</p>
                  </button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
