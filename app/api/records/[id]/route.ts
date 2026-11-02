import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB } from "@/lib/db";
import { getStudentModel } from "@/models/Student";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/records/[id]">
) {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const siteKey = url.searchParams.get("siteKey") ?? "jimn";

  await connectDB();
  const Student = getStudentModel(siteKey);

  const student = await Student.findById(id).select("-__v").lean();
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student });
}
