"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CreditCard, MessageSquare, FileUp, FileDown, Building2, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

const integrations = [
  {
    category: "Must Have (R1)",
    items: [
      {
        id: "INT-001",
        name: "Aadhaar eKYC (UIDAI)",
        status: "implemented",
        description: "OTP-based Aadhaar verification for member KYC",
        href: "/dashboard/integrations/aadhaar-ekyc",
        icon: <Shield className="w-5 h-5" />,
      },
      {
        id: "INT-002",
        name: "UPI Payment Collection",
        status: "implemented",
        description: "Dynamic QR codes and payment links for UPI transactions",
        href: "/dashboard/integrations/upi",
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        id: "INT-005",
        name: "SMS Gateway (TRAI DLT)",
        status: "implemented",
        description: "Transactional SMS with DLT template support",
        href: "/dashboard/integrations/sms",
        icon: <MessageSquare className="w-5 h-5" />,
      },
      {
        id: "INT-014",
        name: "Bulk Import/Export",
        status: "implemented",
        description: "CSV templates for members, loans, deposits",
        href: "/dashboard/integrations/bulk-import-export",
        icon: <FileUp className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "Should Have (R1-R2)",
    items: [
      {
        id: "INT-011",
        name: "Payment Gateway (Razorpay/PayU)",
        status: "implemented",
        description: "Online payment gateway integration",
        href: "/dashboard/integrations/payment-gateway",
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        id: "INT-003",
        name: "NACH Auto-Debit",
        status: "implemented",
        description: "Automated recurring payment mandates",
        href: "/dashboard/integrations/nach",
        icon: <Building2 className="w-5 h-5" />,
      },
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Third-Party Integrations</h1>
        <p className="text-muted-foreground mt-2">Manage external service integrations</p>
      </div>

      <Tabs defaultValue="must-have" className="space-y-4">
        <TabsList>
          <TabsTrigger value="must-have">Must Have (R1)</TabsTrigger>
          <TabsTrigger value="should-have">Should Have (R1-R2)</TabsTrigger>
          <TabsTrigger value="could-have">Could Have (R2-R3)</TabsTrigger>
        </TabsList>

        <TabsContent value="must-have">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations[0].items.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{integration.id}</CardDescription>
                      </div>
                    </div>
                    <Badge className={integration.status === "implemented" ? "bg-green-500" : "bg-yellow-500"}>
                      {integration.status === "implemented" ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Implemented</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" />Pending</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                  <Link href={integration.href}>
                    <Button variant="outline" className="w-full">Configure</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="should-have">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations[1].items.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{integration.id}</CardDescription>
                      </div>
                    </div>
                    <Badge className={integration.status === "implemented" ? "bg-green-500" : "bg-yellow-500"}>
                      {integration.status === "implemented" ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Implemented</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" />Pending</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                  <Link href={integration.href}>
                    <Button variant="outline" className="w-full">Configure</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="could-have">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Could Have integrations will be implemented in R2-R3</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
