import { connectDB } from "./db";
import { COLLECTIONS, DEFAULT_RATES, getSettings, type CollectionKey, type DbRecord } from "./api-helpers";
import { AppSettings, Backup, SETTINGS_ID } from "@/models";
import { nextId } from "./format";
import type { ExchangeRates } from "./types";

export const BACKUP_VERSION = 1;

export interface Snapshot {
  version: number;
  createdAt: string;
  exchangeRates: ExchangeRates;
  collections: Record<string, DbRecord[]>;
}

export type BackupSource = "manual" | "cron" | "restore";

function stripMongoInternals(record: DbRecord): DbRecord {
  const { _id: _mongoId, __v: _version, ...rest } = record;
  void _mongoId;
  void _version;
  return rest;
}

/**
 * Full dump of every collection. Password hashes are kept so a restore
 * produces a working system — the endpoints that expose this are admin only.
 */
export async function buildSnapshot(): Promise<Snapshot> {
  await connectDB();

  const keys = Object.keys(COLLECTIONS) as CollectionKey[];
  const rows = await Promise.all(
    keys.map((key) => COLLECTIONS[key].model.find({}).lean<DbRecord[]>())
  );

  const collections: Record<string, DbRecord[]> = {};
  keys.forEach((key, index) => {
    collections[key] = rows[index].map(stripMongoInternals);
  });

  const settings = await getSettings();

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    exchangeRates: settings.exchangeRates ?? DEFAULT_RATES,
    collections,
  };
}

export function snapshotCounts(snapshot: Snapshot): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key, rows] of Object.entries(snapshot.collections)) {
    counts[key] = rows.length;
  }
  return counts;
}

/** Persists a snapshot in the `Backup` collection and stamps `lastBackupAt`. */
export async function saveBackup(
  snapshot: Snapshot,
  source: BackupSource,
  createdBy: string
): Promise<{ id: string; createdAt: string; counts: Record<string, number> }> {
  const counts = snapshotCounts(snapshot);
  const doc = {
    id: nextId("bk"),
    createdAt: snapshot.createdAt,
    createdBy,
    source,
    counts,
    data: snapshot,
  };

  await Backup.create(doc);
  await AppSettings.updateOne(
    { id: SETTINGS_ID },
    { $set: { lastBackupAt: snapshot.createdAt } },
    { upsert: true }
  );

  return { id: doc.id, createdAt: doc.createdAt, counts };
}

export interface RestoreResult {
  restored: Record<string, number>;
  skipped: string[];
}

/** Replaces the contents of every collection present in the snapshot. */
export async function restoreSnapshot(snapshot: Snapshot): Promise<RestoreResult> {
  await connectDB();

  const restored: Record<string, number> = {};
  const skipped: string[] = [];

  for (const [key, rows] of Object.entries(snapshot.collections ?? {})) {
    if (!Object.prototype.hasOwnProperty.call(COLLECTIONS, key)) {
      skipped.push(key);
      continue;
    }
    if (!Array.isArray(rows)) {
      skipped.push(key);
      continue;
    }

    const model = COLLECTIONS[key as CollectionKey].model;
    await model.deleteMany({});
    if (rows.length) {
      await model.insertMany(rows.map(stripMongoInternals), { ordered: false });
    }
    restored[key] = rows.length;
  }

  if (snapshot.exchangeRates) {
    await AppSettings.updateOne(
      { id: SETTINGS_ID },
      { $set: { exchangeRates: snapshot.exchangeRates } },
      { upsert: true }
    );
  }

  return { restored, skipped };
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Snapshot>;
  return Boolean(candidate.collections && typeof candidate.collections === "object");
}
