# TruckLayBay — Full-Truckload Freight Allocation & Rate Engine

TruckLayBay is an enterprise-grade full-truckload (FTL) freight rate and capacity allocation platform engineered for Indian industrial corridors. The platform pairs commercial fleet carriers with shippers through deterministic contractual rate cards, capability-based relational matching, and concurrency-safe transactional booking.

---

## 1. Project Overview & Customer Booking Workflow

TruckLayBay is built to solve commercial freight pricing uncertainty and capacity double-booking across India's primary freight highways. Unlike speculative broker marketplaces, TruckLayBay enforces fixed, contractual rate cards agreed with fleet carriers and binds physical vehicles to shipments through atomic database transactions.

### The Customer Booking Workflow

1. **Corridor & Cargo Specification**:
   The customer selects an active freight corridor (e.g., *Indore → Mumbai*, 589 km), chooses required pickup and delivery dates, specifies total cargo weight in kilograms, and selects required vehicle/equipment capabilities (such as 32FT multi-axle container, refrigerated cold chain, or waterproof body).

2. **Deterministic Rate Card & Fleet Matching**:
   The backend executes an SQL relational matching query (`001_find_eligible_trucks.sql`) to find active fleet trucks that have capacity $\ge$ cargo weight, possess *all* requested load capabilities, and belong to an active carrier with a valid rate card covering the lane, vehicle type, and pickup date window ($[\text{valid\_from}, \text{valid\_until})$).

3. **Instant Quotation Generation**:
   The pricing service calculates an integer-safe quotation for every eligible truck with a strictly enforced 15-minute server expiration window. Base freight, the 10% configured fuel surcharge, and any accessorials are calculated in paise and stored in an immutable JSONB audit snapshot.

4. **Quote Comparison & Checkout Initiation**:
   The customer compares quotes ordered by total amount, inspecting carrier names, truck registrations, equipment specs, and itemized fare breakdowns. Expired quotes cannot proceed. Clicking "Continue to checkout" navigates to the dedicated checkout experience (`/checkout/:quoteId`).

5. **Shipment Review & Demo Payment Simulation**:
   On the checkout page, the customer reviews route, schedule, carrier, vehicle capacity, and itemized fare details. Shippers select a demo payment rail (UPI, Corporate Card, or Net Banking) and can toggle between simulated success and simulated failure. Prominent disclaimers guarantee transparency: *"Demo checkout — no real payment is processed and no money is charged."*

6. **Concurrency-Safe Truck Commitment**:
   Only after simulated payment succeeds does the application trigger the transactional booking backend (`POST /api/quotes/:quoteId/book`). If payment simulation fails, the booking endpoint is intentionally NOT called, verifying error resilience without reserving resources. When invoked, the booking service checks out a dedicated PostgreSQL client, begins a transaction, acquires pessimistic row locks (`FOR UPDATE`) on the quote, load, and truck, verifies the quote has not expired or been booked, ensures the truck has no overlapping booking conflict over the scheduled transit window, inserts a `CONFIRMED` booking, transitions the quote to `ACCEPTED`, and updates the load to `BOOKED`.

7. **Bill of Lading & Booking Lookup**:
   Upon confirmation, an official freight allocation record is presented with the assigned vehicle registration, driver details, schedule, fare breakdown, and demo payment reference, printable as a consignment record and searchable by booking ID.

---

## 2. Product Features & Current Scope

