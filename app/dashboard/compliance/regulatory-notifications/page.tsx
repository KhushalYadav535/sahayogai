"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";

export default function RegulatoryNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.regulatoryNotifications(unreadOnly);
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "MEDIUM":
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regulatory Change Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with regulatory changes and compliance requirements</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Unread Only
          </label>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Alert key={notification.id} className={notification.priority === "HIGH" ? "border-red-500" : ""}>
              <div className="flex items-start gap-4">
                {getPriorityIcon(notification.priority)}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                    </div>
                    {getPriorityBadge(notification.priority)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    <span>Issued by: {notification.issuedBy}</span>
                    <span>Issued: {new Date(notification.issuedDate).toLocaleDateString()}</span>
                    <span>Effective: {new Date(notification.effectiveDate).toLocaleDateString()}</span>
                    <Badge variant="outline" className="ml-auto">{notification.category}</Badge>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
