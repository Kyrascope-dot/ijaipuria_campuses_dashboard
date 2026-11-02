import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ── Sub-schemas ── */
const CourseSchema = new Schema(
  {
    course_id: Number,
    title: String,
    url: String,
    status: String,
    completed_steps: Number,
    total_steps: Number,
    percentage: Number,
    enrolled_at: String,
    completed_at: String,
    certificate_url: String,
  },
  { _id: false },
);

const QuizSchema = new Schema(
  {
    quiz_id: Number,
    quiz_title: String,
    course_id: Number,
    lesson_id: Number,
    score: Number,
    question_count: Number,
    points: Number,
    total_points: Number,
    percentage: Number,
    passed: Boolean,
    started_at: String,
    completed_at: String,
    time_spent_seconds: Number,
  },
  { _id: false },
);

const AssignmentSchema = new Schema(
  {
    id: Number,
    title: String,
    course_id: Number,
    lesson_id: Number,
    approved: Boolean,
    points: Schema.Types.Mixed,
    file_url: String,
    submitted_at: String,
  },
  { _id: false },
);

const EssaySchema = new Schema(
  {
    id: Number,
    title: String,
    status: String,
    quiz_id: Number,
    course_id: Number,
    lesson_id: Number,
    submitted_at: String,
  },
  { _id: false },
);

const StatsSchema = new Schema(
  {
    courses_enrolled: { type: Number, default: 0 },
    courses_completed: { type: Number, default: 0 },
    courses_in_progress: { type: Number, default: 0 },
    avg_progress_percent: { type: Number, default: 0 },
    certificates: { type: Number, default: 0 },
    quiz_attempts: { type: Number, default: 0 },
    quizzes_passed: { type: Number, default: 0 },
    assignments: { type: Number, default: 0 },
    essays_pending: { type: Number, default: 0 },
  },
  { _id: false },
);

/* ── Main schema ── */
export interface IStudent extends Document {
  siteKey: string;
  wpId: number;
  username: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone: string | null;
  roles: string[];
  registered_at: string | null;
  last_site_activity_at: string | null;
  last_learning_activity: string | null;
  avatar_url: string;
  profile_url: string | null;
  profile_fields: Record<string, any>;
  groups: Array<{ id: number; title: string }>;
  batch: string | null;
  academicYear: string | null;
  stats: Record<string, number>;
  courses: any[];
  quizzes: any[];
  assignments: any[];
  essays: any[];
  syncedAt: Date;
}

function buildStudentSchema() {
  const schema = new Schema<IStudent>(
    {
      siteKey: { type: String, required: true, index: true },
      wpId: { type: Number, required: true },
      username: String,
      email: { type: String, index: true },
      display_name: String,
      first_name: { type: String, index: true },
      last_name: { type: String, index: true },
      nickname: String,
      phone: String,
      roles: [String],
      registered_at: String,
      last_site_activity_at: String,
      last_learning_activity: String,
      avatar_url: String,
      profile_url: String,
      profile_fields: { type: Schema.Types.Mixed, default: {} },
      groups: [{ id: Number, title: String }],
      batch: { type: String, default: null, index: true },
      academicYear: { type: String, default: null, index: true },
      stats: StatsSchema,
      courses: [CourseSchema],
      quizzes: [QuizSchema],
      assignments: [AssignmentSchema],
      essays: [EssaySchema],
      syncedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
  );

  schema.index({ siteKey: 1, wpId: 1 }, { unique: true });
  schema.index({
    first_name: "text",
    last_name: "text",
    email: "text",
    username: "text",
    display_name: "text",
  });

  return schema;
}

const SITE_COLLECTION_MAP: Record<string, string> = {
  jimn: "jimn_noida_student",
  jiml: "jiml_lucknow_student",
  jimj: "jimj_jaipur_student",
  jimi: "jimi_indore_student",
};

const modelCache: Record<string, Model<IStudent>> = {};

export function getStudentModel(siteKey: string): Model<IStudent> {
  const collectionName = SITE_COLLECTION_MAP[siteKey];
  if (!collectionName) {
    throw new Error(
      `Unknown siteKey: "${siteKey}". Expected one of: ${Object.keys(SITE_COLLECTION_MAP).join(", ")}`,
    );
  }

  if (modelCache[siteKey]) return modelCache[siteKey];

  const modelName = `Student_${siteKey}`;
  const model =
    mongoose.models[modelName] ??
    mongoose.model<IStudent>(modelName, buildStudentSchema(), collectionName);

  modelCache[siteKey] = model;
  return model;
}
