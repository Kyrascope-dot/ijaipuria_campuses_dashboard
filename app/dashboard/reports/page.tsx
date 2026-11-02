"use client";

import { useDashboardSummary, useSyncStatus } from "@/hooks/use-dashboard";
import { decodeHTML } from "@/lib/decode-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChartCard } from "@/components/dashboard/chart-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(220, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(45, 90%, 55%)",
];

export default function ReportsPage() {
  const { data, isLoading } = useDashboardSummary({ siteKey: "jimn" });
  const { data: syncLogs, isLoading: syncLoading } = useSyncStatus();
  const loading = isLoading || !data;

  const courseData = (data?.courseDistribution ?? []) as Array<{
    _id: number;
    title: string;
    enrolled: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    avgPercentage: number;
  }>;

  return (
    <div className="space-y-6">
      {/* Stacked bar: completed vs in-progress vs not-started for top courses */}
      <ChartCard
        title="Course Status Breakdown (Top 10)"
        info={`Stacked bar showing how enrollments split into Completed, In Progress, and Not Started for the top 10 courses by enrollment.\nData source: courses[] from each student, grouped by course_id.`}
        loading={loading}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={courseData.slice(0, 10).map((c) => ({
                name: (() => {
                  const t = decodeHTML(c.title);
                  return t.length > 20 ? t.slice(0, 18) + "…" : t;
                })(),
                Completed: c.completed,
                "In Progress": c.inProgress,
                "Not Started": c.notStarted,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" fontSize={12} />
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
              />
              <Legend />
              <Bar dataKey="Completed" stackId="a" fill={COLORS[1]} />
              <Bar dataKey="In Progress" stackId="a" fill={COLORS[0]} />
              <Bar dataKey="Not Started" stackId="a" fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Course Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Report</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Not Started</TableHead>
                  <TableHead className="text-center">Completion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseData.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium max-w-62.5 truncate">
                      {decodeHTML(c.title)}
                    </TableCell>
                    <TableCell className="text-center">{c.enrolled}</TableCell>
                    <TableCell className="text-center">{c.completed}</TableCell>
                    <TableCell className="text-center">
                      {c.inProgress}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.notStarted}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.enrolled > 0
                        ? Math.round((c.completed / c.enrolled) * 100)
                        : 0}
                      %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !syncLogs?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No sync records yet. Click {"Sync Data"} to fetch data from the
              website.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Fetched</TableHead>
                  <TableHead className="text-center">Upserted</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log: any) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">{log.siteKey}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "completed"
                            ? "default"
                            : log.status === "running"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.totalFetched}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.totalUpserted}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(log.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.completedAt
                        ? new Date(log.completedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
