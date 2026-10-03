-- db/queries/009_create_booking.sql
-- Description: Insert a new booking record after all pre-conditions have been
--              validated, resources locked, and quotes/loads status verified
--              by the calling application transaction.
--
-- Parameters:
--   $1 = quote_id     (BIGINT)   — the accepted quote being converted to a booking
--   $2 = booking_date (TIMESTAMPTZ) — the moment the booking is confirmed
--
-- ⚠️  CONCURRENCY SAFETY WARNING:
--   This INSERT ALONE IS NOT CONCURRENCY-SAFE.
--
--   A booking is only safe when performed inside a serializable (or
--   carefully locked) database transaction that:
--     1. BEGINs a transaction
--     2. Locks the quote row   (SELECT ... FOR UPDATE)
--     3. Locks the load row    (SELECT ... FOR UPDATE)
--     4. Re-validates quote status = 'ACTIVE' (not already ACCEPTED/EXPIRED)
--     5. Re-validates truck availability via query 008 (no conflicting booking)
--     6. Executes this INSERT (009)
--     7. Updates quote status → 'ACCEPTED'
--     8. Updates load status  → 'BOOKED'
--     9. COMMITs the transaction
--
--   Steps 1–9 will be implemented as atomic transaction orchestration in
--   the Node.js service layer in a future engineering step.
--   Invoking this file in isolation without steps 1–8 risks:
--     - double-booking a truck
--     - booking on an already-expired or accepted quote
--     - race conditions under concurrent requests
--
-- STATUS:
--   Explicitly set to 'CONFIRMED' (not relying solely on column DEFAULT)
--   to make the intent visible in the query text.
--
-- V1 SCHEMA NOTE:
--   load_id, truck_id, carrier_id, pickup_date, and delivery_date are
--   intentionally NOT included here.  They live on the Quote (which is
--   referenced by $1).  Quote is the single source of truth for those
--   relationships.  Adding them to bookings would be denormalisation.

INSERT INTO bookings (
    quote_id,
    booking_date,
    status
)
VALUES (
    $1,           -- quote_id
    $2,           -- booking_date
    'CONFIRMED'   -- explicit status; default preserved as a fallback at DB level
)
RETURNING
    booking_id,
    quote_id,
    booking_date,
    status,
    created_at,
    updated_at;
