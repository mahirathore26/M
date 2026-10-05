import pg from "pg";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Why a pool?
// A Pool maintains a set of reusable connections.  Rather than opening and
// closing a connection for every query, a pool hands out idle connections and
// returns them automatically, which dramatically reduces latency and resource
// usage under concurrent workloads.
//
// Why export the pool from one module?
// Centralising the Pool instance here guarantees every part of the application
// shares the same connection pool, preventing connection leaks and making it
// straightforward to tune pool size, handle errors, and shut down cleanly.
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set.  " +
      "Define it in your .env file (see .env.example) before starting the application."
  );
}

/**
 * Shared PostgreSQL connection pool.
 *
 * The pool is configured entirely through DATABASE_URL so that no credentials
 * need to be hard-coded.  `max` is kept small for local development; increase
 * it for production deployments behind a connection-pooler.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // suitable for local development
});

export default pool;
