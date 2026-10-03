-- db/queries/007_get_active_booking_for_load.sql
-- Description: Determine whether a load already has an active operational booking.
--
-- Parameter:
--   $1 = load_id (BIGINT)
--
-- SCHEMA JOIN CHAIN:
--   The current V1 Booking schema intentionally does not duplicate load_id,
--   truck_id, carrier_id, or pickup/delivery dates.  Quote is the single
--   source of truth for those relationships.  To reach the load from a
--   booking we must traverse:
--
--     bookings  →  quotes  →  loads
--
--   This is by design (see migration comment, Rule 1).
--
-- ACTIVE BOOKING STATUSES (V1):
--   CONFIRMED  — booking accepted, truck not yet departed.
--   IN_TRANSIT — truck is currently moving the load.
--
--   CANCELLED and COMPLETED are not active blockers; they do NOT prevent
--   a new booking from being created for the same load.
--
-- MULTIPLE ROWS:
--   The query returns ALL active matches, not just the first one.
--   This is intentional: if the data is in a bad state (e.g. two
--   CONFIRMED bookings for the same load), both are surfaced so that
--   operators and monitoring can detect the anomaly rather than silently
--   hiding it behind a LIMIT 1.

SELECT
    b.booking_id,
    b.quote_id,
    b.status        AS booking_status,
    b.booking_date,

    -- Carrier (reached through quote)
    c.carrier_id,
    c.name          AS carrier_name,

    -- Truck (reached through quote)
    t.truck_id,
    t.registration_number,

    -- Financial summary (reached through quote)
    q.total_amount

FROM bookings b

-- bookings → quotes
JOIN quotes q
    ON q.quote_id = b.quote_id

-- quotes → loads  (this is how we filter by load_id)
JOIN loads lo
    ON lo.load_id = q.load_id

-- quotes → carriers
JOIN carriers c
    ON c.carrier_id = q.carrier_id

-- quotes → trucks
JOIN trucks t
    ON t.truck_id = q.truck_id

WHERE lo.load_id = $1
  AND b.status IN ('CONFIRMED', 'IN_TRANSIT');
