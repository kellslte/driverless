<p align="center">
  <img src="https://img.icons8.com/3d-fluency/94/car.png" width="80" alt="Driverless Logo" />
</p>

<h1 align="center">Driverless</h1>

<p align="center">
  <strong>A ride-hailing platform built as an engineering journal — learning from Uber's mistakes, one module at a time.</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#philosophy">Philosophy</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#project-phases">Phases</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-11-ea2845?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-dc382d?logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/license-UNLICENSED-lightgrey" alt="License" />
</p>

---

## Overview

**Driverless** is a full-stack ride-hailing platform that replicates the core functionality of Uber while systematically addressing the documented failures, design shortcomings, and engineering challenges the ride-hailing industry has faced over the past decade.

This isn't just a clone — it's an **engineering case study**. Every module ships with:

1. 📖 **A Case Study** — what went wrong at Uber (and why)
2. 🛠️ **An Approach** — how we solve it differently (or adopt what worked)
3. ✅ **A Justification** — why our solution works, with references and trade-off analysis

The platform comprises three client applications and a backend:

| Component | Description |
|-----------|-------------|
| **Rider App** | Request rides, track drivers, make payments, rate experiences |
| **Driver App** | Accept rides, navigate, manage earnings, control availability |
| **Admin Dashboard** | Operations management, analytics, compliance, dispute resolution |
| **Backend Platform** | REST APIs, real-time WebSocket services, background workers, fraud detection |

---

## Philosophy

### Why Build This?

The ride-hailing industry has produced some of the most interesting engineering challenges of the past decade — real-time systems at massive scale, marketplace economics, safety-critical software, and regulatory compliance across jurisdictions. But many of these lessons live scattered across blog posts, conference talks, and post-mortems.

**Driverless consolidates those lessons into a single, buildable codebase** where every architectural decision is documented and justified.

### Design Principles

| Principle | What It Means |
|-----------|---------------|
| 🏗️ **Modular Monolith** | Start as one deployable unit with strict module boundaries; split only when metrics demand it |
| 🧅 **Clean Architecture** | Domain logic has zero external dependencies; all I/O flows through ports and adapters |
| 📡 **Event-Driven** | Modules communicate via domain events — decoupled, auditable, replayable |
| 💥 **Design for Failure** | Every external call has a circuit breaker, retry policy, and fallback path |
| 🔒 **Privacy by Design** | Data minimization, purpose limitation, and consent are architectural concerns, not afterthoughts |
| 👁️ **Observability First** | Structured logging, correlation IDs, and Prometheus metrics from day one |
| 📓 **Journal-Style Documentation** | Every module has a case study — we don't just build, we document *why* |

---

## Architecture

Driverless follows **Clean Architecture** within a modular monolith, with a clear evolution path to microservices:

```
                    ┌──────────────────────────────────────┐
                    │           CLIENT LAYER               │
                    │  Rider App │ Driver App │ Admin Panel │
                    └─────────────────┬────────────────────┘
                                      │
                    ┌─────────────────▼────────────────────┐
                    │           API GATEWAY                 │
                    │     Auth │ Rate Limiting │ Routing    │
                    └─────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────┐
    │  Core Services   │  │  Real-Time Layer   │  │ Background Workers│
    │   (REST API)     │  │   (WebSocket)      │  │   (Queue-based)   │
    └────────┬─────────┘  └────────┬───────────┘  └────────┬──────────┘
             │                     │                       │
    ┌────────▼─────────────────────▼───────────────────────▼──────────┐
    │                    DATA & INFRASTRUCTURE                        │
    │  PostgreSQL + PostGIS │ Redis │ RabbitMQ │ S3/MinIO             │
    └─────────────────────────────────────────────────────────────────┘
```

### Module Structure (Clean Architecture)

Every feature module follows the same four-layer structure:

```
src/modules/<module-name>/
├── domain/                  # 🟢 Business logic (zero external deps)
│   ├── entities/            #     Core business objects
│   ├── value-objects/       #     Immutable typed values
│   ├── events/              #     Domain events
│   └── enums/               #     Domain enumerations
├── application/             # 🔵 Use cases & orchestration
│   ├── use-cases/           #     Business operations
│   ├── dtos/                #     Input/output contracts
│   └── ports/               #     Abstract interfaces (dependency inversion)
├── infrastructure/          # 🟠 External concerns
│   ├── repositories/        #     Database implementations
│   ├── adapters/            #     3rd-party service integrations
│   └── mappers/             #     Entity ↔ Schema transformations
├── presentation/            # 🟣 HTTP/WebSocket layer
│   └── controllers/         #     REST endpoints & WS gateways
├── <module>.module.ts       # NestJS module definition
└── CASE_STUDY.md            # 📓 Engineering journal entry
```

