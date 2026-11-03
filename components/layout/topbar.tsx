"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/overall": "Overall",
  "/dashboard/campus-wise": "Campus Wise",
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
  const title = titles[pathname] ?? "Dashboard";
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6 border-b bg-card">
      <div className="pl-10 lg:pl-0">
        <h1 className="text-lg lg:text-xl font-semibold">{title}</h1>
        <nav className="text-xs text-muted-foreground hidden sm:block">
          {breadcrumb.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">/</span>}
              {part}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