### Implemented Scope
- **Contractual Corridor Tariffs**: Deterministic base rates agreed with commercial fleet carriers across 6 primary lanes.
- **Relational Capability Matching**: All-capability relational set-containment matching (`NOT EXISTS` double-negation) across vehicle dimensions, body types, climate protection, and cargo handling.
- **Paise-Precision Pricing V1**: Integer-safe monetary calculations eliminating IEEE 754 floating-point rounding errors.
- **Configured Fuel Surcharge**: Configured 10% rate calculation snapshot stored immutably in JSONB.
- **15-Minute Quote Expiration**: Server-enforced validity countdown preventing stale commercial commitments.
- **Atomic Resource Locking**: Pessimistic row locking on quotes, loads, and trucks with post-lock revalidation.
- **Transit Window Conflict Prevention**: Rejection of overlapping bookings for the same truck over scheduled dates.
- **Demo Checkout & Payment Simulation**: Dedicated 3-step checkout (`/checkout/:quoteId`) with UPI, Card, and Net Banking simulation, deterministic latency, and toggleable success/failure modes.
- **Full-Stack Interface**: React 19 SPA with global blue-only styling, custom SVG isometric illustration, live validation, and booking lookup.

### Intentionally Excluded Scope / Future Work
- Authentication and role-based permissions (single-tenant / operator terminal in V1).
- Live GPS telemetry / telematics vehicle tracking.
- Production payment gateway processing with live banking/escrow settlement (simulated boundary in V1).
- Dynamic surge pricing / spot-market bidding auctions.
- Multi-leg LTL (less-than-truckload) consolidation and routing.
- Statutory or regulatory tax certification (the 10% fuel surcharge is a configured V1 pricing assumption).

---

## 3. Technology Stack

- **Runtime**: Node.js (v20+ / v24 recommended, ES Modules)
- **Backend Framework**: Express 5
- **Database Driver**: `pg` (node-postgres) with connection pooling (`pg-pool`)
- **Database**: PostgreSQL 14+
- **Frontend Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom brand theme tokens
- **Routing**: React Router 7 (`react-router-dom`)
- **HTTP Client**: Axios
- **Iconography**: Lucide React
- **Test Framework**: Node.js built-in test runner (`node --test`) with `assert`

---

## 4. Architecture & Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Client                            │
│  React 19 • Vite 8 • Tailwind CSS v4 • React Router 7 • Axios   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP JSON (Proxied via Vite /api)
┌────────────────────────────────▼────────────────────────────────┐
│                   Express 5 REST API Layer                      │
│   Lane & Capability Routes • Load Routes • Booking Routes       │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
┌────────────────▼──────────────┐ ┌──────────────▼────────────────┐
│     Quote & Pricing Engine    │ │    Booking Service Engine     │
│  Paise-integer calculation    │ │  Dedicated client checkout    │
│  10% fuel surcharge index     │ │  Pessimistic row locking      │
│  15m server quote expiration  │ │  Double-booking exclusion     │
└────────────────┬──────────────┘ └──────────────┬────────────────┘
                 │                               │
┌────────────────▼───────────────────────────────▼────────────────┐
│               PostgreSQL Connection Pool (pg.Pool)              │
│       Parametric SQL Queries (001–020) • Transaction Control    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                   PostgreSQL Database Server                    │
│   11 Normalized Tables • Relational Foreign Keys • Row Locks    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Relational Data Model & Entity Roles

The database schema is strictly normalized across 11 core tables without denormalized foreign key duplication:

```mermaid
erDiagram
    CARRIERS ||--o{ TRUCKS : owns
    CARRIERS ||--o{ DRIVERS : employs
    CARRIERS ||--o{ RATE_CARDS : establishes
    LANES ||--o{ RATE_CARDS : covers
    CAPABILITIES ||--o{ RATE_CARDS : prices
    TRUCKS ||--o{ TRUCK_CAPABILITIES : possesses
    CAPABILITIES ||--o{ TRUCK_CAPABILITIES : describes
    LANES ||--o{ LOADS : spans
    LOADS ||--o{ LOAD_CAPABILITIES : demands
    CAPABILITIES ||--o{ LOAD_CAPABILITIES : satisfies
    LOADS ||--o{ QUOTES : generated_for
    CARRIERS ||--o{ QUOTES : issued_by
    TRUCKS ||--o{ QUOTES : allocated_truck
    RATE_CARDS ||--o{ QUOTES : referenced_rate
    QUOTES ||--o| BOOKINGS : committed_into
```

