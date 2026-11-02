import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { getSiteConfigs } from "@/lib/sites";

const SITE_DISPLAY_NAMES: Record<string, string> = {
  jimn: "Noida",
  jiml: "Lucknow",
  jimj: "Jaipur",
  jimi: "Indore",
};

export async function GET() {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const sites = getSiteConfigs().map((s) => ({
    key: s.key,
    label: SITE_DISPLAY_NAMES[s.key] ?? s.label,
  }));

  return NextResponse.json({ sites });
}
