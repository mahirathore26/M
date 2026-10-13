-- db/queries/016_create_load_capability.sql
-- Description: Associate a capability requirement with a load.
-- Parameters:
--   $1 = load_id (BIGINT)
--   $2 = capability_id (BIGINT)

INSERT INTO load_capabilities (
    load_id,
    capability_id
) VALUES (
    $1,
    $2
)
RETURNING
    load_id,
    capability_id;
