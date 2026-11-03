"use client";

import { useState, useMemo } from "react";
import { useDashboardSummary, useGroups, useSites } from "@/hooks/use-dashboard";
import { decodeHTML } from "@/lib/decode-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartInfo } from "@/components/ui/chart-info";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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

function CourseCompletionArea({
  courses,
  loading,
  topN = 10,
}: {
  courses: CourseRow[];
  loading: boolean;
  topN?: number;
}) {
  if (loading) {
    return <Skeleton className="h-72 w-full" />;
  }

  const top = courses.slice(0, topN);
  const truncLen = topN <= 10 ? 18 : topN <= 20 ? 12 : 8;
  const data = top.map((c, i) => {
    const total = c.enrolled || 1;
    const decoded = decodeHTML(c.title);
    return {
      name: decoded.length > truncLen ? decoded.slice(0, truncLen) + "…" : decoded,
      fullName: decoded,
      index: i + 1,
      "Completed %": Math.round((c.completed / total) * 100),
      "In Progress %": Math.round((c.inProgress / total) * 100),
      "Yet to Start %": Math.round((c.notStarted / total) * 100),
    };
  });

  const showIndex = topN > 20;
  const tickInterval = topN <= 10 ? 0 : topN <= 20 ? 1 : 3;
  const fontSize = topN <= 10 ? 10 : topN <= 20 ? 9 : 8;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="cwGradCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={STATUS_COLORS.completed} stopOpacity={0.3} />
            <stop offset="95%" stopColor={STATUS_COLORS.completed} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="cwGradInProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={STATUS_COLORS.inProgress} stopOpacity={0.3} />
            <stop offset="95%" stopColor={STATUS_COLORS.inProgress} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="cwGradNotStarted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={STATUS_COLORS.notStarted} stopOpacity={0.3} />
            <stop offset="95%" stopColor={STATUS_COLORS.notStarted} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={showIndex ? "index" : "name"}
          tick={{ fontSize }}
          angle={showIndex ? 0 : -30}
          textAnchor={showIndex ? "middle" : "end"}
          height={showIndex ? 30 : 60}
          interval={tickInterval}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <ReTooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload;
            if (p?.fullName) return showIndex ? `#${p.index} ${p.fullName}` : p.fullName;
            return _;
          }}
          formatter={(value: any, name: any) => [`${value}%`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="Completed %"
          stroke={STATUS_COLORS.completed}
          strokeWidth={2}
          fill="url(#cwGradCompleted)"
        />
        <Area
          type="monotone"
          dataKey="In Progress %"
          stroke={STATUS_COLORS.inProgress}
          strokeWidth={2}
          fill="url(#cwGradInProgress)"
        />
        <Area
          type="monotone"
          dataKey="Yet to Start %"
          stroke={STATUS_COLORS.notStarted}
          strokeWidth={2}
          fill="url(#cwGradNotStarted)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  allLabel = "All",
  required = false,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  required?: boolean;
}) {
  const hasValue = value !== "";
  const displayLabel = hasValue
    ? options.find((o) => o.value === value)?.label ?? value
    : allLabel;

  return (
    <div className="flex flex-col gap-1 min-w-0 w-full sm:w-auto sm:min-w-[160px]">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <Select value={value} onValueChange={(v: string | null) => onValueChange(v ?? "")}>
          <SelectTrigger
            className={`${label === "Course Title" ? "w-full sm:min-w-100" : "w-full sm:min-w-35"} `}
          >
            <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
              {displayLabel}
            </span>
          </SelectTrigger>
          <SelectContent>
            {!required && <SelectItem value="">{allLabel}</SelectItem>}
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasValue && !required && (
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

const CAMPUS_LABELS: Record<string, string> = {
  jimn: "Noida",
  jiml: "Lucknow",
  jimj: "Jaipur",
  jimi: "Indore",
};

export default function OverviewPage() {
  const [siteKey, setSiteKey] = useState("jimn");
  const [academicYear, setAcademicYear] = useState("");
  const [batch, setBatch] = useState("");
  const [trimester, setTrimester] = useState("");
  const [courseId, setCourseId] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [topN, setTopN] = useState(10);

  const { data: sites } = useSites();
  const { data: groupData } = useGroups(siteKey);

  const summaryParams = useMemo(() => {
    const p: Record<string, string> = { siteKey };
    if (academicYear) p.academicYear = academicYear;
    if (batch) p.batch = batch;
    if (trimester) p.trimester = trimester;
    if (courseId) p.courseId = courseId;
    return p;
  }, [siteKey, academicYear, batch, trimester, courseId]);

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
    setSiteKey("jimn");
    setTablePage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          iJaipuria Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Course completion overview and student analytics
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4">
            <FilterSelect
              label="Campus Name"
              value={siteKey}
              onValueChange={(v) => {
                setSiteKey(v || "jimn");
                setAcademicYear("");
                setBatch("");
                setTrimester("");
                setCourseId("");
                setTablePage(1);
              }}
              options={(sites ?? Object.entries(CAMPUS_LABELS).map(([k, l]) => ({ key: k, label: l }))).map((s) => ({ value: s.key, label: s.label }))}
              required
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
            <div className="col-span-2 sm:col-span-1 sm:contents">
            <FilterSelect
              label="Course Title"
              value={courseId}
              onValueChange={(v) => {
                setCourseId(v);
                setTablePage(1);
              }}
              options={courseOptions}
            />
            </div>
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

      {/* Charts: Donut + Area side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Completion Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Overall Completion Status
              </CardTitle>
              <ChartInfo tooltip="Donut chart showing the proportion of all course enrollments split into Completed, In Progress, and Yet to Start. The center percentage is calculated as (Total Completed / Total Enrolled) × 100. Filtered by the selected campus and filters above." />
            </div>
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

        {/* Top Courses Completion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Top Courses — Completion Rate (%)
                <ChartInfo tooltip="Area chart displaying the top courses ranked by completion rate. Each course shows three stacked areas: Completed %, In Progress %, and Yet to Start %, calculated as (count / total enrolled) × 100. Use the dropdown to view Top 10, 20, or 50 courses." />
              </CardTitle>
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="text-xs border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <CourseCompletionArea courses={courses} loading={loading} topN={topN} />
          </CardContent>
        </Card>
      </div>

      {/* Course Table — full width */}
      <Card>
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

      {/* Last sync */}
      {data?.lastSyncAt && (
        <p className="text-xs text-muted-foreground text-right">
          Last synced: {new Date(data.lastSyncAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