### Entity Roles & Database Schema

1. **`carriers`**: Fleet operating companies responsible for commercial transport. Physical deletion cascades into owned trucks and rate cards, but is prevented by `RESTRICT` foreign keys if referenced by historical quotes.
2. **`drivers`**: Commercial drivers employed by carriers (`driver_id`, `carrier_id` FK CASCADE, `license_number` UNIQUE, `license_valid_until`). Distinct entities associated with carriers.
3. **`capabilities`**: Shared catalog of 9 standardized equipment features across 4 categories:
   - `VEHICLE_TYPE`: `20FT`, `32FT` (used as the primary rate card pricing dimension).
   - `BODY_TYPE`: `CONTAINER`, `OPEN_BODY`.
   - `FEATURE`: `WATERPROOF`, `REFRIGERATED`.
   - `FREIGHT_TYPE`: `GENERAL`, `FRAGILE`, `PERISHABLE`.
4. **`trucks`**: Physical vehicles (`registration_number` UNIQUE, `capacity_kg`, `status` ACTIVE/MAINTENANCE/INACTIVE, `model`, `permit_number`, `insurance_valid_until`).
5. **`truck_capabilities`**: Composite PK `(truck_id, capability_id)` assigning capabilities to trucks.
6. **`lanes`**: Origin-destination city pairs (`origin_city`, `destination_city` UNIQUE, `distance_km`, `status`).
7. **`rate_cards`**: Contractual base freight tariffs for a carrier, lane, and vehicle capability (`valid_from`, `valid_until` half-open interval, `base_rate`).
8. **`loads`**: Customer freight orders (`lane_id`, `pickup_date`, `delivery_date`, `weight_kg`, `status` DRAFT/OPEN/QUOTED/BOOKED/IN_TRANSIT/COMPLETED/CANCELLED).
9. **`load_capabilities`**: Composite PK `(load_id, capability_id)` specifying mandatory requirements for a load.
10. **`quotes`**: Fixed-price commercial quote records binding a load, carrier, truck, and rate card with a server-controlled `valid_until` timestamp and JSONB calculation snapshot.
11. **`bookings`**: Acceptance of a quote (`quote_id` UNIQUE FK, `status` CONFIRMED). The quote remains the single source of truth for load, carrier, truck, and rate card.

---

## 6. Truck Eligibility & Relational Matching

Candidate trucks are identified via parameterized SQL (`db/queries/001_find_eligible_trucks.sql`):
1. **Payload Capacity & Status Filter**: `t.status = 'ACTIVE'` and `t.capacity_kg >= target_load.weight_kg`.
2. **Relational Set Containment**: The truck must possess **every single capability** required by the load using double-negation:
   ```sql
   AND NOT EXISTS (
       SELECT 1
       FROM load_capabilities lc
       WHERE lc.load_id = tl.load_id
         AND NOT EXISTS (
             SELECT 1
             FROM truck_capabilities tc
             WHERE tc.truck_id = t.truck_id
               AND tc.capability_id = lc.capability_id
         )
   )
   ```
3. **Carrier & Lane Alignment**: Carrier `status = 'ACTIVE'` on the load's `lane_id`.
4. **Half-Open Temporal Validity**:
   ```sql
   rc.valid_from <= tl.pickup_date AND tl.pickup_date < rc.valid_until
   ```
5. **Vehicle Dimension Alignment**: The rate card's `vehicle_capability_id` must match the truck's `VEHICLE_TYPE` capability (`20FT` or `32FT`).

---

## 7. Deterministic Pricing Engine V1

All pricing calculations are performed in `src/services/pricingService.js` using integer paise arithmetic (`1 INR = 100 paise`):

