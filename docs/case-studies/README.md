# Driverless — Case Studies Index

This directory contains case study documents for each module. Every case study follows the same structure:

1. **What Happened at Uber** — the specific problem, incident, or design failure
2. **Impact** — user trust, revenue, legal consequences  
3. **Root Cause** — technical or organizational
4. **Our Approach** — how Driverless solves it differently
5. **Why It Works** — references to research, industry best practices
6. **Trade-offs** — what we sacrifice and why it's acceptable

---

## Phase 1 — Core Platform & Identity

| Module | Case Study | Status |
|--------|-----------|--------|
| User Management | Monolith scaling pain & the 2016 data breach | ⬜ Planned |
| Authentication | Account takeover attacks | ⬜ Planned |
| Driver Onboarding | Background check failures & impersonation | ⬜ Planned |
| Profile & Privacy | GDPR violations (€290M + €10M fines) | ⬜ Planned |

## Phase 2 — Real-Time & Geospatial

| Module | Case Study | Status |
|--------|-----------|--------|
| GPS Tracking | Write amplification at scale | ⬜ Planned |
| Geospatial Indexing | O(n) nearest-driver to O(1) cell lookup | ⬜ Planned |
| ETA Calculation | Straight-line distance inaccuracy | ⬜ Planned |
| Routing | Unsafe route suggestions | ⬜ Planned |

## Phase 3 — Matching & Dispatch

| Module | Case Study | Status |
|--------|-----------|--------|
| Ride Lifecycle | Double-dispatch race conditions | ⬜ Planned |
| Matching Algorithm | "Closest driver" failure modes | ⬜ Planned |
| Batched Matching | Greedy vs global optimization | ⬜ Planned |
| Supply Prediction | Reactive surge vs proactive repositioning | ⬜ Planned |

## Phase 4 — Pricing & Payments

| Module | Case Study | Status |
|--------|-----------|--------|
| Dynamic Pricing | Surge pricing opacity & Hurricane Sandy | ⬜ Planned |
| Fare Estimation | Unpredictable final fares | ⬜ Planned |
| Payments | Cash markets & payment fraud | ⬜ Planned |
| Driver Earnings | Opaque commission & driver churn | ⬜ Planned |
| Promotions | Mastermind rules engine & abuse rings | ⬜ Planned |

## Phase 5 — Safety & Fraud

| Module | Case Study | Status |
|--------|-----------|--------|
| In-Ride Safety | Reactive vs proactive safety engineering | ⬜ Planned |
| Identity Verification | Driver impersonation incidents | ⬜ Planned |
| Fraud Detection (RADAR) | Adversarial fraud & ML-powered detection | ⬜ Planned |
| Ratings | Rating manipulation & accountability | ⬜ Planned |
| Disputes | Manual resolution doesn't scale | ⬜ Planned |

## Phase 6 — Scale & Compliance

| Module | Case Study | Status |
|--------|-----------|--------|
| Notifications | Multi-channel delivery reliability | ⬜ Planned |
| Compliance Engine | Legal battles across jurisdictions | ⬜ Planned |
| Observability | Silent outages & "design for failure" | ⬜ Planned |
