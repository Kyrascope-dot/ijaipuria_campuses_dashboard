"use client";

import { useOverallSummary } from "@/hooks/use-dashboard";
import { decodeHTML } from "@/lib/decode-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  TrendingUp,
  BookOpen,
  Building2,
  Info,
} from "lucide-react";
import { ChartInfo } from "@/components/ui/chart-info";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CAMPUS_COLORS: Record<string, string> = {
  Noida: "#3b82f6",
  Lucknow: "#22c55e",
  Jaipur: "#f59e0b",
  Indore: "#8b5cf6",
};

const STATUS_COLORS = {
  completed: "#22c55e",
  inProgress: "#eab308",
  notStarted: "#ef4444",
};

function GrandKpi({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className="flex items-center justify-center h-12 w-12 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


function CompletionComparisonArea({
  campuses,
  loading,
}: {
  campuses: any[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-72 w-full" />;
  }

  const data = campuses.map((c) => ({
    name: c.name,
    Completed: c.totalCompleted,
    "In Progress": c.totalInProgress,
    "Yet to Start": c.totalNotStarted,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={STATUS_COLORS.completed}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={STATUS_COLORS.completed}
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="gradInProgress" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={STATUS_COLORS.inProgress}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={STATUS_COLORS.inProgress}
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="gradNotStarted" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={STATUS_COLORS.notStarted}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={STATUS_COLORS.notStarted}
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <ReTooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: any) => value.toLocaleString()}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="Completed"
          stroke={STATUS_COLORS.completed}
          strokeWidth={2}
          fill="url(#gradCompleted)"
        />
        <Area
          type="monotone"
          dataKey="In Progress"
          stroke={STATUS_COLORS.inProgress}
          strokeWidth={2}
          fill="url(#gradInProgress)"
        />
        <Area
          type="monotone"
          dataKey="Yet to Start"
          stroke={STATUS_COLORS.notStarted}
          strokeWidth={2}
          fill="url(#gradNotStarted)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function OverallDonut({ grand, loading }: { grand: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="h-44 w-44 rounded-full" />
      </div>
    );
  }

  const data = [
    {
      name: "Completed",
      value: grand.totalCompleted,
      color: STATUS_COLORS.completed,
    },
    {
      name: "In Progress",
      value: grand.totalInProgress,
      color: STATUS_COLORS.inProgress,
    },
    {
      name: "Yet to Start",
      value: grand.totalNotStarted,
      color: STATUS_COLORS.notStarted,
    },
  ];

  const total = grand.totalEnrolled;
  const pct = total > 0 ? Math.round((grand.totalCompleted / total) * 100) : 0;

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <ReTooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any, name: any) => {
              const p = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return [`${value.toLocaleString()} (${p}%)`, name];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ marginBottom: 30 }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold">{pct}%</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
      </div>
    </div>
  );
}

