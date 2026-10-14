import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './pool.js';
import { generateQuotesForLoad } from '../services/quoteService.js';
import { listQuotesForLoad } from '../repositories/quoteRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyFleetCoverage() {
  const querySql = fs.readFileSync(
    path.resolve(__dirname, '../../db/queries/001_find_eligible_trucks.sql'),
    'utf8'
  );

  const testProfiles = [
    {
      name: '1. Standard 32FT Dry Container Freight (General + Waterproof)',
      laneId: 1, // Indore -> Mumbai (589 km)
      laneName: 'Indore → Mumbai',
      pickupDate: '2026-10-20',
      weightKg: 18000,
      capNames: ['32FT', 'CONTAINER', 'WATERPROOF', 'GENERAL'],
    },
    {
      name: '2. Heavy Open-Body Flatbed Freight (Supported High Capacity)',
      laneId: 2, // Indore -> Delhi (793 km)
      laneName: 'Indore → Delhi',
      pickupDate: '2026-10-22',
      weightKg: 25000,
      capNames: ['32FT', 'OPEN_BODY', 'GENERAL'],
    },
    {
      name: '3. Light-Haul Container Freight (Urban Short Haul)',
      laneId: 4, // Mumbai -> Pune (150 km)
      laneName: 'Mumbai → Pune',
      pickupDate: '2026-10-25',
      weightKg: 8000,
      capNames: ['20FT', 'CONTAINER', 'WATERPROOF', 'GENERAL'],
    },
    {
      name: '4. Refrigerated & Perishable Cold Chain Cargo',
      laneId: 3, // Bhopal -> Mumbai (780 km)
      laneName: 'Bhopal → Mumbai',
      pickupDate: '2026-11-05',
      weightKg: 20000,
      capNames: ['32FT', 'CONTAINER', 'WATERPROOF', 'REFRIGERATED', 'PERISHABLE'],
    },
    {
      name: '5. Waterproof & High-Value Fragile Cargo',
      laneId: 5, // Indore -> Pune (640 km)
      laneName: 'Indore → Pune',
      pickupDate: '2026-11-12',
      weightKg: 17000,
      capNames: ['32FT', 'CONTAINER', 'WATERPROOF', 'FRAGILE'],
    },
    {
      name: '6. Bhopal to Delhi Industrial Linehaul (32FT Container)',
      laneId: 6, // Bhopal -> Delhi (697 km)
      laneName: 'Bhopal → Delhi',
      pickupDate: '2026-11-18',
      weightKg: 22000,
      capNames: ['32FT', 'CONTAINER', 'WATERPROOF', 'GENERAL'],
    },
  ];

  console.log('=================================================================================');
  console.log('TRUCKLAYBAY FLEET COVERAGE & QUOTE AVAILABILITY VALIDATION');
  console.log('=================================================================================\n');

  const createdLoadIds = [];

  try {
    for (const profile of testProfiles) {
      // 1. Create committed load record in OPEN status
      const loadRes = await pool.query(
        `INSERT INTO loads (lane_id, pickup_date, delivery_date, weight_kg, status)
         VALUES ($1, $2, $2::date + INTERVAL '1 day', $3, 'OPEN')
         RETURNING load_id`,
        [profile.laneId, profile.pickupDate, profile.weightKg]
      );
      const loadId = Number(loadRes.rows[0].load_id);
      createdLoadIds.push(loadId);

      // 2. Assign demanded load capabilities
      for (const capName of profile.capNames) {
        await pool.query(
          `INSERT INTO load_capabilities (load_id, capability_id)
           SELECT $1, capability_id FROM capabilities WHERE name = $2`,
          [loadId, capName]
        );
      }

      // 3. Diagnose candidate trucks & filtering stages
      const totalActiveTrucks = await pool.query(
        `SELECT count(*) FROM trucks WHERE status = 'ACTIVE'`
      );
      const capacitySufficient = await pool.query(
        `SELECT count(*) FROM trucks WHERE status = 'ACTIVE' AND capacity_kg >= $1`,
        [profile.weightKg]
      );
      const allCapsMatch = await pool.query(
        `SELECT count(*) FROM trucks t
         WHERE t.status = 'ACTIVE'
           AND t.capacity_kg >= $1
           AND NOT EXISTS (
               SELECT 1 FROM load_capabilities lc
               WHERE lc.load_id = $2
                 AND NOT EXISTS (
                     SELECT 1 FROM truck_capabilities tc
                     WHERE tc.truck_id = t.truck_id AND tc.capability_id = lc.capability_id
                 )
           )`,
        [profile.weightKg, loadId]
      );

      // 4. Run 001_find_eligible_trucks.sql (relational matching + rate card resolution)
      const eligibleRes = await pool.query(querySql, [loadId]);
      const eligibleRows = eligibleRes.rows;

      // 5. Generate actual quotes using quoteService (testing end-to-end quotation creation)
      const validUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const generatedQuotes = await generateQuotesForLoad(loadId, validUntil);

      // Print structured verification report for this profile
      console.log(`─────────────────────────────────────────────────────────────────────────────────`);
      console.log(`PROFILE: ${profile.name}`);
      console.log(`  Corridor:      Lane ${profile.laneId} (${profile.laneName})`);
      console.log(`  Pickup Date:   ${profile.pickupDate}`);
      console.log(`  Weight:        ${profile.weightKg} kg`);
      console.log(`  Requirements:  [${profile.capNames.join(', ')}]`);
      console.log(`  Filtering Diagnostics:`);
      console.log(`    • Total Active Fleet:                   ${totalActiveTrucks.rows[0].count} trucks`);
      console.log(`    • Payload Capacity >= ${profile.weightKg} kg:        ${capacitySufficient.rows[0].count} trucks`);
      console.log(`    • Equipment Specs Fully Satisfied:      ${allCapsMatch.rows[0].count} trucks`);
      console.log(`    • Active Rate Cards Matched:            ${eligibleRows.length} rate cards`);
      console.log(`  Quotes Generated: ${generatedQuotes.length} quote(s)`);

      for (const q of generatedQuotes) {
        const truck = eligibleRows.find((r) => String(r.truck_id) === String(q.truck_id));
        console.log(
          `    ✓ Quote #${q.quote_id} | Truck: ${truck?.registration_number} (${truck?.capacity_kg}kg) | Carrier: ${truck?.carrier_name} | Base: ₹${q.base_rate} | Fuel: ₹${q.fuel_surcharge} | Quoted Total: ₹${q.total_amount}`
        );
      }

      if (generatedQuotes.length === 0) {
        throw new Error(`Profile "${profile.name}" yielded 0 quotes! Coverage gap detected.`);
      }
    }

    console.log(`─────────────────────────────────────────────────────────────────────────────────`);
    console.log('✔ All 6 representative freight profiles validated with 100% quote availability!');
    console.log('=================================================================================\n');
  } catch (err) {
    console.error('✖ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    // Clean up test loads and quotes generated during verification
    if (createdLoadIds.length > 0) {
      await pool.query('DELETE FROM quotes WHERE load_id = ANY($1)', [createdLoadIds]);
      await pool.query('DELETE FROM load_capabilities WHERE load_id = ANY($1)', [createdLoadIds]);
      await pool.query('DELETE FROM loads WHERE load_id = ANY($1)', [createdLoadIds]);
    }
    await pool.end();
  }
}

verifyFleetCoverage();
