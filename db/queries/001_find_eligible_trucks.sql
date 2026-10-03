-- db/queries/001_find_eligible_trucks.sql
-- Description: Find all eligible trucks for a given load and resolve their applicable base rates in V1.
-- Parameter: $1 (load_id)

WITH
-- 1. LOAD LOOKUP
-- Retrieve target load attributes (lane, pickup date, required weight) for parameter $1.
target_load AS (
    SELECT
        load_id,
        lane_id,
        pickup_date,
        weight_kg
    FROM loads
    WHERE load_id = $1
),

-- 2. CANDIDATE TRUCK FILTERING & 3. ALL-CAPABILITY MATCHING
-- Filter active trucks with sufficient capacity that possess EVERY capability required by the load.
eligible_trucks AS (
    SELECT
        t.truck_id,
        t.carrier_id,
        t.registration_number,
        t.capacity_kg
    FROM trucks t
    CROSS JOIN target_load tl
    -- Candidate truck filtering: truck must be ACTIVE and have capacity >= load weight
    WHERE t.status = 'ACTIVE'
      AND t.capacity_kg >= tl.weight_kg
      -- ALL-capability matching (relational set containment via NOT EXISTS):
      -- There does NOT EXIST a load capability requirement for which there does NOT EXIST a matching truck capability.
      AND NOT EXISTS (
          SELECT 1
          FROM load_capabilities lc
          WHERE lc.load_id = tl.load_id
            AND NOT EXISTS (
                SELECT 1
                FROM truck_capabilities tc
                WHERE tc.truck_id = t.truck_id
                  AND tc.capability_id = lc.capability_id
            )
      )
)

-- 4. APPLICABLE RATE-CARD RESOLUTION
-- Join active carriers and resolve active rate cards matching the load lane, pickup date,
-- and the truck's VEHICLE_TYPE capability.
SELECT
    tl.load_id,
    et.truck_id,
    et.registration_number,
    c.carrier_id,
    c.name AS carrier_name,
    et.capacity_kg,
    rc.rate_card_id AS applicable_rate_card_id,
    rc.base_rate
FROM eligible_trucks et
CROSS JOIN target_load tl
JOIN carriers c
    ON c.carrier_id = et.carrier_id
   AND c.status = 'ACTIVE'
JOIN truck_capabilities tc_v
    ON tc_v.truck_id = et.truck_id
JOIN capabilities cap_v
    ON cap_v.capability_id = tc_v.capability_id
   AND cap_v.category = 'VEHICLE_TYPE'
JOIN rate_cards rc
    ON rc.carrier_id = c.carrier_id
   AND rc.lane_id = tl.lane_id
   AND rc.vehicle_capability_id = tc_v.capability_id
   AND rc.status = 'ACTIVE'
   -- Rate validity: half-open interval [valid_from, valid_until)
   AND rc.valid_from <= tl.pickup_date
   AND tl.pickup_date < rc.valid_until
ORDER BY
    rc.base_rate ASC,
    et.truck_id ASC;