function CompletionRateComparison({
  campuses,
  loading,
}: {
  campuses: any[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <div className="space-y-4">
      {campuses.map((c) => {
        const color = CAMPUS_COLORS[c.name] ?? "#6b7280";
        return (
          <div key={c.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-sm font-bold" style={{ color }}>
                {c.completionRate}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${c.completionRate}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CampusTable({
  campuses,
  grand,
  loading,
}: {
  campuses: any[];
  grand: any;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-3 px-4 font-semibold text-muted-foreground">
              Campus
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              Students
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              Courses
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              Enrollment
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              Completed
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              In Progress
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              Yet to Start
            </th>
            <th className="py-3 px-3 font-semibold text-muted-foreground text-center">
              Rate
            </th>
          </tr>
        </thead>
        <tbody>
          {campuses.map((c, i) => (
            <tr
              key={c.key}
              className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${
                i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
              }`}
            >
              <td className="py-3 px-4 font-medium">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: CAMPUS_COLORS[c.name] ?? "#6b7280",
                    }}
                  />
                  {c.name}
                </div>
              </td>
              <td className="py-3 px-3 text-center tabular-nums">
                {c.totalStudents.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-center tabular-nums">
                {c.courseOffering}
              </td>
              <td className="py-3 px-3 text-center tabular-nums">
                {c.totalEnrolled.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-center tabular-nums">
                <span
                  className="inline-flex items-center justify-center min-w-[28px] rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: `${STATUS_COLORS.completed}18`,
                    color: STATUS_COLORS.completed,
                  }}
                >
                  {c.totalCompleted.toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-3 text-center tabular-nums">
                <span
                  className="inline-flex items-center justify-center min-w-[28px] rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: `${STATUS_COLORS.inProgress}18`,
                    color: STATUS_COLORS.inProgress,
                  }}
                >
                  {c.totalInProgress.toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-3 text-center tabular-nums">
                <span
                  className="inline-flex items-center justify-center min-w-[28px] rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: `${STATUS_COLORS.notStarted}18`,
                    color: STATUS_COLORS.notStarted,
                  }}
                >
                  {c.totalNotStarted.toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-3 text-center tabular-nums font-bold">
                {c.completionRate}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-bold bg-muted/30">
            <td className="py-3 px-4">Grand Total</td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.totalStudents.toLocaleString()}
            </td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.totalCourses}
            </td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.totalEnrolled.toLocaleString()}
            </td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.totalCompleted.toLocaleString()}
            </td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.totalInProgress.toLocaleString()}
            </td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.totalNotStarted.toLocaleString()}
            </td>
            <td className="py-3 px-3 text-center tabular-nums">
              {grand.completionRate}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function OverallPage() {
  const { data, isLoading } = useOverallSummary();
  const loading = isLoading || !data;

  const campuses = data?.campuses ?? [];
  const grand = data?.grand ?? {
    totalStudents: 0,
    totalCourses: 0,
    totalEnrolled: 0,
    totalCompleted: 0,
    totalInProgress: 0,
    totalNotStarted: 0,
    completionRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Overall Campus Progression
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-campus analytics across all {campuses.length} campuses
        </p>
      </div>

      {/* Grand Total KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <GrandKpi
          label="Total Campuses"
          value={campuses.length}
          icon={Building2}
          color="#8b5cf6"
          loading={loading}
        />
        <GrandKpi
          label="Total Students"
          value={grand.totalStudents}
          icon={Users}
          color="#3b82f6"
          loading={loading}
        />
        <GrandKpi
          label="Total Enrollment"
          value={grand.totalEnrolled}
          icon={GraduationCap}
          color="#06b6d4"
          loading={loading}
        />
        <GrandKpi
          label="Total Completed"
          value={grand.totalCompleted}
          icon={BookOpen}
          color="#22c55e"
          loading={loading}
        />
        <GrandKpi
          label="Overall Rate"
          value={`${grand.completionRate}%`}
          icon={TrendingUp}
          color="#f59e0b"
          loading={loading}
        />
      </div>

      {/* Row 1: Overall Donut + Completion Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Overall Completion Status
              </CardTitle>
              <ChartInfo tooltip="Donut chart showing the combined enrollment status across all campuses. Segments represent Completed, In Progress, and Yet to Start. The center percentage is (Total Completed / Total Enrolled) × 100 across all campuses." />
            </div>
          </CardHeader>
          <CardContent>
            <OverallDonut grand={grand} loading={loading} />
            {!loading && (
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div className="rounded-lg p-2 bg-muted/40">
                  <p
                    className="text-base font-bold"
                    style={{ color: STATUS_COLORS.completed }}
                  >
                    {grand.totalCompleted.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
                <div className="rounded-lg p-2 bg-muted/40">
                  <p
                    className="text-base font-bold"
                    style={{ color: STATUS_COLORS.inProgress }}
                  >
                    {grand.totalInProgress.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    In Progress
                  </p>
                </div>
                <div className="rounded-lg p-2 bg-muted/40">
                  <p
                    className="text-base font-bold"
                    style={{ color: STATUS_COLORS.notStarted }}
                  >
                    {grand.totalNotStarted.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Yet to Start
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Completion Rate by Campus
              </CardTitle>
              <ChartInfo tooltip="Horizontal progress bars comparing each campus's completion rate. Each bar shows (Completed Enrollments / Total Enrollments) × 100 for that campus, making it easy to compare performance across locations." />
            </div>
          </CardHeader>
          <CardContent>
            <CompletionRateComparison campuses={campuses} loading={loading} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Area Chart full width */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              Campus Wise Completion Breakdown
            </CardTitle>
            <ChartInfo tooltip="Area chart showing the absolute count of Completed, In Progress, and Yet to Start enrollments for each campus. The stacked areas let you compare both the total volume and the status distribution across campuses side by side." />
          </div>
        </CardHeader>
        <CardContent>
          <CompletionComparisonArea campuses={campuses} loading={loading} />
        </CardContent>
      </Card>

      {/* Campus Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Campus Wise Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CampusTable campuses={campuses} grand={grand} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
