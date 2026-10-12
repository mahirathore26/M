-- db/queries/012_update_quote_status.sql

UPDATE quotes
SET status = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE quote_id = $1
  AND status = 'ACTIVE'
RETURNING quote_id, status, updated_at;
