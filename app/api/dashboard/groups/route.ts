import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB } from "@/lib/db";
import { getGroupModel } from "@/models/Group";
import { getStudentModel } from "@/models/Student";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const url = new URL(request.url);
  const siteKey = url.searchParams.get("siteKey") ?? "jimn";

  await connectDB();
  const Group = getGroupModel(siteKey);
  const Student = getStudentModel(siteKey);

  const groups = await Group.find({ siteKey })
    .sort({ title: 1 })
    .select("-__v")
    .lean();

  const batches = [
    ...new Set(
      groups.filter((g) => g.batch).map((g) => g.batch as string),
    ),
  ].sort();

  const academicYears = [
    ...new Set(
      groups.filter((g) => g.academicYear).map((g) => g.academicYear as string),
    ),
  ].sort();

  const trimesters = [
    ...new Set(
      groups.filter((g) => g.trimester != null).map((g) => g.trimester as number),
    ),
  ].sort((a, b) => a - b);

  // Get unique course titles from student data
  const courseTitles = await Student.aggregate([
    { $match: { siteKey } },
    { $unwind: "$courses" },
    { $group: { _id: "$courses.course_id", title: { $first: "$courses.title" } } },
    { $sort: { title: 1 } },
  ]);

  return NextResponse.json({
    groups,
    batches,
    academicYears,
    trimesters,
    courseTitles: courseTitles.map((c) => ({ id: c._id, title: c.title })),
  });
}
