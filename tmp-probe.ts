import mongoose, { Schema } from "mongoose";
import type { Model } from "mongoose";
import type { AppUser } from "@/lib/types";

const baseOptions = { versionKey: false, minimize: false } as const;

function registerModel<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

const permissionsSchema = new Schema(
  {
    viewCost: { type: Boolean, default: false },
    viewProfit: { type: Boolean, default: false },
    viewAccounts: { type: Boolean, default: false },
    viewFinancialReports: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    createRecords: { type: Boolean, default: true },
    editRecords: { type: Boolean, default: false },
    deleteRecords: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: true },
    viewActivityLog: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    role: { type: String, enum: ["super_admin", "staff"], default: "staff" },
    permissions: { type: permissionsSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
    avatar: { type: String },
    createdAt: { type: String, required: true },
  },
  baseOptions
);

export const User = registerModel<AppUser>("User", userSchema);
