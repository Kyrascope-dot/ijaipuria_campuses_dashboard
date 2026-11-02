import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB } from "@/lib/db";
import { getStudentModel } from "@/models/Student";
import { getGroupModel } from "@/models/Group";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const url = new URL(request.url);
  const siteKey = url.searchParams.get("siteKey") ?? "jimn";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")));
  const search = url.searchParams.get("search") ?? "";
  const sortBy = url.searchParams.get("sortBy") ?? "first_name";
  const sortOrder = url.searchParams.get("sortOrder") === "desc" ? -1 : 1;
  const role = url.searchParams.get("role") ?? "";
  const courseStatus = url.searchParams.get("courseStatus") ?? "";
  const batch = url.searchParams.get("batch") ?? "";
  const academicYear = url.searchParams.get("academicYear") ?? "";
  const groupName = url.searchParams.get("group") ?? "";
  const registeredAfter = url.searchParams.get("registeredAfter") ?? "";
  const registeredBefore = url.searchParams.get("registeredBefore") ?? "";

  await connectDB();
  const Student = getStudentModel(siteKey);
  const Group = getGroupModel(siteKey);

  const filter: any = { siteKey };

  // Text search
  if (search) {
    filter.$or = [
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { display_name: { $regex: search, $options: "i" } },
    ];
  }

  // Role filter
  if (role) {
    filter.roles = role;
  }

  // Course status filter (students who have at least one course with this status)
  if (courseStatus) {
    filter["courses.status"] = courseStatus;
  }

  // Batch filter
  if (batch) {
    filter.batch = batch;
  }

  // Academic year filter
  if (academicYear) {
    filter.academicYear = academicYear;
  }

  // Group filter — use Group collection's studentIds for accurate mapping
  if (groupName) {
    const group = await Group.findOne({ siteKey, title: groupName }).lean();
    if (group && group.studentIds.length > 0) {
      filter.wpId = { ...(filter.wpId ?? {}), $in: group.studentIds };
    } else {
      filter.wpId = -1; // no match
    }
  }

  // Registration date range
  if (registeredAfter) {
    filter.registered_at = { ...(filter.registered_at ?? {}), $gte: registeredAfter };
  }
  if (registeredBefore) {
    filter.registered_at = { ...(filter.registered_at ?? {}), $lte: registeredBefore };
  }

  const skip = (page - 1) * limit;
  const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder as 1 | -1 };

  const [students, total] = await Promise.all([
    Student.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),
    Student.countDocuments(filter),
  ]);

  return NextResponse.json({
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
