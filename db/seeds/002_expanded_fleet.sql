-- Seed: 002_expanded_fleet.sql
-- Description: Additive, idempotent seed script to expand TruckLayBay demo fleet
--              Adds 30 realistic commercial trucks across new and existing carriers,
--              satisfying major freight profiles across all 6 active corridors.

BEGIN;

-- ============================================================
-- 1. ADDITIONAL CARRIERS
-- ============================================================

INSERT INTO carriers (name, phone, email, address, gst_number, status) VALUES
  (
    'Khandwa Roadlines Pvt Ltd',
    '+91-9893112233',
    'ops@khandwaroadlines.in',
    '45, Ring Road Transport Nagar, Indore, MP 452016',
    '23AAACK4455D1Z8',
    'ACTIVE'
  ),
  (
    'Vindhya Freight Logistics',
    '+91-9425008899',
    'dispatch@vindhyafreight.com',
    '12, Govindpura Industrial Area, Bhopal, MP 462023',
    '23AAACV8899E1Z2',
    'ACTIVE'
  ),
  (
    'Sahyadri Intercity Cargo',
    '+91-9823445566',
    'rates@sahyadricargo.in',
    '102, Vashi Logistics Park, Navi Mumbai, MH 400703',
    '27AAACS6677F1Z5',
    'ACTIVE'
  )
ON CONFLICT (gst_number) DO NOTHING;

-- ============================================================
-- 2. ADDITIONAL DRIVERS
-- ============================================================

INSERT INTO drivers (carrier_id, name, phone, license_number, license_valid_until, status)
SELECT
  c.carrier_id,
  d.name,
  d.phone,
  d.license_number,
  d.license_valid_until::DATE,
  d.status
FROM carriers c
JOIN (VALUES
  ('Khandwa Roadlines Pvt Ltd', 'Rajendra Malviya',  '+91-9893000001', 'MP09-2021-0099411', '2029-05-15', 'ACTIVE'),
  ('Khandwa Roadlines Pvt Ltd', 'Kailash Patel',     '+91-9893000002', 'MP09-2020-0088322', '2028-11-20', 'ACTIVE'),
  ('Vindhya Freight Logistics', 'Manish Soni',       '+91-9425000001', 'MP04-2019-0077123', '2028-04-10', 'ACTIVE'),
  ('Vindhya Freight Logistics', 'Deepak Yadav',      '+91-9425000002', 'MP04-2022-0055441', '2030-08-25', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',  'Sachin Deshmukh',   '+91-9823000001', 'MH04-2020-0033211', '2029-12-15', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',  'Nitin Shinde',      '+91-9823000002', 'MH04-2021-0044552', '2028-07-30', 'ACTIVE')
) AS d(carrier_name, name, phone, license_number, license_valid_until, status)
  ON c.name = d.carrier_name
ON CONFLICT (license_number) DO NOTHING;

-- ============================================================
-- 3. EXPANDED FLEET TRUCKS (30 Additional Vehicles)
-- ============================================================

INSERT INTO trucks (carrier_id, registration_number, capacity_kg, status, model, permit_number, insurance_valid_until)
SELECT
  c.carrier_id,
  t.reg,
  t.cap,
  t.status,
  t.model,
  t.permit,
  t.ins_until::DATE