### Mathematical Model
$$\text{basePaise} = \text{round}(\text{baseRate} \times 100)$$
$$\text{fuelPaise} = \text{round}(\text{basePaise} \times 0.10)$$
$$\text{accessorialPaise} = \sum \text{round}(\text{charge}_i \times 100)$$
$$\text{totalPaise} = \text{basePaise} + \text{fuelPaise} + \text{accessorialPaise}$$
$$\text{totalAmount} = \frac{\text{totalPaise}}{100}$$

- **Fuel Surcharge**: Fixed 10% configured assumption of base freight (`Math.round(baseRate * 0.10)`).
- **Accessorial Charges**: Explicitly itemized (refrigeration, special handling).
- **Audit Snapshot**: The full calculation input, formula, and paise-accurate components are stored in `quotes.calculation_snapshot`.

---

## 8. Concurrency Safety & Booking Transactions

To guarantee that a truck cannot be double-booked across overlapping shipment dates, `src/services/bookingService.js` implements strict transactional boundaries:

### 1. Dedicated Client Connection
The service checks out a dedicated client from the pool (`const client = await pool.connect()`) and executes `BEGIN`.

### 2. Pessimistic Row-Level Locking (`011_lock_booking_resources.sql`)
The quote, load, and truck rows are locked simultaneously using `FOR UPDATE`:
```sql
WITH locked_quote AS (
    SELECT q.quote_id, q.load_id, q.truck_id
    FROM quotes q
    WHERE q.quote_id = $1
    FOR UPDATE
),
locked_load AS (
    SELECT l.load_id
    FROM loads l
    JOIN locked_quote lq ON lq.load_id = l.load_id
    FOR UPDATE
),
locked_truck AS (
    SELECT t.truck_id
    FROM trucks t
    JOIN locked_quote lq ON lq.truck_id = t.truck_id
    FOR UPDATE
)
SELECT lq.quote_id, lq.load_id, lq.truck_id
FROM locked_quote lq
JOIN locked_load ll ON ll.load_id = lq.load_id
JOIN locked_truck lt ON lt.truck_id = lq.truck_id;
```

### 3. Post-Lock Re-Read & Re-Validation
Because competing transactions queue while waiting for row locks, the service re-reads the quote under the acquired lock and re-verifies:
- **Quote Status**: Must still be `'ACTIVE'` (aborts with `409 Conflict` if already accepted/rejected).
- **Expiration Check**: Verified against `CURRENT_TIMESTAMP` (aborts with `409 Conflict` if the 15-minute window expired while waiting for the lock).
- **Delivery Date**: Verified that delivery date is non-null.

### 4. Overlapping Transit Window Conflict Query (`008_get_truck_booking_conflicts.sql`)
The transaction checks whether the assigned truck has an active booking on an overlapping calendar interval:
```sql
SELECT b.booking_id
FROM bookings b
JOIN quotes q ON q.quote_id = b.quote_id
JOIN loads l ON l.load_id = q.load_id
WHERE q.truck_id = $1
  AND b.status IN ('CONFIRMED', 'IN_TRANSIT')
  AND l.pickup_date <= $3
  AND l.delivery_date >= $2;
```
If an active booking exists within that date range, the transaction rolls back and returns `409 Conflict`.

### 5. Atomic State Commit
If valid:
1. `bookings` record created (`status = 'CONFIRMED'`).
2. `quotes.status` updated to `'ACCEPTED'`.
3. `loads.status` updated to `'BOOKED'`.
4. Transaction committed via `COMMIT` and client released in a `finally` block.

