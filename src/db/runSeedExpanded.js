import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeedExpanded() {
  const seedFile = path.resolve(__dirname, '../../db/seeds/002_expanded_fleet.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');

  console.log(`Executing expanded fleet seed: ${seedFile}`);
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✔ Successfully executed 002_expanded_fleet.sql');

    const carrierCount = await client.query('SELECT count(*) FROM carriers');
    const truckCount = await client.query('SELECT count(*) FROM trucks');
    const rateCardCount = await client.query('SELECT count(*) FROM rate_cards');

    console.log(`Current state:`);
    console.log(`  Carriers: ${carrierCount.rows[0].count}`);
    console.log(`  Trucks: ${truckCount.rows[0].count}`);
    console.log(`  Rate cards: ${rateCardCount.rows[0].count}`);
  } catch (err) {
    console.error('✖ Failed to execute expanded fleet seed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeedExpanded();
