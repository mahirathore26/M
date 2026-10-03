-- db/queries/005_get_quote_by_id.sql
-- Description: Retrieve a single fully-joined quote for API or read use.
--
-- Parameter:
--   $1 = quote_id (BIGINT)
--
-- Returns zero rows when the quote_id does not exist.
-- Returns exactly one row when it does.
--
-- NOTE: valid_until appears on both quotes (quote expiry, TIMESTAMPTZ) and
-- rate_cards (rate card period boundary, DATE).  Both are returned under
-- distinct aliases: quote_valid_until and rc_valid_until.

SELECT
    -- QUOTE
    q.quote_id,
    q.status,
    q.base_rate,
    q.fuel_surcharge,
    q.accessorial_charges,
    q.total_amount,
    q.valid_until           AS quote_valid_until,
    q.calculation_snapshot,
    q.created_at,
    q.updated_at,

    -- LOAD
    lo.load_id,
    lo.pickup_date,
    lo.delivery_date,
    lo.weight_kg,

    -- LANE
    la.lane_id,
    la.origin_city,
    la.destination_city,
    la.distance_km,

    -- CARRIER
    c.carrier_id,
    c.name                  AS carrier_name,

    -- TRUCK
    t.truck_id,
    t.registration_number,
    t.capacity_kg,
    t.status                AS truck_status,

    -- RATE CARD
    rc.rate_card_id,
    rc.valid_from           AS rc_valid_from,
    rc.valid_until          AS rc_valid_until,
    rc.status               AS rate_card_status

FROM quotes q

-- Quote → Load
JOIN loads lo
    ON lo.load_id = q.load_id

-- Load → Lane
JOIN lanes la
    ON la.lane_id = lo.lane_id

-- Quote → Carrier
JOIN carriers c
    ON c.carrier_id = q.carrier_id

-- Quote → Truck
JOIN trucks t
    ON t.truck_id = q.truck_id

-- Quote → Rate Card
JOIN rate_cards rc
    ON rc.rate_card_id = q.rate_card_id

WHERE q.quote_id = $1;
