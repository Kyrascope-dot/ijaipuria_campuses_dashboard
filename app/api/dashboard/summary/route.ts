import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB } from "@/lib/db";
import { getStudentModel } from "@/models/Student";
import { getGroupModel } from "@/models/Group";
import { SyncLog } from "@/models/SyncLog";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const url = new URL(request.url);
  const siteKey = url.searchParams.get("siteKey") ?? "jimn";
  const filterBatch = url.searchParams.get("batch") ?? "";
  const filterTrimester = url.searchParams.get("trimester") ?? "";
  const filterCourseId = url.searchParams.get("courseId") ?? "";
  const filterAcademicYear = url.searchParams.get("academicYear") ?? "";

  await connectDB();
  const Student = getStudentModel(siteKey);
  const Group = getGroupModel(siteKey);

  // ── Build student filter from group-based filters ──
  const studentFilter: any = { siteKey };
  let courseIdFilter: number[] | null = null;

  // If academic year filter is active, convert it to a batch filter
  // "2026-27" → match batches starting with "2026"
  let effectiveBatch = filterBatch;
  if (filterAcademicYear && !filterBatch) {
    const ayMatch = filterAcademicYear.match(/^(\d{4})/);
    if (ayMatch) {
      const startYear = ayMatch[1];
      const batchGroups = await Group.find({
        siteKey,
        batch: { $regex: new RegExp(`^Batch ${startYear}`) },
      }).select("batch").lean();
      const matchedBatch = batchGroups[0]?.batch;
      if (matchedBatch) effectiveBatch = matchedBatch;
    }
  }

  // If batch or trimester filter is active, find matching groups → filter students by wpId
  if (effectiveBatch || filterTrimester) {
    const groupQuery: any = { siteKey };
    if (effectiveBatch) groupQuery.batch = effectiveBatch;
    if (filterTrimester) groupQuery.trimester = parseInt(filterTrimester, 10);

    const matchingGroups = await Group.find(groupQuery).select("studentIds courseIds").lean();
    const studentWpIds = [...new Set(matchingGroups.flatMap((g) => g.studentIds))];
    studentFilter.wpId = { $in: studentWpIds };

    // Restrict courses to those assigned in the matching groups
    const groupCourseIds = [...new Set(matchingGroups.flatMap((g) => g.courseIds))];
    if (groupCourseIds.length > 0) {
      courseIdFilter = groupCourseIds;
    }
  }

  // Course-level filters for aggregation
  const courseMatch: any = {};
  if (filterCourseId) {
    courseMatch["courses.course_id"] = parseInt(filterCourseId, 10);
  }
  if (courseIdFilter && courseIdFilter.length > 0) {
    courseMatch["courses.course_id"] = { ...(courseMatch["courses.course_id"] ? { $eq: courseMatch["courses.course_id"] } : {}), $in: courseIdFilter };
  }

  // ── Queries ──
  const [totalStudents, lastSync, lastSyncWithCourses] = await Promise.all([
    Student.countDocuments(studentFilter),
    SyncLog.findOne({ siteKey, status: "completed" }).sort({ completedAt: -1 }).lean(),
    SyncLog.findOne({ siteKey, status: "completed", allCoursesCount: { $gt: 0 } }).sort({ completedAt: -1 }).lean(),
  ]);

  // Course distribution with filters
  const coursePipeline: any[] = [
    { $match: studentFilter },
    { $unwind: "$courses" },
  ];
  if (filterCourseId) {
    coursePipeline.push({ $match: { "courses.course_id": parseInt(filterCourseId, 10) } });
  }
  if (courseIdFilter && courseIdFilter.length > 0 && !filterCourseId) {
    coursePipeline.push({ $match: { "courses.course_id": { $in: courseIdFilter } } });
  }
  coursePipeline.push(
    {
      $group: {
        _id: "$courses.course_id",
        title: { $first: "$courses.title" },
        enrolled: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ["$courses.status", "completed"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$courses.status", "in_progress"] }, 1, 0] } },
        notStarted: { $sum: { $cond: [{ $eq: ["$courses.status", "not_started"] }, 1, 0] } },
        avgPercentage: {
          $avg: {
            $cond: [
              { $eq: ["$courses.status", "completed"] },
              100,
              "$courses.percentage",
            ],
          },
        },
      },
    },
    { $sort: { enrolled: -1 } },
  );

  const courseDistribution = await Student.aggregate(coursePipeline);

  // Compute totals from course distribution (more accurate with filters)
  const totalCoursesEnrolled = courseDistribution.reduce((s, c) => s + c.enrolled, 0);
  const totalCoursesCompleted = courseDistribution.reduce((s, c) => s + c.completed, 0);
  const totalCoursesInProgress = courseDistribution.reduce((s, c) => s + c.inProgress, 0);

  const uniqueCourses = courseDistribution.length;

  let courseOfferingCount: number;
  if (effectiveBatch || filterTrimester) {
    const offeringGroupQuery: any = { siteKey };
    if (effectiveBatch) offeringGroupQuery.batch = effectiveBatch;
    if (filterTrimester) offeringGroupQuery.trimester = parseInt(filterTrimester, 10);
    const filteredGroupCourses = await Group.aggregate([
      { $match: offeringGroupQuery },
      { $unwind: "$courses" },
      { $group: { _id: "$courses.id" } },
    ]);
    courseOfferingCount = filteredGroupCourses.length || uniqueCourses;
  } else {
    const storedCount = (lastSyncWithCourses as any)?.allCoursesCount;
    if (storedCount && storedCount > 0) {
      courseOfferingCount = storedCount;
    } else {
      const allGroupCourses = await Group.aggregate([
        { $match: { siteKey } },
        { $unwind: "$courses" },
        { $group: { _id: "$courses.id" } },
      ]);
      courseOfferingCount = allGroupCourses.length || uniqueCourses;
    }
  }

  const completionRate =
    totalCoursesEnrolled > 0
      ? Math.round((totalCoursesCompleted / totalCoursesEnrolled) * 10000) / 100
      : 0;

  // Batch distribution from groups
  const batchDistribution = await Group.aggregate([
    { $match: { siteKey, batch: { $ne: null } } },
    {
      $group: {
        _id: "$batch",
        academicYear: { $first: "$academicYear" },
        count: { $sum: "$totalStudents" },
        groupCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Group distribution
  const groupDistribution = await Group.find({ siteKey })
    .sort({ title: 1 })
    .select("wpId title batch academicYear trimester totalStudents totalCourses")
    .lean();

  return NextResponse.json({
    totalStudents,
    uniqueCourses,
    courseOfferingCount,
    totalCoursesEnrolled,
    totalCoursesCompleted,
    totalCoursesInProgress,
    completionRate,
    courseDistribution,
    batchDistribution: batchDistribution.map((b) => ({
      batch: b._id,
      academicYear: b.academicYear,
      count: b.count,
      groupCount: b.groupCount,
    })),
    groupDistribution: groupDistribution.map((g) => ({
      group: g.title,
      groupId: g.wpId,
      batch: g.batch,
      academicYear: g.academicYear,
      trimester: g.trimester,
      studentCount: g.totalStudents,
      courseCount: g.totalCourses,
    })),
    lastSyncAt: lastSync?.completedAt ?? null,
  });
}
