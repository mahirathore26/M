-- Seed: 001_initial_data.sql
-- Description: Development seed data for the Freight Rate Engine
-- Purpose: Support first real backend query -
--          "given a load, find trucks that satisfy its requirements
--           and whose carrier has an applicable rate card."
--
-- Insertion order (respects FK dependencies):
--   1. capabilities
--   2. carriers
--   3. drivers
--   4. trucks
--   5. truck_capabilities
--   6. lanes
--   7. rate_cards
--   8. loads
--   9. load_capabilities

BEGIN;

-- ============================================================
-- 1. CAPABILITIES
-- ============================================================

INSERT INTO capabilities (name, category, description) VALUES
  -- Vehicle types (used as the pricing dimension in rate cards)
  ('20FT',         'VEHICLE_TYPE', '20-foot container truck'),
  ('32FT',         'VEHICLE_TYPE', '32-foot container truck'),

  -- Body types
  ('CONTAINER',    'BODY_TYPE',    'Enclosed container body'),
  ('OPEN_BODY',    'BODY_TYPE',    'Open flatbed / open body'),

  -- Features
  ('WATERPROOF',   'FEATURE',      'Fully weather-sealed cargo area'),
  ('REFRIGERATED', 'FEATURE',      'Temperature-controlled refrigeration unit'),

  -- Freight types
  ('GENERAL',      'FREIGHT_TYPE', 'Standard general merchandise'),
  ('FRAGILE',      'FREIGHT_TYPE', 'Requires careful handling; breakables'),
  ('PERISHABLE',   'FREIGHT_TYPE', 'Time-sensitive; requires cold chain or fast transit');

-- 9 rows total

-- ============================================================
-- 2. CARRIERS
-- ============================================================

INSERT INTO carriers (name, phone, email, address, gst_number, status) VALUES
  (
    'Malwa Express Logistics Pvt Ltd',
    '+91-9301112233',
    'ops@malwaexpress.in',
    '14, Industrial Estate, Dewas Naka, Indore, MP 452010',
    '23AABCM1234A1Z5',
    'ACTIVE'
  ),
  (
    'Deccan Freight Carriers',
    '+91-9822334455',
    'dispatch@deccanfreight.co.in',
    '78, MIDC Phase II, Bhosari, Pune, MH 411026',
    '27AABCD5678B1Z3',
    'ACTIVE'
  ),
  (
    'Capital Road Lines',
    '+91-9711223344',
    'contact@capitalroadlines.in',
    '33, Naraina Industrial Area, Phase I, New Delhi 110028',
    '07AABCC9012C1Z1',
    'ACTIVE'
  );

-- 3 rows total

-- ============================================================
-- 3. DRIVERS
-- ============================================================

-- Malwa Express Logistics (carrier 1)
INSERT INTO drivers (carrier_id, name, phone, license_number, license_valid_until, status)
SELECT
  c.carrier_id,
  d.name,
  d.phone,
  d.license_number,
  d.license_valid_until::DATE,
  d.status
FROM carriers c
CROSS JOIN (VALUES
  ('Ramesh Patidar',    '+91-9301000001', 'MP09-2018-0034521', '2028-06-30', 'ACTIVE'),
  ('Suresh Chouhan',    '+91-9301000002', 'MP09-2019-0047832', '2027-11-15', 'ACTIVE'),
  ('Dinesh Verma',      '+91-9301000003', 'MP09-2017-0021100', '2026-12-01', 'INACTIVE')
) AS d(name, phone, license_number, license_valid_until, status)
WHERE c.name = 'Malwa Express Logistics Pvt Ltd';

-- Deccan Freight Carriers (carrier 2)
INSERT INTO drivers (carrier_id, name, phone, license_number, license_valid_until, status)
SELECT
  c.carrier_id,
  d.name,
  d.phone,
  d.license_number,
  d.license_valid_until::DATE,
  d.status
