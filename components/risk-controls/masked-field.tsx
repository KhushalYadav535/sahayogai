'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';

interface MaskedFieldProps {
  value: string | null | undefined;
  field: 'aadhaar' | 'pan' | 'bank_account' | 'mobile';
  entityType: string;
  entityId: string;
  maskedDisplay: string;
  className?: string;
}

export function MaskedField({
  value,
  field,
  entityType,
  entityId,
  maskedDisplay,
  className = '',
}: MaskedFieldProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [unmasked, setUnmasked] = useState(false);
  const [unmasking, setUnmasking] = useState(false);

  const handleUnmask = async () => {
    if (!value) return;
    
    setUnmasking(true);
    try {
      await riskControlsApi.unmask({
        field,
        entityType,
        entityId,
        purpose: `View ${field} for ${entityType}`,
      });
      setUnmasked(true);
      toast({
        title: 'Unmasked',
        description: `${field.toUpperCase()} field unmasked. Action logged.`,
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to unmask field',
        variant: 'destructive',
      });
    } finally {
      setUnmasking(false);
    }
  };

  const handleMask = () => {
    setUnmasked(false);
  };

  if (!value) {
    return <span className={className}>—</span>;
  }

  // Check permissions based on field
  const role = user?.role?.toLowerCase() || '';
  const allowedRoles: Record<string, string[]> = {
    aadhaar: ['secretary', 'admin', 'superadmin'],
    pan: ['accountant', 'admin', 'superadmin'],
    bank_account: ['accountant', 'admin', 'superadmin'],
    mobile: ['secretary', 'admin', 'superadmin'],
  };

  const hasPermission = allowedRoles[field]?.includes(role) || false;

  if (!hasPermission) {
    return <span className={className}>{maskedDisplay}</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono">
        {unmasked ? value : maskedDisplay}
      </span>
      {!unmasked ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUnmask}
          disabled={unmasking}
          className="h-6 px-2"
        >
          {unmasking ? (
            <Lock className="w-3 h-3 animate-pulse" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleMask}
          className="h-6 px-2"
        >
          <EyeOff className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// Helper functions to mask values
export function maskAadhaar(aadhaar: string | null | undefined): string {
  if (!aadhaar) return 'XXXX-XXXX-XXXX';
  if (aadhaar.length < 4) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

export function maskPAN(pan: string | null | undefined): string {
  if (!pan) return 'XXXXX1234X';
  if (pan.length < 5) return 'XXXXX1234X';
  return `XXXXX${pan.slice(-5)}`;
}

export function maskBankAccount(account: string | null | undefined): string {
  if (!account) return 'XXXX XXXX XXXX';
  if (account.length < 4) return 'XXXX XXXX XXXX';
  const last4 = account.slice(-4);
  return `XXXX XXXX ${last4}`;
}

export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return 'XXXXX 67890';
  if (mobile.length < 5) return 'XXXXX 67890';
  return `XXXXX ${mobile.slice(-5)}`;
}
