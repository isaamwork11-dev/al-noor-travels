#!/usr/bin/env node
// Seeds the database through the running app's API, so it uses exactly the same
// code path as a first-run login. Start `npm run dev` (or `npm start`) first.
//
//   npm run seed
//   npm run seed -- --force        # wipe and reseed every collection
//   BASE_URL=https://example.com npm run seed

const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const force = process.argv.includes("--force");
const url = `${baseUrl}/api/seed${force ? "?force=1" : ""}`;

try {
  const response = await fetch(url, { method: "POST" });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error(`Seed failed (${response.status}):`, payload?.error ?? "unknown error");
    process.exit(1);
  }

  console.log(payload?.reason ?? "Done");
  if (payload?.counts) console.table(payload.counts);
} catch (error) {
  console.error(`Could not reach ${url}.`);
  console.error("Is the dev server running? Start it with `npm run dev`.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
