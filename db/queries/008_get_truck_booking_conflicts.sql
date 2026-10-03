-- db/queries/008_get_truck_booking_conflicts.sql
-- Description: Find active bookings that conflict with a proposed date range
--              for a specific truck.
--
-- Parameters:
--   $1 = truck_id               (BIGINT)
--   $2 = requested_pickup_date  (DATE)
--   $3 = requested_delivery_date (DATE)
--
-- SCHEMA JOIN CHAIN:
--   The current V1 Booking schema does not store truck_id or date fields
--   directly on the bookings table.  Quote is the single source of truth
--   for the truck relationship; Load is the source of truth for dates.
--   To reach both from a booking we traverse two chains:
--
--     bookings → quotes → trucks   (to filter by truck_id)
--     bookings → quotes → loads    (to retrieve pickup/delivery dates)
--
-- ACTIVE BOOKING STATUSES (V1):
--   Only CONFIRMED and IN_TRANSIT are considered active occupancy.
--   CANCELLED and COMPLETED are not conflicts.
--
-- V1 BOOKING PRECONDITION — NULL delivery_date:
--   A load must have a non-NULL delivery_date before it can be booked.
--   The loads schema permits delivery_date to be NULL (not yet scheduled),
--   but this query's overlap condition (lo.delivery_date >= $2) will silently
--   evaluate to NULL — i.e. FALSE — for any load with a NULL delivery_date,
--   meaning such a load would never appear as a conflict.  That could cause
--   a truck to be double-booked if a NULL-delivery_date load is mistakenly
--   booked without a date.
--
--   RULE: The booking transaction/application layer MUST reject booking
--   attempts for loads whose delivery_date IS NULL before invoking this
--   conflict check.  No COALESCE fallback or assumed default date is
--   used here; NULL must be caught and rejected upstream.
--
-- V1 INCLUSIVE-DATE OVERLAP RULE:
--   A truck is considered fully occupied on every calendar date between
--   pickup_date and delivery_date, including both endpoints.
--   Two date ranges overlap under this closed-interval assumption when:
--
--     existing.pickup_date   <= requested_delivery_date   ($3)
--     existing.delivery_date >= requested_pickup_date     ($2)
--
--   IMPORTANT — DESIGN REVIEW REQUIRED BEFORE FINAL IMPLEMENTATION:
--   This inclusive occupancy assumption is a V1 simplification.
--   It must be reviewed and confirmed (or replaced with a half-open
--   interval model) before the final temporal concurrency constraint
--   (EXCLUDE USING gist with daterange + btree_gist) is added to the
--   bookings table.  Do NOT silently change this to half-open semantics
--   without a deliberate engineering decision.

SELECT
    b.booking_id,
    b.quote_id,

    -- The conflicting load
    lo.load_id              AS existing_load_id,
    lo.pickup_date          AS existing_pickup_date,
    lo.delivery_date        AS existing_delivery_date,

    -- The truck in question (denormalized for caller convenience)
    t.truck_id,
    c.carrier_id,
    c.name                  AS carrier_name

FROM bookings b

-- bookings → quotes
JOIN quotes q
    ON q.quote_id = b.quote_id

-- quotes → trucks  (filter to the requested truck)
JOIN trucks t
    ON t.truck_id = q.truck_id

-- quotes → carriers
JOIN carriers c
    ON c.carrier_id = q.carrier_id

-- quotes → loads  (to access pickup/delivery dates)
JOIN loads lo
    ON lo.load_id = q.load_id

WHERE t.truck_id = $1
  -- Only active occupancy statuses count as conflicts.
  AND b.status IN ('CONFIRMED', 'IN_TRANSIT')
  -- Inclusive-overlap test (see V1 design note above).
  AND lo.pickup_date   <= $3
  AND lo.delivery_date >= $2;
