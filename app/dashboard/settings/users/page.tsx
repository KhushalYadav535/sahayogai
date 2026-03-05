'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { usersApi, authApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, Search, Edit, Key, Power } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';

const roleColors: Record<string, string> = {
    [UserRole.PLATFORM_ADMIN]: 'bg-red-100 text-red-800',
    [UserRole.SOCIETY_ADMIN]: 'bg-purple-100 text-purple-800',
    [UserRole.PRESIDENT]: 'bg-yellow-100 text-yellow-800',
    [UserRole.SECRETARY]: 'bg-cyan-100 text-cyan-800',
    [UserRole.ACCOUNTANT]: 'bg-blue-100 text-blue-800',
    [UserRole.SENIOR_ACCOUNTANT]: 'bg-indigo-100 text-indigo-800',
    [UserRole.LOAN_OFFICER]: 'bg-green-100 text-green-800',
    [UserRole.COMPLIANCE_OFFICER]: 'bg-rose-100 text-rose-800',
    [UserRole.AUDITOR]: 'bg-slate-100 text-slate-700',
    [UserRole.MEMBER]: 'bg-orange-100 text-orange-800',
};

// Backend role string → frontend UserRole label
const roleMap: Record<string, string> = {
    superadmin: UserRole.PLATFORM_ADMIN,
    admin: UserRole.SOCIETY_ADMIN,
    president: UserRole.PRESIDENT,
    secretary: UserRole.SECRETARY,
    accountant: UserRole.ACCOUNTANT,
    senior_accountant: UserRole.SENIOR_ACCOUNTANT,
    loan_officer: UserRole.LOAN_OFFICER,
    compliance_officer: UserRole.COMPLIANCE_OFFICER,
    auditor: UserRole.AUDITOR,
    member: UserRole.MEMBER,
    staff: UserRole.ACCOUNTANT, // legacy fallback
};

// Frontend UserRole → backend role string (for saving)
const roleToBackend: Record<string, string> = {
    [UserRole.PLATFORM_ADMIN]: 'superadmin',
    [UserRole.SOCIETY_ADMIN]: 'admin',
    [UserRole.PRESIDENT]: 'president',
    [UserRole.SECRETARY]: 'secretary',
    [UserRole.ACCOUNTANT]: 'accountant',
    [UserRole.SENIOR_ACCOUNTANT]: 'senior_accountant',
    [UserRole.LOAN_OFFICER]: 'loan_officer',
    [UserRole.COMPLIANCE_OFFICER]: 'compliance_officer',
    [UserRole.AUDITOR]: 'auditor',
    [UserRole.MEMBER]: 'member',
};

type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    mfaEnabled?: boolean;
};

export default function UsersPage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [editRole, setEditRole] = useState('');
    const [resetUser, setResetUser] = useState<UserRow | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.ACCOUNTANT, password: '' });

    const refreshUsers = useCallback(() => {
        return usersApi.list()
            .then(r => setUsers((r.users || []).map((u: any) => ({
                ...u,
                role: roleMap[u.role] || u.role,
                status: (u.status || 'active').toUpperCase(),
                mfaEnabled: false,
            }))))
            .catch(() => setUsers([]));
    }, []);

    useEffect(() => {
        refreshUsers().finally(() => setLoading(false));
    }, [refreshUsers]);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) return;
        setSaving(true);
        try {
            await authApi.register({
                email: newUser.email,
                password: newUser.password,
                name: newUser.name,
                role: (roleToBackend[newUser.role] || 'staff') as 'admin' | 'staff',
                tenantId: currentUser?.tenantId || undefined,
            });
            await refreshUsers();
            setCreateOpen(false);
            setNewUser({ name: '', email: '', role: UserRole.ACCOUNTANT, password: '' });
            toast({ title: 'User created successfully' });
        } catch (e: any) {
            toast({ title: e?.message || 'Failed to create user', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleEditRoleSave = async () => {
        if (!editUser || !editRole) return;
        setSaving(true);
        try {
            const backendRole = roleToBackend[editRole] || 'staff';
            await usersApi.updateRole(editUser.id, backendRole);
            await refreshUsers();
            setEditUser(null);
            toast({ title: 'Role updated' });
        } catch (e: any) {
            toast({ title: e?.message || 'Failed to update role', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (u: UserRow) => {
        const newStatus = u.status === 'ACTIVE' ? 'inactive' : 'active';
        try {
            await usersApi.toggleStatus(u.id, newStatus);
            await refreshUsers();
            toast({ title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
        } catch (e: any) {
            toast({ title: e?.message || 'Failed to update status', variant: 'destructive' });
        }
    };

    const handleResetPassword = async () => {
        if (!resetUser || newPassword.length < 8) return;
        setSaving(true);
        try {
            await usersApi.resetPassword(resetUser.id, newPassword);
            setResetUser(null);
            setNewPassword('');
            toast({ title: 'Password reset successfully' });
        } catch (e: any) {
            toast({ title: e?.message || 'Failed to reset password', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold">User Management</h1><p className="text-muted-foreground text-sm">Manage system users and their roles</p></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Button onClick={() => setCreateOpen(true)} className="gap-2"><UserPlus className="w-4 h-4" /> Add User</Button>
            </div>

            <Card>
                <CardContent className="pt-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">Loading users...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead><TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                        <TableCell><Badge className={roleColors[u.role] || 'bg-gray-100 text-gray-700'}>{u.role}</Badge></TableCell>
                                        <TableCell><Badge className={u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{u.status}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit Role" onClick={() => { setEditUser(u); setEditRole(u.role); }}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Reset Password" onClick={() => { setResetUser(u); setNewPassword(''); }}>
                                                    <Key className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(u)}>
                                                    <Power className={`w-3.5 h-3.5 ${u.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}`} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No users found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create User Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent><DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Full Name *</label><Input className="mt-1" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
                        <div><label className="text-sm font-medium">Email *</label><Input className="mt-1" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
                        <div><label className="text-sm font-medium">Role *</label>
                            <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    {Object.values(UserRole).filter(r => r !== UserRole.PLATFORM_ADMIN).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><label className="text-sm font-medium">Temporary Password *</label><PasswordInput className="mt-1" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></div>
                        <Alert><AlertDescription className="text-xs">User will be required to change password on first login.</AlertDescription></Alert>
                        <Button className="w-full" disabled={!newUser.name || !newUser.email || !newUser.role || !newUser.password || saving} onClick={handleCreate}>
                            {saving ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Role Modal */}
            <Dialog open={!!editUser} onOpenChange={v => !v && setEditUser(null)}>
                <DialogContent><DialogHeader><DialogTitle>Edit Role — {editUser?.name}</DialogTitle></DialogHeader>
                    {editUser && (
                        <div className="space-y-4">
                            <div><label className="text-sm font-medium">Role</label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.values(UserRole).filter(r => r !== UserRole.PLATFORM_ADMIN).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" disabled={saving || editRole === editUser.role} onClick={handleEditRoleSave}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reset Password Modal */}
            <Dialog open={!!resetUser} onOpenChange={v => !v && setResetUser(null)}>
                <DialogContent><DialogHeader><DialogTitle>Reset Password — {resetUser?.name}</DialogTitle></DialogHeader>
                    {resetUser && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">New Password (min 8 chars)</label>
                                <PasswordInput className="mt-1" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <Button className="w-full" disabled={newPassword.length < 8 || saving} onClick={handleResetPassword}>
                                {saving ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