**Dependency rule:** outer layers depend on inner layers, never the reverse. The domain layer is pure TypeScript with no framework imports.

---

## Project Phases

The build is broken into **6 progressive phases**, each adding capabilities and shipping with full documentation.

### Phase 1 — Core Platform & Identity

| Module | Uber Problem Addressed |
|--------|----------------------|
| User Management | Monolith scaling pain & 57M-record data breach (2016) |
| Authentication & Authorization | Account takeover attacks via credential stuffing |
| Driver Onboarding & Verification | Inadequate background checks, impersonation incidents |
| Profile & Data Privacy | GDPR violations — €290M fine for illegal data transfers |

### Phase 2 — Real-Time Location & Geospatial

| Module | Uber Problem Addressed |
|--------|----------------------|
| GPS Tracking & Streaming | Write amplification from storing every GPS update to primary DB |
| Geospatial Indexing (H3) | O(n) nearest-driver queries → O(1) with hexagonal cells |
| ETA Calculation | Straight-line distance estimates destroying rider trust |
| Map & Routing | Unsafe route suggestions contributing to accidents |

### Phase 3 — Ride Matching & Dispatch

| Module | Uber Problem Addressed |
|--------|----------------------|
| Ride Request Lifecycle | Race conditions: multiple drivers dispatched to one rider |
| Matching Algorithm | "Closest driver" failing in complex urban environments |
| Batched Matching | Greedy one-at-a-time matching vs. global optimization |
| Supply Prediction | Reactive surge vs. proactive driver repositioning |

### Phase 4 — Marketplace, Pricing & Payments

| Module | Uber Problem Addressed |
|--------|----------------------|
| Dynamic Pricing | Surge pricing opacity (8.8x during Hurricane Sandy) |
| Fare Estimation | Unpredictable final fares eroding trust |
| Payment Processing | Scaling from card-only to cash, mobile money, wallets |
| Driver Earnings | Opaque commission structures driving driver churn |
| Promotions & Incentives | Multi-million dollar promotion abuse by fraud rings |

### Phase 5 — Safety, Trust & Fraud Prevention

| Module | Uber Problem Addressed |
|--------|----------------------|
| In-Ride Safety | No proactive anomaly detection during trips |
| Identity Verification | Driver impersonation bypassing weak checks |
| Fraud Detection (RADAR) | Adversarial fraud evolving faster than static rules |
| Rating System | One-sided, gameable ratings without accountability |
| Dispute Resolution | Manual dispute handling that can't scale |

### Phase 6 — Scale, Compliance & Operations

| Module | Uber Problem Addressed |
|--------|----------------------|
| Notification System | Multi-channel delivery failures and missed alerts |
| Regulatory Compliance Engine | Hardcoded rules breaking across jurisdictions |
| Observability & Monitoring | Silent outages discovered via social media complaints |
| Admin Panel | Monolithic admin without role-based access |
| Disaster Recovery | Cascading failures in distributed systems |

---

## Tech Stack

### Core

| Technology | Version | Role |
|-----------|---------|------|
| **Node.js** | 20 LTS | Runtime |
| **NestJS** | 11 | Backend framework |
| **TypeScript** | 5.7 | Language |
| **TypeORM** | Latest | ORM with migrations |
| **PostgreSQL** | 16 | Primary database |
| **PostGIS** | 3.4 | Geospatial queries |
| **Redis** | 7 | Cache, sessions, real-time location store |
| **RabbitMQ** | 3.12 | Message broker for domain events |
| **Socket.IO** | 4 | Real-time WebSocket communication |
| **Uber H3** | Latest | Hexagonal geospatial indexing |

### Development & Operations

| Tool | Purpose |
|------|---------|
| Docker + Docker Compose | Local development environment |
| GitHub Actions | CI/CD pipeline |
| Jest + Supertest | Unit, integration, and E2E testing |
| k6 | Load and performance testing |
| Swagger / OpenAPI 3.0 | Auto-generated API documentation |
| Prometheus + Grafana | Metrics and dashboarding |
| Pino | Structured JSON logging |
| ESLint + Prettier | Code quality and formatting |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **Yarn** (package manager)
- **Docker** & **Docker Compose** (for infrastructure services)

### Installation

```bash
# Clone the repository
git clone https://github.com/kellendia/driverless.git
cd driverless

# Install dependencies
yarn install
```

### Running Infrastructure (Docker)

```bash
# Start PostgreSQL, Redis, RabbitMQ, and MinIO
docker compose up -d
```

### Running the Application

```bash
# Development (watch mode)
yarn start:dev

# Production build
yarn build
yarn start:prod
```

### Running Tests

```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# E2E tests
yarn test:e2e

# Coverage report
yarn test:cov
```

### Linting & Formatting

