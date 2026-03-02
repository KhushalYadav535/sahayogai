'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
    return (
        <div className="w-full overflow-hidden rounded-lg border border-border">
            {/* Header */}
            <div className="flex gap-4 px-4 py-3 bg-muted/50 border-b border-border">
                {Array.from({ length: cols }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 rounded bg-muted animate-pulse flex-1"
                        style={{ maxWidth: i === 0 ? '120px' : undefined }}
                    />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className="flex gap-4 px-4 py-3 border-b border-border last:border-0 bg-card"
                >
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <div
                            key={colIdx}
                            className="h-4 rounded bg-muted/70 animate-pulse flex-1"
                            style={{
                                animationDelay: `${(rowIdx * cols + colIdx) * 50}ms`,
                                maxWidth: colIdx === 0 ? '120px' : undefined,
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

interface CardSkeletonProps {
    count?: number;
    className?: string;
}

export function CardSkeleton({ count = 4, className = '' }: CardSkeletonProps) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-32 rounded bg-muted/80 animate-pulse mb-2" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                        <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" style={{ animationDelay: `${i * 100 + 80}ms` }} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
