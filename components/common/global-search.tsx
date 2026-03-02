'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Banknote, Wallet, X, Clock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SearchResult {
    id: string;
    type: 'member' | 'loan' | 'deposit' | 'account';
    title: string;
    subtitle: string;
    status?: string;
    href: string;
}

const mockResults: SearchResult[] = [
    { id: '1', type: 'member', title: 'Rajesh Kumar', subtitle: 'MEM-202401-0001 • ACTIVE', href: '/dashboard/members/1' },
    { id: '2', type: 'member', title: 'Priya Sharma', subtitle: 'MEM-202401-0002 • ACTIVE', href: '/dashboard/members/2' },
    { id: '3', type: 'loan', title: 'LN-2024-000001', subtitle: 'Rajesh Kumar • ₹50,000 • ACTIVE', href: '/dashboard/loans/1' },
    { id: '4', type: 'deposit', title: 'FDR-2024-0001', subtitle: 'Priya Sharma • ₹1,00,000 • ACTIVE', href: '/dashboard/deposits/1' },
    { id: '5', type: 'account', title: 'SB-001234', subtitle: 'Rajesh Kumar • ₹25,000 • ACTIVE', href: '/dashboard/accounts/SB-001234' },
];

const typeIcons: Record<string, React.ReactNode> = {
    member: <Users className="w-4 h-4 text-blue-500" />,
    loan: <Banknote className="w-4 h-4 text-orange-500" />,
    deposit: <Wallet className="w-4 h-4 text-green-500" />,
    account: <Wallet className="w-4 h-4 text-purple-500" />,
};

const typeLabels: Record<string, string> = {
    member: 'Members',
    loan: 'Loans',
    deposit: 'Deposits',
    account: 'Accounts',
};

interface GlobalSearchProps {
    open: boolean;
    onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const [recentSearches, setRecentSearches] = useState<string[]>(['Rajesh Kumar', 'LN-2024-000001']);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.length >= 2
        ? mockResults.filter(r =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.subtitle.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    const grouped = filtered.reduce<Record<string, SearchResult[]>>((acc, r) => {
        if (!acc[r.type]) acc[r.type] = [];
        acc[r.type].push(r);
        return acc;
    }, {});

    const flatResults = Object.values(grouped).flat();

    const handleSelect = useCallback((result: SearchResult) => {
        setRecentSearches(prev => [result.title, ...prev.filter(s => s !== result.title)].slice(0, 5));
        onClose();
        router.push(result.href);
    }, [onClose, router]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setSelected(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        setSelected(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatResults.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
        if (e.key === 'Enter' && flatResults[selected]) handleSelect(flatResults[selected]);
        if (e.key === 'Escape') onClose();
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="p-0 gap-0 max-w-lg" onKeyDown={handleKeyDown}>
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search members, loans, deposits..."
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                    {query && (
                        <button onClick={() => setQuery('')}>
                            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
                </div>

                <div className="max-h-80 overflow-y-auto py-2">
                    {query.length < 2 ? (
                        /* Recent searches */
                        <div className="px-4">
                            {recentSearches.length > 0 && (
                                <>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Searches</p>
                                    {recentSearches.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(s)}
                                            className="flex items-center gap-2 w-full text-left text-sm py-2 text-foreground hover:text-primary transition-colors"
                                        >
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            {s}
                                        </button>
                                    ))}
                                </>
                            )}
                            {recentSearches.length === 0 && (
                                <p className="text-sm text-muted-foreground py-6 text-center">Start typing to search...</p>
                            )}
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">No results for "{query}"</p>
                    ) : (
                        /* Grouped results */
                        Object.entries(grouped).map(([type, results]) => {
                            let globalIdx = flatResults.indexOf(results[0]);
                            return (
                                <div key={type} className="mb-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1">{typeLabels[type]}</p>
                                    {results.map((result, localIdx) => {
                                        const idx = globalIdx + localIdx;
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result)}
                                                className={`flex items-center gap-3 w-full text-left px-4 py-2.5 transition-colors ${idx === selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                                            >
                                                {typeIcons[result.type]}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{result.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span><kbd className="border border-border rounded px-1 font-mono">↑↓</kbd> navigate</span>
                    <span><kbd className="border border-border rounded px-1 font-mono">↵</kbd> open</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
