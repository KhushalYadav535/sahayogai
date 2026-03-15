'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { loanProductsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Edit, CheckCircle, XCircle, Clock, Loader2, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900',
  SUPERSEDED: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  DEACTIVATED: 'bg-red-100 text-red-800 dark:bg-red-900',
};

const categoryColors: Record<string, string> = {
  PERSONAL: 'bg-purple-100 text-purple-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  HOUSING: 'bg-blue-100 text-blue-800',
  AGRICULTURE: 'bg-green-100 text-green-800',
  VEHICLE: 'bg-orange-100 text-orange-800',
  EDUCATION: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function LoanProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      
      const response = await loanProductsApi.list(params);
      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load loan products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewProduct = async (productId: string) => {
    try {
      const response = await loanProductsApi.get(productId);
      if (response.success) {
        setSelectedProduct(response.product);
        setIsViewDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Products</h1>
          <p className="text-muted-foreground">Manage loan product master and configurations</p>
        </div>
        <Link href="/dashboard/loans/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                  <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="HOUSING">Housing</SelectItem>
                  <SelectItem value="AGRICULTURE">Agriculture</SelectItem>
                  <SelectItem value="VEHICLE">Vehicle</SelectItem>
                  <SelectItem value="EDUCATION">Education</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchProducts} variant="outline" className="w-full">
                <Loader2 className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Products ({filteredProducts.length})</CardTitle>
          <CardDescription>All loan products configured in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No loan products found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interest Scheme</TableHead>
                  <TableHead>Repayment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono font-medium">{product.productCode}</TableCell>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[product.category] || categoryColors.OTHER}>
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[product.status] || statusColors.DRAFT}>
                        {product.status === 'PENDING_APPROVAL' && <Clock className="w-3 h-3 mr-1" />}
                        {product.status === 'ACTIVE' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {product.status === 'DEACTIVATED' && <XCircle className="w-3 h-3 mr-1" />}
                        {product.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.interestScheme ? (
                        <span className="text-sm">{product.interestScheme.schemeCode}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{product.repaymentStructure}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProduct(product.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {product.status === 'DRAFT' && (
                          <Link href={`/dashboard/loans/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        {/* BRD v5.0 LN-P07: Version History Link */}
                        <Link href={`/dashboard/loans/products/${product.id}/versions`}>
                          <Button variant="ghost" size="sm" title="View Version History">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              {selectedProduct?.productCode} - {selectedProduct?.productName}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Product Code</Label>
                  <p className="font-mono">{selectedProduct.productCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedProduct.status]}>
                    {selectedProduct.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{selectedProduct.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Repayment Structure</Label>
                  <p>{selectedProduct.repaymentStructure}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Fee Structure</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span>
                      {selectedProduct.processingFeeType === 'PERCENTAGE'
                        ? `${selectedProduct.processingFeeValue}%`
                        : `₹${selectedProduct.processingFeeValue}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documentation Charge:</span>
                    <span>₹{selectedProduct.documentationCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST on Fees:</span>
                    <span>{selectedProduct.gstOnFees}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
