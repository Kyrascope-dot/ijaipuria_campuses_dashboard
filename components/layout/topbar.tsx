"use client";

import { usePathname } from "next/navigation";
import { useSyncData } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/analytics": "Analytics",
  "/dashboard/reports": "Course Reports",
  "/dashboard/records": "Student Reports",
  "/dashboard/settings": "Settings",
};

function getBreadcrumb(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
}

export function Topbar() {
  const pathname = usePathname();
  const sync = useSyncData();
  const title = titles[pathname] ?? "Dashboard";
  const breadcrumb = getBreadcrumb(pathname);

  const handleSync = () => {
    const t = toast.loading("Syncing data from all campuses...");
    sync.mutate(undefined, {
      onSuccess: () => {
        toast.success("Sync complete for all campuses", { id: t });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.error ?? "Sync failed", { id: t });
      },
    });
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-card">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <nav className="text-xs text-muted-foreground">
          {breadcrumb.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">/</span>}
              {part}
            </span>
          ))}
        </nav>
      </div>
      <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
        {sync.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Sync Data
      </Button>
    </header>
  );
}
