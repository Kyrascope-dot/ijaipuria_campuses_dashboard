import mongoose, { Schema, type Document } from "mongoose";

export interface ISyncLog extends Document {
  siteKey: string;
  status: "running" | "completed" | "failed";
  totalFetched: number;
  totalUpserted: number;
  allCoursesCount: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

const SyncLogSchema = new Schema<ISyncLog>({
  siteKey: { type: String, required: true, index: true },
  status: { type: String, enum: ["running", "completed", "failed"], default: "running" },
  totalFetched: { type: Number, default: 0 },
  totalUpserted: { type: Number, default: 0 },
  allCoursesCount: { type: Number, default: 0 },
  error: String,
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

export const SyncLog = mongoose.models.SyncLog ?? mongoose.model<ISyncLog>("SyncLog", SyncLogSchema);
