-- db/queries/014_get_active_lanes.sql
-- Description: Retrieve all active lanes ordered by origin and destination city.

SELECT
    lane_id,
    origin_city,
    destination_city,
    distance_km,
    status,
    created_at,
    updated_at
FROM lanes
WHERE status = 'ACTIVE'
ORDER BY origin_city ASC, destination_city ASC;
