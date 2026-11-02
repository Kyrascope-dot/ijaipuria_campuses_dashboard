"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useDashboardSummary(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["dashboard", "summary", params],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/summary", { params });
      return data;
    },
  });
}

export function useRecords(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["records", params],
    queryFn: async () => {
      const { data } = await axios.get("/api/records", { params });
      return data;
    },
    placeholderData: (prev: any) => prev,
  });
}

export function useRecordDetail(id: string | null, siteKey = "jimn") {
  return useQuery({
    queryKey: ["records", "detail", id, siteKey],
    queryFn: async () => {
      const { data } = await axios.get(`/api/records/${id}`, { params: { siteKey } });
      return data.student;
    },
    enabled: !!id,
  });
}

export function useSyncData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (siteKey?: string) => {
      const body = siteKey ? { siteKey } : {};
      const { data } = await axios.post("/api/sync", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useGroups(siteKey = "jimn") {
  return useQuery({
    queryKey: ["dashboard", "groups", siteKey],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/groups", { params: { siteKey } });
      return data as {
        groups: Array<{
          _id: string;
          wpId: number;
          title: string;
          batch: string | null;
          academicYear: string | null;
          trimester: number | null;
          studentIds: number[];
          totalStudents: number;
          totalCourses: number;
        }>;
        batches: string[];
        academicYears: string[];
        trimesters: number[];
        courseTitles: Array<{ id: number; title: string }>;
      };
    },
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: ["sync", "status"],
    queryFn: async () => {
      const { data } = await axios.get("/api/sync/status");
      return data.logs;
    },
  });
}

export function useOverallSummary() {
  return useQuery({
    queryKey: ["dashboard", "overall"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/overall");
      return data;
    },
  });
}

export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await axios.get("/api/sites");
      return data.sites as Array<{ key: string; label: string }>;
    },
  });
}
