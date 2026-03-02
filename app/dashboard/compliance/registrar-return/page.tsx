'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/formatters';
import { Download, FileText, CheckCircle, Send } from 'lucide-react';

const returnData = {
    fy: '2025-26',
    socName: 'Sahayog Co-operative Credit Society Ltd.',
    regNo: 'MH-COOP-2019-001',
    state: 'Maharashtra',
    dueDate: '30 September 2026',
    auditorName: 'M/s Sharma & Associates',
    auditorReg: 'ICAI-005421',
    auditDate: '15 August 2026',
    auditClass: 'A',
};

const scheduleSections = [
    { ref: 'Form A – Part I', title: 'General Information', status: 'COMPLETE', fields: [['Society Name', returnData.socName], ['Registration No.', returnData.regNo], ['State', returnData.state], ['Address', 'Survey No. 14, Pimpri-Chinchwad, Pune – 411033'], ['Working Area', 'Pimpri-Chinchwad Municipal Corporation']] },
    { ref: 'Form A – Part II', title: 'Membership Details', status: 'COMPLETE', fields: [['Members (Opening)', '420'], ['New Members', '42'], ['Resigned', '8'], ['Deceased', '2'], ['Members (Closing)', '452'], ['Share Capital Paid Up', formatCurrency(4520000)]] },
    { ref: 'Form A – Part III', title: 'Financial Summary', status: 'COMPLETE', fields: [['Total Deposits', formatCurrency(47280000)], ['Loans Outstanding', formatCurrency(23200000)], ['Net Surplus', formatCurrency(1420000)], ['Reserve Fund', formatCurrency(1820000)]] },
    { ref: 'Form A – Part IV', title: 'Audit Details', status: 'REVIEW', fields: [['Auditor Name', returnData.auditorName], ['Audit Reg. No.', returnData.auditorReg], ['Date of Audit', returnData.auditDate], ['Audit Class', returnData.auditClass], ['Defects (if any)', 'Nil']] },
    { ref: 'Form A – Part V', title: 'Compliance Declarations', status: 'COMPLETE', fields: [['AGM Held', 'Yes – 25 September 2025'], ['Election Due', 'No'], ['By-laws Amendment', 'No'], ['BOD Composition', 'As per Act']] },
];

const STATUS_STYLE: Record<string, string> = { COMPLETE: 'bg-green-100 text-green-800', REVIEW: 'bg-amber-100 text-amber-800' };

export default function RegistrarReturnPage() {
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [presSign, setPresSign] = useState('');
    const [secSign, setSecSign] = useState('');

    const allComplete = scheduleSections.every(s => s.status === 'COMPLETE');

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Registrar Annual Return</h1>
                    <p className="text-muted-foreground text-sm">Form A — State Registrar of Co-operative Societies — Due {returnData.dueDate}</p>
                </div>
                <div className="flex gap-2">
                    {generated && <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Download Form A</Button>}
                    <Button onClick={async () => { setGenerating(true); await new Promise(r => setTimeout(r, 1800)); setGenerating(false); setGenerated(true); }} disabled={generating || generated || !allComplete} className="gap-2">
                        <FileText className="w-4 h-4" />{generating ? 'Generating...' : generated ? 'Generated ✓' : 'Generate Form A'}
                    </Button>
                </div>
            </div>

            {!allComplete && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                    <AlertDescription className="text-amber-700 text-sm">Some sections require review before the return can be generated. Please complete all sections.</AlertDescription>
                </Alert>
            )}

            {/* Progress */}
            <div className="flex gap-2 flex-wrap">
                {scheduleSections.map(s => (
                    <div key={s.ref} className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${s.status === 'COMPLETE' ? 'border-green-300 bg-green-50 dark:bg-green-950 text-green-700' : 'border-amber-300 bg-amber-50 dark:bg-amber-950 text-amber-700'}`}>
                        {s.status === 'COMPLETE' && <CheckCircle className="w-3 h-3" />}
                        {s.ref}
                    </div>
                ))}
            </div>

            <Tabs defaultValue="0">
                <TabsList className="grid grid-cols-5 w-full text-[10px]">
                    {scheduleSections.map((s, i) => (
                        <TabsTrigger key={i} value={String(i)} className="truncate">{s.ref.split(' – ')[1]}</TabsTrigger>
                    ))}
                </TabsList>
                {scheduleSections.map((section, i) => (
                    <TabsContent key={i} value={String(i)}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-sm">
                                    <span>{section.ref} — {section.title}</span>
                                    <Badge className={STATUS_STYLE[section.status]}>{section.status}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y divide-border">
                                    {section.fields.map(([k, v]) => (
                                        <div key={k} className="flex justify-between py-2.5 text-sm">
                                            <span className="text-muted-foreground">{k}</span>
                                            <span className="font-medium text-right max-w-[200px]">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Declarations */}
            <Card>
                <CardHeader><CardTitle className="text-sm">Declaration & Signatures</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Alert><AlertDescription className="text-xs">We hereby declare that the information furnished in this Annual Return is true and correct to the best of our knowledge and belief, and nothing has been wilfully concealed or omitted.</AlertDescription></Alert>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">President Signature / Stamp</label>
                            <Input className="mt-1" placeholder="Type name to sign digitally" value={presSign} onChange={e => setPresSign(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Secretary Signature / Stamp</label>
                            <Input className="mt-1" placeholder="Type name to sign digitally" value={secSign} onChange={e => setSecSign(e.target.value)} />
                        </div>
                    </div>
                    {generated && !submitted && (
                        <Button className="w-full gap-2" disabled={!presSign || !secSign || submitting} onClick={async () => { setSubmitting(true); await new Promise(r => setTimeout(r, 2000)); setSubmitting(false); setSubmitted(true); }}>
                            <Send className="w-4 h-4" />{submitting ? 'Submitting to Registrar Portal...' : 'File with State Registrar'}
                        </Button>
                    )}
                    {submitted && (
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700">Return filed successfully. Acknowledgement No: MH-ANN-2026-00341. Download filed copy for your records.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