FROM carriers c
CROSS JOIN (VALUES
  ('Pramod Jadhav',     '+91-9822000001', 'MH12-2020-0065401', '2029-03-20', 'ACTIVE'),
  ('Ganesh Kale',       '+91-9822000002', 'MH12-2019-0058992', '2027-08-10', 'ACTIVE')
) AS d(name, phone, license_number, license_valid_until, status)
WHERE c.name = 'Deccan Freight Carriers';

-- Capital Road Lines (carrier 3)
INSERT INTO drivers (carrier_id, name, phone, license_number, license_valid_until, status)
SELECT
  c.carrier_id,
  d.name,
  d.phone,
  d.license_number,
  d.license_valid_until::DATE,
  d.status
FROM carriers c
CROSS JOIN (VALUES
  ('Ajay Sharma',       '+91-9711000001', 'DL01-2021-0089123', '2030-01-15', 'ACTIVE'),
  ('Vikram Singh',      '+91-9711000002', 'DL01-2020-0074500', '2028-09-30', 'ACTIVE')
) AS d(name, phone, license_number, license_valid_until, status)
WHERE c.name = 'Capital Road Lines';

-- 7 drivers total

-- ============================================================
-- 4. TRUCKS
-- ============================================================

-- Malwa Express Logistics trucks
--   T-MEL-001 : 32FT CONTAINER, WATERPROOF, PERISHABLE  (REFRIGERATED intentionally missing)
--   T-MEL-002 : 32FT CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE  (fully capable)
--   T-MEL-003 : 20FT OPEN_BODY, GENERAL  (wrong vehicle type & body type for test load)

INSERT INTO trucks (carrier_id, registration_number, capacity_kg, status, model, permit_number, insurance_valid_until)
SELECT c.carrier_id, t.reg, t.cap, t.status, t.model, t.permit, t.ins_until::DATE
FROM carriers c
CROSS JOIN (VALUES
  ('MP09-CM-3421', 22000, 'ACTIVE',      'Tata Prima 3525.K',  'NP-MP-2024-04312', '2027-06-30'),
  ('MP09-CM-3422', 22000, 'ACTIVE',      'Tata Prima 3525.K',  'NP-MP-2024-04313', '2027-06-30'),
  ('MP09-CM-1101', 10000, 'MAINTENANCE', 'Eicher Pro 2059',    'NP-MP-2023-09871', '2026-12-31')
) AS t(reg, cap, status, model, permit, ins_until)
WHERE c.name = 'Malwa Express Logistics Pvt Ltd';

-- Deccan Freight Carriers trucks
--   T-DFC-001 : 32FT CONTAINER, WATERPROOF, FRAGILE  (no REFRIGERATED or PERISHABLE)
--   T-DFC-002 : 32FT CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE  (fully capable)

INSERT INTO trucks (carrier_id, registration_number, capacity_kg, status, model, permit_number, insurance_valid_until)
SELECT c.carrier_id, t.reg, t.cap, t.status, t.model, t.permit, t.ins_until::DATE
FROM carriers c
CROSS JOIN (VALUES
  ('MH12-AX-7741', 24000, 'ACTIVE', 'BharatBenz 3523R',   'NP-MH-2024-11201', '2028-03-31'),
  ('MH12-AX-7742', 24000, 'ACTIVE', 'BharatBenz 3523R',   'NP-MH-2024-11202', '2028-03-31')
) AS t(reg, cap, status, model, permit, ins_until)
WHERE c.name = 'Deccan Freight Carriers';

-- Capital Road Lines trucks
--   T-CRL-001 : 32FT OPEN_BODY, GENERAL  (wrong body type for CONTAINER requirement)
--   T-CRL-002 : 20FT CONTAINER, WATERPROOF, GENERAL  (undersized vehicle type for test load)

INSERT INTO trucks (carrier_id, registration_number, capacity_kg, status, model, permit_number, insurance_valid_until)
SELECT c.carrier_id, t.reg, t.cap, t.status, t.model, t.permit, t.ins_until::DATE
FROM carriers c
CROSS JOIN (VALUES
  ('DL01-BT-5591', 20000, 'ACTIVE', 'Ashok Leyland 3521',  'NP-DL-2023-30041', '2027-09-30'),
  ('DL01-BT-5592', 10500, 'ACTIVE', 'Mahindra Furio 14',   'NP-DL-2024-30042', '2027-09-30')
) AS t(reg, cap, status, model, permit, ins_until)
WHERE c.name = 'Capital Road Lines';

