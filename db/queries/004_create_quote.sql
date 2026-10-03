-- db/queries/004_create_quote.sql
-- Description: Persist a pre-calculated quote produced by the Node.js pricing service.
--
-- Parameters (all positional):
--   $1  = load_id              (BIGINT)   — must reference an existing load
--   $2  = carrier_id           (BIGINT)   — caller-supplied; expected to be an ACTIVE carrier
--                                           previously validated by the eligibility/rate-card
--                                           queries (001, 002, 003).  This INSERT does not
--                                           re-verify carrier status; it relies on the FK
--                                           constraint for existence only.
--   $3  = truck_id             (BIGINT)   — caller-supplied; expected to be an ACTIVE truck
--                                           whose carrier and capabilities were established as
--                                           coherent by the eligibility/input queries.  This
--                                           INSERT does not re-verify truck status; it relies
--                                           on the FK constraint for existence only.
--   $4  = rate_card_id         (BIGINT)   — caller-supplied; expected to be an ACTIVE rate card
--                                           whose lane, vehicle type, and temporal validity were
--                                           confirmed by query 002 or 003.  This INSERT does not
--                                           re-verify rate card status or date range; it relies
--                                           on the FK constraint for existence only.
--   $5  = base_rate            (NUMERIC)  — supplied by pricing service; copied from rate card
--   $6  = fuel_surcharge       (NUMERIC)  — calculated by pricing service
--   $7  = accessorial_charges  (NUMERIC)  — calculated by pricing service
--   $8  = total_amount         (NUMERIC)  — supplied by pricing service
--                                           DB CHECK: total_amount = base_rate + fuel_surcharge + accessorial_charges
--   $9  = valid_until          (TIMESTAMPTZ) — quote expiry; set by pricing service / business policy
--   $10 = calculation_snapshot (JSONB)    — immutable audit snapshot produced by pricing service
--
-- VALIDATION RESPONSIBILITY:
--   This query intentionally does not repeat business validation that has
--   already been performed by the eligibility and input queries (001–003).
--   The caller (Node.js service) is responsible for supplying IDs that
--   represent a coherent, validated combination.  The database enforces:
--     • FK constraints — referenced rows must exist.
--     • quotes CHECK   — total_amount = base_rate + fuel_surcharge + accessorial_charges.
--   All monetary parameters ($5–$10) are computed entirely in Node.js
--   before this INSERT is invoked.  This query performs no arithmetic.
--   The DB CHECK constraint on total_amount is the final database-level
--   consistency guard: if the pricing service passes inconsistent values,
--   the INSERT will be rejected.
--
-- STATUS:
--   Defaults to 'ACTIVE' (per quotes table CHECK + DEFAULT).
--   The application layer transitions status to EXPIRED / ACCEPTED / REJECTED.

INSERT INTO quotes (
    load_id,
    carrier_id,
    truck_id,
    rate_card_id,
    base_rate,
    fuel_surcharge,
    accessorial_charges,
    total_amount,
    valid_until,
    calculation_snapshot
)
VALUES (
    $1,   -- load_id
    $2,   -- carrier_id
    $3,   -- truck_id
    $4,   -- rate_card_id
    $5,   -- base_rate            (from rate card, passed through pricing service)
    $6,   -- fuel_surcharge       (calculated by pricing service)
    $7,   -- accessorial_charges  (calculated by pricing service)
    $8,   -- total_amount         (calculated by pricing service; verified by DB CHECK)
    $9,   -- valid_until
    $10   -- calculation_snapshot (JSONB audit record)
)
RETURNING
    quote_id,
    load_id,
    carrier_id,
    truck_id,
    rate_card_id,
    base_rate,
    fuel_surcharge,
    accessorial_charges,
    total_amount,
    valid_until,
    status,
    calculation_snapshot,
    created_at,
    updated_at;
