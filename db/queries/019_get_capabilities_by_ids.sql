-- db/queries/019_get_capabilities_by_ids.sql
-- Description: Retrieve capabilities matching a list of capability IDs.
-- Parameter:
--   $1 = capability_ids (BIGINT[])

SELECT
    capability_id,
    name,
    category,
    description
FROM capabilities
WHERE capability_id = ANY($1::bigint[])
ORDER BY capability_id ASC;
