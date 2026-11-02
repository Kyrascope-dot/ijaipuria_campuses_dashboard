import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB } from "@/lib/db";
import { SyncLog } from "@/models/SyncLog";

export async function GET() {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  await connectDB();
  const logs = await SyncLog.find().sort({ startedAt: -1 }).limit(10).lean();
  return NextResponse.json({ logs });
}
