# TruckLayBay

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

TruckLayBay is a full-truckload (FTL) freight-booking platform engineered for Indian industrial corridors. It matches shipper cargo specifications with eligible commercial carrier fleets, resolves contractual rate cards into transparent quotes, and executes concurrency-safe transactional bookings.

---

## Overview & Key Features

Commercial road freight procurement in India frequently faces volatile broker spot pricing, unverified vehicle capabilities, and capacity double-booking. TruckLayBay addresses these challenges through deterministic rate-card tariffs, relational set-containment matching, and atomic database transactions.

### Key Implemented Features

- **Load Creation & Validation**: Validates origin-destination freight lanes, calendar date ordering, payload weight limits, and required vehicle capabilities.
- **Capability- & Capacity-Based Truck Eligibility**: Matches active vehicles against required cargo weight and enforces strict set-containment matching across all requested capabilities.
- **Carrier & Temporal Rate-Card Resolution**: Resolves carrier tariffs based on corridor, vehicle classification, and half-open contract validity windows.
- **Deterministic Freight Pricing & Quote Expiration**: Computes integer-safe paise amounts with a configured 10% fuel surcharge, itemized accessorials, and a server-controlled 15-minute expiration countdown.
- **Quote Comparison**: Presents multi-carrier fare comparisons ordered by total cost, complete with itemized price breakdowns and vehicle specifications.
- **Transactional Booking & Conflict Handling**: Guarantees atomic commitment via PostgreSQL pessimistic row locks (`FOR UPDATE`), post-lock revalidation, and rejection of overlapping transit schedules.
- **Booking Retrieval & Confirmation**: Provides comprehensive booking records with allocated vehicle registration, driver details, schedule, route information, and billing details.
- **React Customer Interface with Simulated Checkout**: Interactive single-page application with corridor selection, live quote generation, and simulated payment workflows across multiple payment rails.

---

## How It Works

Shippers progress through a structured six-stage booking workflow:

**Create a load → Match eligible trucks → Generate quotes → Compare prices → Demo checkout → Confirm booking**

```mermaid
flowchart LR
    A["Create Load"] --> B["Match Trucks"]
    B --> C["Generate Quotes"]
    C --> D["Compare Prices"]
    D --> E["Demo Checkout"]
    E --> F["Confirm Booking"]
```

> **Simulated Payment Notice**: The checkout process simulates payment authorization across mock payment rails (UPI, Corporate Card, Net Banking) for demonstration and testing purposes. No real money is processed or charged.

---

## Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Axios | Customer booking interface and client-side routing |
| **Styling** | Tailwind CSS v4, Lucide React | Modern responsive design and iconography |
| **Backend** | Node.js (ESM), Express 5 | RESTful API, validation layer, and domain services |
| **Database** | PostgreSQL 14+, `pg` (node-postgres) | Relational persistence, connection pooling, and row locks |
| **Testing** | Node.js Test Runner (`node --test`), `assert/strict` | Automated unit, integration, and concurrency regression suites |

---

## Architecture & Data Model

The backend employs a layered separation of concerns to keep business logic, data access, and database queries modular and testable:

- **Routes & Controllers** (`src/routes`, `src/controllers`): Handle HTTP request routing, input parsing, status dispatching, and centralized error normalization via `AppError`.
- **Services** (`src/services`): Coordinate core business logic, including load creation, quote calculation, expiration lifecycles, and transactional booking execution.
- **Repositories** (`src/repositories`): Encapsulate data access operations, passing PostgreSQL pool connections or dedicated transactional clients.
- **Parametric SQL Queries** (`db/queries`): Modular, auditable SQL statements (`001`–`020`) separating complex relational queries from application code.
- **PostgreSQL Database**: Relational engine enforcing domain constraints, cascade rules, and ACID transactional guarantees.

### Entity-Relationship Diagram

```mermaid
erDiagram
    CARRIERS ||--o{ TRUCKS : owns
    CARRIERS ||--o{ DRIVERS : employs
    CARRIERS ||--o{ RATE_CARDS : establishes
    LANES ||--o{ RATE_CARDS : covers
    CAPABILITIES ||--o{ RATE_CARDS : classifies
    TRUCKS ||--o{ TRUCK_CAPABILITIES : possesses
    CAPABILITIES ||--o{ TRUCK_CAPABILITIES : defines
    LANES ||--o{ LOADS : spans
    LOADS ||--o{ LOAD_CAPABILITIES : requires
    CAPABILITIES ||--o{ LOAD_CAPABILITIES : fulfills
    LOADS ||--o{ QUOTES : receives
    CARRIERS ||--o{ QUOTES : issues
    TRUCKS ||--o{ QUOTES : assigns
    RATE_CARDS ||--o{ QUOTES : applies
    QUOTES ||--o| BOOKINGS : confirms
```

### Relational Schema Design

- **`carriers`**: Fleet operating companies with commercial details (GST number, contact info) and operational status.
- **`drivers`**: Commercial drivers employed by carriers with license numbers and expiry tracking.
- **`capabilities`**: Standardized catalog spanning vehicle types (`20FT`, `32FT`), body types (`CONTAINER`, `OPEN_BODY`), features (`WATERPROOF`, `REFRIGERATED`), and freight types (`GENERAL`, `FRAGILE`, `PERISHABLE`).
- **`trucks`**: Physical vehicles linked to carriers, specifying payload capacity (`capacity_kg`), registration numbers, and active status.
- **`lanes`**: Origin-destination city pairs defining operational freight corridors and distances.
- **`rate_cards`**: Contractual base tariffs per carrier, lane, and vehicle capability over specified calendar intervals.
- **`loads`**: Shipper freight requests defining lane, cargo weight, pickup and delivery dates, and required capabilities.
- **`quotes`**: Time-limited commercial offers binding a load to a carrier, truck, and rate card with an immutable calculation snapshot.
- **`bookings`**: Confirmation record referencing an accepted quote as the single source of truth for shipment and fleet details.

