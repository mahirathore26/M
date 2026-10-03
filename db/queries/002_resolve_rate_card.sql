-- db/queries/002_resolve_rate_card.sql
-- Description: Resolve the applicable ACTIVE rate card for a given carrier, lane,
--              vehicle type capability, and requested date (V1).
--
-- Parameters (all positional, no hard-coded IDs or dates):
--   $1 = carrier_id            (BIGINT)
--   $2 = lane_id               (BIGINT)
--   $3 = vehicle_capability_id (BIGINT — must reference a VEHICLE_TYPE capability)
--   $4 = requested_date        (DATE)
--
-- V1 ASSUMPTION:
--   For any given (carrier_id, lane_id, vehicle_capability_id, requested_date)
--   there should be AT MOST one ACTIVE applicable rate card.
--   Cross-row enforcement of non-overlapping rate-card periods (e.g. via
--   EXCLUDE USING gist with btree_gist) is intentionally deferred to a later
--   PostgreSQL temporal-constraint step. Until that constraint is in place,
--   the application layer is responsible for detecting and rejecting ambiguous
--   results (i.e. more than one row returned by this query).

SELECT
    -- Returned columns — no wildcard SELECT
    rc.rate_card_id,
    rc.carrier_id,
    rc.lane_id,
    rc.vehicle_capability_id,
    rc.base_rate,
    rc.valid_from,
    rc.valid_until,
    rc.status
FROM rate_cards rc
WHERE
    -- 1. IDENTITY FILTERS
    --    Narrow to the exact carrier, lane, and vehicle-type capability
    --    supplied by the caller. All three must match simultaneously.
    rc.carrier_id            = $1
    AND rc.lane_id           = $2
    AND rc.vehicle_capability_id = $3

    -- 2. ACTIVE-RATE FILTERING
    --    Only consider rate cards that are explicitly marked ACTIVE.
    --    EXPIRED and INACTIVE cards are excluded even if their date
    --    range would otherwise match.
    AND rc.status = 'ACTIVE'

    -- 3. HALF-OPEN TEMPORAL VALIDITY  [valid_from, valid_until)
    --    valid_from  is INCLUSIVE: the card is valid on its start date.
    --    valid_until is EXCLUSIVE: the card expires at the start of this date.
    --    This allows adjacent, non-overlapping periods to share a boundary
    --    (e.g. 2026-07-01 → 2026-10-01 and 2026-10-01 → 2027-01-01)
    --    without a gap or a double match on the boundary date.
    AND rc.valid_from  <= $4
    AND $4             <  rc.valid_until

-- Most-recent period first; useful if the V1 assumption is ever violated
-- and the caller needs to surface or log the ambiguity.
ORDER BY rc.valid_from DESC;
