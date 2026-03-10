'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Banknote, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user?.tenantId]);

  const kpiCards = stats
    ? [
      {
        title: 'Total Members',
        value: stats.memberCount.toLocaleString('en-IN'),
        icon: <Users className="w-6 h-6" />,
        gradient: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50 dark:bg-blue-950/30',
        textColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Active Loans',
        value: formatCurrency(stats.activeLoansOutstanding, 0),
        icon: <Banknote className="w-6 h-6" />,
        gradient: 'from-emerald-500 to-green-500',
        bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'Total Savings',
        value: formatCurrency(stats.totalSavings, 0),
        icon: <Wallet className="w-6 h-6" />,
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50 dark:bg-purple-950/30',
        textColor: 'text-purple-600 dark:text-purple-400',
      },
      {
        title: 'Total Deposits',
        value: formatCurrency(stats.totalDeposits, 0),
        icon: <TrendingUp className="w-6 h-6" />,
        gradient: 'from-orange-400 to-amber-500',
        bgLight: 'bg-orange-50 dark:bg-orange-950/30',
        textColor: 'text-orange-600 dark:text-orange-400',
      },
    ]
    : [
      { title: 'Total Members', value: '—', icon: <Users className="w-6 h-6" />, gradient: 'from-blue-500 to-indigo-500', bgLight: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
      { title: 'Active Loans', value: '—', icon: <Banknote className="w-6 h-6" />, gradient: 'from-emerald-500 to-green-500', bgLight: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
      { title: 'Total Savings', value: '—', icon: <Wallet className="w-6 h-6" />, gradient: 'from-purple-500 to-pink-500', bgLight: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400' },
      { title: 'Total Deposits', value: '—', icon: <TrendingUp className="w-6 h-6" />, gradient: 'from-orange-400 to-amber-500', bgLight: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-orange-600 dark:text-orange-400' },
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
    <div className="space-y-6 animate-slide-up">
      {/* Welcome section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name}</span>!
        </h1>
        <p className="text-muted-foreground">
          {roleGreeting[user?.role || UserRole.MEMBER]}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group overflow-hidden relative">
            {/* Subtle gradient accent at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80`}></div>

            <CardHeader className="pb-3 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                </div>
                <div className={`p-2.5 rounded-xl ${card.bgLight} ${card.textColor} transition-transform duration-300 group-hover:scale-110`}>
                  {card.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tracking-tight mb-1 animate-count-up">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Recent Activity</CardTitle>
          <CardDescription>
            Latest transactions and events in your cooperative
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-muted rounded"></div>
                      <div className="h-2.5 w-24 bg-muted rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No recent transactions</p>
              </div>
            ) : (
              activities.map((a, i) => {
                const label = a.category === 'deposit' ? 'Member Deposit' : a.category === 'withdrawal' ? 'Withdrawal' : a.category === 'transfer' ? 'Transfer' : a.category === 'interest' ? 'Interest' : a.category === 'emi' ? 'EMI Payment' : a.category;
                const isCredit = a.type === 'credit';
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-muted/30 transition-colors duration-150 group/item"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                      {isCredit
                        ? <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        : <ArrowUpRight className="w-5 h-5 text-red-500 dark:text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.memberName}
                      </p>
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
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
        <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/40">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Getting Started</CardTitle>
            <CardDescription>
              Learn how to make the most of your cooperative membership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { action: 'View Account', icon: <Wallet className="w-5 h-5" /> },
                { action: 'Apply for Loan', icon: <Banknote className="w-5 h-5" /> },
                { action: 'Manage Deposits', icon: <TrendingUp className="w-5 h-5" /> },
              ].map((item, index) => (
                <button
                  key={index}
                  className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left flex items-center gap-3 group"
                >
                  <div className="text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">{item.icon}</div>
                  <p className="font-medium text-sm text-foreground">{item.action}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
