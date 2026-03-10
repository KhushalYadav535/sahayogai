'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, CreditCard, MoreHorizontal, FileText, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { icon: Home, label: 'Home', href: '/member-portal/home' },
    { icon: Wallet, label: 'Account', href: '/portal/account' },
    { icon: CreditCard, label: 'Loans', href: '/portal/loans' },
    { icon: FileText, label: 'Pay', href: '/portal/pay' },
    { icon: Bell, label: 'More', href: '/member-portal/notifications' },
];

export function MemberPortalNav() {
    const pathname = usePathname();

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
            <div className="mx-3 mb-3">
                <div className="glass rounded-2xl shadow-xl border border-white/20 dark:border-white/10 px-2 py-2">
                    <div className="flex items-center justify-around">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                pathname === item.href ||
                                (item.href === '/member-portal/home' && pathname?.startsWith('/member-portal/home'));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavTab"
                                            className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <div className="relative z-10">
                                        <Icon
                                            className={`w-5 h-5 transition-all duration-300 ${isActive
                                                    ? 'text-primary scale-110'
                                                    : 'text-muted-foreground'
                                                }`}
                                        />
                                    </div>
                                    <span
                                        className={`relative z-10 text-[10px] font-semibold transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavDot"
                                            className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