-- 7 trucks total

-- ============================================================
-- 5. TRUCK_CAPABILITIES
-- ============================================================

-- Helper: assign capabilities to a truck by (registration_number, [capability names...])
-- We use explicit subqueries to avoid hard-coding auto-generated IDs.

-- MP09-CM-3421  : 32FT, CONTAINER, WATERPROOF, PERISHABLE
--   Intentionally MISSING: REFRIGERATED and FRAGILE → will fail the test load's REFRIGERATED and FRAGILE requirements
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'MP09-CM-3421'
  AND c.name IN ('32FT', 'CONTAINER', 'WATERPROOF', 'PERISHABLE');

-- MP09-CM-3422  : 32FT, CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE
--   Fully capable — expected to MATCH the test load
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'MP09-CM-3422'
  AND c.name IN ('32FT', 'CONTAINER', 'WATERPROOF', 'REFRIGERATED', 'PERISHABLE', 'FRAGILE');

-- MP09-CM-1101  : 20FT, OPEN_BODY, GENERAL
--   Wrong vehicle type (20FT vs 32FT) and body type — will fail test load
--   Also status = MAINTENANCE → filtered at truck level
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'MP09-CM-1101'
  AND c.name IN ('20FT', 'OPEN_BODY', 'GENERAL');

-- MH12-AX-7741  : 32FT, CONTAINER, WATERPROOF, FRAGILE
--   Intentionally MISSING: REFRIGERATED, PERISHABLE → will fail the test load
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'MH12-AX-7741'
  AND c.name IN ('32FT', 'CONTAINER', 'WATERPROOF', 'FRAGILE');

-- MH12-AX-7742  : 32FT, CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE
--   Fully capable — expected to MATCH the test load (if carrier has a rate card)
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'MH12-AX-7742'
  AND c.name IN ('32FT', 'CONTAINER', 'WATERPROOF', 'REFRIGERATED', 'PERISHABLE', 'FRAGILE');

-- DL01-BT-5591  : 32FT, OPEN_BODY, GENERAL
--   Intentionally MISSING: CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE
--   Will fail test load on CONTAINER body type requirement
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'DL01-BT-5591'
  AND c.name IN ('32FT', 'OPEN_BODY', 'GENERAL');

-- DL01-BT-5592  : 20FT, CONTAINER, WATERPROOF, GENERAL
--   Wrong vehicle type (20FT vs 32FT) — will fail test load on vehicle type
--   Carrier (Capital Road Lines) also has no rate card for Indore→Mumbai, so doubly excluded
INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM trucks t, capabilities c
WHERE t.registration_number = 'DL01-BT-5592'
  AND c.name IN ('20FT', 'CONTAINER', 'WATERPROOF', 'GENERAL');

-- ============================================================
-- 6. LANES
-- ============================================================

INSERT INTO lanes (origin_city, destination_city, distance_km, status) VALUES
  ('Indore',  'Mumbai',    589.00, 'ACTIVE'),
  ('Indore',  'Delhi',     793.00, 'ACTIVE'),
  ('Bhopal',  'Mumbai',    780.00, 'ACTIVE'),
  ('Mumbai',  'Pune',      150.00, 'ACTIVE'),
  ('Indore',  'Pune',      640.00, 'ACTIVE'),
  ('Bhopal',  'Delhi',     697.00, 'ACTIVE');

-- 6 lanes total

-- ============================================================
-- 7. RATE_CARDS
-- ============================================================

-- Malwa Express Logistics — Indore → Mumbai, 32FT
--   TWO non-overlapping validity periods to test temporal rate resolution:
--     Period 1 : 2026-07-01 → 2026-10-01   (EXPIRED)
--     Period 2 : 2026-10-01 → 2027-01-01   (ACTIVE — test load pickup falls here)

INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT
  car.carrier_id,
  l.lane_id,
  cap.capability_id,
  rc.base_rate,
  rc.valid_from::DATE,
  rc.valid_until::DATE,
  rc.status
FROM carriers car, lanes l, capabilities cap
CROSS JOIN (VALUES
  (38000.00, '2026-07-01', '2026-10-01', 'EXPIRED'),
  (41500.00, '2026-10-01', '2027-01-01', 'ACTIVE')
) AS rc(base_rate, valid_from, valid_until, status)
WHERE car.name = 'Malwa Express Logistics Pvt Ltd'
  AND l.origin_city = 'Indore' AND l.destination_city = 'Mumbai'
  AND cap.name = '32FT' AND cap.category = 'VEHICLE_TYPE';

-- Malwa Express Logistics — Indore → Mumbai, 20FT (single period)
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 24000.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Malwa Express Logistics Pvt Ltd'
  AND l.origin_city = 'Indore' AND l.destination_city = 'Mumbai'
  AND cap.name = '20FT' AND cap.category = 'VEHICLE_TYPE';

-- Malwa Express Logistics — Indore → Delhi, 32FT
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 52000.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Malwa Express Logistics Pvt Ltd'
  AND l.origin_city = 'Indore' AND l.destination_city = 'Delhi'
  AND cap.name = '32FT' AND cap.category = 'VEHICLE_TYPE';

-- Deccan Freight Carriers — Indore → Mumbai, 32FT (single period, different price)
--   Carrier has truck MH12-AX-7742 which is fully capable;
--   but Deccan's base yard is Pune, so this is an inbound positioning rate.
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 44000.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Deccan Freight Carriers'
  AND l.origin_city = 'Indore' AND l.destination_city = 'Mumbai'
  AND cap.name = '32FT' AND cap.category = 'VEHICLE_TYPE';

-- Deccan Freight Carriers — Bhopal → Mumbai, 32FT
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 48500.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Deccan Freight Carriers'
  AND l.origin_city = 'Bhopal' AND l.destination_city = 'Mumbai'
  AND cap.name = '32FT' AND cap.category = 'VEHICLE_TYPE';

-- Deccan Freight Carriers — Mumbai → Pune, 20FT
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 9500.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Deccan Freight Carriers'
  AND l.origin_city = 'Mumbai' AND l.destination_city = 'Pune'
  AND cap.name = '20FT' AND cap.category = 'VEHICLE_TYPE';

-- Capital Road Lines — Indore → Delhi, 32FT
--   Note: Capital Road Lines has NO rate card for Indore → Mumbai,
--   so its trucks are excluded from the test load's carrier check.
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 49000.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Capital Road Lines'
  AND l.origin_city = 'Indore' AND l.destination_city = 'Delhi'
  AND cap.name = '32FT' AND cap.category = 'VEHICLE_TYPE';

-- Capital Road Lines — Bhopal → Delhi, 32FT
INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT car.carrier_id, l.lane_id, cap.capability_id, 44500.00, '2026-10-01'::DATE, '2027-01-01'::DATE, 'ACTIVE'
FROM carriers car, lanes l, capabilities cap
WHERE car.name = 'Capital Road Lines'
  AND l.origin_city = 'Bhopal' AND l.destination_city = 'Delhi'
  AND cap.name = '32FT' AND cap.category = 'VEHICLE_TYPE';

-- 9 rate cards total (2 of which are the non-overlapping pair for MEL / Indore→Mumbai / 32FT)

-- ============================================================
-- 8. LOADS
-- ============================================================