FROM carriers c
JOIN (VALUES
  -- Malwa Express Logistics (Carrier 1) - 5 trucks
  ('Malwa Express Logistics Pvt Ltd', 'MP09-CM-4101', 24000, 'ACTIVE', 'Tata Prima 3525.K',         'NP-MP-2025-10101', '2028-06-30'),
  ('Malwa Express Logistics Pvt Ltd', 'MP09-CM-4102', 26000, 'ACTIVE', 'Ashok Leyland 4220',        'NP-MP-2025-10102', '2028-06-30'),
  ('Malwa Express Logistics Pvt Ltd', 'MP09-CM-4103', 10500, 'ACTIVE', 'Eicher Pro 2059',           'NP-MP-2025-10103', '2027-12-31'),
  ('Malwa Express Logistics Pvt Ltd', 'MP09-CM-4104', 22000, 'ACTIVE', 'BharatBenz 3523R Reefer',   'NP-MP-2025-10104', '2028-09-30'),
  ('Malwa Express Logistics Pvt Ltd', 'MP09-CM-4105', 20000, 'ACTIVE', 'Tata Signa 2823.K',         'NP-MP-2025-10105', '2028-03-31'),

  -- Deccan Freight Carriers (Carrier 2) - 5 trucks
  ('Deccan Freight Carriers',         'MH12-AX-8201', 25000, 'ACTIVE', 'BharatBenz 3523R',          'NP-MH-2025-20201', '2028-11-30'),
  ('Deccan Freight Carriers',         'MH12-AX-8202', 11000, 'ACTIVE', 'Mahindra Furio 14',         'NP-MH-2025-20202', '2028-05-31'),
  ('Deccan Freight Carriers',         'MH12-AX-8203',  9500, 'ACTIVE', 'Eicher Pro 3015',           'NP-MH-2025-20203', '2027-10-31'),
  ('Deccan Freight Carriers',         'MH12-AX-8204', 22000, 'ACTIVE', 'BharatBenz 3523R Reefer',   'NP-MH-2025-20204', '2028-12-31'),
  ('Deccan Freight Carriers',         'MH12-AX-8205', 27000, 'ACTIVE', 'Tata Prima 4028.S',         'NP-MH-2025-20205', '2029-01-31'),

  -- Capital Road Lines (Carrier 3) - 5 trucks
  ('Capital Road Lines',              'DL01-BT-6701', 24000, 'ACTIVE', 'Tata Prima 3525.K',         'NP-DL-2025-30301', '2028-08-31'),
  ('Capital Road Lines',              'DL01-BT-6702', 20000, 'ACTIVE', 'Ashok Leyland 3521',        'NP-DL-2025-30302', '2028-04-30'),
  ('Capital Road Lines',              'DL01-BT-6703', 22000, 'ACTIVE', 'BharatBenz 3523R Reefer',   'NP-DL-2025-30303', '2028-10-31'),
  ('Capital Road Lines',              'DL01-BT-6704', 11500, 'ACTIVE', 'Mahindra Furio 14',         'NP-DL-2025-30304', '2028-02-28'),
  ('Capital Road Lines',              'DL01-BT-6705',  9000, 'ACTIVE', 'Tata 1109 LPT',             'NP-DL-2025-30305', '2027-11-30'),

  -- Khandwa Roadlines Pvt Ltd (Carrier 4) - 5 trucks
  ('Khandwa Roadlines Pvt Ltd',       'MP09-KD-1001', 25000, 'ACTIVE', 'Tata Prima 3525.K',         'NP-MP-2025-40401', '2028-09-30'),
  ('Khandwa Roadlines Pvt Ltd',       'MP09-KD-1002', 22000, 'ACTIVE', 'BharatBenz 3523R Reefer',   'NP-MP-2025-40402', '2028-12-31'),
  ('Khandwa Roadlines Pvt Ltd',       'MP09-KD-1003', 21000, 'ACTIVE', 'Ashok Leyland 3521',        'NP-MP-2025-40403', '2028-07-31'),
  ('Khandwa Roadlines Pvt Ltd',       'MP09-KD-1004', 11000, 'ACTIVE', 'Eicher Pro 3015',           'NP-MP-2025-40404', '2028-03-31'),
  ('Khandwa Roadlines Pvt Ltd',       'MP09-KD-1005',  8500, 'ACTIVE', 'Tata 1109 LPT',             'NP-MP-2025-40405', '2027-10-31'),

  -- Vindhya Freight Logistics (Carrier 5) - 5 trucks
  ('Vindhya Freight Logistics',       'MP04-VF-2001', 26000, 'ACTIVE', 'Ashok Leyland 4220',        'NP-MP-2025-50501', '2029-02-28'),
  ('Vindhya Freight Logistics',       'MP04-VF-2002', 23000, 'ACTIVE', 'BharatBenz 3523R Reefer',   'NP-MP-2025-50502', '2028-11-30'),
  ('Vindhya Freight Logistics',       'MP04-VF-2003', 27000, 'ACTIVE', 'Tata Prima 4028.S',         'NP-MP-2025-50503', '2029-04-30'),
  ('Vindhya Freight Logistics',       'MP04-VF-2004', 11000, 'ACTIVE', 'Mahindra Blazo X 28',       'NP-MP-2025-50504', '2028-08-31'),
  ('Vindhya Freight Logistics',       'MP04-VF-2005',  9500, 'ACTIVE', 'Eicher Pro 2059',           'NP-MP-2025-50505', '2027-12-31'),

  -- Sahyadri Intercity Cargo (Carrier 6) - 5 trucks
  ('Sahyadri Intercity Cargo',        'MH04-SC-3001', 25000, 'ACTIVE', 'BharatBenz 3523R',          'NP-MH-2025-60601', '2028-10-31'),
  ('Sahyadri Intercity Cargo',        'MH04-SC-3002', 22000, 'ACTIVE', 'Tata Prima 3525.K Reefer',  'NP-MH-2025-60602', '2028-12-31'),
  ('Sahyadri Intercity Cargo',        'MH04-SC-3003', 21000, 'ACTIVE', 'Ashok Leyland 3521',        'NP-MH-2025-60603', '2028-06-30'),
  ('Sahyadri Intercity Cargo',        'MH04-SC-3004', 11500, 'ACTIVE', 'Eicher Pro 3015',           'NP-MH-2025-60604', '2028-04-30'),
  ('Sahyadri Intercity Cargo',        'MH04-SC-3005',  9000, 'ACTIVE', 'Tata 1109 LPT',             'NP-MH-2025-60605', '2027-11-30')
) AS t(carrier_name, reg, cap, status, model, permit, ins_until)
  ON c.name = t.carrier_name
