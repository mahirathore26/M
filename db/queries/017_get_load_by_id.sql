-- db/queries/017_get_load_by_id.sql
-- Description: Retrieve a single load with joined lane details and its required capabilities.
-- Parameter:
--   $1 = load_id (BIGINT)

SELECT
    lo.load_id,
    lo.lane_id,
    la.origin_city,
    la.destination_city,
    la.distance_km,
    lo.pickup_date,
    lo.delivery_date,
    lo.weight_kg,
    lo.status,
    lo.created_at,
    lo.updated_at,
    COALESCE(
        json_agg(
            json_build_object(
                'capability_id', c.capability_id,
                'name', c.name,
                'category', c.category,
                'description', c.description
            ) ORDER BY c.capability_id ASC
        ) FILTER (WHERE c.capability_id IS NOT NULL),
        '[]'::json
    ) AS capabilities
FROM loads lo
JOIN lanes la
    ON la.lane_id = lo.lane_id
LEFT JOIN load_capabilities lc
    ON lc.load_id = lo.load_id
LEFT JOIN capabilities c
    ON c.capability_id = lc.capability_id
WHERE lo.load_id = $1
GROUP BY
    lo.load_id,
    lo.lane_id,
    la.origin_city,
    la.destination_city,
    la.distance_km,
    lo.pickup_date,
    lo.delivery_date,
    lo.weight_kg,
    lo.status,
    lo.created_at,
    lo.updated_at;
