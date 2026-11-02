import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB } from "@/lib/db";
import { getSiteConfigs } from "@/lib/sites";
import { getStudentModel } from "@/models/Student";
import { getGroupModel } from "@/models/Group";
import { SyncLog } from "@/models/SyncLog";

const DISPLAY_NAMES: Record<string, string> = {
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

  await connectDB();
  const sites = getSiteConfigs();

  const campuses: any[] = [];
  let grandTotalStudents = 0;
  let grandTotalEnrolled = 0;
  let grandTotalCompleted = 0;
  let grandTotalInProgress = 0;
  let grandTotalCourses = 0;

  for (const site of sites) {
    const Student = getStudentModel(site.key);
    const Group = getGroupModel(site.key);

    const [totalStudents, lastSync] = await Promise.all([
      Student.countDocuments({ siteKey: site.key }),
      SyncLog.findOne({ siteKey: site.key, status: "completed", allCoursesCount: { $gt: 0 } })
        .sort({ completedAt: -1 })
        .lean(),
    ]);

    const coursePipeline = [
      { $match: { siteKey: site.key } },
      { $unwind: "$courses" },
      {
        $group: {
          _id: "$courses.course_id",
          title: { $first: "$courses.title" },
          enrolled: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$courses.status", "completed"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$courses.status", "in_progress"] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ["$courses.status", "not_started"] }, 1, 0] } },
        },
      },
    ];

    const courseDistribution = await Student.aggregate(coursePipeline);

    const enrolled = courseDistribution.reduce((s, c) => s + c.enrolled, 0);
    const completed = courseDistribution.reduce((s, c) => s + c.completed, 0);
    const inProgress = courseDistribution.reduce((s, c) => s + c.inProgress, 0);
    const notStarted = enrolled - completed - inProgress;
    const uniqueCourses = courseDistribution.length;

    const storedCount = (lastSync as any)?.allCoursesCount;
    let courseOffering = uniqueCourses;
    if (storedCount && storedCount > 0) {
      courseOffering = storedCount;
    } else {
      const allGroupCourses = await Group.aggregate([
        { $match: { siteKey: site.key } },
        { $unwind: "$courses" },
        { $group: { _id: "$courses.id" } },
      ]);
      if (allGroupCourses.length > 0) courseOffering = allGroupCourses.length;
    }

    const completionRate = enrolled > 0 ? Math.round((completed / enrolled) * 10000) / 100 : 0;

    // Top 10 courses by enrollment for this campus
    const topCourses = courseDistribution
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 10)
      .map((c) => ({
        id: c._id,
        title: c.title,
        enrolled: c.enrolled,
        completed: c.completed,
        inProgress: c.inProgress,
        notStarted: c.notStarted,
      }));

    campuses.push({
      key: site.key,
      name: DISPLAY_NAMES[site.key] ?? site.label,
      totalStudents,
      uniqueCourses,
      courseOffering,
      totalEnrolled: enrolled,
      totalCompleted: completed,
      totalInProgress: inProgress,
      totalNotStarted: notStarted,
      completionRate,
      topCourses,
    });

    grandTotalStudents += totalStudents;
    grandTotalEnrolled += enrolled;
    grandTotalCompleted += completed;
    grandTotalInProgress += inProgress;
    grandTotalCourses += courseOffering;
  }

  const grandTotalNotStarted = grandTotalEnrolled - grandTotalCompleted - grandTotalInProgress;
  const grandCompletionRate =
    grandTotalEnrolled > 0
      ? Math.round((grandTotalCompleted / grandTotalEnrolled) * 10000) / 100
      : 0;

  return NextResponse.json({
    campuses,
    grand: {
      totalStudents: grandTotalStudents,
      totalCourses: grandTotalCourses,
      totalEnrolled: grandTotalEnrolled,
      totalCompleted: grandTotalCompleted,
      totalInProgress: grandTotalInProgress,
      totalNotStarted: grandTotalNotStarted,
      completionRate: grandCompletionRate,
    },
  });
}