ON CONFLICT (registration_number) DO NOTHING;

-- ============================================================
-- 4. TRUCK CAPABILITIES ASSIGNMENTS
-- ============================================================

INSERT INTO truck_capabilities (truck_id, capability_id)
SELECT t.truck_id, c.capability_id
FROM (VALUES
  -- MP09-CM-4101: 32FT Dry Heavy Haul
  ('MP09-CM-4101', '32FT'), ('MP09-CM-4101', 'CONTAINER'), ('MP09-CM-4101', 'WATERPROOF'), ('MP09-CM-4101', 'GENERAL'),
  -- MP09-CM-4102: 32FT Open Flatbed
  ('MP09-CM-4102', '32FT'), ('MP09-CM-4102', 'OPEN_BODY'), ('MP09-CM-4102', 'GENERAL'),
  -- MP09-CM-4103: 20FT Light Haul Dry
  ('MP09-CM-4103', '20FT'), ('MP09-CM-4103', 'CONTAINER'), ('MP09-CM-4103', 'WATERPROOF'), ('MP09-CM-4103', 'GENERAL'),
  -- MP09-CM-4104: 32FT Cold Chain Reefer
  ('MP09-CM-4104', '32FT'), ('MP09-CM-4104', 'CONTAINER'), ('MP09-CM-4104', 'WATERPROOF'), ('MP09-CM-4104', 'REFRIGERATED'), ('MP09-CM-4104', 'PERISHABLE'),
  -- MP09-CM-4105: 32FT Weather-sealed Fragile
  ('MP09-CM-4105', '32FT'), ('MP09-CM-4105', 'CONTAINER'), ('MP09-CM-4105', 'WATERPROOF'), ('MP09-CM-4105', 'FRAGILE'), ('MP09-CM-4105', 'GENERAL'),

  -- MH12-AX-8201: 32FT Dry Container
  ('MH12-AX-8201', '32FT'), ('MH12-AX-8201', 'CONTAINER'), ('MH12-AX-8201', 'WATERPROOF'), ('MH12-AX-8201', 'GENERAL'),
  -- MH12-AX-8202: 20FT Fragile
  ('MH12-AX-8202', '20FT'), ('MH12-AX-8202', 'CONTAINER'), ('MH12-AX-8202', 'WATERPROOF'), ('MH12-AX-8202', 'FRAGILE'), ('MH12-AX-8202', 'GENERAL'),
  -- MH12-AX-8203: 20FT Open Body
  ('MH12-AX-8203', '20FT'), ('MH12-AX-8203', 'OPEN_BODY'), ('MH12-AX-8203', 'GENERAL'),
  -- MH12-AX-8204: 32FT Reefer
  ('MH12-AX-8204', '32FT'), ('MH12-AX-8204', 'CONTAINER'), ('MH12-AX-8204', 'WATERPROOF'), ('MH12-AX-8204', 'REFRIGERATED'), ('MH12-AX-8204', 'PERISHABLE'),
  -- MH12-AX-8205: 32FT Heavy Open Flatbed
  ('MH12-AX-8205', '32FT'), ('MH12-AX-8205', 'OPEN_BODY'), ('MH12-AX-8205', 'GENERAL'),

  -- DL01-BT-6701: 32FT Dry Container
  ('DL01-BT-6701', '32FT'), ('DL01-BT-6701', 'CONTAINER'), ('DL01-BT-6701', 'WATERPROOF'), ('DL01-BT-6701', 'GENERAL'),
  -- DL01-BT-6702: 32FT Fragile
  ('DL01-BT-6702', '32FT'), ('DL01-BT-6702', 'CONTAINER'), ('DL01-BT-6702', 'WATERPROOF'), ('DL01-BT-6702', 'FRAGILE'),
  -- DL01-BT-6703: 32FT Reefer
  ('DL01-BT-6703', '32FT'), ('DL01-BT-6703', 'CONTAINER'), ('DL01-BT-6703', 'WATERPROOF'), ('DL01-BT-6703', 'REFRIGERATED'), ('DL01-BT-6703', 'PERISHABLE'),
  -- DL01-BT-6704: 20FT Dry Container
  ('DL01-BT-6704', '20FT'), ('DL01-BT-6704', 'CONTAINER'), ('DL01-BT-6704', 'WATERPROOF'), ('DL01-BT-6704', 'GENERAL'),
  -- DL01-BT-6705: 20FT Open Body
  ('DL01-BT-6705', '20FT'), ('DL01-BT-6705', 'OPEN_BODY'), ('DL01-BT-6705', 'GENERAL'),

  -- MP09-KD-1001: 32FT Dry Container
  ('MP09-KD-1001', '32FT'), ('MP09-KD-1001', 'CONTAINER'), ('MP09-KD-1001', 'WATERPROOF'), ('MP09-KD-1001', 'GENERAL'),
  -- MP09-KD-1002: 32FT Reefer
  ('MP09-KD-1002', '32FT'), ('MP09-KD-1002', 'CONTAINER'), ('MP09-KD-1002', 'WATERPROOF'), ('MP09-KD-1002', 'REFRIGERATED'), ('MP09-KD-1002', 'PERISHABLE'),
  -- MP09-KD-1003: 32FT Fragile & Waterproof
  ('MP09-KD-1003', '32FT'), ('MP09-KD-1003', 'CONTAINER'), ('MP09-KD-1003', 'WATERPROOF'), ('MP09-KD-1003', 'FRAGILE'), ('MP09-KD-1003', 'GENERAL'),
  -- MP09-KD-1004: 20FT Dry Container
  ('MP09-KD-1004', '20FT'), ('MP09-KD-1004', 'CONTAINER'), ('MP09-KD-1004', 'WATERPROOF'), ('MP09-KD-1004', 'GENERAL'),
  -- MP09-KD-1005: 20FT Open Body
  ('MP09-KD-1005', '20FT'), ('MP09-KD-1005', 'OPEN_BODY'), ('MP09-KD-1005', 'GENERAL'),

  -- MP04-VF-2001: 32FT Dry Container
  ('MP04-VF-2001', '32FT'), ('MP04-VF-2001', 'CONTAINER'), ('MP04-VF-2001', 'WATERPROOF'), ('MP04-VF-2001', 'GENERAL'),
  -- MP04-VF-2002: 32FT Reefer
  ('MP04-VF-2002', '32FT'), ('MP04-VF-2002', 'CONTAINER'), ('MP04-VF-2002', 'WATERPROOF'), ('MP04-VF-2002', 'REFRIGERATED'), ('MP04-VF-2002', 'PERISHABLE'),
  -- MP04-VF-2003: 32FT Open Body
  ('MP04-VF-2003', '32FT'), ('MP04-VF-2003', 'OPEN_BODY'), ('MP04-VF-2003', 'GENERAL'),
  -- MP04-VF-2004: 20FT Dry Container
  ('MP04-VF-2004', '20FT'), ('MP04-VF-2004', 'CONTAINER'), ('MP04-VF-2004', 'WATERPROOF'), ('MP04-VF-2004', 'GENERAL'),
  -- MP04-VF-2005: 20FT Fragile & Perishable
  ('MP04-VF-2005', '20FT'), ('MP04-VF-2005', 'CONTAINER'), ('MP04-VF-2005', 'WATERPROOF'), ('MP04-VF-2005', 'FRAGILE'), ('MP04-VF-2005', 'PERISHABLE'),

  -- MH04-SC-3001: 32FT Dry Container
  ('MH04-SC-3001', '32FT'), ('MH04-SC-3001', 'CONTAINER'), ('MH04-SC-3001', 'WATERPROOF'), ('MH04-SC-3001', 'GENERAL'),
  -- MH04-SC-3002: 32FT Reefer
  ('MH04-SC-3002', '32FT'), ('MH04-SC-3002', 'CONTAINER'), ('MH04-SC-3002', 'WATERPROOF'), ('MH04-SC-3002', 'REFRIGERATED'), ('MH04-SC-3002', 'PERISHABLE'),
  -- MH04-SC-3003: 32FT Fragile
  ('MH04-SC-3003', '32FT'), ('MH04-SC-3003', 'CONTAINER'), ('MH04-SC-3003', 'WATERPROOF'), ('MH04-SC-3003', 'FRAGILE'),
  -- MH04-SC-3004: 20FT Dry Container
  ('MH04-SC-3004', '20FT'), ('MH04-SC-3004', 'CONTAINER'), ('MH04-SC-3004', 'WATERPROOF'), ('MH04-SC-3004', 'GENERAL'),
  -- MH04-SC-3005: 20FT Open Body
  ('MH04-SC-3005', '20FT'), ('MH04-SC-3005', 'OPEN_BODY'), ('MH04-SC-3005', 'GENERAL')
) AS tc(reg, cap_name)
JOIN trucks t ON t.registration_number = tc.reg
JOIN capabilities c ON c.name = tc.cap_name
ON CONFLICT (truck_id, capability_id) DO NOTHING;

