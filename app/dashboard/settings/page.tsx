"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { useSyncStatus, useSyncData } from "@/hooks/use-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Loader2, Globe, Database, User } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const sync = useSyncData();

  const handleSync = () => {
    const t = toast.loading("Syncing data...");
    sync.mutate(undefined, {
      onSuccess: (data) => toast.success(`Synced ${data.totalFetched} students`, { id: t }),
      onError: (err: any) => toast.error(err?.response?.data?.error ?? "Failed", { id: t }),
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* User info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user?.name}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email}</dd>
            <dt className="text-muted-foreground">Role</dt>
            <dd><Badge variant="secondary">{user?.role}</Badge></dd>
          </dl>
        </CardContent>
      </Card>

      {/* Connected websites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Connected Websites
          </CardTitle>
          <CardDescription>Websites configured for data synchronization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">JIMN Campus</p>
              <p className="text-sm text-muted-foreground">jimn.ijaipuria.com</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Active</Badge>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
                {sync.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Sync Now
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            More websites will be added after client approval of the first dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Data is synced from the website API and stored in MongoDB. Each sync fetches all students and updates existing records (upsert by WordPress user ID).</p>
          <p>Click "Sync Data" in the top bar or the button above to pull the latest data.</p>
        </CardContent>
      </Card>
    </div>
  );
}