### Tested Concurrency Scenarios (`src/routes/concurrency.test.js`)
- **Race 1**: Two concurrent requests for the exact same quote $\rightarrow$ exactly one returns `201 Created`, the second returns `409 Conflict`.
- **Race 2**: Two concurrent requests booking different quotes on the same load $\rightarrow$ exactly one succeeds; the second is rejected because the load is already booked.
- **Race 3**: Sequential booking of an already accepted quote $\rightarrow$ returns `409 Conflict` (not `500`).
- **Race 4**: Booking an expired quote $\rightarrow$ returns `409 Conflict` and preserves `loads.status` in `OPEN`/`QUOTED`.
- **Race 5**: Two different loads attempting to book the same truck on overlapping dates $\rightarrow$ first succeeds, second receives `409 Conflict`.
- **Race 6**: Five simultaneous concurrent booking attempts for the same quote $\rightarrow$ exactly one succeeds with `201 Created`, all others receive `409 Conflict`.

---

## 9. REST API Reference

All requests and responses use JSON. Client error responses return `{ error: string }`.

| Method | Endpoint | Request Body | Response Payload | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/lanes` | None | Array of active lanes | `200`, `500` |
| `GET` | `/api/capabilities` | None | Array of capability catalog records | `200`, `500` |
| `POST` | `/api/loads` | `{ laneId, pickupDate, deliveryDate, weightKg, capabilityIds }` | Created load object with capabilities | `201`, `400`, `500` |
| `GET` | `/api/loads/:loadId` | None | Load object with joined capabilities | `200`, `400`, `404`, `500` |
| `POST` | `/api/loads/:loadId/quotes` | `{ validUntil?, baseRate? }` (overrides ignored) | Array of calculated quotes (15m validity) | `201`, `400`, `404`, `500` |
| `GET` | `/api/loads/:loadId/quotes` | None | Array of quotes with carrier & truck info | `200`, `400`, `404`, `500` |
| `GET` | `/api/quotes/:quoteId` | None | Joined quote with calculation snapshot | `200`, `400`, `404`, `500` |
| `POST` | `/api/quotes/:quoteId/book` | None | Confirmed booking object with joined details | `201`, `400`, `404`, `409`, `500` |
| `GET` | `/api/bookings/:bookingId` | None | Full booking record with vehicle & schedule | `200`, `400`, `404`, `500` |

---

## 10. Demo Checkout & Simulated Payment Architecture

TruckLayBay includes a dedicated, frontend checkout experience at `/checkout/:quoteId` designed to demonstrate freight booking fulfillment without requiring live banking or payment gateway credentials.

### 1. Simulated Payment Boundary & Transparency
- **Explicit Demo Disclaimer**: Every checkout screen prominently communicates: *"Demo checkout — no real payment is processed and no money is charged."*
- **No Mock Gateway Deception**: The platform never presents simulated transaction IDs as authentic banking gateway receipts or claims real currency was moved. All payment references are explicitly prefixed (e.g. `DEMO-PAY-XXX`).
- **Simulated Payment Rails**:
  - **UPI Demo**: Virtual Payment Address simulation with instant validation.
  - **Corporate Card Demo**: Commercial debit/credit card simulation with cardholder and expiry validation.
  - **Net Banking Demo**: Commercial internet banking simulation across primary Indian corporate banks (HDFC, ICICI, SBI, Axis, Kotak).

### 2. Transactional Booking Execution Hook
The simulated payment acts as a strict guardrail before the backend booking API is invoked:
1. **Shipment Review**: The shipper reviews corridor, schedule, carrier, vehicle capacity, and itemized fare. Expired quotes cannot advance.
2. **Payment Simulation**:
   - The user selects a demo payment method and triggers payment simulation.
   - **Success Mode (Default)**: `processDemoPayment()` simulates an approved transaction after realistic latency (900–1000ms). Only upon approved simulation does the client invoke `POST /api/quotes/:quoteId/book`.
   - **Failure Mode (Test Sandbox)**: If the user toggles "Simulate Failure", `processDemoPayment()` simulates an immediate bank gateway decline. The booking endpoint is **intentionally NOT invoked**, verifying that no database row locks are held and no booking records are created when payment is declined.
3. **Dual Confirmation**: Upon successful booking, the confirmation screen clearly displays both operational booking reference information and explicit sandbox confirmation:
   - *"Booking confirmed in TruckLayBay demo environment"*
   - *"Demo payment simulation successful — no real payment processed"*

### 3. Production Gateway Integration Roadmap
To transition from the demo payment simulation to production payment processing:
- **Webhook Verification**: Integrate server-to-server signed webhook handlers (e.g., Razorpay HMAC SHA256 signature verification) to listen for asynchronous `payment.captured` events.
- **Idempotency Keys**: Require unique payment idempotency keys on `POST /api/quotes/:quoteId/book` to prevent duplicate authorizations.
- **Two-Step Escrow / Authorization-and-Capture**: Authorize payment upon quote acceptance, place funds in escrow, and capture payout upon electronic Proof of Delivery (e-POD) verification.
- **Carrier Settlement Engine**: Automate split payments deducting marketplace platform fees and remitting contractual base freight directly to carrier nodal accounts.

---

## 11. Fleet Network & Corridors

The platform includes seed data modeling **37 commercial vehicles** across **6 transport companies** covering **6 industrial corridors** with **45 active rate cards**:

### Operating Corridors
1. **Indore ⇄ Mumbai** (589 km) — NH 52 industrial linehaul
2. **Indore ⇄ Delhi** (793 km) — Western dedicated freight route
3. **Bhopal ⇄ Mumbai** (780 km) — Central India manufacturing corridor
4. **Mumbai ⇄ Pune** (150 km) — Expressway short haul & port feeder
5. **Indore ⇄ Pune** (640 km) — Automotive corridor
6. **Bhopal ⇄ Delhi** (697 km) — North-South connection

### Carrier Fleet Operators
- **Malwa Express Logistics Pvt Ltd** (Indore, MP) — 8 trucks (Container, reefer, open body)
- **Deccan Freight Carriers** (Pune, MH) — 7 trucks (Multi-axle 32FT, heavy flatbed)
- **Capital Road Lines** (New Delhi, DL) — 7 trucks (Express linehaul & 20FT container)
- **Khandwa Roadlines Pvt Ltd** (Indore, MP) — 5 trucks (Industrial container & reefer)
- **Vindhya Freight Logistics** (Bhopal, MP) — 5 trucks (Central India reefer & flatbed)
- **Sahyadri Intercity Cargo** (Navi Mumbai, MH) — 5 trucks (Container & expressway transit)

---

## 12. Local Development & Verification Guide

### 1. Prerequisites
- **Node.js**: v20+ (v24 recommended)
- **PostgreSQL**: v14+ running locally or in Docker

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/trucklaybay
PORT=3000
```

### 3. Database Migration & Seed
```powershell
# 1. Apply initial schema migration
psql -d trucklaybay -f db/migrations/001_initial_schema.sql

# 2. Seed baseline catalog and test loads
psql -d trucklaybay -f db/seeds/001_initial_data.sql

# 3. Seed expanded 37-truck fleet across all corridors (idempotent, safe to run repeatedly)
node --env-file=.env src/db/runSeedExpanded.js
```

### 4. Running Verification Checks
```powershell
# Run backend test suite (79 tests)
npm test

# Run repository invariant checks
npm run repo:check
npm run rate:check
npm run quote:check
npm run book:check

# Verify fleet eligibility coverage & quote generation across 6 customer profiles
node --env-file=.env src/db/verifyFleetCoverage.js
```

### 5. Running the Application (Separate Terminals)

**Terminal 1 — Express Backend API**:
```powershell
# Run production backend
npm start

# Or development watch mode:
npm run dev
# Express API listens on http://localhost:3000
```

**Terminal 2 — React Frontend**:
```powershell
cd client
npm run dev
# Vite dev server runs at http://localhost:5173 and proxies /api to http://localhost:3000

# Build frontend production bundle
npm run build
```
