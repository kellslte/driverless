# Driverless — Software Requirements Document (SRD)

**Version:** 1.0  
**Date:** March 6, 2026  
**Status:** Draft  
**Author:** Kellendia Engineering

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Stakeholder Analysis](#2-stakeholder-analysis)
3. [System Overview](#3-system-overview)
4. [Phase 1 — Core Platform & Identity](#4-phase-1--core-platform--identity)
5. [Phase 2 — Real-Time Location & Geospatial Services](#5-phase-2--real-time-location--geospatial-services)
6. [Phase 3 — Ride Matching & Dispatch Engine](#6-phase-3--ride-matching--dispatch-engine)
7. [Phase 4 — Marketplace, Pricing & Payments](#7-phase-4--marketplace-pricing--payments)
8. [Phase 5 — Safety, Trust & Fraud Prevention](#8-phase-5--safety-trust--fraud-prevention)
9. [Phase 6 — Scale, Compliance & Operations](#9-phase-6--scale-compliance--operations)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [System Constraints](#11-system-constraints)
12. [Glossary](#12-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document defines the complete software requirements for **Driverless**, a ride-hailing platform built as an engineering case study. The platform replicates the core functionality of Uber while systematically addressing documented failures and design shortcomings encountered by the ride-hailing industry.

### 1.2 Scope

Driverless is a full-stack ride-hailing platform comprising:

- **Rider Application** — request rides, track drivers, make payments, rate experiences
- **Driver Application** — accept rides, navigate, manage earnings, manage availability
- **Admin Dashboard** — operations management, analytics, compliance, dispute resolution
- **Backend Platform** — APIs, real-time services, data pipelines, fraud detection

### 1.3 Objectives

| # | Objective |
|---|-----------|
| O1 | Build a production-grade ride-hailing platform using modern engineering practices |
| O2 | Document every module with a case study of real industry failures and our approach to solving them |
| O3 | Prioritize safety, transparency, and fairness as first-class architectural concerns |
| O4 | Design for scale from day one while shipping incrementally |
| O5 | Comply with GDPR and prepare for multi-jurisdiction regulatory requirements |

### 1.4 Document Conventions

- **SHALL** — mandatory requirement
- **SHOULD** — strongly recommended
- **MAY** — optional, at implementer's discretion
- Requirements are tagged: `[FR-X.Y.Z]` for functional, `[NFR-X.Y]` for non-functional

---

## 2. Stakeholder Analysis

| Stakeholder | Role | Key Concerns |
|-------------|------|-------------|
| **Rider** | End-user requesting rides | Affordable pricing, safety, short wait times, fare transparency |
| **Driver** | Service provider accepting rides | Fair earnings, flexible hours, personal safety, clear expectations |
| **Admin/Ops** | Platform operator | Operational efficiency, compliance, fraud prevention, system health |
| **Regulator** | Government/legal authority | Labour law compliance, data privacy, passenger safety, licensing |
| **Payment Partner** | Financial service provider | Transaction security, settlement reliability, fraud liability |
| **Support Agent** | Customer service representative | Dispute context, user history access, quick resolution tools |

---

## 3. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│   Rider App    │    Driver App    │    Admin Dashboard    │
└───────┬────────┴────────┬─────────┴────────┬─────────────┘
        │                 │                  │
        ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY                           │
│          Auth │ Rate Limiting │ Routing                   │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌────────────┐ ┌───────────────┐
│  Core        │ │ Real-Time  │ │  Background   │
│  Services    │ │ Services   │ │  Workers      │
│  (REST API)  │ │ (WebSocket)│ │  (Queue)      │
└──────┬───────┘ └─────┬──────┘ └───────┬───────┘
       │               │               │
       ▼               ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA & INFRASTRUCTURE                    │
│  PostgreSQL │ Redis │ Message Queue │ Object Storage      │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Phase 1 — Core Platform & Identity

### 4.1 User Management

> **Case Study Context:** Uber's original monolithic architecture processed all user operations through a single service that became a bottleneck at scale. Coupled with weak account security, this led to millions of account compromises in the 2016 data breach affecting 57 million users.

#### Functional Requirements

**`[FR-1.1.1]`** The system **shall** support two distinct user types: Rider and Driver, each with role-specific data models and permissions.

**`[FR-1.1.2]`** A user **shall** be able to register using:
- Email + password
- Phone number + OTP
- Social OAuth (Google, Apple)

**`[FR-1.1.3]`** The system **shall** enforce email and phone verification before granting full account access.

**`[FR-1.1.4]`** A user **shall** be able to maintain a profile containing:
- Full name, profile photo
- Phone number (verified), email (verified)
- Preferred language, accessibility preferences
- Emergency contacts (up to 3)

**`[FR-1.1.5]`** A single phone number or email **shall** map to at most one account per role (a person may have both a Rider and Driver account).

**`[FR-1.1.6]`** The system **shall** support soft-deletion of accounts with a 30-day recovery window, after which data is purged per GDPR Article 17.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1.1.1 | As a rider, I want to create an account with my phone number so I can start requesting rides. | OTP sent within 5s, account created on verification, redirected to profile completion. |
| US-1.1.2 | As a user, I want to edit my profile so my information stays current. | Changes saved immediately, photo upload accepts JPG/PNG ≤ 5MB, phone change triggers re-verification. |
| US-1.1.3 | As a user, I want to delete my account so my data is removed from the platform. | Confirmation prompt shown, account deactivated immediately, data purged after 30 days, confirmation email sent. |
| US-1.1.4 | As an admin, I want to search for users by name, email, or phone so I can investigate issues. | Results returned within 2s, partial matches supported, results show account status. |

---

### 4.2 Authentication & Authorization

> **Case Study Context:** Uber suffered widespread account takeover (ATO) attacks where attackers used credential-stuffing to hijack accounts and take fraudulent rides. Their initial session management was stateless with long-lived tokens, making revocation nearly impossible.

#### Functional Requirements

**`[FR-1.2.1]`** The system **shall** implement JWT-based authentication with short-lived access tokens (15 min) and long-lived refresh tokens (7 days).

**`[FR-1.2.2]`** The system **shall** support multi-factor authentication (MFA) via:
- SMS OTP
- Email OTP
- Authenticator app (TOTP)

**`[FR-1.2.3]`** The system **shall** implement device fingerprinting and flag login attempts from unrecognized devices, requiring step-up authentication.

**`[FR-1.2.4]`** The system **shall** enforce role-based access control (RBAC) with the following base roles: `rider`, `driver`, `support_agent`, `ops_admin`, `super_admin`.

**`[FR-1.2.5]`** The system **shall** allow an admin to force-logout any user by invalidating all active sessions.

**`[FR-1.2.6]`** The system **shall** lock an account after 5 consecutive failed login attempts for 15 minutes, with exponential backoff on repeated lockouts.

**`[FR-1.2.7]`** The system **shall** log all authentication events (login, logout, MFA challenge, password reset) in an immutable audit trail.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1.2.1 | As a user, I want to log in with my phone and OTP so I don't need to remember a password. | OTP delivered within 5s, valid for 5 min, single-use, account locked after 5 failed attempts. |
| US-1.2.2 | As a user, I want to be notified when my account is accessed from a new device so I can detect unauthorized access. | Push notification + email sent within 30s of new-device login, includes device info and location. |
| US-1.2.3 | As an admin, I want to force-revoke all sessions for a compromised account so the attacker loses access immediately. | All tokens invalidated within 5s, user must re-authenticate on next request. |

---

### 4.3 Driver Onboarding & Verification

> **Case Study Context:** Uber's background check system faced criticism after several incidents involving drivers with criminal records who passed inadequate screening. Their single-pass verification allowed unqualified drivers onto the platform, and re-verification was manual and inconsistent.

#### Functional Requirements

**`[FR-1.3.1]`** Driver onboarding **shall** follow a state-machine workflow with the following states: `application_started → documents_submitted → under_review → approved | rejected → active | suspended → deactivated`.

**`[FR-1.3.2]`** The system **shall** require the following documents for driver verification:
- Government-issued photo ID
- Driver's license (valid, matching ID)
- Vehicle registration certificate
- Vehicle insurance certificate
- Vehicle inspection report (if applicable per jurisdiction)

**`[FR-1.3.3]`** Each document **shall** have an expiration date tracked by the system, with automated alerts at 30, 14, and 7 days before expiry.

**`[FR-1.3.4]`** The system **shall** support annual re-verification of all drivers, triggering a review workflow when a driver's anniversary date approaches.

**`[FR-1.3.5]`** The system **shall** automatically suspend a driver whose required documents have expired until updated documents are submitted and verified.

**`[FR-1.3.6]`** The system **should** integrate with third-party background check providers via a pluggable adapter interface.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1.3.1 | As a prospective driver, I want to see a clear checklist of required documents so I know what to prepare. | Checklist shows all required docs, indicates which are submitted/approved/rejected, progress percentage shown. |
| US-1.3.2 | As a driver, I want to be notified when my license is about to expire so I can update it before losing access. | Notifications at 30/14/7 days before expiry via push + email, one-tap upload link included. |
| US-1.3.3 | As an admin, I want to review submitted documents with approve/reject actions and mandatory rejection reasons. | Document viewer shows high-res image, side-by-side comparison available, rejection requires a reason from predefined list + optional free text. |

---

### 4.4 Profile & Data Privacy

> **Case Study Context:** In August 2024, Uber was fined €290 million by the Dutch DPA for transferring European driver data (including medical records and location data) to US servers without adequate GDPR safeguards. They also received a €10 million fine for failing to provide transparent data processing information.

#### Functional Requirements

**`[FR-1.4.1]`** The system **shall** obtain explicit, granular consent before collecting or processing personal data, recording the consent with timestamp, purpose, and version.

**`[FR-1.4.2]`** The system **shall** provide a data export endpoint complying with GDPR Article 20 (Right to Data Portability), returning all user data in machine-readable JSON format within 72 hours of request.

**`[FR-1.4.3]`** The system **shall** implement data residency controls, ensuring personal data is stored in the geographic region specified by the user's jurisdiction.

**`[FR-1.4.4]`** The system **shall** maintain a clear, human-readable privacy policy accessible in-app, detailing:
- What data is collected and why
- How long data is retained (specific durations, not "as long as necessary")
- Which third parties receive data and for what purpose
- How to exercise data rights (access, rectification, erasure, portability)

**`[FR-1.4.5]`** The system **shall** enforce data retention policies that automatically purge data beyond the defined retention period:
- Trip data: 3 years
- Payment data: 7 years (legal requirement)
- Location data: 1 year
- Support tickets: 2 years
- Account data: 30 days after deletion request

**`[FR-1.4.6]`** The system **shall** log all data access by internal staff in an immutable audit trail.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1.4.1 | As a user, I want to download all data the platform holds about me so I can review or transfer it. | Request acknowledged immediately, data delivered within 72 hours, includes trips, payments, communications, location history. |
| US-1.4.2 | As a user, I want to see exactly what data is collected and why, in plain language. | Privacy center accessible from profile, organized by data category, each with purpose and retention period. |

---

## 5. Phase 2 — Real-Time Location & Geospatial Services

### 5.1 GPS Tracking & Location Streaming

> **Case Study Context:** At peak, Uber processes millions of GPS updates per second from active drivers. Their initial approach of writing every update to the primary database caused catastrophic write amplification. The move to a dedicated location service with in-memory storage was critical.

#### Functional Requirements

**`[FR-2.1.1]`** Active drivers **shall** stream GPS coordinates to the platform at a configurable interval (default: every 4 seconds).

**`[FR-2.1.2]`** The system **shall** store the latest location of each active driver in a low-latency cache (Redis) for real-time queries.

**`[FR-2.1.3]`** The system **shall** persist location history to a time-series optimized store for trip reconstruction and analytics.

**`[FR-2.1.4]`** Riders with an active booking **shall** receive real-time driver location updates via WebSocket at no more than 2-second intervals.

**`[FR-2.1.5]`** The system **shall** detect and discard anomalous GPS readings (teleportation, impossible speeds > 200 km/h, stationary drift).

**`[FR-2.1.6]`** The system **shall** support graceful degradation when drivers enter low-connectivity areas, buffering locations on-device and syncing when connectivity resumes.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-2.1.1 | As a rider, I want to see my driver's location moving on the map in real-time so I know when they're arriving. | Map updates within 2s of driver movement, smooth animation between points, shows ETA countdown. |
| US-2.1.2 | As a driver, I want the app to work smoothly even with poor signal so I don't miss rides. | Locations buffered locally, synced within 10s of reconnection, no duplicate ride assignments during offline period. |

---

### 5.2 Geospatial Indexing

> **Case Study Context:** Uber's earliest matching queried "all drivers within X radius" using raw coordinate math — O(n) over all active drivers. Adopting Google's S2 geometry library (and later developing Uber's own H3 hexagonal system) reduced this to O(1) lookups by cell ID.

#### Functional Requirements

**`[FR-2.2.1]`** The system **shall** implement a hexagonal geospatial grid (H3) for partitioning geographic space into cells at configurable resolutions.

**`[FR-2.2.2]`** Each active driver's current H3 cell ID **shall** be indexed for constant-time spatial queries.

**`[FR-2.2.3]`** The system **shall** support "ring" queries — retrieving all drivers within N rings of a given cell — to power nearest-driver search.

**`[FR-2.2.4]`** The system **shall** maintain per-cell aggregate metrics:
- Active driver count
- Active rider request count
- Average wait time (rolling 10 min)
- Supply/demand ratio

**`[FR-2.2.5]`** Cell-level metrics **shall** be recalculated and published every 30 seconds.

---

### 5.3 ETA Calculation

> **Case Study Context:** Uber's early ETAs used simplistic straight-line distance divided by average speed, leading to gross inaccuracies in dense urban areas. Riders lost trust when drivers consistently arrived far later than predicted. Uber invested heavily in ML-based ETA models factoring traffic, construction, and historical trip data.

#### Functional Requirements

**`[FR-2.3.1]`** The system **shall** calculate ETA using a routing engine that accounts for:
- Real-time traffic conditions
- Road type and speed limits
- One-way streets and turn restrictions
- Historical trip duration for the same origin-destination pair

**`[FR-2.3.2]`** ETA **shall** be updated in real-time during an active trip as conditions change.

**`[FR-2.3.3]`** The system **shall** display both the "driver to pickup" ETA and the "pickup to destination" ETA separately.

**`[FR-2.3.4]`** ETA accuracy **should** be within ±20% of actual trip duration for 90% of trips.

---

### 5.4 Map & Routing Integration

> **Case Study Context:** Uber's routing algorithms initially suggested the shortest-distance path, but this often included dangerous left turns across traffic, contributing to accidents. They developed safety-weighted routing that penalizes high-risk maneuvers.

#### Functional Requirements

**`[FR-2.4.1]`** The system **shall** integrate with a map provider (e.g., Mapbox, Google Maps, OSRM) for route calculation and map rendering.

**`[FR-2.4.2]`** Route calculation **should** factor a configurable safety weight that penalizes:
- Unprotected left turns
- School zones (time-dependent)
- Roads with high accident frequency
- Roads without street lighting (nighttime trips)

**`[FR-2.4.3]`** The system **shall** support alternative route suggestions, displaying up to 3 route options with estimated time, distance, and fare.

**`[FR-2.4.4]`** The system **shall** recalculate routes in real-time when the driver deviates from the suggested path.

---

## 6. Phase 3 — Ride Matching & Dispatch Engine

### 6.1 Ride Request Lifecycle

> **Case Study Context:** Uber's early dispatch system suffered from race conditions where multiple drivers would be dispatched to the same rider, or a single driver would be matched to multiple riders simultaneously. This was caused by lack of distributed coordination in their monolithic architecture.

#### Functional Requirements

**`[FR-3.1.1]`** A ride request **shall** follow this lifecycle: `created → searching → driver_assigned → driver_en_route → arrived_at_pickup → trip_in_progress → trip_completed | cancelled`.

**`[FR-3.1.2]`** Each ride request **shall** be assigned a globally unique, idempotent request ID. Duplicate submissions with the same idempotency key within 60 seconds **shall** return the existing request.

**`[FR-3.1.3]`** The system **shall** use distributed locks to ensure a ride request can only be assigned to exactly one driver, and a driver can only accept one ride at a time.

**`[FR-3.1.4]`** A driver **shall** have a configurable response window (default: 15 seconds) to accept or decline a ride. If no response is received, the request **shall** cascade to the next best candidate.

**`[FR-3.1.5]`** The system **shall** attempt up to 5 driver matches before declaring "no drivers available" and notifying the rider.

**`[FR-3.1.6]`** A rider **shall** be able to cancel a ride request at any state before `trip_in_progress`. Cancellation after driver assignment beyond a grace period (default: 2 minutes) **shall** incur a cancellation fee.

**`[FR-3.1.7]`** A driver **shall** be able to cancel an accepted ride with a required reason. Repeated cancellations **shall** trigger a review and potential temporary suspension.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-3.1.1 | As a rider, I want to request a ride by setting my pickup and destination so a driver can be matched. | Pickup auto-detected from GPS, destination searched via autocomplete, fare estimate displayed before confirmation. |
| US-3.1.2 | As a rider, I want to cancel a ride within 2 minutes of matching without being charged. | Cancel button visible, no fee applied within grace period, refund processed immediately for post-grace cancellations if driver hasn't started. |
| US-3.1.3 | As a driver, I want to see ride requests with enough context (pickup location, estimated earnings, trip distance) to decide whether to accept. | Request card shows pickup address, trip distance, estimated fare, rider rating, expires after 15s. |

---

### 6.2 Matching Algorithm

> **Case Study Context:** Uber's initial "dispatch the closest driver" algorithm failed in dense urban areas where the geographically closest driver might be 15 minutes away due to one-way streets, bridges, or traffic. This caused poor ETAs and rider cancellations.

#### Functional Requirements

**`[FR-3.2.1]`** The matching algorithm **shall** score candidates using a weighted multi-factor model:
- **ETA to pickup** (highest weight) — road-distance, not straight-line
- **Driver rating** — historical performance
- **Vehicle type match** — rider's requested category
- **Driver acceptance rate** — reliability signal
- **Current trip direction** — can the driver's current trip end near the new pickup?

**`[FR-3.2.2]`** The weights **shall** be configurable per city to account for local conditions.

**`[FR-3.2.3]`** The system **should** implement ride chaining: if a driver is completing a trip near the new rider's pickup, they **may** be pre-matched before trip completion.

---

### 6.3 Batched Matching

> **Case Study Context:** Uber found that greedy one-at-a-time matching led to globally suboptimal assignments. By accumulating requests over short windows (2-5 seconds) and solving a bipartite matching problem, they reduced average wait times city-wide.

#### Functional Requirements

**`[FR-3.3.1]`** The system **shall** support a configurable batching window (default: 3 seconds) during which incoming ride requests are accumulated.

**`[FR-3.3.2]`** At the end of each window, the system **shall** solve the batch as an optimization problem minimizing total wait time across all pending requests.

**`[FR-3.3.3]`** Batched matching **shall** degrade gracefully to greedy matching when request volume is below a configurable threshold (e.g., < 5 pending requests).

---

### 6.4 Supply Prediction & Repositioning

> **Case Study Context:** Uber discovered that reactive surge pricing alone couldn't solve supply deserts. By predicting demand 30-60 minutes ahead and proactively suggesting repositioning to drivers, they could smooth supply before shortages occurred.

#### Functional Requirements

**`[FR-3.4.1]`** The system **shall** generate demand forecasts per H3 cell for the next 30 and 60-minute windows.

**`[FR-3.4.2]`** When a supply/demand imbalance is predicted, the system **shall** send repositioning suggestions to nearby idle drivers with estimated earning potential.

**`[FR-3.4.3]`** Repositioning **shall** be a suggestion only — drivers **shall not** be penalized for declining.

**`[FR-3.4.4]`** The system **should** consider events (concerts, sports games, flight arrivals) as demand signal inputs.

---

## 7. Phase 4 — Marketplace, Pricing & Payments

### 7.1 Dynamic Pricing Engine

> **Case Study Context:** Uber's surge pricing became a PR crisis during emergencies (e.g., 8.8x surge during Hurricane Sandy). The opacity of the algorithm — riders couldn't understand WHY they were paying more — eroded trust. Researchers from Northeastern University partially reverse-engineered the algorithm and found inconsistencies suggesting potential price discrimination.

#### Functional Requirements

**`[FR-4.1.1]`** The system **shall** calculate ride fares using: `fare = base_fare + (rate_per_km × distance) + (rate_per_min × duration) + booking_fee + tolls - promotions`.

**`[FR-4.1.2]`** Dynamic pricing **shall** be computed per H3 cell using the real-time supply/demand ratio. When demand exceeds supply by a configurable threshold, a multiplier **shall** be applied.

**`[FR-4.1.3]`** The system **shall** enforce a hard cap on surge multipliers (configurable, default: 3.0x) and automatically disable surge during declared emergencies.

**`[FR-4.1.4]`** The system **shall** show the rider a transparent pricing breakdown BEFORE ride confirmation:
- Base fare
- Distance charge
- Time charge
- Current demand multiplier with explanation (e.g., "High demand in your area")
- Estimated total (guaranteed upfront price)

**`[FR-4.1.5]`** The confirmed fare **shall** be the fare charged, regardless of actual route taken (upfront pricing). Exceptions: significant route changes requested by the rider, tolls, or wait time exceeding 3 minutes at pickup.

**`[FR-4.1.6]`** The system **shall** maintain a pricing history per cell for auditing and regression analysis.

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-4.1.1 | As a rider, I want to see exactly why my fare is higher than normal so I can decide whether to wait or pay. | Demand indicator shown (e.g., "1.5x — high demand"), tooltip explains cause, "notify me when prices drop" option available. |
| US-4.1.2 | As a rider, I want guaranteed pricing so I'm not surprised by the final fare. | Upfront price shown and guaranteed, receipt matches estimate unless rider-requested route change. |

---

### 7.2 Payment Processing

> **Case Study Context:** Uber's expansion into cash-dominant markets (India, Southeast Asia, Africa) required a radical rethinking of their originally card-only payment system. They also faced significant payment fraud through stolen cards and chargeback abuse.

#### Functional Requirements

**`[FR-4.2.1]`** The system **shall** support multiple payment methods via a pluggable provider architecture:
- Credit/debit card (Stripe, Paystack, Flutterwave)
- Mobile money (M-Pesa, MTN MoMo)
- Cash (with driver-confirmed collection)
- Wallet (pre-loaded in-app balance)

**`[FR-4.2.2]`** Payment method addition **shall** require verification:
- Cards: penny-drop or CVV verification
- Mobile money: OTP confirmation
- Wallet: identity-verified top-up only

**`[FR-4.2.3]`** The system **shall** process payments automatically at trip completion for card/wallet methods. For cash payments, the system **shall** require driver confirmation of cash received.

**`[FR-4.2.4]`** The system **shall** handle payment failures gracefully:
- Retry up to 3 times with exponential backoff
- Fallback to secondary payment method if configured
- Outstanding balance tracked and required before next ride request

**`[FR-4.2.5]`** The system **shall** support split-fare functionality where a rider can split the fare with up to 4 other registered users.

**`[FR-4.2.6]`** All payment data **shall** be PCI DSS compliant. The system **shall not** store raw card numbers — only tokenized references via the payment provider.

---

### 7.3 Driver Earnings & Payouts

> **Case Study Context:** Driver dissatisfaction with Uber centered on opaque earnings — drivers couldn't clearly see how fares were split, what commission was taken, or how incentives were calculated. This opacity fueled distrust and contributed to driver churn.

#### Functional Requirements

**`[FR-4.3.1]`** The system **shall** provide a real-time earnings dashboard showing:
- Gross fare per trip
- Platform commission (percentage and amount)
- Net earnings per trip
- Tips received
- Incentive bonuses earned
- Daily, weekly, and monthly totals

**`[FR-4.3.2]`** Commission rates **shall** be clearly disclosed to drivers at onboarding and displayed on every trip receipt.

**`[FR-4.3.3]`** The system **shall** support configurable payout schedules:
- Weekly automatic payouts (default)
- Instant cashout (with a small fee)
- Custom schedule per driver preference

**`[FR-4.3.4]`** The system **shall** provide a tax summary document for each fiscal year, including total earnings, expenses, and applicable deductions.

---

### 7.4 Promotions & Incentives

> **Case Study Context:** Uber lost millions to promotional abuse — users creating multiple accounts for referral bonuses, drivers colluding with fake riders to trigger incentive payouts. They built the Mastermind rules engine to detect and block abuse patterns in real-time.

#### Functional Requirements

**`[FR-4.4.1]`** The system **shall** support promotion types:
- Promo codes (flat discount or percentage, with usage limits)
- First-ride discounts (one per verified identity)
- Referral bonuses (both referrer and referee)
- Area-based incentives (bonus for rides in underserved areas)
- Peak-hour driver bonuses

**`[FR-4.4.2]`** The system **shall** enforce anti-abuse rules:
- One promo code per ride
- Device fingerprint + phone number uniqueness for new-user promos
- Velocity checks (max N redemptions per time window per user/device)
- GPS verification for area-based incentives

**`[FR-4.4.3]`** Promotions **shall** have configurable start/end dates, budget caps, and targeting criteria (city, user segment, ride type).

---

## 8. Phase 5 — Safety, Trust & Fraud Prevention

### 8.1 In-Ride Safety Features

> **Case Study Context:** Uber faced lawsuits and intense public criticism following safety incidents where riders had no effective way to signal distress during a ride. The "Ride Check" feature — using phone sensors to detect unusual stops, crashes, or route deviations — was developed reactively after incidents rather than proactively engineered.

#### Functional Requirements

**`[FR-5.1.1]`** The system **shall** implement real-time trip monitoring that detects anomalies:
- Unexpected stops lasting > 3 minutes (configurable)
- Route deviation > 500m from suggested route
- Excessive speed (> 130% of speed limit)
- Phone motion anomaly suggesting a crash (accelerometer spike)

**`[FR-5.1.2]`** When an anomaly is detected, the system **shall** trigger an in-app "Are you OK?" check to the rider with one-tap responses: "I'm fine" or "Send help".

**`[FR-5.1.3]`** The system **shall** provide a persistent emergency button accessible during any active ride, which:
- Calls local emergency services with trip details (vehicle, location, route)
- Notifies the rider's designated emergency contacts
- Begins background audio recording (with consent)
- Alerts the Driverless safety operations team

**`[FR-5.1.4]`** The system **shall** support trip sharing, allowing riders to share a live trip link with contacts, showing real-time location and ETA.

**`[FR-5.1.5]`** The system **should** implement a driver identity verification check at the start of each shift (selfie comparison against profile photo).

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-5.1.1 | As a rider, I want to share my trip with friends/family so they can track my safety. | One-tap share generates a link, link shows live map + vehicle info + ETA, no app required for viewer, link expires at trip end. |
| US-5.1.2 | As a rider, I want the app to detect if something goes wrong and check on me automatically. | "Are you OK?" prompt appears within 30s of anomaly detection, covers unexpected stops, route deviation, and crash detection. |

---

### 8.2 Fraud Detection System

> **Case Study Context:** Uber built RADAR (Risk Anomaly Detection And Response) to combat fraud at scale. The system uses anomaly detection, pattern mining, and graph neural networks to identify fraud rings. A key insight was that fraud is adversarial — attackers constantly evolve, so static rules fail. The human-in-the-loop approach, where ML proposes rules and analysts approve them, proved most effective.

#### Functional Requirements

**`[FR-5.2.1]`** The system **shall** implement a rules engine capable of evaluating real-time events against configurable fraud rules.

**`[FR-5.2.2]`** The rules engine **shall** support the following event types:
- Account creation
- Payment method addition
- Ride request
- Ride completion
- Promo redemption
- Rating submission
- Payout request

**`[FR-5.2.3]`** Each rule **shall** define: trigger event(s), condition expression, action (block, flag_for_review, warn, log_only), and severity level.

**`[FR-5.2.4]`** The system **shall** compute and maintain a risk score (0-100) per user, updated after every relevant event.

**`[FR-5.2.5]`** High-risk actions (score > 70) **shall** trigger step-up verification (e.g., ID re-verification, payment method re-confirmation).

**`[FR-5.2.6]`** The system **shall** detect collusion patterns:
- Same driver and rider paired repeatedly at unusual frequency
- Rides between the same origin-destination with near-zero duration
- Multiple accounts sharing device fingerprints or payment methods

**`[FR-5.2.7]`** All fraud decisions **shall** be logged with the triggering rule, input data, and outcome for auditability and appeal.

---

### 8.3 Rating & Review System

> **Case Study Context:** Uber's rating system was criticized for being one-sided (riders rated drivers but not vice versa initially), gameable (drivers requesting 5-star ratings before trip end), and lacking actionable feedback mechanics.

#### Functional Requirements

**`[FR-5.3.1]`** The system **shall** support bidirectional ratings — riders rate drivers and drivers rate riders — on a 1-5 star scale with optional tags.

**`[FR-5.3.2]`** Rating **shall** be required before the next ride can be requested/accepted (but a "skip" option with a mandatory tag selection is allowed).

**`[FR-5.3.3]`** Predefined feedback tags **shall** include:
- **Positive**: Clean vehicle, Great conversation, Smooth driving, Professional
- **Negative**: Unsafe driving, Vehicle condition, Route deviation, Rude behavior

**`[FR-5.3.4]`** The system **shall** calculate a rolling average rating weighted by recency (recent trips carry 2x weight vs. trips > 90 days old).

**`[FR-5.3.5]`** Drivers falling below a 4.2 average rating **shall** receive a warning. Below 4.0 **shall** trigger a review and potential temporary suspension with a mandatory quality improvement module.

**`[FR-5.3.6]`** The system **shall** detect rating manipulation (e.g., mutual 5-star exchanges between the same pairs) and exclude flagged ratings from averages.

---

### 8.4 Dispute Resolution

> **Case Study Context:** Uber's manual dispute resolution process couldn't scale — human agents handled every fare dispute, damage claim, and service complaint, leading to inconsistent outcomes and long wait times. Automating common dispute types reduced resolution time from days to minutes.

#### Functional Requirements

**`[FR-5.4.1]`** The system **shall** support automated resolution for common dispute categories:
- **Fare dispute**: Compare charged fare vs. calculated fare from trip data; auto-refund if discrepancy > 10%
- **Route deviation**: Compare actual route vs. optimal route; auto-adjust fare if driver deviation added > 20% distance
- **Wait time charge**: Verify pickup wait time from GPS data; auto-refund if data doesn't support the charge

**`[FR-5.4.2]`** Disputes not resolvable automatically **shall** escalate to human agents with full trip context (map, timeline, fare breakdown, ratings, chat history).

**`[FR-5.4.3]`** The system **shall** enforce SLA on dispute resolution: automated within 5 minutes, human-escalated within 24 hours.

---

## 9. Phase 6 — Scale, Compliance & Operations

### 9.1 Notification System

#### Functional Requirements

**`[FR-6.1.1]`** The system **shall** deliver notifications through configurable channels: push notification, SMS, email, WhatsApp.

**`[FR-6.1.2]`** Each notification type **shall** have a priority level (critical, high, normal, low) that determines delivery strategy:
- **Critical** (safety, emergency): all channels simultaneously
- **High** (ride updates): push + SMS fallback if push undelivered after 30s
- **Normal** (promotions, receipts): push only
- **Low** (announcements): email only

**`[FR-6.1.3]`** The system **shall** track delivery status per message per channel and support retry with exponential backoff.

---

### 9.2 Regulatory Compliance Engine

> **Case Study Context:** Uber faced legal battles in almost every market it entered — banned in multiple cities, fined billions across jurisdictions. A major architectural lesson: compliance rules (driver requirements, insurance mandates, licensing, pricing caps) vary wildly by jurisdiction and change frequently. Hardcoding them is a recipe for legal exposure.

#### Functional Requirements

**`[FR-6.2.1]`** The system **shall** implement a jurisdiction-aware configuration system where operational rules are defined per city/region:
- Required driver documents
- Minimum driver age
- Vehicle age limits
- Insurance requirements
- Maximum surge multiplier
- Mandatory wait time before cancellation fee
- Data residency rules

**`[FR-6.2.2]`** Jurisdiction rules **shall** be managed via the admin panel without code deployment.

**`[FR-6.2.3]`** The system **shall** enforce jurisdiction rules at the application layer, rejecting operations that violate local rules with clear error messages.

**`[FR-6.2.4]`** The system **shall** maintain a changelog of jurisdiction rule changes for audit purposes.

---

### 9.3 Observability & Monitoring

> **Case Study Context:** Uber experienced several high-profile outages where the lack of observability meant the team didn't know the platform was down until users flooded social media with complaints. They adopted "design for failure" — assuming every component will fail and ensuring the system degrades gracefully with full visibility.

#### Functional Requirements

**`[FR-6.3.1]`** The system **shall** implement structured logging (JSON) with correlation IDs for request tracing across services.

**`[FR-6.3.2]`** The system **shall** expose health check endpoints (`/health`, `/ready`) for every service.

**`[FR-6.3.3]`** The system **shall** implement circuit breakers on all external service calls with configurable failure thresholds and recovery timeouts.

**`[FR-6.3.4]`** Key business metrics **shall** be exposed as Prometheus-compatible metrics:
- Active riders, active drivers (per city)
- Average match time, average ETA accuracy
- Payment success/failure rates
- API latency percentiles (p50, p95, p99)

**`[FR-6.3.5]`** The system **shall** support alerting rules that trigger notifications to operations when metrics cross defined thresholds.

---

### 9.4 Admin Panel & Operations

#### Functional Requirements

**`[FR-6.4.1]`** The admin panel **shall** support role-based access:
- **City Ops**: manage drivers, handle disputes, view local metrics
- **National Ops**: manage jurisdiction rules, view aggregate metrics
- **Safety Ops**: review safety incidents, manage suspensions
- **Super Admin**: full system access, user impersonation (audited)

**`[FR-6.4.2]`** The admin panel **shall** provide real-time dashboards showing:
- Active trips, available drivers, pending requests (per city)
- Revenue, trips completed, average rating (daily/weekly/monthly)
- Safety incidents, fraud flags, dispute backlog

**`[FR-6.4.3]`** All admin actions **shall** be logged in a tamper-evident audit trail with actor, action, target, timestamp, and reason.

---

## 10. Non-Functional Requirements

### 10.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | API response time (p95) | < 200ms |
| NFR-1.2 | WebSocket message latency | < 100ms |
| NFR-1.3 | Ride matching time (median) | < 10 seconds |
| NFR-1.4 | Payment processing time | < 3 seconds |
| NFR-1.5 | Location update processing | < 50ms per update |
| NFR-1.6 | Notification delivery (critical) | < 5 seconds |

### 10.2 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | Concurrent active drivers | 100,000+ |
| NFR-2.2 | Concurrent active riders | 500,000+ |
| NFR-2.3 | Location updates per second | 25,000+ |
| NFR-2.4 | Ride requests per minute (peak) | 10,000+ |

### 10.3 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | Core service uptime | 99.95% (≤ 22 min downtime/month) |
| NFR-3.2 | Safety services uptime | 99.99% (≤ 4.3 min downtime/month) |
| NFR-3.3 | Recovery Time Objective (RTO) | < 5 minutes |
| NFR-3.4 | Recovery Point Objective (RPO) | < 1 minute |

### 10.4 Security

| ID | Requirement |
|----|-------------|
| NFR-4.1 | All data in transit **shall** use TLS 1.3 |
| NFR-4.2 | All PII at rest **shall** be encrypted with AES-256 |
| NFR-4.3 | API authentication via short-lived JWT (15 min access, 7 day refresh) |
| NFR-4.4 | Rate limiting on all public endpoints (configurable per endpoint) |
| NFR-4.5 | OWASP Top 10 protections implemented and validated |
| NFR-4.6 | Dependency vulnerability scanning in CI pipeline |

### 10.5 Privacy & Compliance

| ID | Requirement |
|----|-------------|
| NFR-5.1 | GDPR compliance for EU users (right to access, rectify, erase, port data) |
| NFR-5.2 | Data residency enforcement per jurisdiction |
| NFR-5.3 | Cookie consent and tracking opt-out |
| NFR-5.4 | Audit logs retained for 5 years |
| NFR-5.5 | PCI DSS compliance for payment data |

---

## 11. System Constraints

| Constraint | Detail |
|------------|--------|
| Backend Framework | NestJS 11 (TypeScript) |
| Primary Database | PostgreSQL 16 with PostGIS extension |
| Cache / Real-Time Store | Redis 7+ |
| Message Broker | RabbitMQ (initial), Kafka (at scale) |
| Real-Time Communication | Socket.IO over WebSocket |
| Containerization | Docker + Docker Compose (dev), Kubernetes (prod) |
| CI/CD | GitHub Actions |
| API Documentation | OpenAPI 3.0 / Swagger |
| Geospatial Library | Uber H3 |
| Map Provider | Mapbox or Google Maps Platform |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Rider** | A user who requests rides on the platform |
| **Driver** | A verified user who provides rides |
| **Trip** | A completed ride from pickup to drop-off |
| **H3 Cell** | A hexagonal geographic cell from Uber's H3 indexing system |
| **Surge / Dynamic Pricing** | Fare multiplier applied during high-demand periods |
| **ETA** | Estimated Time of Arrival |
| **Ride Check** | Automated safety monitoring during trips |
| **Upfront Pricing** | Guaranteed fare shown to rider before ride confirmation |
| **Idempotency Key** | A unique identifier preventing duplicate processing of the same request |
| **Circuit Breaker** | A fault-tolerance pattern that prevents cascading failures |
| **S2/H3** | Geospatial indexing systems (Google S2 and Uber H3) |
| **RADAR** | Risk Anomaly Detection And Response — fraud detection system |
| **Mastermind** | Rules engine for real-time fraud mitigation |
| **PCI DSS** | Payment Card Industry Data Security Standard |
| **GDPR** | General Data Protection Regulation (EU privacy law) |

---

*End of Software Requirements Document*
