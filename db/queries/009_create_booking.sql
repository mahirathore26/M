-- db/queries/009_create_booking.sql

INSERT INTO bookings (
    quote_id,
    status
)
VALUES (
    $1,
    'CONFIRMED'
)
RETURNING
    booking_id,
    quote_id,
    booking_date,
    status,
    created_at,
    updated_at;
