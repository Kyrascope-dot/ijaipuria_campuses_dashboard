"use client";

import { useDashboardSummary } from "@/hooks/use-dashboard";
import { decodeHTML } from "@/lib/decode-html";
import { ChartCard } from "@/components/dashboard/chart-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookOpen, Trophy, TrendingUp, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(220, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(45, 90%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(270, 55%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(190, 65%, 50%)",
  "hsl(10, 75%, 55%)",
];

export default function AnalyticsPage() {
  const { data, isLoading } = useDashboardSummary("jimn");
  const loading = isLoading || !data;

  // console.log("data", data);

  const courseData = (data?.courseDistribution ?? []) as Array<{
    title: string;
    enrolled: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    avgPercentage: number;
  }>;

  // Completion rate per course for top 10
  const completionByCourse = courseData.slice(0, 10).map((c) => ({
    name: (() => {
      const t = decodeHTML(c.title);
      return t.length > 20 ? t.slice(0, 18) + "…" : t;
    })(),
    rate: c.enrolled > 0 ? Math.round((c.completed / c.enrolled) * 100) : 0,
    enrolled: c.enrolled,
  }));

  // Role distribution
  const roleData = (data?.roleDistribution ?? []) as Array<{
    role: string;
    count: number;
  }>;

  // Treemap for course sizes
  // const treemapData = courseData.slice(0, 12).map((c, i) => ({
  //   name: (() => {
  //     const t = decodeHTML(c.title);
  //     return t.length > 18 ? t.slice(0, 16) + "…" : t;
  //   })(),
  //   size: c.enrolled,
  //   fill: COLORS[i % COLORS.length],
  // }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Unique Courses"
          value={courseData.length}
          icon={BookOpen}
          info="Number of distinct courses that at least one student is enrolled in."
          loading={loading}
        />
        <StatCard
          title="Avg Completion Rate"
          value={`${data?.completionRate ?? 0}%`}
          icon={Target}
          info="(Total Courses Completed / Total Course Enrollments) × 100 across all students."
          loading={loading}
        />
        <StatCard
          title="Avg Quiz Pass Rate"
          value={`${data?.quizPassRate ?? 0}%`}
          icon={Trophy}
          info="(Total Quizzes Passed / Total Quiz Attempts) × 100 across all students."
          loading={loading}
        />
        <StatCard
          title="Avg Student Progress"
          value={`${data?.avgProgress ?? 0}%`}
          icon={TrendingUp}
          info="Average of each student's avg_progress_percent field. This is the mean course progress across all students."
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Completion Rate by Course"
          info={`For each of the top 10 courses by enrollment:\nCompletion Rate = (Completed / Enrolled) × 100.\nShows how effectively students finish each course.`}
          loading={loading}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completionByCourse}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} fontSize={12} unit="%" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  fontSize={11}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ReTooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                  formatter={(value: any) => [`${value}%`, "Completion Rate"]}
                />
                <Bar dataKey="rate" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Student Role Distribution"
          info={`Number of students in each WordPress role.\nData source: roles[] array from each student record.`}
          loading={loading}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData.map((r) => ({ name: r.role, value: r.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
