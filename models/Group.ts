import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IGroup extends Document {
  siteKey: string;
  wpId: number;
  title: string;
  status: string;
  createdAt_wp: string | null;
  batch: string | null;
  academicYear: string | null;
  trimester: number | null;
  leaderIds: number[];
  courseIds: number[];
  courses: Array<{ id: number; title: string }>;
  studentIds: number[];
  totalStudents: number;
  totalCourses: number;
  syncedAt: Date;
}

function buildGroupSchema() {
  const schema = new Schema<IGroup>(
    {
      siteKey: { type: String, required: true, index: true },
      wpId: { type: Number, required: true },
      title: { type: String, index: true },
      status: String,
      createdAt_wp: String,
      batch: { type: String, default: null, index: true },
      academicYear: { type: String, default: null, index: true },
      trimester: { type: Number, default: null, index: true },
      leaderIds: [Number],
      courseIds: [Number],
      courses: [{ id: Number, title: String }],
      studentIds: [Number],
      totalStudents: { type: Number, default: 0 },
      totalCourses: { type: Number, default: 0 },
      syncedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
  );

  schema.index({ siteKey: 1, wpId: 1 }, { unique: true });
  schema.index({ siteKey: 1, studentIds: 1 });

  return schema;
}

const SITE_COLLECTION_MAP: Record<string, string> = {
  jimn: "jimn_noida_groups",
  jiml: "jiml_lucknow_groups",
  jimj: "jimj_jaipur_groups",
  jimi: "jimi_indore_groups",
};

const modelCache: Record<string, Model<IGroup>> = {};

export function getGroupModel(siteKey: string): Model<IGroup> {
  const collectionName = SITE_COLLECTION_MAP[siteKey];
  if (!collectionName) {
    throw new Error(
      `Unknown siteKey: "${siteKey}". Expected one of: ${Object.keys(SITE_COLLECTION_MAP).join(", ")}`,
    );
  }

  if (modelCache[siteKey]) return modelCache[siteKey];

  const modelName = `Group_${siteKey}`;
  const model =
    mongoose.models[modelName] ??
    mongoose.model<IGroup>(modelName, buildGroupSchema(), collectionName);

  modelCache[siteKey] = model;
  return model;
}
