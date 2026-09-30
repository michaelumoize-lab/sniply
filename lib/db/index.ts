import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePool } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// HTTP driver for fast reads and simple single-row writes
const sql = neon(connectionString);
export const db = drizzleHttp(sql, { schema });

// WebSocket Pool driver for interactive multi-statement transactions
let pool: Pool | null = null;

export function getPoolDb() {
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return drizzlePool(pool, { schema });
}
