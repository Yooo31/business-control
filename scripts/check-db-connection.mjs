import "dotenv/config";

import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const url = new URL(connectionString);
const usesSupabase = url.hostname.endsWith(".supabase.co");
const sslmode = url.searchParams.get("sslmode");
const needsSsl = usesSupabase || sslmode !== null;
const poolUrl = new URL(connectionString);

poolUrl.searchParams.delete("schema");
poolUrl.searchParams.delete("sslmode");

const pool = new pg.Pool({
  connectionString: poolUrl.toString(),
  ssl: needsSsl
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});

try {
  const result = await pool.query(
    "select current_database() as database_name, now() as server_time",
  );
  const row = result.rows[0];

  console.log(
    `Database connection OK: ${row.database_name} at ${new Date(row.server_time).toISOString()}`,
  );
} finally {
  await pool.end();
}
