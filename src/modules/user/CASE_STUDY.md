# Case Study: User Management & Platform Security

**Module:** User Management (Phase 1)  
**Uber Problems:** Monolithic architecture bottleneck • 2014 data breach (100K drivers) • 2016 data breach (57M users) • "God View" unauthorized access  
**Date:** March 6, 2026

---

## Table of Contents

1. [What Happened at Uber](#1-what-happened-at-uber)
2. [Impact](#2-impact)
3. [Root Cause Analysis](#3-root-cause-analysis)
4. [Our Approach](#4-our-approach)
5. [Why It Works](#5-why-it-works)
6. [Trade-offs](#6-trade-offs)

---

## 1. What Happened at Uber

Uber's user management system was at the center of two intertwined failures that played out over several years: an **architectural bottleneck** that couldn't scale, and a **security posture** so weak that it led to two major breaches and one of the most damaging cover-ups in tech history.

### 1.1 The Monolith That Couldn't Scale (2010–2014)

Uber's first codebase was built in 2009 by contractors using a classic **LAMP stack** (Linux, Apache, MySQL, PHP). It was a single application with a single MySQL database handling everything — user accounts, ride dispatch, payments, driver management — all wired together.

By 2010, the concurrency bugs were already fatal:

- **Multiple cars dispatched to one rider.** The PHP/MySQL combo had no mechanism for distributed locking. When two drivers hit "accept" at the same time, both were dispatched.
- **One driver matched to multiple riders.** Without atomic state transitions, a driver could appear "available" to two simultaneous ride requests.
- **One database for everything.** A spike in ride requests during Friday night surge would slow down user signups, driver onboarding, and payment processing — all competing for the same connection pool.

In late 2010, Uber rewrote the system. The dispatch service moved to **Node.js** (for non-blocking I/O), initially using MongoDB (switched to Redis in February 2012). Business logic — auth, promotions, fare calculation — went into a separate **Python service**. But user management was still monolithic. All user operations (CRUD, auth, sessions, profiles) flowed through one service backed by a single PostgreSQL instance.

By 2013, this single-database architecture was hitting hard limits:

- **Connection pool exhaustion** during peak hours
- **Write amplification** from denormalized schemas
- **No horizontal scaling** — PostgreSQL at the time had limited native sharding
- **Replication lag** making read replicas inconsistent for real-time operations

Uber developed "Schemaless" — an in-house NoSQL layer on top of MySQL — by end of 2014. But for user management, the damage was done: years of operating on an architecture where a single slow query could cascade across the entire platform.

### 1.2 The 2014 Data Breach: 100,000 Drivers Exposed

In May 2014, Uber suffered its first known data breach. The attack vector was embarrassingly simple:

1. **An Uber engineer posted an AWS access key to a public GitHub repository.** Not a private repo — *public*.
2. The key granted **full administrative access** to Uber's Amazon S3 storage.
3. An attacker found the key, accessed the S3 bucket, and downloaded an **unencrypted file** containing 100,000+ drivers' personal information.

The stolen data included:
- Full names
- Driver's license numbers
- In some cases: **unencrypted bank account and routing numbers**
- In some cases: **Social Security numbers**

Uber didn't discover the breach until September 2014, nearly 5 months later. They notified affected drivers in February 2015 — *9 months* after the breach occurred. The New York Attorney General fined Uber $20,000 for the delayed notification.

### 1.3 "God View": Uncontrolled Internal Access

In parallel with the 2014 breach, a separate scandal erupted around Uber's internal tool called **"God View."** This was an internal dashboard that allowed any Uber employee to:

- See the **real-time location** of any rider who had an active ride request
- Look up **ride history** for any user
- Access personal information without logging or oversight

God View was used casually — Uber employees were caught using it to track journalists, celebrities, and ex-partners. The FTC investigated and found that:

- Uber had **built** an automated system to monitor employee access to personal data, but **abandoned it after less than a year**
- The company "rarely monitored" God View usage
- Uber's public claims about data access controls were "false or misleading"

### 1.4 The 2016 Data Breach: 57 Million Records

Two years after the first breach, it happened again. Same attack vector, more catastrophic scale:

1. **Two attackers discovered AWS access credentials** in a *private* GitHub repository used by Uber engineers. The compromised access key had been **created in 2013 and never rotated** — 3 years of unchanged secrets.
2. Using these credentials, they accessed an **unencrypted Amazon S3 bucket** and downloaded:
   - Names, emails, and phone numbers of **~50 million riders**
   - Names and driver's license numbers of **~7 million drivers** (including ~600,000 in the US)

What happened next turned a bad breach into a criminal case:

3. Instead of disclosing the breach, Uber's Chief Security Officer **Joseph Sullivan** arranged to **pay the attackers $100,000** — disguised as a bug bounty payment.
4. The attackers were made to **sign non-disclosure agreements** and delete the stolen data.
5. The breach was **concealed for over a year**, until new CEO Dara Khosrowshahi disclosed it in November 2017.

### 1.5 Timeline of Consequences

| Date | Event |
|------|-------|
| May 2014 | First breach — 100K drivers' data stolen via public GitHub AWS key |
| Sept 2014 | Breach discovered (5 months after the fact) |
| Feb 2015 | Drivers notified (9 months after breach) |
| 2014–2015 | FTC investigates "God View" — finds misleading data protection claims |
| Oct 2016 | Second breach — 57M records stolen via private GitHub AWS key |
| Late 2016 | CSO Sullivan pays hackers $100K, conceals the breach |
| Nov 2017 | New CEO Khosrowshahi discloses the breach; Sullivan fired |
| Apr 2018 | FTC settlement over data protection failures |
| Oct 2022 | Sullivan **convicted** of obstruction of justice and misprision of a felony |
| — | Uber fined **$148 million** by US states for concealment |

---

## 2. Impact

### 2.1 Financial

| Item | Cost |
|------|------|
| $148M settlement (US states) | Data breach concealment |
| $20K fine (NY AG) | Delayed breach notification |
| $100K ransom payment | Hacker payoff (disguised as bug bounty) |
| Undisclosed | FTC compliance program costs |
| Undisclosed | Legal fees, insurance, security remediation |
| **Total estimated:** | **$150M+ direct costs** |

### 2.2 Trust & Reputation

- **57 million users** learned their data was stolen *and* covered up — a double betrayal
- **Driver trust** cratered — the people whose livelihoods depended on the platform had their Social Security numbers and bank details exposed
- **Regulatory credibility** destroyed — Uber was already under FTC oversight from the 2014 breach when the 2016 breach happened and was hidden
- **Public perception of tech industry** — the Sullivan conviction became a landmark case for CISO accountability

### 2.3 Organizational

- CSO Joseph Sullivan **criminally convicted** — first-ever criminal prosecution of a CISO for breach concealment
- Leadership turnover — Sullivan and other security leaders fired
- Mandatory independent privacy audits imposed by FTC for 20 years
- Complete security program rebuild required — essentially starting over

### 2.4 Technical

- Forced migration from PII-in-plaintext to encrypted storage
- Mandatory credential rotation policies implemented retroactively
- Access control systems rebuilt from scratch after God View scandal
- Audit logging infrastructure created after the fact — years too late

---

## 3. Root Cause Analysis

The breaches and scaling failures share common root causes. This wasn't one bad decision — it was a pattern of systematically deprioritizing security and operational discipline in favor of speed.

### 3.1 Architectural Root Causes

```
┌──────────────────────────────────────────────────────┐
│               MONOLITHIC USER SERVICE                │
│                                                      │
│  Signup ─┐                                           │
│  Login ──┤                                           │
│  Profile ┤──→ ONE Service ──→ ONE Database           │
│  Session ┤      │                    │               │
│  Admin ──┘      │                    │               │
│                 ▼                    ▼               │
│          No module isolation    No access controls   │
│          No rate limiting       PII in plaintext     │
│          No circuit breakers    No encryption at rest │
│          Shared connection pool No audit logging      │
└──────────────────────────────────────────────────────┘
```

| Root Cause | Consequence |
|------------|-------------|
| **Single service for all user operations** | Any load spike on one operation affects all others |
| **Single database, no sharding** | Connection pool exhaustion, write contention, no horizontal scaling |
| **No module boundaries** | Changes to auth logic could break profile logic; no independent deployment |
| **PHP/MySQL concurrency model** | Process-per-request, no async; race conditions in concurrent dispatch |

### 3.2 Security Root Causes

| Root Cause | Consequence |
|------------|-------------|
| **Secrets in source code** | AWS keys committed to GitHub (both public and private repos) |
| **No credential rotation** | The 2016 breach used a key created in 2013 — 3 years without rotation |
| **No encryption at rest** | Stolen S3 files were plaintext — no barrier after access was gained |
| **No access controls on S3** | A single AWS key gave admin access to *all* storage buckets |
| **No audit logging** | Couldn't detect the 2014 breach for 5 months; "God View" usage was unmonitored |
| **No data minimization** | SSNs, bank accounts, and driver's licenses stored together with no partitioning |
| **No internal access controls** | "God View" accessible to all employees without logging or justification |
| **Security culture** | Breach cover-up was approved by security leadership — systemic failure |

### 3.3 The Core Pattern

Both the architectural and security failures share one underlying cause: **user data was treated as a generic resource rather than a first-class architectural concern.** There was no dedicated domain for user identity, no access boundary between "user data" and "everything else," and no principle of least privilege applied to either internal tools or infrastructure credentials.

---

## 4. Our Approach

Driverless addresses every root cause identified above through architectural decisions made *before the first line of feature code.*

### 4.1 Modular Architecture: User Module Isolation

Instead of one monolithic user service, user management is an **isolated NestJS module** with strict boundaries:

```
src/modules/user/
├── domain/                          # Zero external dependencies
│   ├── entities/
│   │   └── user.entity.ts           # Business object with invariants enforced
│   ├── value-objects/
│   │   ├── email.vo.ts              # Self-validating, immutable
│   │   ├── phone-number.vo.ts       # E.164 format enforcement
│   │   └── hashed-password.vo.ts    # Never stores plaintext
│   ├── events/
│   │   ├── user-created.event.ts    # Published after creation
│   │   └── user-deleted.event.ts    # Triggers GDPR cleanup pipeline
│   └── enums/
│       ├── user-role.enum.ts
│       └── user-status.enum.ts
├── application/
│   ├── use-cases/
│   │   ├── create-user.use-case.ts
│   │   ├── update-profile.use-case.ts
│   │   ├── delete-user.use-case.ts  # Soft-delete + 30-day purge
│   │   └── export-user-data.use-case.ts  # GDPR Article 20
│   ├── dtos/                        # Input validation at boundary
│   └── ports/
│       └── user-repository.port.ts  # Interface — not TypeORM
├── infrastructure/
│   ├── repositories/
│   │   └── typeorm-user.repository.ts
│   ├── encryption/
│   │   └── pii-encryption.service.ts  # AES-256-GCM for PII columns
│   └── mappers/
│       └── user.mapper.ts
└── presentation/
    └── controllers/
        └── user.controller.ts
```

**Key design decisions:**

1. **The User entity enforces its own invariants.** You can't create a User with an invalid email — `Email.create()` validates and throws. Business rules don't leak into controllers.

2. **The repository is a port (interface).** The use case depends on `IUserRepository`, not `TypeOrmRepository<User>`. This means:
   - Unit tests use `InMemoryUserRepository` — no database needed
   - We can swap storage (PostgreSQL → DynamoDB) without touching business logic
   - The module is independently deployable

3. **PII is encrypted at the infrastructure layer.** The `PiiEncryptionService` encrypts email, phone, and name fields using AES-256-GCM before they hit the database. Even if an attacker gets database access, they get ciphertext.

4. **Domain events for cross-module communication.** When a user is created, a `UserCreatedEvent` is published. The notification module subscribes to send a welcome email. The user module doesn't know about or import the notification module.

### 4.2 Defense in Depth: Security Architecture

We apply security at every layer, so that **no single failure can lead to data exposure:**

```
Layer 1: SECRETS MANAGEMENT
├── Environment variables only (.env in .gitignore)
├── Pre-commit hooks scan for secrets (git-secrets / trufflehog)
├── CI pipeline blocks pushes containing credential patterns
└── Production: vault/secrets manager with automatic rotation

Layer 2: AUTHENTICATION
├── Short-lived JWT access tokens (15 min)
├── Opaque refresh tokens (7 days, stored hashed in Redis)
├── Device fingerprinting on every login
├── MFA required for new devices
├── Account lockout after 5 failed attempts (exponential backoff)
└── All auth events logged in immutable audit trail

Layer 3: AUTHORIZATION
├── RBAC guards on every endpoint (@Roles decorator)
├── Per-resource ownership checks (users can only access own data)
├── Admin actions require elevated auth (MFA step-up)
├── No "God View" — admin queries are scoped and logged
└── Principle of least privilege for all roles

Layer 4: DATA PROTECTION
├── TLS 1.3 for all data in transit
├── AES-256-GCM encryption for PII columns at rest
├── Tokenized payment data (never store raw card numbers)
├── Data residency controls (region-aware storage)
├── Retention policies with automated purge
└── Data export endpoint for GDPR portability

Layer 5: AUDIT & DETECTION
├── Every data access logged: who, what, when, why
├── Tamper-evident append-only audit log
├── Rate limiting on auth endpoints (per IP + per user)
├── Anomaly detection on login patterns
└── Alerting on bulk data access or unusual query patterns

Layer 6: INCIDENT RESPONSE
├── Breach notification process documented and tested
├── Data classification (PII, sensitive, public) drives response severity
├── No cover-ups — transparency is a policy mandate
└── Post-incident review process
```

### 4.3 Access Control: No More "God View"

Every admin endpoint in Driverless enforces:

```typescript
// Every admin action is:
// 1. Role-gated
// 2. Logged with actor, target, action, reason
// 3. Scoped to authorized data only

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {

  @Get(':id')
  @AuditLog('admin.user.view')  // Custom decorator
  async getUser(
    @Param('id') id: string,
    @CurrentUser() admin: User,  // Who is accessing
    @Body('reason') reason: string,  // Why (required)
  ) {
    // Audit trail entry created automatically:
    // { actor: admin.id, action: 'view', target: id,
    //   reason, timestamp, ip, device }
    return this.findUserUseCase.execute(id);
  }

  @Post(':id/suspend')
  @AuditLog('admin.user.suspend')
  @RequireMfa()  // Step-up authentication for destructive actions
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,  // Requires reason from dropdown + free text
    @CurrentUser() admin: User,
  ) {
    return this.suspendUserUseCase.execute(id, dto, admin.id);
  }
}
```

**No employee can:**
- View user data without a logged reason
- Access data outside their jurisdiction/city scope
- Perform destructive actions without MFA
- Bulk-export user data without a separate approval workflow
- Access the system without their activity being permanently recorded

### 4.4 Credential Safety: Never Commit Secrets

```
Mitigation Layer            What It Does                          What It Prevents
─────────────────────────── ──────────────────────────────────── ─────────────────────────
.gitignore                  .env, *.pem, *.key excluded          Accidental commit
.pre-commit hooks           trufflehog scans every commit        Intentional/careless commit
CI secret scanning          GitHub secret scanning + custom      Merged PRs with secrets
                            patterns in CI pipeline
Env-based config            ConfigModule loads from process.env  Secrets in code
Short-lived credentials     Vault/secrets manager with TTL       Stale, long-lived keys
Key rotation policy         Automated 90-day rotation            Compromised keys active forever
Least-privilege IAM         Each service gets only the           One key compromise ≠ total access
                            permissions it needs
```

### 4.5 Encryption at Rest: PII as Ciphertext

Unlike Uber's plaintext S3 buckets, Driverless encrypts PII at the application layer:

```typescript
// Infrastructure service — applied transparently by the repository
@Injectable()
export class PiiEncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    @Inject(CONFIG) private config: SecurityConfig,
  ) {}

  encrypt(plaintext: string): EncryptedField {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.config.encryptionKey,  // From env/vault, NEVER hardcoded
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // Return IV + tag + ciphertext as a single encoded string
    return { iv, tag, data: encrypted };
  }

  decrypt(field: EncryptedField): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.config.encryptionKey,
      field.iv,
    );
    decipher.setAuthTag(field.tag);
    return decipher.update(field.data) + decipher.final('utf8');
  }
}
```

What this means in practice:

```
What Uber stored:          What Driverless stores:
───────────────────────    ──────────────────────────────────────────
john@example.com           a7f3e2...b8c4d1 (AES-256-GCM ciphertext)
+1-555-123-4567            c9d1f4...e6a2b3 (AES-256-GCM ciphertext)
John Smith                 f2b8a1...d7c3e9 (AES-256-GCM ciphertext)
DL-12345678                e4c6d2...a9f1b7 (AES-256-GCM ciphertext)
```

Even if an attacker gains database access or intercepts a backup, they get ciphertext. Without the encryption key (stored in a secrets manager, rotated quarterly), the data is useless.

---

## 5. Why It Works

### 5.1 Module Isolation Prevents Monolith Bottlenecks

| Uber Problem | Driverless Mitigation | Why It Works |
|-------------|----------------------|-------------|
| One service for all user ops | Isolated NestJS module with own boundary | Failed auth requests don't affect profile queries |
| Single database, all tables | Module owns its tables; cross-module via events | We can shard or extract the user module independently |
| No horizontal scaling | Port-based architecture; swap in-process calls for HTTP/gRPC | Scaling path from monolith → service is a config change, not a rewrite |
| Race conditions on concurrent writes | Domain entities with invariant enforcement; repository-level optimistic locking | State transitions are atomic at the domain level |

**Industry reference:** This approach aligns with what Uber eventually reached — their "Domain-Oriented Microservice Architecture" (DOMA), announced in 2020. The key insight is that you don't need microservices from day one — you need *module boundaries* that make microservice extraction trivial when the time comes.

### 5.2 Defense in Depth Prevents Single-Point Compromise

The security architecture works because **no single layer's failure exposes data:**

```
If an attacker...                  They still can't...           Because...
────────────────────────────────── ───────────────────────────── ───────────────────────────
Finds a credential in source code  Access production systems     Secrets aren't in code
Compromises a developer's machine  Access prod without MFA       Step-up auth on all envs
Gets database access               Read PII                      PII is AES-256 encrypted
Gets the encryption key            Access all data               Keys are scoped per module
Gets admin portal access           Bulk export without detection Audit logs + anomaly alerts
Exfiltrates data successfully      Cover it up                   Immutable audit trail + policy
```

This is the principle of **defense in depth** — a military strategy adapted for information security. No single wall protects the castle; multiple independent layers mean an attacker must breach *all* of them.

### 5.3 Audit Logging Solves Detection, Deterrence, and Accountability

Uber's 2014 breach went undetected for **5 months** because there was no access logging on S3 buckets. God View usage was unmonitored for **years.** The 2016 breach was concealed for **over a year** because there was no institutional mechanism requiring disclosure.

Our audit system addresses all three gaps:

1. **Detection:** Every data access is logged in real-time. Anomaly detection flags unusual patterns (e.g., an admin viewing 500 user profiles in an hour).

2. **Deterrence:** Employees know their access is logged and audited. The audit trail is append-only and tamper-evident — you can't delete your tracks.

3. **Accountability:** The audit log provides the forensic evidence needed for incident response, regulatory compliance, and (if necessary) legal proceedings.

---

## 6. Trade-offs

Every engineering decision has costs. Here's what we're consciously trading away:

### 6.1 Performance Cost of Encryption

| Trade-off | Cost | Mitigation |
|-----------|------|-----------|
| PII encryption/decryption adds latency | ~1-2ms per field per operation | Acceptable for user CRUD (not on hot path); searchable via deterministic hash index |
| Can't do SQL `LIKE` queries on encrypted columns | Need alternative search strategy | Maintain a hashed search index for email/phone lookups; full-text search via separate index |
| Key rotation requires re-encryption of all rows | Batch job, can't rotate instantly | Enveloped encryption: data encrypted with DEK, DEK encrypted with KEK. Rotate KEK, re-encrypt only DEKs |

### 6.2 Complexity Cost of Module Isolation

| Trade-off | Cost | Mitigation |
|-----------|------|-----------|
| Can't do cross-module JOINs | Joins require event-sourced projections or API calls | In practice, 90% of operations are within-module. Cross-module reads are eventually consistent, which is acceptable for non-critical paths |
| Domain events add eventual consistency | Brief window where modules are out of sync | Critical paths (ride dispatch, payment) use synchronous calls; non-critical paths (notifications, analytics) use async events |
| More code than a simple CRUD | Boilerplate for ports, adapters, mappers | Generators/schematics reduce boilerplate; the investment pays off at >3 modules |

### 6.3 Operational Cost of Audit Logging

| Trade-off | Cost | Mitigation |
|-----------|------|-----------|
| Storage growth from comprehensive logging | Significant over time | Log rotation: detailed logs retained 90 days, aggregated summaries retained 5 years. Cold storage for archived logs |
| Audit logging adds latency to every admin action | ~5-10ms per request | Async logging via message queue; write-behind pattern so the audit log write never blocks the primary operation |

### 6.4 What We Consciously Don't Do

| Decision | Rationale |
|----------|-----------|
| **No premature microservices** | Uber's jump from 1 to 2,000+ services created more problems than it solved. We extract only when module-specific metrics demand it |
| **No client-side encryption** | Adds complexity to search, reporting, and debugging. Server-side encryption with proper key management achieves the same security goal with less complexity |
| **No blockchain-based audit logs** | Tamper-evident append-only logs (with HMAC chains) provide the same guarantee as blockchain without the operational overhead |

---

## References

1. Huntress. *Uber Breach Exposed Data of 57 Million Users and Drivers.* 2017.
2. Securonix. *Uber Data Breach Analysis.* 2017.
3. FTC. *Uber Settles FTC Allegations.* 2017.
4. Forbes. *Uber's Series of Data Breaches.* 2022.
5. The Guardian. *Uber Concealed Massive Hack that Exposed 57 Million Users' Data.* 2017.
6. DataGuard. *Uber Data Breach Breakdown.* 2023.
7. BreachesCloud. *Uber 2014 and 2016 Cloud Breach Case Studies.* 2023.
8. Uber Engineering Blog. *Domain-Oriented Microservice Architecture.* 2020.
9. GitConnected. *Uber's Architecture Timeline: From 0 to Letting Drivers Go.* 2024.
10. HighScalability. *How Uber Scales Their Real-Time Market Platform.* 2015.

---

*End of Case Study*
