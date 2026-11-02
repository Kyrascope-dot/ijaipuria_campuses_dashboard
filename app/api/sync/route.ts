import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { getSiteConfig, getSiteConfigs } from "@/lib/sites";
import { syncSite } from "@/services/sync";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const body = await request.json().catch(() => ({}));
  const siteKey: string = body.siteKey ?? getSiteConfigs()[0]?.key;

  const site = getSiteConfig(siteKey);
  if (!site) {
    return NextResponse.json({ error: `Site "${siteKey}" not configured` }, { status: 400 });
  }

  try {
    const result = await syncSite(site);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Sync failed" }, { status: 500 });
  }
}
