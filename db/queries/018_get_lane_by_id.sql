-- db/queries/018_get_lane_by_id.sql
-- Description: Retrieve a lane by lane_id.
-- Parameter:
--   $1 = lane_id (BIGINT)

SELECT
    lane_id,
    origin_city,
    destination_city,
    distance_km,
    status,
    created_at,
    updated_at
FROM lanes
WHERE lane_id = $1;