-- LOAD 1 (THE PRIMARY TEST LOAD)
--   Lane         : Indore → Mumbai
--   Pickup date  : 2026-10-15  (falls inside MEL and DFC's ACTIVE rate card period)
--   Weight       : 18000 kg    (within 22000 kg / 24000 kg capacity of qualifying trucks)
--   Requirements : 32FT + CONTAINER + WATERPROOF + REFRIGERATED + PERISHABLE + FRAGILE
--   Expected matches: MP09-CM-3422 (MEL) + MH12-AX-7742 (DFC)

INSERT INTO loads (lane_id, pickup_date, delivery_date, weight_kg, status)
SELECT l.lane_id, '2026-10-15'::DATE, '2026-10-16'::DATE, 18000, 'OPEN'
FROM lanes l
WHERE l.origin_city = 'Indore' AND l.destination_city = 'Mumbai';

-- LOAD 2 — General dry goods, Indore → Delhi, 32FT
--   No refrigeration needed; simpler capability set.
INSERT INTO loads (lane_id, pickup_date, delivery_date, weight_kg, status)
SELECT l.lane_id, '2026-10-20'::DATE, '2026-10-22'::DATE, 12000, 'DRAFT'
FROM lanes l
WHERE l.origin_city = 'Indore' AND l.destination_city = 'Delhi';

-- LOAD 3 — Bhopal → Mumbai, within DFC's active rate card period
INSERT INTO loads (lane_id, pickup_date, delivery_date, weight_kg, status)
SELECT l.lane_id, '2026-11-05'::DATE, '2026-11-06'::DATE, 20000, 'OPEN'
FROM lanes l
WHERE l.origin_city = 'Bhopal' AND l.destination_city = 'Mumbai';

-- LOAD 4 — Mumbai → Pune, short haul, 20FT (DFC has a rate card)
INSERT INTO loads (lane_id, pickup_date, delivery_date, weight_kg, status)
SELECT l.lane_id, '2026-10-25'::DATE, '2026-10-25'::DATE, 8000, 'DRAFT'
FROM lanes l
WHERE l.origin_city = 'Mumbai' AND l.destination_city = 'Pune';

-- 4 loads total

-- ============================================================
-- 9. LOAD_CAPABILITIES
-- ============================================================

-- LOAD 1 requirements: 32FT, CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE
INSERT INTO load_capabilities (load_id, capability_id)
SELECT lo.load_id, c.capability_id
FROM loads lo, lanes la, capabilities c
WHERE lo.lane_id = la.lane_id
  AND la.origin_city = 'Indore' AND la.destination_city = 'Mumbai'
  AND lo.pickup_date = '2026-10-15'
  AND c.name IN ('32FT', 'CONTAINER', 'WATERPROOF', 'REFRIGERATED', 'PERISHABLE', 'FRAGILE');

-- LOAD 2 requirements: 32FT, CONTAINER, GENERAL
INSERT INTO load_capabilities (load_id, capability_id)
SELECT lo.load_id, c.capability_id
FROM loads lo, lanes la, capabilities c
WHERE lo.lane_id = la.lane_id
  AND la.origin_city = 'Indore' AND la.destination_city = 'Delhi'
  AND lo.pickup_date = '2026-10-20'
  AND c.name IN ('32FT', 'CONTAINER', 'GENERAL');

-- LOAD 3 requirements: 32FT, CONTAINER, WATERPROOF, PERISHABLE
INSERT INTO load_capabilities (load_id, capability_id)
SELECT lo.load_id, c.capability_id
FROM loads lo, lanes la, capabilities c
WHERE lo.lane_id = la.lane_id
  AND la.origin_city = 'Bhopal' AND la.destination_city = 'Mumbai'
  AND lo.pickup_date = '2026-11-05'
  AND c.name IN ('32FT', 'CONTAINER', 'WATERPROOF', 'PERISHABLE');

-- LOAD 4 requirements: 20FT, CONTAINER, FRAGILE
INSERT INTO load_capabilities (load_id, capability_id)
SELECT lo.load_id, c.capability_id
FROM loads lo, lanes la, capabilities c
WHERE lo.lane_id = la.lane_id
  AND la.origin_city = 'Mumbai' AND la.destination_city = 'Pune'
  AND lo.pickup_date = '2026-10-25'
  AND c.name IN ('20FT', 'CONTAINER', 'FRAGILE');

-- load_capabilities rows: 6 + 3 + 4 + 3 = 16 rows total
-- truck_capabilities rows: 4 + 6 + 3 + 4 + 6 + 3 + 4 = 30 rows total

COMMIT;