```bash
# Lint and auto-fix
yarn lint

# Format code
yarn format
```

---

## Documentation

All project documentation lives in the [`docs/`](./docs) directory:

| Document | Description |
|----------|-------------|
| [**SRD.md**](./docs/SRD.md) | Software Requirements Document — 100+ functional requirements, user stories, non-functional requirements |
| [**TDD.md**](./docs/TDD.md) | Technical Design Document — system architecture, data models, API design, security, observability |
| [**Case Studies**](./docs/case-studies/) | Index of 25+ engineering case studies, one per module |

### Case Study Format

Each module's `CASE_STUDY.md` follows this structure:

1. **What Happened at Uber** — the specific failure or challenge
2. **Impact** — user trust, revenue, legal consequences
3. **Root Cause** — technical or organizational
4. **Our Approach** — how Driverless solves it
5. **Why It Works** — references and industry best practices
6. **Trade-offs** — what we sacrifice and why it's acceptable

---

## Project Structure

```
driverless/
├── docs/                            # 📚 Project documentation
│   ├── SRD.md                       #    Software Requirements Document
│   ├── TDD.md                       #    Technical Design Document
│   └── case-studies/                #    Engineering case studies
│       └── README.md                #    Case study index
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── common/                      # Shared kernel (decorators, guards, pipes, etc.)
│   ├── config/                      # Configuration module
│   └── modules/                     # Feature modules
│       ├── user/                    #   Phase 1 — User Management
│       ├── auth/                    #   Phase 1 — Authentication
│       ├── driver/                  #   Phase 1 — Driver Onboarding
│       ├── location/                #   Phase 2 — Geospatial Services
│       ├── ride/                    #   Phase 3 — Ride Lifecycle
│       ├── matching/                #   Phase 3 — Matching Engine
│       ├── pricing/                 #   Phase 4 — Dynamic Pricing
│       ├── payment/                 #   Phase 4 — Payments
│       ├── safety/                  #   Phase 5 — Safety Features
│       ├── fraud/                   #   Phase 5 — Fraud Detection
│       ├── notification/            #   Phase 6 — Notifications
│       └── compliance/              #   Phase 6 — Regulatory Compliance
├── test/                            # E2E tests
├── docker-compose.yml               # Local infrastructure
├── package.json
├── tsconfig.json
└── README.md                        # ← You are here
```

---

## API Overview

The platform exposes a RESTful API with Swagger documentation available at `/api/docs` when running locally.

### Key Endpoints

| Area | Base Path | Highlights |
|------|-----------|------------|
| **Auth** | `/api/v1/auth` | Register, login, OTP, MFA, token refresh |
| **Users** | `/api/v1/users` | Profile management, data export (GDPR) |
| **Drivers** | `/api/v1/drivers` | Application, documents, online/offline toggle |
| **Rides** | `/api/v1/rides` | Fare estimate, request, cancel, rate, history |
| **Payments** | `/api/v1/payments` | Payment methods, earnings, payouts |
| **Admin** | `/api/v1/admin` | User search, driver verification, operations |

### Real-Time (WebSocket)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `driver:location:update` | Driver → Server | GPS coordinate streaming |
| `ride:offer` | Server → Driver | New ride request notification |
| `ride:matched` | Server → Rider | Driver assignment with ETA |
| `ride:driver:location` | Server → Rider | Live driver tracking |
| `safety:check` | Server → Rider | Automated "Are you OK?" prompt |

Full event catalog is documented in the [TDD](./docs/TDD.md#62-socket-io-room-strategy).

---

## Non-Functional Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| WebSocket latency | < 100ms |
| Ride matching time (median) | < 10 seconds |
| Core service uptime | 99.95% |
| Safety services uptime | 99.99% |
| Concurrent active drivers | 100,000+ |
| Location updates/second | 25,000+ |

---

## Contributing

This is an engineering case study project by **Kellendia Engineering**. Contributions are welcome for:

- 🐛 Bug fixes and improvements
- 📖 Case study refinements and additional research
- 🧪 Test coverage improvements
- 📐 Architecture suggestions

### Development Workflow

1. Create a feature branch from `main`
2. Follow the Clean Architecture module structure
3. Include or update the relevant `CASE_STUDY.md`
4. Ensure all tests pass (`yarn test`)
5. Submit a pull request with a clear description

### Code Style

- **TypeScript strict mode** enabled
- **ESLint + Prettier** enforced (run `yarn lint` before committing)
- **Conventional Commits** for commit messages

---

## License

This project is **UNLICENSED** — proprietary to Kellendia Engineering.

---

<p align="center">
  <sub>Built with ❤️ by <strong>Kellendia Engineering</strong> — learning from the giants' mistakes so we don't have to repeat them.</sub>
</p>