-- ============================================================
-- 5. EXPANDED RATE CARDS ACROSS LANES 1 THROUGH 6
-- ============================================================

INSERT INTO rate_cards (carrier_id, lane_id, vehicle_capability_id, base_rate, valid_from, valid_until, status)
SELECT
  c.carrier_id,
  l.lane_id,
  cap.capability_id,
  r.base_rate,
  r.valid_from::DATE,
  r.valid_until::DATE,
  r.status
FROM (VALUES
  -- Lane 1: Indore -> Mumbai (589 km)
  ('Khandwa Roadlines Pvt Ltd',  'Indore', 'Mumbai', '32FT', 42000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Khandwa Roadlines Pvt Ltd',  'Indore', 'Mumbai', '20FT', 24500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Indore', 'Mumbai', '32FT', 43000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Indore', 'Mumbai', '20FT', 25000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Capital Road Lines',         'Indore', 'Mumbai', '32FT', 43500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Capital Road Lines',         'Indore', 'Mumbai', '20FT', 25500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),

  -- Lane 2: Indore -> Delhi (793 km)
  ('Khandwa Roadlines Pvt Ltd',  'Indore', 'Delhi',  '32FT', 50500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Khandwa Roadlines Pvt Ltd',  'Indore', 'Delhi',  '20FT', 31000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Vindhya Freight Logistics',  'Indore', 'Delhi',  '32FT', 51000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Vindhya Freight Logistics',  'Indore', 'Delhi',  '20FT', 30500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Capital Road Lines',         'Indore', 'Delhi',  '20FT', 29500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Indore', 'Delhi', '20FT', 30000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),

  -- Lane 3: Bhopal -> Mumbai (780 km)
  ('Vindhya Freight Logistics',  'Bhopal', 'Mumbai', '32FT', 47500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Vindhya Freight Logistics',  'Bhopal', 'Mumbai', '20FT', 28500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Bhopal', 'Mumbai', '32FT', 49000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Bhopal', 'Mumbai', '20FT', 29000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Bhopal', 'Mumbai', '32FT', 48000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Bhopal', 'Mumbai', '20FT', 28000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),

  -- Lane 4: Mumbai -> Pune (150 km)
  ('Deccan Freight Carriers',    'Mumbai', 'Pune',   '32FT', 14000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Mumbai', 'Pune',   '32FT', 13500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Mumbai', 'Pune',   '20FT',  9000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Mumbai', 'Pune', '32FT', 15000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Mumbai', 'Pune', '20FT', 10000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),

  -- Lane 5: Indore -> Pune (640 km)
  ('Deccan Freight Carriers',    'Indore', 'Pune',   '32FT', 43500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Deccan Freight Carriers',    'Indore', 'Pune',   '20FT', 26000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Khandwa Roadlines Pvt Ltd',  'Indore', 'Pune',   '32FT', 44000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Khandwa Roadlines Pvt Ltd',  'Indore', 'Pune',   '20FT', 26500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Indore', 'Pune', '32FT', 45000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Indore', 'Pune', '20FT', 27000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Indore', 'Pune',   '32FT', 44500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Sahyadri Intercity Cargo',   'Indore', 'Pune',   '20FT', 26000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),

  -- Lane 6: Bhopal -> Delhi (697 km)
  ('Capital Road Lines',         'Bhopal', 'Delhi',  '20FT', 27000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Vindhya Freight Logistics',  'Bhopal', 'Delhi',  '32FT', 43500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Vindhya Freight Logistics',  'Bhopal', 'Delhi',  '20FT', 26500.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Bhopal', 'Delhi', '32FT', 45000.00, '2026-10-01', '2027-04-01', 'ACTIVE'),
  ('Malwa Express Logistics Pvt Ltd', 'Bhopal', 'Delhi', '20FT', 27500.00, '2026-10-01', '2027-04-01', 'ACTIVE')
) AS r(carrier_name, origin_city, destination_city, vehicle_cap, base_rate, valid_from, valid_until, status)
JOIN carriers c ON c.name = r.carrier_name
JOIN lanes l ON l.origin_city = r.origin_city AND l.destination_city = r.destination_city
JOIN capabilities cap ON cap.name = r.vehicle_cap AND cap.category = 'VEHICLE_TYPE'
WHERE NOT EXISTS (
  SELECT 1 FROM rate_cards rc
  WHERE rc.carrier_id = c.carrier_id
    AND rc.lane_id = l.lane_id
    AND rc.vehicle_capability_id = cap.capability_id
    AND rc.valid_from = r.valid_from::DATE
    AND rc.valid_until = r.valid_until::DATE
);

COMMIT;
