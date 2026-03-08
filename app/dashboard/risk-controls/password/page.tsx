'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, RefreshCw, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authApi, riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function PasswordPage() {
  const { toast } = useToast();
  const [passwordExpiry, setPasswordExpiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPasswordExpiry();
  }, []);

  const fetchPasswordExpiry = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.passwordExpiry();
      if (res.success) {
        setPasswordExpiry(res);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load password status', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character');
    return errors;
  };

  const handleChangePassword = async () => {
    setErrors({});

    // Validation
    if (!formData.currentPassword) {
      setErrors({ currentPassword: 'Current password is required' });
      return;
    }
    if (!formData.newPassword) {
      setErrors({ newPassword: 'New password is required' });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setErrors({ newPassword: passwordErrors.join(', ') });
      return;
    }

    setChanging(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      if (res.success) {
        toast({ title: 'Success', description: 'Password changed successfully' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        fetchPasswordExpiry();
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to change password',
        variant: 'destructive',
      });
      if (e.message?.includes('Current password')) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else if (e.message?.includes('last 5')) {
        setErrors({ newPassword: 'New password cannot be one of the last 5 passwords' });
      }
    } finally {
      setChanging(false);
    }
  };

  const getAlertLevel = () => {
    if (!passwordExpiry) return 'NONE';
    return passwordExpiry.alertLevel;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Lock className="w-8 h-8" />
          Password Management
        </h1>
        <p className="text-muted-foreground mt-1">Change password and manage password expiry</p>
      </div>

      {/* Password Expiry Status */}
      {passwordExpiry && (
        <Card>
          <CardHeader>
            <CardTitle>Password Expiry Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Password Changed</Label>
                <div className="text-lg font-semibold">{formatDate(passwordExpiry.passwordChangedAt)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Days Until Expiry</Label>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{passwordExpiry.daysUntilExpiry} days</div>
                  <Badge
                    className={
                      passwordExpiry.alertLevel === 'EXPIRED'
                        ? 'bg-red-100 text-red-800'
                        : passwordExpiry.alertLevel === 'CRITICAL'
                        ? 'bg-orange-100 text-orange-800'
                        : passwordExpiry.alertLevel === 'WARNING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {passwordExpiry.alertLevel}
                  </Badge>
                </div>
              </div>
            </div>

            {getAlertLevel() !== 'NONE' && (
              <Alert
                variant={passwordExpiry.alertLevel === 'EXPIRED' ? 'destructive' : 'default'}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {passwordExpiry.alertLevel === 'EXPIRED'
                    ? 'Your password has expired. Please change it immediately to continue using the system.'
                    : passwordExpiry.alertLevel === 'CRITICAL'
                    ? `Your password will expire in ${passwordExpiry.daysUntilExpiry} day(s). Please change it immediately.`
                    : `Your password will expire in ${passwordExpiry.daysUntilExpiry} days. Please change it soon.`}
                </AlertDescription>
              </Alert>
            )}

            {passwordExpiry.forceExpired && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your password has been force-expired by an administrator. Please change it immediately.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Change Password Form */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className={errors.currentPassword ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
            <div className="text-xs text-muted-foreground">
              Password must be at least 8 characters and contain uppercase, lowercase, number, and special character
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
            {formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Passwords match
              </div>
            )}
          </div>

          <Button onClick={handleChangePassword} disabled={changing} className="w-full">
            {changing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Password Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Minimum 8 characters
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              At least one uppercase letter (A-Z)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              At least one lowercase letter (a-z)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              At least one number (0-9)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              At least one special character (!@#$%^&*)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Cannot be one of your last 5 passwords
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
