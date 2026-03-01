'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Banknote, Wallet, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const kpiCards = [
    {
      title: 'Total Members',
      value: '2,456',
      icon: <Users className="w-8 h-8" />,
      change: '+12% from last month',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Loans',
      value: '₹45,23,000',
      icon: <Banknote className="w-8 h-8" />,
      change: '+8% from last month',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Savings',
      value: '₹89,12,000',
      icon: <Wallet className="w-8 h-8" />,
      change: '+15% from last month',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Deposits',
      value: '₹56,78,000',
      icon: <TrendingUp className="w-8 h-8" />,
      change: '+5% from last month',
      color: 'text-orange-600 dark:text-orange-400',
    },
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
              <p className="text-xs text-muted-foreground">
                {card.change}
              </p>
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
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b border-border last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Member Deposit Received
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹5,000 from Rajesh Kumar
                  </p>
                </div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +₹5,000
                </div>
              </div>
            ))}
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
