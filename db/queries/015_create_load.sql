-- db/queries/015_create_load.sql
-- Description: Insert a new load with status OPEN.
-- Parameters:
--   $1 = lane_id (BIGINT)
--   $2 = pickup_date (DATE)
--   $3 = delivery_date (DATE, optional)
--   $4 = weight_kg (INTEGER)

INSERT INTO loads (
    lane_id,
    pickup_date,
    delivery_date,
    weight_kg,
    status
) VALUES (
    $1,
    $2,
    $3,
    $4,
    'OPEN'
)
RETURNING
    load_id,
    lane_id,
    pickup_date,
    delivery_date,
    weight_kg,
    status,
    created_at,
    updated_at;
