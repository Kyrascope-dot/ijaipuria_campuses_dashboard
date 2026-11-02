"use client";

import { useState, useMemo } from "react";
import { useDashboardSummary, useGroups } from "@/hooks/use-dashboard";
import { decodeHTML } from "@/lib/decode-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  completed: "#22c55e",
  inProgress: "#eab308",
  notStarted: "#ef4444",
};

const ROWS_PER_PAGE = 10;

interface CourseRow {
  _id: number;
  title: string;
  enrolled: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  avgPercentage: number;
}

function KpiCard({
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

function InlineBar({
  completed,
  inProgress,
  notStarted,
  total,
}: {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
}) {
  if (total === 0) return <div className="h-2 rounded-full bg-muted w-full" />;
  const pC = (completed / total) * 100;
  const pI = (inProgress / total) * 100;
  const pN = (notStarted / total) * 100;

  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
      {pC > 0 && (
        <div
          className="h-full transition-all"
          style={{ width: `${pC}%`, backgroundColor: STATUS_COLORS.completed }}
        />
      )}
      {pI > 0 && (
        <div
          className="h-full transition-all"
          style={{ width: `${pI}%`, backgroundColor: STATUS_COLORS.inProgress }}
        />
      )}
      {pN > 0 && (
        <div
          className="h-full transition-all"
          style={{ width: `${pN}%`, backgroundColor: STATUS_COLORS.notStarted }}
        />
      )}
    </div>
  );
}

function CourseTable({
  courses,
  loading,
  page,
  onPageChange,
}: {
  courses: CourseRow[];
  loading: boolean;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const totalPages = Math.ceil(courses.length / ROWS_PER_PAGE);
  const start = (page - 1) * ROWS_PER_PAGE;
  const pageRows = courses.slice(start, start + ROWS_PER_PAGE);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3 px-4 font-semibold text-muted-foreground w-[40%]">
                Course Name
              </th>
              <th className="py-3 px-3 font-semibold text-muted-foreground text-center w-[10%]">
                Enrolled
              </th>
              <th className="py-3 px-3 font-semibold text-muted-foreground text-center w-[10%]">
                Completed
              </th>
              <th className="py-3 px-3 font-semibold text-muted-foreground text-center w-[10%]">
                In Progress
              </th>
              <th className="py-3 px-3 font-semibold text-muted-foreground text-center w-[10%]">
                Yet to Start
              </th>
              <th className="py-3 px-4 font-semibold text-muted-foreground w-[20%]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c, i) => (
              <tr
                key={c._id}
                className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${
                  i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                }`}
              >
                <td className="py-3 px-4 font-medium">{decodeHTML(c.title)}</td>
                <td className="py-3 px-3 text-center tabular-nums">
                  {c.enrolled}
                </td>
                <td className="py-3 px-3 text-center tabular-nums">
                  <span
                    className="inline-flex items-center justify-center min-w-[28px] rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `${STATUS_COLORS.completed}18`,
                      color: STATUS_COLORS.completed,
                    }}
                  >
                    {c.completed}
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
                    {c.inProgress}
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
                    {c.notStarted}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <InlineBar
                    completed={c.completed}
                    inProgress={c.inProgress}
                    notStarted={c.notStarted}
                    total={c.enrolled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-xs text-muted-foreground">
            {start + 1} – {Math.min(start + ROWS_PER_PAGE, courses.length)} /{" "}
            {courses.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutChart({
  completed,
  inProgress,
  notStarted,
  loading,
}: {
  completed: number;
  inProgress: number;
  notStarted: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Skeleton className="h-52 w-52 rounded-full" />
      </div>
    );
  }

  const total = completed + inProgress + notStarted;
  const data = [
    { name: "Completed", value: completed, color: STATUS_COLORS.completed },
    { name: "In Progress", value: inProgress, color: STATUS_COLORS.inProgress },
    {
      name: "Yet to Start",
      value: notStarted,
      color: STATUS_COLORS.notStarted,
    },
  ];

  const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
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
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
            formatter={(value: any, name: any) => {
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return [`${value} (${pct}%)`, name];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ marginBottom: 40 }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold">{pctCompleted}%</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  allLabel = "All",
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const hasValue = value !== "";

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <Select value={value} onValueChange={(v: string | null) => onValueChange(v ?? "")}>
          <SelectTrigger
            className={`${label === "Course Title" ? "w-full min-w-100" : "w-full min-w-35"} `}
          >
            <SelectValue placeholder={allLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{allLabel}</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasValue && (
          <button
            onClick={() => onValueChange("")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Clear filter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [academicYear, setAcademicYear] = useState("");
  const [batch, setBatch] = useState("");
  const [trimester, setTrimester] = useState("");
  const [courseId, setCourseId] = useState("");
  const [tablePage, setTablePage] = useState(1);

  const { data: groupData } = useGroups("jimn");

  const summaryParams = useMemo(() => {
    const p: Record<string, string> = { siteKey: "jimn" };
    if (academicYear) p.academicYear = academicYear;
    if (batch) p.batch = batch;
    if (trimester) p.trimester = trimester;
    if (courseId) p.courseId = courseId;
    return p;
  }, [academicYear, batch, trimester, courseId]);

  const { data, isLoading } = useDashboardSummary(summaryParams);
  const loading = isLoading || !data;

  const courses = (data?.courseDistribution ?? []) as CourseRow[];
  const uniqueCourses = data?.uniqueCourses ?? courses.length;
  const courseOffering = data?.courseOfferingCount ?? uniqueCourses;
  const totalCoursesEnrolled = data?.totalCoursesEnrolled ?? 0;
  const totalCompleted = data?.totalCoursesCompleted ?? 0;
  const totalInProgress = data?.totalCoursesInProgress ?? 0;
  const totalNotStarted =
    totalCoursesEnrolled - totalCompleted - totalInProgress;

  const academicYearOptions = useMemo(
    () => (groupData?.academicYears ?? []).map((y) => ({ value: y, label: y })),
    [groupData],
  );

  const batchOptions = useMemo(
    () => (groupData?.batches ?? []).map((b) => ({ value: b, label: b })),
    [groupData],
  );

  const trimesterOptions = useMemo(
    () =>
      (groupData?.trimesters ?? []).map((t) => ({
        value: String(t),
        label: `T${t}`,
      })),
    [groupData],
  );

  const courseOptions = useMemo(
    () =>
      (groupData?.courseTitles ?? []).map((c) => ({
        value: String(c.id),
        label: decodeHTML(c.title),
      })),
    [groupData],
  );

  const activeFilterCount = [academicYear, batch, trimester, courseId].filter(
    Boolean,
  ).length;

  function clearAllFilters() {
    setAcademicYear("");
    setBatch("");
    setTrimester("");
    setCourseId("");
    setTablePage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          iJaipuria Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Course completion overview and student analytics
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <FilterSelect
              label="Campus Name"
              value=""
              onValueChange={() => {}}
              options={[{ value: "jimn", label: "Noida" }]}
              allLabel="Noida"
            />
            <FilterSelect
              label="Academic Year"
              value={academicYear}
              onValueChange={(v) => {
                setAcademicYear(v);
                setTablePage(1);
              }}
              options={academicYearOptions}
            />
            <FilterSelect
              label="Batch"
              value={batch}
              onValueChange={(v) => {
                setBatch(v);
                setTablePage(1);
              }}
              options={batchOptions}
            />
            <FilterSelect
              label="Trimester"
              value={trimester}
              onValueChange={(v) => {
                setTrimester(v);
                setTablePage(1);
              }}
              options={trimesterOptions}
            />
            <FilterSelect
              label="Course Title"
              value={courseId}
              onValueChange={(v) => {
                setCourseId(v);
                setTablePage(1);
              }}
              options={courseOptions}
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 pb-2"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Unique Courses"
          value={uniqueCourses}
          icon={BookOpen}
          color="#8b5cf6"
          loading={loading}
        />
        <KpiCard
          label="Course Offering"
          value={courseOffering}
          icon={ClipboardList}
          color="#3b82f6"
          loading={loading}
        />

        <KpiCard
          label="Unique Students"
          value={data?.totalStudents ?? 0}
          icon={Users}
          color="#06b6d4"
          loading={loading}
        />

        <KpiCard
          label="Course Enrollment"
          value={totalCoursesEnrolled}
          icon={GraduationCap}
          color="#f59e0b"
          loading={loading}
        />

        <KpiCard
          label="Completion Rate"
          value={`${data?.completionRate ?? 0}%`}
          icon={TrendingUp}
          color="#22c55e"
          loading={loading}
        />
      </div>

      {/* Main Content: Table + Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Course Wise Completion Status */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Course Wise Completion Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CourseTable
              courses={courses}
              loading={loading}
              page={tablePage}
              onPageChange={setTablePage}
            />
          </CardContent>
        </Card>

        {/* Overall Completion Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Overall Completion Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              completed={totalCompleted}
              inProgress={totalInProgress}
              notStarted={totalNotStarted}
              loading={loading}
            />

            {!loading && (
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="rounded-lg p-3 bg-muted/40">
                  <p
                    className="text-lg font-bold"
                    style={{ color: STATUS_COLORS.completed }}
                  >
                    {totalCompleted.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Completed</p>
                </div>
                <div className="rounded-lg p-3 bg-muted/40">
                  <p
                    className="text-lg font-bold"
                    style={{ color: STATUS_COLORS.inProgress }}
                  >
                    {totalInProgress.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    In Progress
                  </p>
                </div>
                <div className="rounded-lg p-3 bg-muted/40">
                  <p
                    className="text-lg font-bold"
                    style={{ color: STATUS_COLORS.notStarted }}
                  >
                    {totalNotStarted.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Yet to Start
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last sync */}
      {data?.lastSyncAt && (
        <p className="text-xs text-muted-foreground text-right">
          Last synced: {new Date(data.lastSyncAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
