/**
 * Database health-check script.
 *
 * Run via:  npm run db:check
 *
 * Connects to PostgreSQL through the shared pool, executes a trivial
 * parameterized query, and reports success or failure before exiting.
 */

import "dotenv/config"; // load .env before anything else
import pool from "./pool.js";

async function checkConnection() {
  let client;
  try {
    client = await pool.connect();

    // A parameterized SELECT that exercises the connection without touching
    // application tables.  The $1 parameter proves parameterisation works.
    const { rows } = await client.query("SELECT $1::text AS status", [
      "connected",
    ]);

    console.log(`✔  Database connection successful  (status: ${rows[0].status})`);
  } catch (error) {
    // Surface a useful message without leaking credentials.
    console.error("✖  Database connection failed");
    console.error(`   ${error.message}`);
    process.exitCode = 1;
  } finally {
    // Release the client back to the pool, then shut the pool down so
    // the process can exit cleanly.
    if (client) client.release();
    await pool.end();
  }
}

checkConnection();
