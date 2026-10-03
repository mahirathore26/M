-- db/queries/006_list_quotes_for_load.sql
-- Description: Return currently usable quotes for a given load,
--              suitable for the future "show available quotes for this load" use case.
--
-- Parameter:
--   $1 = load_id (BIGINT)
--
-- STATUS FILTER DESIGN NOTE:
--   This query intentionally includes only quotes in status ACTIVE or ACCEPTED.
--   EXPIRED quotes are excluded because they are no longer actionable.
--   REJECTED quotes are excluded because they represent terminal negative decisions.
--   If a historical / audit view of all quotes for a load is later needed,
--   that should be a separate query (e.g. 006b_list_all_quotes_for_load.sql)
--   rather than loosening this filter.
--
-- ORDER:
--   total_amount ASC  — cheapest option first (primary sort)
--   quote_id ASC      — deterministic tiebreaker by insertion order

SELECT
    q.quote_id,
    c.carrier_id,
    c.name          AS carrier_name,
    t.truck_id,
    t.registration_number,
    rc.rate_card_id,
    q.base_rate,
    q.fuel_surcharge,
    q.accessorial_charges,
    q.total_amount,
    q.valid_until   AS quote_valid_until,
    q.status,
    q.created_at

FROM quotes q

-- Quote → Carrier
JOIN carriers c
    ON c.carrier_id = q.carrier_id

-- Quote → Truck
JOIN trucks t
    ON t.truck_id = q.truck_id

-- Quote → Rate Card
JOIN rate_cards rc
    ON rc.rate_card_id = q.rate_card_id

WHERE q.load_id = $1
  -- Only currently usable quote statuses.
  -- See design note above before changing this filter.
  AND q.status IN ('ACTIVE', 'ACCEPTED')

ORDER BY
    q.total_amount ASC,
    q.quote_id     ASC;
