"use client";

import { useState, useCallback } from "react";
import { useRecords, useRecordDetail, useGroups } from "@/hooks/use-dashboard";
import { decodeHTML } from "@/lib/decode-html";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
} from "lucide-react";

export default function RecordsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("first_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [role, setRole] = useState("");
  const [courseStatus, setCourseStatus] = useState("");
  const [batch, setBatch] = useState("");
  const [group, setGroup] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: groupsData } = useGroups("jimn");
  const batches = groupsData?.batches ?? [];
  const groups = groupsData?.groups ?? [];

  // When batch is selected, filter groups to show only groups in that batch
  const filteredGroups = batch
    ? groups.filter((g) => g.batch === batch)
    : groups;

  const params: Record<string, any> = {
    siteKey: "jimn",
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    role: role || undefined,
    courseStatus: courseStatus || undefined,
    batch: batch || undefined,
    group: group || undefined,
  };

  const { data, isLoading } = useRecords(params);
  const { data: detail, isLoading: detailLoading } =
    useRecordDetail(selectedId);

  // console.log("student data", data);

  const students = data?.students ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  const activeFilters = [role, courseStatus, search, batch, group].filter(
    Boolean,
  ).length;

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col)
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setRole("");
    setCourseStatus("");
    setBatch("");
    setGroup("");
    setPage(1);
  };

  const exportCSV = () => {
    if (!students.length) return;
    const headers = [
      "Name",
      "Email",
      "Batch",
      "Group",
      "Role",
      "Courses Enrolled",
      "Courses Completed",
      "Quiz Attempts",
      "Quizzes Passed",
      "Avg Progress %",
      "Registered At",
    ];
    const rows = students.map((s: any) => [
      `${s.first_name} ${s.last_name}`,
      s.email,
      s.batch ?? "",
      s.groups?.map((g: any) => decodeHTML(g.title)).join("; ") ?? "",
      s.roles?.join(", "),
      s.stats?.courses_enrolled,
      s.stats?.courses_completed,
      s.stats?.quiz_attempts,
      s.stats?.quizzes_passed,
      s.stats?.avg_progress_percent,
      s.registered_at ? new Date(s.registered_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters Row 1: Search + Role + Course Status */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <Select
          value={batch || "all"}
          onValueChange={(v) => {
            setBatch(!v || v === "all" ? "" : v);
            setGroup("");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={group || "all"}
          onValueChange={(v) => {
            setGroup(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {filteredGroups.map((g) => (
              <SelectItem key={g.wpId} value={g.title}>
                {decodeHTML(g.title)} ({g.totalStudents})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={role || "all"}
          onValueChange={(v) => {
            setRole(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="subscriber">Subscriber</SelectItem>
            <SelectItem value="wdm_instructor">Instructor</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={courseStatus || "all"}
          onValueChange={(v) => {
            setCourseStatus(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Course Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Clear ({activeFilters})
          </Button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("first_name")}
              >
                <span className="flex items-center">
                  Name <SortIcon col="first_name" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("email")}
              >
                <span className="flex items-center">
                  Email <SortIcon col="email" />
                </span>
              </TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-center">Courses</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Avg %</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("registered_at")}
              >
                <span className="flex items-center">
                  Registered <SortIcon col="registered_at" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              students.map((s: any) => (
                <TableRow
                  key={s._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedId(s._id)}
                >
                  <TableCell className="font-medium">
                    {s.first_name} {s.last_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.email}
                  </TableCell>
                  <TableCell>
                    {s.batch ? (
                      <Badge variant="outline" className="text-xs">
                        {s.batch}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {s.groups?.length
                      ? s.groups.map((g: any) => decodeHTML(g.title)).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.stats?.courses_enrolled ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.stats?.courses_completed ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.stats?.avg_progress_percent ?? 0}%
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.registered_at
                      ? new Date(s.registered_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              if (v) {
                setLimit(Number(v));
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
            {((page - 1) * limit + 1).toLocaleString()}–
            {Math.min(page * limit, pagination.total).toLocaleString()} of{" "}
            {pagination.total.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(pagination.totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Student Details</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)] px-6 pb-6">
            {detailLoading || !detail ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic info */}
                <div>
                  <h3 className="font-semibold mb-2">Profile</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd>
                      {detail.first_name} {detail.last_name}
                    </dd>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="break-all">{detail.email}</dd>
                    <dt className="text-muted-foreground">Username</dt>
                    <dd>{detail.username}</dd>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd>
                      <Badge variant="secondary">{detail.roles?.[0]}</Badge>
                    </dd>
                    <dt className="text-muted-foreground">Batch</dt>
                    <dd>{detail.batch ?? "—"}</dd>
                    <dt className="text-muted-foreground">Academic Year</dt>
                    <dd>{detail.academicYear ?? "—"}</dd>
                    <dt className="text-muted-foreground">Groups</dt>
                    <dd>
                      {detail.groups
                        ?.map((g: any) => decodeHTML(g.title))
                        .join(", ") || "—"}
                    </dd>
                    <dt className="text-muted-foreground">Registered</dt>
                    <dd>
                      {detail.registered_at
                        ? new Date(detail.registered_at).toLocaleDateString()
                        : "—"}
                    </dd>
                    <dt className="text-muted-foreground">Last Activity</dt>
                    <dd>
                      {detail.last_learning_activity
                        ? new Date(
                            detail.last_learning_activity,
                          ).toLocaleDateString()
                        : "—"}
                    </dd>
                  </dl>
                </div>

                <Separator />

                {/* Stats */}
                <div>
                  <h3 className="font-semibold mb-2">Statistics</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Courses Enrolled</dt>
                    <dd>{detail.stats?.courses_enrolled}</dd>
                    <dt className="text-muted-foreground">Courses Completed</dt>
                    <dd>{detail.stats?.courses_completed}</dd>
                    <dt className="text-muted-foreground">Quiz Attempts</dt>
                    <dd>{detail.stats?.quiz_attempts}</dd>
                    <dt className="text-muted-foreground">Quizzes Passed</dt>
                    <dd>{detail.stats?.quizzes_passed}</dd>
                    <dt className="text-muted-foreground">Certificates</dt>
                    <dd>{detail.stats?.certificates}</dd>
                    <dt className="text-muted-foreground">Avg Progress</dt>
                    <dd>{detail.stats?.avg_progress_percent}%</dd>
                  </dl>
                </div>

                <Separator />

                {/* Courses */}
                {detail.courses?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Courses ({detail.courses.length})
                    </h3>
                    <div className="space-y-2">
                      {detail.courses.map((c: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-lg border p-3 text-sm space-y-1"
                        >
                          <p className="font-medium">{decodeHTML(c.title)}</p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge
                              variant={
                                c.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {c.status?.replace("_", " ")}
                            </Badge>
                            <span>{c.percentage}%</span>
                            <span>
                              {c.completed_steps}/{c.total_steps} steps
                            </span>
                          </div>
                          {c.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Completed:{" "}
                              {new Date(c.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Quizzes */}
                {detail.quizzes?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Quiz Attempts ({detail.quizzes.length})
                    </h3>
                    <div className="space-y-2">
                      {detail.quizzes.map((q: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-lg border p-3 text-sm space-y-1"
                        >
                          <p className="font-medium">
                            {decodeHTML(q.quiz_title)}
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge
                              variant={q.passed ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {q.passed ? "Passed" : "Failed"}
                            </Badge>
                            <span>{q.percentage}%</span>
                            <span>
                              {q.score}/{q.question_count}
                            </span>
                          </div>
                          {q.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(q.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
