-- db/queries/011_lock_booking_resources.sql
--
-- Acquires an exclusive row-level lock on the quote, its load, and its truck
-- in a single statement, preventing concurrent transactions from modifying any
-- of these three rows between the lock acquisition and the commit.
--
-- Parameter:
--   $1 = quote_id (BIGINT)
--
-- Locking quote + load + truck together closes the TOCTOU window that existed
-- when only load and truck were locked after a separate unlocked quote read.
--
-- Note on lock ordering: Rows across quotes, loads, and trucks are locked by
-- the query execution plan. While all three rows are locked within the transaction,
-- PostgreSQL does not guarantee deterministic acquisition order across joined tables.

SELECT q.quote_id, lo.load_id, t.truck_id
FROM   quotes  q
JOIN   loads   lo ON lo.load_id  = q.load_id
JOIN   trucks  t  ON t.truck_id  = q.truck_id
WHERE  q.quote_id = $1
FOR UPDATE;
