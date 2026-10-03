-- db/queries/003_get_quote_inputs.sql
-- Description: Retrieve all normalized inputs required by the pricing engine
--              to calculate a quote for a single load + truck + rate card.
--
-- Parameters (all positional):
--   $1 = load_id      (BIGINT)
--   $2 = truck_id     (BIGINT)
--   $3 = rate_card_id (BIGINT)
--
-- WHY THIS QUERY IS SEPARATE FROM ELIGIBLE-TRUCK DISCOVERY (001):
--   001_find_eligible_trucks.sql answers a set-level question: "which trucks
--   can serve this load?"  This query answers a record-level question: "given
--   a specific (load, truck, rate card) triple that has already been selected,
--   is the combination coherent and what raw data does the pricer need?"
--   Keeping them separate respects single-responsibility and makes each query
--   independently testable and auditable.
--
-- WHY PRICING CALCULATION IS NOT PERFORMED HERE:
--   Fuel-surcharge and accessorial-charge rules involve business logic
--   (multipliers, thresholds, carrier-specific policy) that changes
--   independently of the data model. That logic lives in Node.js, where it
--   can be unit-tested, versioned, and hot-patched without a DB migration.
--   This query supplies only the stable, schema-level inputs the pricer
--   needs; it never computes a total amount.
--
-- ZERO-ROW GUARANTEE:
--   Every JOIN condition encodes a real relationship that must hold.
--   If any condition is violated — wrong carrier, wrong lane, inactive
--   truck, expired rate card, date out of range — the entire row is
--   filtered and the query returns zero rows.  The caller must treat a
--   zero-row result as a validation failure, never as a silent success.

SELECT
    -- LOAD fields
    lo.load_id,
    lo.lane_id,
    lo.pickup_date,
    lo.delivery_date,
    lo.weight_kg,

    -- LANE fields
    la.origin_city,
    la.destination_city,
    la.distance_km,

    -- TRUCK fields
    t.truck_id,
    t.registration_number,
    t.capacity_kg,
    t.status         AS truck_status,

    -- CARRIER fields
    c.carrier_id,
    c.name           AS carrier_name,

    -- RATE CARD fields
    rc.rate_card_id,
    rc.vehicle_capability_id,
    rc.base_rate,
    rc.valid_from,
    rc.valid_until

FROM loads lo

-- 1. Resolve the load's lane.
JOIN lanes la
    ON la.lane_id = lo.lane_id

-- 2. Pin to the specific truck supplied by the caller.
JOIN trucks t
    ON t.truck_id = $2

-- 3. Truck must belong to an ACTIVE carrier.
JOIN carriers c
    ON c.carrier_id = t.carrier_id
   AND c.status = 'ACTIVE'

-- 4. Truck must itself be ACTIVE.
--    (Applied as a WHERE predicate below; listed here for narrative clarity.)

-- 5. Pin to the specific rate card supplied by the caller.
JOIN rate_cards rc
    ON rc.rate_card_id = $3

-- 6. Rate card must belong to the same carrier as the truck.
   AND rc.carrier_id = c.carrier_id

-- 7. Rate card must cover the same lane as the load.
   AND rc.lane_id = lo.lane_id

-- 8. Rate card must be priced for a VEHICLE_TYPE capability that the
--    truck actually possesses.  The join through truck_capabilities
--    ensures the truck has the capability; the join through capabilities
--    confirms it is of category VEHICLE_TYPE.
JOIN truck_capabilities tc
    ON tc.truck_id = t.truck_id
   AND tc.capability_id = rc.vehicle_capability_id
JOIN capabilities cap
    ON cap.capability_id = tc.capability_id
   AND cap.category = 'VEHICLE_TYPE'

-- 9. Rate card must be ACTIVE (not EXPIRED or INACTIVE).
WHERE rc.status = 'ACTIVE'

  -- 4. Truck must be ACTIVE (cross-referenced here in WHERE for clarity).
  AND t.status = 'ACTIVE'

  -- Pin to the specific load supplied by the caller.
  AND lo.load_id = $1

  -- 10. TEMPORAL VALIDITY — half-open interval [valid_from, valid_until):
  --     valid_from  is INCLUSIVE (card is live on its start date).
  --     valid_until is EXCLUSIVE (card expires at the start of that date).
  --     Ensures the pickup date is covered by this rate card's active period.
  AND rc.valid_from  <= lo.pickup_date
  AND lo.pickup_date <  rc.valid_until;
