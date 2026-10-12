-- db/queries/011_lock_booking_resources.sql

SELECT lo.load_id, t.truck_id
FROM loads lo
CROSS JOIN trucks t
WHERE lo.load_id = $1
  AND t.truck_id = $2
FOR UPDATE;
