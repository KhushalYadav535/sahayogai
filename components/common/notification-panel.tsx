'use client';

import React, { useState } from 'react';
import { Bell, CheckSquare, Zap, Settings, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
    id: string;
    type: 'approval' | 'ai' | 'system';
    title: string;
    description: string;
    timeAgo: string;
    read: boolean;
}

const mockNotifications: Notification[] = [
    { id: '1', type: 'approval', title: 'Loan Approval Pending', description: 'LN-2024-000023 awaiting your approval', timeAgo: '5 min ago', read: false },
    { id: '2', type: 'ai', title: 'AI Risk Alert', description: 'Member MEM-202401-0005 risk score dropped to RED (42)', timeAgo: '12 min ago', read: false },
    { id: '3', type: 'approval', title: 'Journal Entry Approval', description: 'JV-2024-00234 by Accountant awaiting checker', timeAgo: '1 hr ago', read: false },
    { id: '4', type: 'system', title: 'Day-End Completed', description: 'Day-end process for 28/02/2026 completed successfully', timeAgo: '8 hr ago', read: true },
    { id: '5', type: 'ai', title: 'STR Flagged', description: 'Transaction TXN-2024-0098 flagged for suspicious pattern', timeAgo: '1 day ago', read: true },
];

const typeConfig = {
    approval: { icon: <CheckSquare className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    ai: { icon: <Zap className="w-4 h-4" />, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
    system: { icon: <Settings className="w-4 h-4" />, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900' },
};

interface NotificationPanelProps {
    open: boolean;
    onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [activeTab, setActiveTab] = useState<'all' | 'approval' | 'ai' | 'system'>('all');

    const unreadCount = notifications.filter(n => !n.read).length;

    const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.type === activeTab);

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />
            {/* Panel */}
            <div className="fixed right-0 top-0 h-screen w-80 bg-card border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 min-w-[1.25rem] text-center">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                                <Check className="w-3 h-3 mr-1" /> All read
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border flex-shrink-0">
                    {(['all', 'approval', 'ai', 'system'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 text-xs py-2 font-medium capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab === 'ai' ? 'AI Alerts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Notifications */}
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {filtered.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No notifications</div>
                    ) : (
                        filtered.map(n => {
                            const cfg = typeConfig[n.type];
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30 ${!n.read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                        <span className={cfg.color}>{cfg.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className={`text-sm font-medium leading-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {n.title}
                                            </p>
                                            {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.description}</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">{n.timeAgo}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const unreadCount = mockNotifications.filter(n => !n.read).length;

    return (
        <>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </Button>
            <NotificationPanel open={open} onClose={() => setOpen(false)} />
        </>
    );
}
