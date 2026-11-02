import axios from "axios";
import type { SiteConfig } from "./sites";

/** Create an axios instance configured for a WordPress site's ijdash API */
export function createSiteClient(site: SiteConfig) {
  return axios.create({
    baseURL: site.apiUrl,
    headers: {
      "X-API-User": site.apiUser,
      "X-API-Pass": site.apiPass,
    },
    timeout: 120_000,
  });
}

export interface WPStudentRaw {
  id: number;
  username: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone: string | null;
  website: string;
  roles: string[];
  registered_at: string | null;
  last_site_activity_at: string | null;
  last_learning_activity: string | null;
  avatar_url: string;
  profile_url: string | null;
  profile_fields: Record<string, any>;
  groups: Array<{ id: number; title: string }>;
  batch: string | null;
  academic_year: string | null;
  stats: {
    courses_enrolled: number;
    courses_completed: number;
    courses_in_progress: number;
    avg_progress_percent: number;
    certificates: number;
    quiz_attempts: number;
    quizzes_passed: number;
    assignments: number;
    essays_pending: number;
  };
  courses: any[];
  quizzes: any[];
  assignments: any[];
  essays: any[];
}

export interface WPStudentsResponse {
  site: string;
  generated: string;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  students: WPStudentRaw[];
}

export interface WPGroupRaw {
  id: number;
  title: string;
  status: string;
  created_at: string | null;
  batch: string | null;
  academic_year: string | null;
  leader_ids: number[];
  course_ids: number[];
  courses: Array<{ id: number; title: string }>;
  student_ids: number[];
  total_students: number;
  total_courses: number;
}

export interface WPGroupsResponse {
  site: string;
  generated: string;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  groups: WPGroupRaw[];
  all_courses: Array<{ id: number; title: string }>;
}

export interface WPSummaryResponse {
  site: string;
  generated: string;
  total_students: number;
  total_courses: number;
  assignments_pending: number;
  essays_pending: number;
  courses: Array<{
    id: number;
    title: string;
    status: string;
    url: string;
    created: string;
  }>;
}
