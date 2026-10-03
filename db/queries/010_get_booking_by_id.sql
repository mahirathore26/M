-- db/queries/010_get_booking_by_id.sql
-- Description: Retrieve a complete, fully-joined booking view for a given booking_id.
--
-- Parameter:
--   $1 = booking_id (BIGINT)
--
-- SCHEMA JOIN CHAIN:
--   Booking intentionally stores only quote_id.  All load, lane, carrier,
--   truck, and rate card detail is reached by traversing:
--
--     bookings → quotes → loads → lanes
--                       → carriers
--                       → trucks
--                       → rate_cards
--
-- ALIAS DISAMBIGUATION:
--   base_rate  exists on both quotes and rate_cards — returned as
--              quote_base_rate and rc_base_rate respectively.
--   valid_until exists on both quotes (TIMESTAMPTZ) and rate_cards (DATE)
--              — returned as quote_valid_until and rc_valid_until respectively.

SELECT
    -- BOOKING
    b.booking_id,
    b.booking_date,
    b.status        AS booking_status,
    b.created_at    AS booking_created_at,
    b.updated_at    AS booking_updated_at,

    -- QUOTE
    q.quote_id,
    q.total_amount,
    q.base_rate         AS quote_base_rate,
    q.fuel_surcharge,
    q.accessorial_charges,
    q.valid_until       AS quote_valid_until,
    q.status            AS quote_status,

    -- LOAD
    lo.load_id,
    lo.pickup_date,
    lo.delivery_date,
    lo.weight_kg,

    -- LANE (reached through load)
    la.origin_city,
    la.destination_city,

    -- CARRIER
    c.carrier_id,
    c.name              AS carrier_name,

    -- TRUCK
    t.truck_id,
    t.registration_number,

    -- RATE CARD
    rc.rate_card_id,
    rc.base_rate        AS rc_base_rate,
    rc.valid_from       AS rc_valid_from,
    rc.valid_until      AS rc_valid_until

FROM bookings b

-- bookings → quotes
JOIN quotes q
    ON q.quote_id = b.quote_id

-- quotes → loads
JOIN loads lo
    ON lo.load_id = q.load_id

-- loads → lanes
JOIN lanes la
    ON la.lane_id = lo.lane_id

-- quotes → carriers
JOIN carriers c
    ON c.carrier_id = q.carrier_id

-- quotes → trucks
JOIN trucks t
    ON t.truck_id = q.truck_id

-- quotes → rate cards
JOIN rate_cards rc
    ON rc.rate_card_id = q.rate_card_id

WHERE b.booking_id = $1;
