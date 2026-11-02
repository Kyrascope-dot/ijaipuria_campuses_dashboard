import { connectDB } from "@/lib/db";
import { getStudentModel } from "@/models/Student";
import { getGroupModel } from "@/models/Group";
import { SyncLog } from "@/models/SyncLog";
import { createSiteClient, type WPStudentsResponse, type WPGroupsResponse } from "@/lib/api-client";
import type { SiteConfig } from "@/lib/sites";

export async function syncSite(site: SiteConfig) {
  await connectDB();

  const log = await SyncLog.create({ siteKey: site.key, status: "running" });
  const client = createSiteClient(site);
  const Student = getStudentModel(site.key);
  const Group = getGroupModel(site.key);

  try {
    // ── 1. Sync groups first (fast, gives us all_courses count) ──
    let groupsFetched = 0;
    let allCoursesCount = 0;
    try {
      const { data: groupsData } = await client.get<WPGroupsResponse>("/groups", {
        params: { page: 1, per_page: 5000 },
      });

      if (groupsData.groups?.length) {
        groupsFetched = groupsData.groups.length;

        const groupOps = groupsData.groups.map((g) => {
          const trimMatch = g.title.match(/(?:[\s_-]|^)T(?:erm[\s_]*)?(\d+)/i);
          const trimester = trimMatch ? parseInt(trimMatch[1], 10) : null;

          return {
            updateOne: {
              filter: { siteKey: site.key, wpId: g.id },
              update: {
                $set: {
                  siteKey: site.key,
                  wpId: g.id,
                  title: g.title,
                  status: g.status,
                  createdAt_wp: g.created_at,
                  batch: g.batch,
                  academicYear: g.academic_year,
                  trimester,
                  leaderIds: g.leader_ids,
                  courseIds: g.course_ids,
                  courses: g.courses ?? g.course_ids.map((id: number) => ({ id, title: "" })),
                  studentIds: g.student_ids,
                  totalStudents: g.total_students,
                  totalCourses: g.total_courses,
                  syncedAt: new Date(),
                },
              },
              upsert: true,
            },
          };
        });

        await Group.bulkWrite(groupOps, { ordered: false });
      }

      allCoursesCount = groupsData.all_courses?.length ?? 0;
    } catch {
      // Groups API may not exist yet on some sites
    }

    // ── 2. Sync students ──
    let page = 1;
    let totalPages = 1;
    let totalFetched = 0;
    let totalUpserted = 0;

    while (page <= totalPages) {
      const { data } = await client.get<WPStudentsResponse>("/students", {
        params: { page, per_page: 200 },
      });

      totalPages = data.pagination.total_pages;
      totalFetched += data.students.length;

      const ops = data.students.map((s) => {
        let avgProgress = s.stats.avg_progress_percent;
        if (s.courses.length > 0) {
          const sum = s.courses.reduce((acc, c) => {
            if (c.status === "completed") return acc + 100;
            return acc + (c.percentage ?? 0);
          }, 0);
          avgProgress = Math.round(sum / s.courses.length);
        }

        return {
          updateOne: {
            filter: { siteKey: site.key, wpId: s.id },
            update: {
              $set: {
                siteKey: site.key,
                wpId: s.id,
                username: s.username,
                email: s.email,
                display_name: s.display_name,
                first_name: s.first_name,
                last_name: s.last_name,
                nickname: s.nickname,
                phone: s.phone,
                roles: s.roles,
                registered_at: s.registered_at,
                last_site_activity_at: s.last_site_activity_at,
                last_learning_activity: s.last_learning_activity,
                avatar_url: s.avatar_url,
                profile_url: s.profile_url,
                profile_fields: s.profile_fields,
                groups: s.groups,
                batch: s.batch ?? null,
                academicYear: s.academic_year ?? null,
                stats: { ...s.stats, avg_progress_percent: avgProgress },
                courses: s.courses,
                quizzes: s.quizzes,
                assignments: s.assignments,
                essays: s.essays,
                syncedAt: new Date(),
              },
            },
            upsert: true,
          },
        };
      });

      if (ops.length > 0) {
        const result = await Student.bulkWrite(ops, { ordered: false });
        totalUpserted += result.upsertedCount + result.modifiedCount;
      }

      page++;
    }

    // ── 3. Update students with batch/academicYear from their groups ──
    const groups = await Group.find({ siteKey: site.key, batch: { $ne: null } }).select("batch academicYear studentIds").lean();
    for (const g of groups) {
      if (g.studentIds.length > 0) {
        await Student.updateMany(
          {
            siteKey: site.key,
            wpId: { $in: g.studentIds },
            $or: [{ batch: null }, { batch: { $exists: false } }],
          },
          { $set: { batch: g.batch, academicYear: g.academicYear } },
        );
      }
    }

    log.status = "completed";
    log.totalFetched = totalFetched;
    log.totalUpserted = totalUpserted;
    log.allCoursesCount = allCoursesCount;
    log.completedAt = new Date();
    await log.save();

    return { status: "completed", totalFetched, totalUpserted, groupsFetched };
  } catch (error: any) {
    log.status = "failed";
    log.error = error.message ?? String(error);
    log.completedAt = new Date();
    await log.save();
    throw error;
  }
}
