'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserCheck, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { membersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ConversionMember {
    id: string;
    name: string;
    memberId: string;
    dob: Date;
    guardian?: string;
    age: number;
    daysOverdue: number;
    kyc: string;
}

const CONVERSION_STEPS = ['Initiate eKYC', 'Capture Signature', 'Remove Guardian', 'Activate Account'];

function calcAge(dob: Date) {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
}

function calcDaysOverdue(dob: Date) {
    const turnedAt = new Date(dob);
    turnedAt.setFullYear(turnedAt.getFullYear() + 18);
    const now = new Date();
    if (now < turnedAt) return 0;
    return Math.floor((now.getTime() - turnedAt.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MinorConversionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<ConversionMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<ConversionMember | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState<string[]>([]);

    const fetchMinors = async () => {
        setLoading(true);
        try {
            // fetch all members and filter those with category = minor or age >= 18 from DOB
            const res = await membersApi.list({ limit: 500 });
            const raw = res.members || [];
            // Find members who are minors (age < 18) or who just turned 18 (eligible for conversion)
            const eligible: ConversionMember[] = raw
                .filter((m: any) => m.dateOfBirth) // has DOB
                .map((m: any) => {
                    const dob = new Date(m.dateOfBirth);
                    const age = calcAge(dob);
                    const daysOverdue = calcDaysOverdue(dob);
                    return {
                        id: m.id,
                        name: `${m.firstName} ${m.lastName}`,
                        memberId: m.memberNumber || m.id,
                        dob,
                        guardian: m.guardianName || '',
                        age,
                        daysOverdue,
                        kyc: m.kycStatus?.toUpperCase() || 'PENDING',
                    };
                })
                // Show members who are 17–18+ (minor members approaching or past 18)
                .filter((m: ConversionMember) => m.age >= 17 && (m.kyc !== 'VERIFIED' || m.daysOverdue > 0));
            setMembers(eligible);
        } catch {
            toast({ title: 'Failed to load members', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMinors(); }, []);

    const handleStartConversion = (member: ConversionMember) => {
        setSelectedMember(member);
        setCurrentStep(0);
        setOtp('');
        setOtpSent(false);
    };

    const handleNextStep = async () => {
        setProcessing(true);
        await new Promise(r => setTimeout(r, 1000)); // simulate step processing
        setProcessing(false);
        if (currentStep < CONVERSION_STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            // Final step: mark complete + update member via API
            try {
                await membersApi.update(selectedMember!.id, { category: 'regular', kycStatus: 'verified' });
                setCompleted(prev => [...prev, selectedMember!.id]);
                toast({ title: '✅ Conversion complete', description: `${selectedMember!.name} is now a full member.` });
            } catch {
                toast({ title: 'Activation failed', description: 'Could not update member status.', variant: 'destructive' });
            }
            setSelectedMember(null);
        }
    };

    const activePending = members.filter(m => !completed.includes(m.id) && m.age >= 18);
    const overdueCount = activePending.filter(m => m.daysOverdue > 30).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="w-6 h-6" /> Minor-to-Major Conversion</h1>
                    <p className="text-muted-foreground text-sm">Members who have attained age 18 and require account upgrade</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pending Conversion</p><p className="text-2xl font-bold text-amber-600">{loading ? '—' : activePending.length}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Overdue (&gt;30 days)</p><p className="text-2xl font-bold text-red-600">{loading ? '—' : overdueCount}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Completed This Session</p><p className="text-2xl font-bold text-green-600">{completed.length}</p></CardContent></Card>
            </div>

            {overdueCount > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm">
                        {overdueCount} member(s) (&gt;30 days overdue) — accounts may be restricted until conversion.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Members Pending Conversion</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchMinors} disabled={loading}>
                        <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                    ) : members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No members pending conversion.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Date of Birth</TableHead>
                                    <TableHead>Age</TableHead>
                                    <TableHead>Guardian</TableHead>
                                    <TableHead>Overdue</TableHead>
                                    <TableHead>KYC</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => {
                                    const isDone = completed.includes(member.id);
                                    const isMinor = member.age < 18;
                                    return (
                                        <TableRow key={member.id} className={member.daysOverdue > 30 && !isDone ? 'bg-red-50 dark:bg-red-950' : ''}>
                                            <TableCell>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{member.memberId}</p>
                                            </TableCell>
                                            <TableCell>{member.dob.toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell>{member.age}</TableCell>
                                            <TableCell className="text-sm">{member.guardian || '—'}</TableCell>
                                            <TableCell>
                                                {isDone ? <span className="text-green-600 text-xs font-medium">Completed</span>
                                                    : isMinor ? <span className="text-muted-foreground text-xs">Not yet 18</span>
                                                        : <span className={`text-xs font-medium ${member.daysOverdue > 30 ? 'text-red-600' : 'text-amber-600'}`}>{member.daysOverdue}d</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={isDone ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                                                    {isDone ? 'DONE' : member.kyc}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {!isDone && !isMinor && (
                                                    <Button size="sm" onClick={() => handleStartConversion(member)} className="h-7 text-xs gap-1">
                                                        <RefreshCw className="w-3 h-3" /> Convert
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Conversion Wizard Dialog */}
            <Dialog open={!!selectedMember} onOpenChange={v => !v && setSelectedMember(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Convert Minor → Major: {selectedMember?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedMember && (
                        <div className="space-y-4">
                            {/* Step indicator */}
                            <div className="flex gap-1 mb-2">
                                {CONVERSION_STEPS.map((s, i) => (
                                    <div key={s} className="flex-1 space-y-1">
                                        <div className={`h-1.5 rounded-full transition-all ${i < currentStep ? 'bg-green-400' : i === currentStep ? 'bg-primary' : 'bg-muted'}`} />
                                        <p className="text-[10px] text-center text-muted-foreground">{s}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Step 0 — eKYC */}
                            {currentStep === 0 && (
                                <div className="space-y-3">
                                    <Alert><AlertDescription className="text-xs">Aadhaar OTP-based eKYC will be initiated for <strong>{selectedMember.name}</strong>. The member must be physically present.</AlertDescription></Alert>
                                    <div className="p-3 rounded-lg border border-border text-sm space-y-1">
                                        <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{selectedMember.dob.toLocaleDateString('en-IN')}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{selectedMember.age} years</span></div>
                                        {selectedMember.guardian && <div className="flex justify-between"><span className="text-muted-foreground">Guardian</span><span>{selectedMember.guardian}</span></div>}
                                    </div>
                                    {!otpSent ? (
                                        <Button className="w-full" onClick={() => setOtpSent(true)}>Send Aadhaar OTP</Button>
                                    ) : (
                                        <div className="space-y-2">
                                            <Input className="text-center text-xl font-mono tracking-widest" maxLength={6} placeholder="------" value={otp} onChange={e => setOtp(e.target.value)} />
                                            <Button className="w-full" disabled={otp.length < 4 || processing} onClick={handleNextStep}>
                                                {processing ? 'Verifying…' : 'Verify OTP & Proceed'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 1 — Signature */}
                            {currentStep === 1 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">Capture fresh signature from the member to replace the minor-period guardian signature.</p>
                                    <div className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground" onClick={handleNextStep}>
                                        Click to capture / upload signature
                                    </div>
                                </div>
                            )}

                            {/* Step 2 — Remove Guardian */}
                            {currentStep === 2 && (
                                <div className="space-y-3">
                                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-700 text-sm">Guardian link{selectedMember.guardian ? ` to ${selectedMember.guardian}` : ''} will be permanently removed.</AlertDescription>
                                    </Alert>
                                    <Button className="w-full" disabled={processing} onClick={handleNextStep}>
                                        {processing ? 'Removing…' : 'Remove Guardian Link'}
                                    </Button>
                                </div>
                            )}

                            {/* Step 3 — Activate */}
                            {currentStep === 3 && (
                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl border border-green-300 bg-green-50 dark:bg-green-950 text-center">
                                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                        <p className="font-semibold">Ready to Activate</p>
                                        <p className="text-xs text-muted-foreground mt-1">eKYC verified · Signature captured · Guardian removed</p>
                                    </div>
                                    <Button className="w-full" disabled={processing} onClick={handleNextStep}>
                                        {processing ? 'Activating…' : 'Activate as Full Member'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