---

## Engineering Highlights

### 1. Capability- & Capacity-Based Truck Eligibility
Eligible trucks must satisfy both payload requirements (`capacity_kg >= weight_kg`) and relational set containment across all required load capabilities using SQL double negation (`NOT EXISTS`). This ensures only vehicles physically equipped to handle the shipment are matched.

### 2. Temporal Rate Cards
Rate cards define contractual tariffs over half-open validity intervals (`valid_from <= pickup_date < valid_until`). This standard convention allows adjacent contract periods to transition cleanly without billing gaps or overlapping ambiguity.

### 3. Deterministic Pricing
All monetary amounts are calculated and stored in integer paise (`1 INR = 100 paise`), eliminating IEEE 754 floating-point precision errors. Calculations apply the base rate, a configured 10% fuel surcharge, and any applicable accessorial charges before formatting the total.

### 4. Quote Integrity & Expiration
Every generated quote persists an immutable JSONB calculation snapshot capturing inputs, rates, and formulas at the time of creation. Quotes enforce a strict server-controlled 15-minute expiration countdown, preventing stale commercial pricing and ignoring client-side tampering.

### 5. Concurrency Safety & Booking Correctness
The booking service runs within an explicit PostgreSQL transaction on a dedicated client connection. It executes pessimistic row-level locks (`FOR UPDATE`) across the quote, load, and truck simultaneously. Under the acquired lock, the service revalidates quote status and expiration, checks for overlapping truck transit windows (`pickup_date <= requested_delivery` and `delivery_date >= requested_pickup`), conditionally commits state transitions (`quotes` → `ACCEPTED`, `loads` → `BOOKED`), and returns HTTP 409 Conflict upon any concurrency race or resource collision.

### 6. Automated Testing Suite
The project maintains automated test suites covering pricing arithmetic, input validation, REST API routes, transactional rollbacks, and concurrent race conditions (including simultaneous booking attempts, expired quote rejections, and overlapping schedule conflicts).

---

## API Reference

All requests and responses use JSON format. Error responses follow the standard format `{ "error": "message" }`.

| Method | Endpoint | Request Body / Parameters | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/health` | None | Service health check | `200` |
| `GET` | `/api/lanes` | None | Returns active freight corridors | `200`, `500` |
| `GET` | `/api/capabilities` | None | Returns equipment and cargo capability catalog | `200`, `500` |
| `POST` | `/api/loads` | `{ laneId, pickupDate, deliveryDate, weightKg, capabilityIds }` | Creates and validates a new load | `201`, `400`, `500` |
| `GET` | `/api/loads/:loadId` | None | Retrieves load details with required capabilities | `200`, `400`, `404`, `500` |
| `POST` | `/api/loads/:loadId/quotes` | None | Generates 15-minute quotes for all eligible trucks | `201`, `400`, `404`, `500` |
| `GET` | `/api/loads/:loadId/quotes` | None | Lists available quotes for a specific load | `200`, `400`, `404`, `500` |
| `GET` | `/api/quotes/:quoteId` | None | Retrieves quote with calculation snapshot | `200`, `400`, `404`, `500` |
| `POST` | `/api/quotes/:quoteId/book` | None | Atomically locks resources and confirms booking | `201`, `400`, `404`, `409`, `500` |
| `GET` | `/api/bookings/:bookingId` | None | Retrieves confirmed booking and dispatch details | `200`, `400`, `404`, `500` |

---

## Getting Started

### Prerequisites

- **Node.js**: v20+ (ES Modules support required)
- **PostgreSQL**: v14+ running locally or via Docker

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/trucklaybay
```

### 2. Database Migration

Initialize the relational schema, tables, and indexes:

```bash
psql -d trucklaybay -f db/migrations/001_initial_schema.sql
```

### 3. Backend Setup & Startup

Install backend dependencies and start the Express API:

```bash
npm install

# Start development server with file watch
npm run dev

# Or start in production mode:
# npm start
```

The backend API listens on `http://localhost:3000`.

### 4. Frontend Setup & Startup (Separate Terminal)

In a separate terminal, install client dependencies and launch the Vite development server:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and automatically proxies `/api` requests to the Express backend.

### 5. Running Tests & Production Build

```bash
# Run backend test suite (unit, integration, and concurrency tests)
npm test

# Build client production bundle
cd client
npm run build
```

---

## Scope & Limitations

TruckLayBay focuses on deterministic rate calculation and reliable booking execution. Certain real-world logistics capabilities are outside the current project scope:

- **Simulated Payment**: The checkout workflow models payment rail selection (UPI, Corporate Card, Net Banking) and failure handling as a demonstration sandbox. It does not integrate with external payment gateways or process actual funds.
- **Authentication & RBAC**: Implemented as a single-tenant operations platform without user accounts or role-based permissions.
- **Fleet Telematics**: Fleet tracking and live GPS telemetry are not integrated.
- **Regulatory Tax Certification**: The 10% fuel surcharge is a configured platform parameter rather than a statutory taxation calculation. Split invoicing and automated e-way bill generation are excluded.
- **Consolidation**: The platform models dedicated point-to-point full-truckload (FTL) transport and does not support multi-stop less-than-truckload (LTL) consolidation.
