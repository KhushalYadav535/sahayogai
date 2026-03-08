'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { membersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function BulkImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ imported: number; failed: number; results: any[]; errors: any[] } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({ title: 'Invalid File', description: 'Please select a CSV file.', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await membersApi.getBulkImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'member_import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Template Downloaded', description: 'CSV template downloaded successfully.' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: 'No File', description: 'Please select a CSV file to import.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const members: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const member: any = {};
        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          if (header === 'dateOfBirth' && value) {
            member[header] = value;
          } else if (header === 'gender' && value) {
            member[header] = value.toLowerCase();
          } else if (value) {
            member[header] = value;
          }
        });
        if (Object.keys(member).length > 0) {
          members.push(member);
        }
      }

      const res = await membersApi.bulkImport({ members });
      setResults(res);
      toast({
        title: 'Import Completed',
        description: `Successfully imported ${res.imported} members. ${res.failed} failed.`,
      });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Member Import</h1>
          <p className="text-muted-foreground mt-1">Import multiple members from CSV file</p>
        </div>
        <Link href="/dashboard/members">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Members
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Members</CardTitle>
          <CardDescription>
            Download the template CSV file, fill in member details, and upload it here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <div className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {file ? file.name : 'Select CSV File'}
                  </span>
                </Button>
              </label>
            </div>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? 'Importing...' : 'Import Members'}
            </Button>
          </div>

          {file && (
            <Alert>
              <AlertDescription>
                Selected file: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              {results.imported} members imported successfully, {results.failed} failed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.results.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Successful Imports ({results.results.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Member Number</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.row}</TableCell>
                        <TableCell className="font-semibold">{r.memberNumber}</TableCell>
                        <TableCell>
                          <span className="text-green-600">{r.status}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {results.errors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Errors ({results.errors.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.errors.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{e.row}</TableCell>
                        <TableCell>{e.member}</TableCell>
                        <TableCell className="text-red-600">{e.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
