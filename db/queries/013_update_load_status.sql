-- db/queries/013_update_load_status.sql

UPDATE loads
SET status = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE load_id = $1
  AND status IN ('OPEN', 'QUOTED')
RETURNING load_id, status, updated_at;
