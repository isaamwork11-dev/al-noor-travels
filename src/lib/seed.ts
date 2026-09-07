import { connectDB } from "./db";
import { DEMO_DATA } from "./demo-data";
import { hashPassword } from "./auth-server";
import { COLLECTIONS, DEFAULT_RATES, type CollectionKey, type DbRecord } from "./api-helpers";
import { AppSettings, Backup, SETTINGS_ID, User } from "@/models";
import type { InsuranceRecord } from "./types";

/** Extra sample record so the Insurance module isn't empty on a fresh install. */
const SAMPLE_INSURANCE: InsuranceRecord = DEMO_DATA.insurance[0] ?? {
  id: "in1",
  bookingId: "BK-000141",
  customerId: "c1",
  provider: "Jubilee General",
  policyNumber: "TRV-2024-88213",
  coverageType: "Travel Medical",
  startDate: "2024-05-22",
  endDate: "2024-06-05",
  costPrice: 4500,
  salePrice: 7500,
  profit: 3000,
  status: "Confirmed",
  currency: "PKR",
  createdBy: "u1",
  createdAt: "2024-05-11",
};

/** Which `DEMO_DATA` array feeds which collection. */
const SEED_SOURCES: Record<CollectionKey, DbRecord[]> = {
  users: DEMO_DATA.users as unknown as DbRecord[],
  customers: DEMO_DATA.customers as unknown as DbRecord[],
  suppliers: DEMO_DATA.suppliers as unknown as DbRecord[],
  airTickets: DEMO_DATA.airTickets as unknown as DbRecord[],
  visas: DEMO_DATA.visas as unknown as DbRecord[],
  hotels: DEMO_DATA.hotels as unknown as DbRecord[],
  transports: DEMO_DATA.transports as unknown as DbRecord[],
  umrahPackages: DEMO_DATA.umrahPackages as unknown as DbRecord[],
  tourPackages: DEMO_DATA.tourPackages as unknown as DbRecord[],
  insurance: [SAMPLE_INSURANCE] as unknown as DbRecord[],
  travelBookings: (DEMO_DATA.travelBookings ?? []) as unknown as DbRecord[],
  payments: DEMO_DATA.payments as unknown as DbRecord[],
  cashBook: DEMO_DATA.cashBook as unknown as DbRecord[],
  refunds: DEMO_DATA.refunds as unknown as DbRecord[],
  activityLogs: DEMO_DATA.activityLogs as unknown as DbRecord[],
};

export interface SeedResult {
  seeded: boolean;
  reason: string;
  counts: Record<string, number>;
}

/**
 * Upserts `DEMO_DATA` into MongoDB. Runs only when the users collection is
 * empty unless `force` is set, in which case every collection is replaced.
 */
export async function seedDB(force = false): Promise<SeedResult> {
  await connectDB();

  const userCount = await User.countDocuments();
    if (userCount > 0 && !force) {
      return { seeded: false, reason: "Database already has users", counts: {} };
    }

    if (!force) {
      const admin = DEMO_DATA.users[0];
      const record: DbRecord = {
        ...admin,
        password: await hashPassword(admin.password),
      };
      await User.create(record);
      await AppSettings.updateOne(
        { id: SETTINGS_ID },
        { $setOnInsert: { exchangeRates: DEFAULT_RATES } },
        { upsert: true }
      );
      return {
        seeded: true,
        reason: "Created initial admin account; business data is empty",
        counts: { users: 1 },
      };
    }

  if (force) {
    await Promise.all([
      ...(Object.keys(COLLECTIONS) as CollectionKey[]).map((key) =>
        COLLECTIONS[key].model.deleteMany({})
      ),
      Backup.deleteMany({}),
    ]);
  }

  const counts: Record<string, number> = {};

  for (const key of Object.keys(SEED_SOURCES) as CollectionKey[]) {
    const model = COLLECTIONS[key].model;
    const rows = SEED_SOURCES[key];

    for (const row of rows) {
      const record: DbRecord = { ...row };
      if (key === "users" && typeof record.password === "string") {
        record.password = await hashPassword(record.password);
      }
      await model.updateOne({ id: record.id }, { $set: record }, { upsert: true });
    }

    counts[key] = rows.length;
  }

  await AppSettings.updateOne(
    { id: SETTINGS_ID },
    { $set: { exchangeRates: DEMO_DATA.exchangeRates ?? DEFAULT_RATES } },
    { upsert: true }
  );

  return {
    seeded: true,
    reason: "Reseeded demo data (force)",
    counts,
  };
}

export async function needsSeed(): Promise<boolean> {
  await connectDB();
  return (await User.countDocuments()) === 0;
}
