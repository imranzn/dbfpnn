// src/lib/db.ts
// PostgreSQL query helper using the pg library
import { Pool, QueryResult } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  const res = await pool.query<T>(text, params)
  const duration = Date.now() - start
  console.log("executed query", { text, duration, rows: res.rowCount })
  return res
}
