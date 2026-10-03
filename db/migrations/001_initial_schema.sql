-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for Freight Rate Engine (FTL)

BEGIN;

-- 1. CARRIERS
-- Preferred lifecycle: set status = 'SUSPENDED' or 'INACTIVE' rather than physically
-- deleting a carrier that has trucks, drivers, rate cards, or commercial history.
-- Physical deletion of a carrier will cascade into its trucks, drivers, and rate cards.
-- If any of those have historical quotes or bookings the deletion will be blocked by
-- the RESTRICT FK on quotes, enforcing history preservation at the DB level.
CREATE TABLE carriers (
    carrier_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    gst_number VARCHAR(15) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. DRIVERS
-- Preferred lifecycle: set status = 'INACTIVE' rather than physically deleting a driver.
-- ON DELETE CASCADE: if the owning carrier is physically deleted, its drivers are
-- removed with it. Drivers have no independent historical FK chain to protect here.
CREATE TABLE drivers (
    driver_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    license_valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. CAPABILITIES
-- This is a single shared capability catalogue used by both trucks and loads.
--   Truck capabilities (truck_capabilities) represent what the truck supports.
--   Load capabilities  (load_capabilities)  represent what the load requires.
--
-- All capability categories participate in truck eligibility matching:
--   - A truck must possess every capability required by a load.
--
-- Rate-card resolution in V1 uses ONLY the VEHICLE_TYPE capability.
--   Example: 32FT determines the rate card to apply.
--
-- BODY_TYPE, FEATURE, and FREIGHT_TYPE capabilities (e.g. WATERPROOF, FRAGILE)
-- are eligibility requirements only; they are NOT independent pricing dimensions in V1.
CREATE TABLE capabilities (
    capability_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('VEHICLE_TYPE', 'BODY_TYPE', 'FEATURE', 'FREIGHT_TYPE')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_capabilities_category_name UNIQUE (category, name)
);

-- 4. TRUCKS
-- Preferred lifecycle: set status = 'INACTIVE' or 'MAINTENANCE' rather than physically
-- deleting a truck. ON DELETE CASCADE from carrier propagates here, but any truck
-- referenced by a historical quote will block that cascade via RESTRICT on quotes.truck_id.
CREATE TABLE trucks (
    truck_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE CASCADE,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    capacity_kg INTEGER NOT NULL CHECK (capacity_kg > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE')) DEFAULT 'ACTIVE',
    model VARCHAR(100) NOT NULL,
    permit_number VARCHAR(100) NOT NULL,
    insurance_valid_until DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. TRUCK_CAPABILITIES
CREATE TABLE truck_capabilities (
    truck_id BIGINT NOT NULL REFERENCES trucks(truck_id) ON DELETE CASCADE,
    capability_id BIGINT NOT NULL REFERENCES capabilities(capability_id) ON DELETE RESTRICT,
    PRIMARY KEY (truck_id, capability_id)
);

-- 6. LANES
CREATE TABLE lanes (
    lane_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    distance_km NUMERIC(8, 2) CHECK (distance_km IS NULL OR distance_km > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lanes_origin_destination UNIQUE (origin_city, destination_city),
    CONSTRAINT chk_lanes_different_cities CHECK (origin_city <> destination_city)
);

-- 7. RATE_CARDS
-- V1 Pricing Model:
--   A rate card defines a carrier's base rate for a specific lane, vehicle-type
--   capability, and validity period (half-open interval: [valid_from, valid_until)).
--
--   Rate Card = Carrier + Lane + Vehicle Type Capability + Validity Period -> Base Rate
--
--   Example:
--     Carrier A + Indore -> Mumbai + 32FT + 2026-10-01 to 2026-12-31 -> ₹38,000
--
--   Adjacent periods are valid and expected:
--     2026-01-01 -> 2026-04-01
--     2026-04-01 -> 2026-07-01
--
--   vehicle_capability_id must reference a capability whose category = 'VEHICLE_TYPE'.
--   This is a domain rule that cannot be enforced by a standard FK alone; it must be
--   validated at the application layer.
--
-- TODO (next DB engineering step): Add cross-row temporal exclusion constraint
-- (e.g. EXCLUDE USING gist with btree_gist) preventing a carrier from having
-- overlapping ACTIVE rate cards for the same (carrier_id, lane_id, vehicle_capability_id).
-- Preferred lifecycle: set status = 'INACTIVE' or 'EXPIRED' rather than physically
-- deleting a rate card referenced by historical quotes. ON DELETE CASCADE from carrier
-- propagates here, but any rate_card referenced by a quote blocks that via RESTRICT.
CREATE TABLE rate_cards (
    rate_card_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE CASCADE,
    lane_id BIGINT NOT NULL REFERENCES lanes(lane_id) ON DELETE RESTRICT,
    vehicle_capability_id BIGINT NOT NULL REFERENCES capabilities(capability_id) ON DELETE RESTRICT,
    base_rate NUMERIC(12, 2) NOT NULL CHECK (base_rate >= 0),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rate_cards_validity_period CHECK (valid_until > valid_from)
);

-- 8. LOADS
CREATE TABLE loads (
    load_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lane_id BIGINT NOT NULL REFERENCES lanes(lane_id) ON DELETE RESTRICT,
    pickup_date DATE NOT NULL,
    delivery_date DATE,
    weight_kg INTEGER NOT NULL CHECK (weight_kg > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'QUOTED', 'BOOKED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')) DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_loads_delivery_after_pickup CHECK (delivery_date IS NULL OR delivery_date >= pickup_date)
);

-- 9. LOAD_CAPABILITIES
CREATE TABLE load_capabilities (
    load_id BIGINT NOT NULL REFERENCES loads(load_id) ON DELETE CASCADE,
    capability_id BIGINT NOT NULL REFERENCES capabilities(capability_id) ON DELETE RESTRICT,
    PRIMARY KEY (load_id, capability_id)
);

-- 10. QUOTES
CREATE TABLE quotes (
    quote_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id BIGINT NOT NULL REFERENCES loads(load_id) ON DELETE RESTRICT,
    carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE RESTRICT,
    truck_id BIGINT NOT NULL REFERENCES trucks(truck_id) ON DELETE RESTRICT,
    rate_card_id BIGINT NOT NULL REFERENCES rate_cards(rate_card_id) ON DELETE RESTRICT,
    base_rate NUMERIC(12, 2) NOT NULL CHECK (base_rate >= 0),
    fuel_surcharge NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (fuel_surcharge >= 0),
    accessorial_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (accessorial_charges >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'ACCEPTED', 'REJECTED')) DEFAULT 'ACTIVE',
    calculation_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quotes_total_amount CHECK (total_amount = base_rate + fuel_surcharge + accessorial_charges)
);

-- 11. BOOKINGS
-- A Booking is the acceptance/commitment of a Quote.
--
-- The Quote is the single source of truth for load, carrier, truck, and rate card.
-- Booking intentionally does not duplicate those relationships:
--   - load_id    is on quotes.load_id
--   - carrier_id is on quotes.carrier_id
--   - truck_id   is on quotes.truck_id
--   - rate_card  is on quotes.rate_card_id
--
-- Truck and load availability, and double-booking prevention, will be handled
-- through transactional booking logic and appropriate database constraints/queries
-- in a later engineering step — not by denormalizing Booking with duplicated FKs.
CREATE TABLE bookings (
    booking_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quote_id     BIGINT NOT NULL UNIQUE REFERENCES quotes(quote_id) ON DELETE RESTRICT,
    booking_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20) NOT NULL CHECK (status IN ('CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')) DEFAULT 'CONFIRMED',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_trucks_carrier_status ON trucks (carrier_id, status);
CREATE INDEX idx_truck_capabilities_capability_id ON truck_capabilities (capability_id);
CREATE INDEX idx_load_capabilities_capability_id ON load_capabilities (capability_id);
CREATE INDEX idx_rate_cards_lane_vehicle_carrier ON rate_cards (lane_id, vehicle_capability_id, carrier_id, status);
CREATE INDEX idx_loads_lane_pickup_date ON loads (lane_id, pickup_date);
CREATE INDEX idx_quotes_load_status ON quotes (load_id, status);
-- Note: Indexes on bookings by truck/load/date range will be defined in the
-- next DB engineering step alongside the temporal exclusion constraints,
-- as they will depend on the join strategy chosen (direct FK vs. via quotes).

COMMIT;
