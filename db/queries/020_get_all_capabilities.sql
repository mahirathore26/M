-- db/queries/020_get_all_capabilities.sql
-- Description: Retrieve all available truck and load capabilities.

SELECT
    capability_id,
    name,
    category,
    description
FROM capabilities
ORDER BY category ASC, capability_id ASC;
