# ticketing-system

> Multi-tenant sports ticketing, box-office, and QR admission platform coordinated with Ruflo.

## Project Mission

Build a reliable prototype for small and medium-sized sports clubs, initially targeting Slovenian football clubs.

The system must support the complete ticket lifecycle:

```text
Club creates event
      ↓
Customer buys ticket
      ↓
Payment confirmed
      ↓
Ticket issued
      ↓
QR presented at venue
      ↓
QR validated
      ↓
Ticket atomically redeemed
      ↓
Attendance + audit data recorded
```

The same backend must support both:

* online ticket sales;
* physical box-office/POS sales.

Gate scanners must validate tickets issued through either channel.

The prototype should be simple enough to iterate quickly while establishing architectural boundaries that can later support multiple clubs.

---

## Product Priorities

Prioritize, in this order:

1. Payment and ticket issuance correctness.
2. QR admission reliability.
3. Inventory/capacity correctness.
4. Simple customer checkout.
5. Fast match-day scanning.
6. Simple box-office workflow.
7. Club administration.
8. Auditability and reporting.
9. Multi-club architecture.
10. Extensibility for season tickets and memberships.

Do not optimize for speculative enterprise requirements before the core ticket flow works end-to-end.

---

# Tech Stack

Primary stack:

* TypeScript
* Node.js
* PostgreSQL
* React / Next.js where appropriate
* Zod or equivalent runtime validation
* Vitest/Jest for unit/integration tests
* Playwright for critical end-to-end flows

Prefer boring, well-supported technology over novel infrastructure.

Do not introduce microservices for the prototype.

Start as a modular monolith with explicit domain boundaries.

---

# Architecture

Use Domain-Driven Design with bounded contexts.

Recommended initial contexts:

```text
src/
├── identity/
├── clubs/
├── events/
├── inventory/
├── orders/
├── payments/
├── ticketing/
├── admissions/
├── box-office/
├── reporting/
└── shared/
```

## Bounded Context Responsibilities

### clubs

Owns:

* club/tenant identity;
* club configuration;
* branding;
* venues;
* club-level settings.

### identity

Owns:

* authentication;
* staff accounts;
* roles;
* permissions;
* sessions.

Roles may initially include:

* platform_admin
* club_admin
* box_office
* gate_staff
* viewer

Never rely on frontend authorization alone.

### events

Owns:

* matches/events;
* event status;
* sales windows;
* venue association;
* scheduled date/time.

### inventory

Owns:

* ticket types;
* capacities;
* availability;
* reservations/holds;
* sold quantities.

Inventory changes must be concurrency-safe.

Never calculate authoritative availability only in application memory.

### orders

Owns:

* carts/orders;
* line items;
* totals;
* customer information;
* order lifecycle.

Suggested lifecycle:

```text
draft
→ pending_payment
→ paid
→ fulfilled
```

Additional terminal states may include:

```text
cancelled
refunded
expired
```

Order transitions must be explicit.

### payments

Owns:

* payment-provider integration;
* payment intents/sessions;
* webhook handling;
* reconciliation state;
* refunds.

The payment provider is authoritative for payment completion.

Never issue a paid ticket merely because a browser redirects to a success URL.

### ticketing

Owns:

* ticket creation;
* ticket identity;
* ticket entitlement;
* QR/token generation;
* cancellation;
* delivery metadata.

QR credentials must use cryptographically secure randomness or a properly signed credential.

Never encode guessable sequential ticket IDs as the admission credential.

### admissions

Owns:

* ticket validation;
* ticket redemption;
* scanner/gate identity;
* scan attempts;
* admission audit log.

The critical operation:

```text
validate + redeem
```

must be atomic.

Two scanners racing to redeem one ticket must never both receive a successful admission result.

### box-office

Owns:

* staff ticket sales;
* cash/card payment recording;
* walk-up ticket issuance;
* optional sell-and-admit workflow;
* receipt/ticket printing interface.

Box-office tickets and online tickets MUST ultimately use the same ticket model.

Do not create a separate admission system for physical sales.

### reporting

Owns read models for:

* tickets sold;
* gross sales;
* payment method;
* sales channel;
* attendance;
* scans;
* event summaries.

Reporting must not become authoritative business state.

---

# Core Domain Invariants

These rules override convenience.

## Ticket Issuance

A ticket requiring payment MUST NOT become valid until authoritative payment confirmation has been processed.

Complimentary tickets require an explicit authorized issuance flow.

## Inventory

The system MUST prevent overselling.

Capacity reservation and ticket issuance must remain correct under concurrent requests.

## Payment Webhooks

Webhook processing MUST be:

* signature verified;
* idempotent;
* replay-safe;
* persisted;
* observable.

Duplicate payment events must not create duplicate tickets.

## QR Credentials

QR admission credentials MUST:

* be unguessable or cryptographically signed;
* not expose sensitive customer information;
* map reliably to one entitlement;
* support cancellation/revocation.

## Ticket Redemption

Redemption MUST be concurrency-safe.

Conceptually:

```text
unused → redeemed
```

is a one-way atomic transition for a standard single-entry ticket.

## Audit Trail

Important business actions should be attributable.

Record where appropriate:

* actor;
* timestamp;
* club;
* event;
* action;
* result;
* scanner/gate;
* relevant entity ID.

Never silently overwrite admission history.

## Tenant Isolation

Every club-owned entity must belong to a tenant/club.

A user authenticated for Club A must never be able to access Club B through guessed IDs or manipulated API requests.

Tenant isolation must be tested at API/repository boundaries.

---

# Prototype Scope

## MVP — Build First

The first usable vertical slice should support:

1. Club admin creates a match.
2. Admin defines ticket category and capacity.
3. Customer opens ticket shop.
4. Customer chooses tickets.
5. Customer completes test payment.
6. Backend processes authoritative payment confirmation.
7. Ticket is generated.
8. Customer sees QR ticket.
9. Scanner opens on a phone.
10. Scanner reads QR.
11. Backend validates and redeems ticket.
12. Second scan returns `already_used`.
13. Admin can see sales and attendance.

After this vertical slice works, add box-office sales.

## MVP Box Office

Support:

* event selection;
* ticket type;
* quantity;
* cash/card payment method;
* sale completion;
* ticket printing/display;
* optional immediate admission.

Both online and box-office sales use shared:

* inventory;
* order;
* ticket;
* admission infrastructure.

## Explicitly Defer Unless Requested

Do NOT prematurely implement:

* native iOS app;
* native Android app;
* microservices;
* Kubernetes;
* Kafka;
* complex event sourcing;
* blockchain;
* secondary resale marketplace;
* dynamic pricing;
* complex reserved seating;
* turnstile hardware integrations;
* full offline synchronization;
* loyalty systems;
* merchandise;
* accounting integrations.

Design boundaries so these can be introduced later without implementing them now.

---

# Scanner Design

For the prototype, prefer a mobile-friendly PWA/web scanner.

The scanner UI should optimize for match-day throughput.

Normal flow:

```text
LOGIN
  ↓
SELECT EVENT
  ↓
SELECT GATE
  ↓
OPEN CAMERA
  ↓
SCAN CONTINUOUSLY
```

Responses should be immediately recognizable.

### Valid

```text
VALID
Adult
Entry allowed
```

### Used

```text
ALREADY USED
Previously admitted at 18:43
```

### Invalid

```text
INVALID TICKET
```

### Cancelled

```text
CANCELLED
Entry denied
```

Avoid requiring unnecessary interaction between scans.

Offline admission is valuable but is not required for the first vertical slice.

Document assumptions that would affect a later offline mode.

---

# Payment Safety

Minimize PCI scope.

Prefer hosted checkout or payment-provider UI components where card details are handled directly by the provider.

Never:

* store raw card numbers;
* store CVV;
* log payment credentials;
* trust client-side payment status;
* invent custom cryptography.

Use provider-issued IDs internally.

Webhook handlers must verify authenticity according to provider documentation.

Do not couple core ticketing logic directly to one payment provider.

Define a payment provider interface where practical.

Example:

```ts
interface PaymentProvider {
  createCheckout(...): Promise<CheckoutResult>;
  verifyWebhook(...): Promise<VerifiedPaymentEvent>;
  refund(...): Promise<RefundResult>;
}
```

Avoid over-abstracting beyond known requirements.

---

# Multi-Tenant Design

Assume from the beginning that multiple clubs may use the platform.

Conceptually:

```text
Platform
   │
   ├── ND Beltinci
   │     ├── events
   │     ├── staff
   │     └── tickets
   │
   ├── ND Ilirija
   │     ├── events
   │     ├── staff
   │     └── tickets
   │
   └── Club N
```

Do not build separate deployments or duplicated schemas for every club unless a later requirement justifies it.

Prefer shared application infrastructure with explicit tenant boundaries.

---

# Data Model Guidelines

Likely core entities:

```text
Club
User
Venue
Event
TicketType
InventoryAllocation
Order
OrderItem
Payment
Ticket
Admission
ScannerDevice
AuditEvent
```

Potential later entities:

```text
SeasonPass
Membership
Seat
Section
Promotion
Voucher
Customer
```

Do not introduce later entities merely because they may someday exist.

---

# API Conventions

Use typed request and response contracts.

Validate every external boundary.

Recommended patterns:

```text
POST   /api/events
GET    /api/events/:id
POST   /api/events/:id/orders

POST   /api/payments/checkout
POST   /api/webhooks/payments

GET    /api/tickets/:id
POST   /api/admissions/redeem

POST   /api/box-office/orders
GET    /api/reports/events/:id
```

Exact URLs may evolve.

Domain semantics matter more than REST purity.

Use stable machine-readable error codes where the client needs deterministic behavior.

Example admission response:

```json
{
  "result": "already_used",
  "ticketType": "adult",
  "previousAdmissionAt": "2026-09-12T16:43:21Z"
}
```

Never require clients to parse human-readable strings to determine business state.

---

# Agent Coordination

Ruflo is the coordination layer.

Codex/coding workers perform implementation, tests, commands, and file changes.

A Ruflo coordination command is not implementation.

**Never stop after coordination. Continue into inspection, coding, testing, or validation.**

---

# Swarm Configuration

Default:

| Setting    | Value           | Purpose                                             |
| ---------- | --------------- | --------------------------------------------------- |
| Topology   | `hierarchical`  | Strong coordinator prevents architecture drift      |
| Strategy   | `specialized`   | Explicit domain ownership                           |
| Max Agents | `8`             | Enough specialization without coordination overload |
| Consensus  | leader-oriented | Architecture/integration owner resolves conflicts   |

Do not spawn eight agents merely because eight are allowed.

Use the smallest capable swarm.

### Typical sizes

```text
Small change       1 agent
Focused feature    2-3 agents
Vertical slice     4-5 agents
Cross-domain work  5-7 agents
Security review    + security specialist
```

---

# Preferred Agent Roles

Ruflo's live registry is authoritative for exact available agent names.

Use `guidance_brain`, routing, MCP discovery, or Ruflo CLI discovery when exact registered names differ.

Map available agents to these project responsibilities.

## 1. product-researcher

Typical Ruflo mapping:

```text
researcher / requirements specialist
```

Owns:

* requirements discovery;
* workflow analysis;
* edge-case discovery;
* competitor/domain research when requested;
* acceptance criteria.

For this system, think in terms of:

```text
supporter
box-office operator
gate steward
club administrator
finance/admin staff
```

Do not invent features without connecting them to a user workflow.

---

## 2. domain-architect

Typical mapping:

```text
architect
```

Owns:

* bounded contexts;
* domain model;
* dependency direction;
* API boundaries;
* ADRs;
* data ownership;
* concurrency strategy.

Must actively prevent:

* giant service classes;
* payment logic leaking everywhere;
* admission logic depending on UI state;
* cross-tenant access;
* premature distributed architecture.

---

## 3. commerce-engineer

Typical mapping:

```text
coder / backend specialist
```

Primary ownership:

```text
inventory/
orders/
payments/
box-office/
```

Special attention to:

* transaction boundaries;
* idempotency;
* inventory race conditions;
* payment webhooks;
* refunds;
* reconciliation.

This agent must never weaken financial invariants to make a test pass.

---

## 4. ticketing-admission-engineer

Typical mapping:

```text
coder / backend specialist
```

Primary ownership:

```text
ticketing/
admissions/
```

Special attention to:

* secure ticket tokens;
* QR representation;
* cancellation;
* scanner validation;
* atomic redemption;
* duplicate scans;
* audit events.

Treat entry authorization as a security-sensitive state transition.

---

## 5. frontend-product-engineer

Typical mapping:

```text
coder / frontend specialist
```

Owns:

* public ticket store;
* checkout UX;
* admin UI;
* box-office UI;
* scanner PWA.

Optimize separately for each surface.

### Customer shop

Optimize for purchase completion.

### Box office

Optimize for speed and low training requirements.

### Scanner

Optimize for:

* large feedback states;
* minimal taps;
* low latency;
* continuous scanning;
* operation on ordinary smartphones.

### Admin

Optimize for clarity, not visual novelty.

---

## 6. test-engineer

Typical mapping:

```text
tester
```

Owns the testing strategy, not just happy-path tests.

High-value test categories:

### Commerce

* two buyers competing for last ticket;
* payment webhook delivered twice;
* webhook arrives before browser redirect;
* failed payment;
* expired order;
* refund/cancellation.

### Admission

* valid first scan;
* duplicate scan;
* two concurrent scanner requests;
* cancelled ticket;
* ticket for different event;
* malformed QR;
* unknown credential.

### Tenant isolation

* Club A user requests Club B event;
* Club A scanner attempts Club B admission;
* guessed IDs;
* reports scoped to correct club.

### Box office

* cash sale;
* card sale;
* capacity exhausted;
* sell-and-admit;
* printer failure does not duplicate order.

Prefer deterministic integration tests around critical invariants.

---

## 7. security-reviewer

Typical mapping:

```text
reviewer
security-auditor
security-architect
```

Invoke for changes affecting:

* authentication;
* authorization;
* payments;
* webhooks;
* QR credentials;
* ticket redemption;
* tenant boundaries;
* customer data;
* dependencies.

Review against:

* OWASP-style web risks;
* broken access control;
* IDOR;
* injection;
* XSS;
* CSRF where relevant;
* webhook forgery;
* replay attacks;
* race conditions;
* secret leakage;
* insecure randomness;
* dependency vulnerabilities.

Security review should include abuse cases, not only static scanning.

---

## 8. integration-lead

Typical mapping:

```text
reviewer / architect / coordinator
```

Use when multiple writing agents contribute.

Owns:

* integration branch/worktree;
* shared manifests;
* migrations;
* lockfiles;
* contract reconciliation;
* final integration tests.

The integration lead does not blindly merge competing implementations.

Resolve domain ownership conflicts explicitly.

---

# Recommended Swarm Patterns

## New End-to-End Feature

Example:

```text
"Implement ticket cancellation"
```

Recommended:

```text
architect
    │
    ├── commerce/ticketing engineer
    ├── frontend engineer
    └── tester
             ↓
         reviewer
```

---

## Payment Feature

Recommended:

```text
domain-architect
commerce-engineer
test-engineer
security-reviewer
```

Payment changes always require failure-path testing.

---

## Admission / QR Feature

Recommended:

```text
domain-architect
ticketing-admission-engineer
test-engineer
security-reviewer
```

Explicitly test concurrency.

---

## UI-Only Prototype

Recommended:

```text
product-researcher
frontend-product-engineer
tester
```

Do not spawn backend/security agents for purely visual mockups unless the mockup establishes security-sensitive behavior.

---

## Cross-System Vertical Slice

Recommended:

```text
domain-architect
commerce-engineer
ticketing-admission-engineer
frontend-product-engineer
test-engineer
integration-lead
```

Add `security-reviewer` when real auth/payments/admission credentials are involved.

---

# When To Use Swarms

Invoke a swarm when work involves:

* a new vertical slice;
* 3+ domain modules;
* payment behavior;
* admission behavior;
* tenant isolation;
* cross-module refactoring;
* database migrations plus application changes;
* significant API contract changes;
* performance/concurrency investigation.

Avoid a swarm for:

* typo fixes;
* formatting;
* simple documentation;
* isolated CSS;
* trivial configuration;
* obvious one-file corrections.

Coordination overhead should never exceed implementation complexity.

---

# Skills

Ruflo's live skill/plugin registry is authoritative.

Prefer these capabilities where available.

| Skill                  | Use                                              |
| ---------------------- | ------------------------------------------------ |
| `$swarm-orchestration` | Coordinate multi-domain implementation           |
| `$memory-management`   | Recall/store proven project patterns             |
| `$sparc-methodology`   | Structure significant feature development        |
| `$security-audit`      | Security-sensitive changes and dependency review |

Also discover specialized installed Ruflo skills rather than assuming they exist.

Useful categories for this project include:

* security scanning;
* dependency checking;
* performance analysis;
* agent routing;
* test generation;
* architecture review;
* database review;
* frontend review.

Never install or invoke a skill just because its name appears useful.

Verify it through the current Ruflo registry first.

---

# Skill Selection Rules

## `$sparc-methodology`

Use for:

* new bounded contexts;
* major features;
* uncertain requirements;
* architectural changes.

Avoid for tiny implementation tasks.

## `$security-audit`

Use automatically before considering payment, authentication, ticket credential, admission, or tenant-isolation work complete.

Security tooling supplements code review; it does not replace reasoning about business abuse cases.

## `$memory-management`

Store durable patterns, such as:

```text
payment webhook idempotency strategy
tenant scoping convention
ticket redemption transaction pattern
API error conventions
testing factories
ADR decisions
```

Do NOT use memory as authoritative truth when repository code or an ADR disagrees.

Repository state wins.

## `$swarm-orchestration`

Use when independent ownership can genuinely run concurrently.

Do not parallelize tightly coupled edits to the same files.

---

# Ruflo Workflow

When Ruflo-specific coordination can improve the task, use:

```text
guidance_brain({ mode: "recommend", task: "..." })
```

when available.

Its live registry is authoritative for:

* agent presence;
* skills;
* tools;
* routing.

Registration does not by itself prove health or authorization.

Then follow:

### 1. Recall

Search memory and ADRs for applicable decisions.

### 2. Inspect

Read actual:

* source;
* tests;
* package configuration;
* schema/migrations;
* runtime assumptions.

Never plan solely from memory.

### 3. Route

Choose the smallest capable set of agents.

### 4. Plan

State:

* acceptance criteria;
* affected contexts;
* invariants;
* ownership;
* validation strategy.

### 5. Execute

Workers implement in isolated scopes.

Ruflo records coordination but does not replace coding.

### 6. Test

Run:

* focused tests;
* integration tests;
* failure-path tests;
* concurrency tests where relevant.

### 7. Validate

Check:

* TypeScript;
* lint;
* build;
* migrations;
* security;
* tenant isolation;
* public contracts.

### 8. Review

An agent that authored security-sensitive code should not be the only agent reviewing it.

### 9. Integrate

Integration owner reconciles concurrent changes.

### 10. Receipt

Record what was changed and the evidence supporting completion.

---

# Agent Ownership Rules

Prefer one primary writer per bounded context during a task.

Example:

```text
commerce-engineer
  owns:
    src/orders/**
    src/payments/**
    src/inventory/**

admission-engineer
  owns:
    src/ticketing/**
    src/admissions/**

frontend-engineer
  owns:
    src/app/**
    src/components/**

test-engineer
  owns:
    tests/**
```

Ownership may change between tasks.

Avoid simultaneous edits to the same files.

Only the integration owner changes shared files such as:

* root package manifests;
* lockfiles;
* central migration registries;
* shared configuration;

when parallel work is underway.

---

# Execution Invariants

* Never allow two writing agents in one worktree.
* Read-only agents may share a checkout.
* Writers require isolated ownership.
* Do not auto-commit, push, merge, deploy, release, or delete worktrees unless explicitly authorized.
* Coordination commands never count as task completion.
* Failed dependencies should cancel dependent work rather than encouraging agents to improvise around them.
* Repository instructions override remembered Ruflo patterns.
* Exact source/build state matters when producing completion evidence.

---

# Development Method

Prefer vertical slices over layer-by-layer construction.

Bad:

```text
build every database table
→ build every repository
→ build every API
→ eventually make UI
```

Preferred:

```text
Create event
→ sell one ticket
→ process payment
→ issue QR
→ scan QR
→ redeem QR
```

Then harden and expand that flow.

Working end-to-end behavior provides better architectural feedback than speculative completeness.

---

# Testing Philosophy

TDD is encouraged for domain behavior.

Do not mock away the behavior being tested.

Use unit tests for:

* domain state transitions;
* calculations;
* policies.

Use integration tests for:

* database constraints;
* transactions;
* concurrency;
* repositories;
* webhook idempotency;
* ticket redemption.

Use E2E tests for critical user journeys.

Primary E2E journey:

```text
admin creates match
→ supporter purchases
→ ticket generated
→ scanner admits supporter
→ duplicate scan rejected
```

Secondary:

```text
staff makes box-office sale
→ ticket generated
→ same scanner admits supporter
```

---

# Critical Concurrency Tests

Concurrency bugs are correctness bugs.

The test suite should eventually prove:

### Last Ticket

```text
remaining inventory = 1

buyer A ─┐
         ├── concurrent checkout
buyer B ─┘

result:
exactly one can acquire final capacity
```

### Duplicate Admission

```text
scanner A ─┐
           ├── same ticket concurrently
scanner B ─┘

result:
exactly one successful redemption
```

### Duplicate Webhook

```text
payment.succeeded
payment.succeeded
payment.succeeded

result:
one payment transition
one set of tickets
```

---

# Database Rules

Use transactions where business state spans multiple writes.

Use database constraints to protect invariants where appropriate.

Prefer:

* foreign keys;
* unique constraints;
* explicit indexes;
* transactional updates;
* optimistic/pessimistic locking only where justified.

Do not rely solely on:

```ts
if (!exists) {
  insert();
}
```

for uniqueness under concurrency.

Every tenant-sensitive query must be scoped correctly.

---

# Security Rules

Never:

* commit `.env` files;
* commit credentials;
* hardcode secrets;
* store raw payment-card credentials;
* log authentication tokens;
* log complete admission credentials unnecessarily;
* trust user-supplied club IDs without authorization;
* generate ticket credentials using `Math.random()`;
* expose sequential IDs as sufficient admission authorization;
* construct SQL using string concatenation.

Always:

* validate untrusted input;
* authorize server-side;
* use parameterized queries;
* escape/sanitize output appropriately;
* verify webhook signatures;
* use cryptographically secure randomness;
* rate-limit abuse-sensitive endpoints when exposed publicly;
* minimize stored personal data.

---

# Privacy

Treat supporter information as personal data.

Prototype only the customer data required for the product.

Avoid collecting:

* date of birth unless genuinely necessary;
* addresses unless necessary;
* unnecessary demographics;
* unrelated tracking data.

Design for:

* deletion/anonymization requirements;
* data export where later needed;
* retention policies;
* auditability.

Do not mix security audit records with unnecessary customer-profile data.

---

# Observability

Critical operations should produce structured logs.

Important events include:

```text
order.created
payment.pending
payment.confirmed
payment.failed
ticket.issued
ticket.cancelled
admission.accepted
admission.rejected
refund.completed
```

Include identifiers such as:

```text
requestId
clubId
eventId
orderId
ticketId
scannerId
```

Never include secrets or sensitive raw credentials.

---

# Performance Targets

Prototype targets should be practical rather than artificial.

Most important latency-sensitive operation:

```text
QR scan → admission response
```

Aim for a result that feels immediate under normal venue connectivity.

Do not optimize based on assumptions.

Benchmark before introducing caches or distributed infrastructure.

For admission load testing, model burst traffic around gate opening rather than uniform daily traffic.

---

# Code Standards

## File Organization

Do not put application source files in repository root.

Use:

```text
/src
/tests
/docs
/config
```

Keep bounded contexts obvious.

## Quality

* Prefer files below ~500 lines.
* Keep functions focused.
* Use strict TypeScript.
* Avoid `any` except at unavoidable boundaries.
* Validate external input.
* Prefer typed domain errors.
* Keep public APIs typed.
* Keep domain logic out of React components.
* Keep payment-provider SDK objects out of core domain models.
* Keep database ORM types from becoming universal domain types.

---

# Documentation

Significant architectural decisions belong in:

```text
/docs/adr/
```

Use ADRs for decisions such as:

* modular monolith architecture;
* tenant isolation model;
* payment-provider strategy;
* QR credential format;
* redemption concurrency mechanism;
* offline scanning strategy;
* season-ticket entitlement model.

Do not create ADRs for trivial implementation details.

---

# Git

Commit format:

```text
<type>(<scope>): <description>
```

Types:

```text
feat
fix
docs
style
refactor
perf
test
chore
```

Examples:

```text
feat(admissions): add atomic ticket redemption
feat(payments): process verified payment webhook
test(inventory): cover concurrent final-ticket purchase
fix(auth): enforce tenant scope on event lookup
```

Do not add `Co-Authored-By` unless repository configuration explicitly requires or authorizes it.

Do not commit, push, merge, or release unless authorized.

---

# Definition of Done

A feature is not done because code exists.

For normal features:

* acceptance criteria satisfied;
* types pass;
* focused tests pass;
* relevant integration tests pass;
* failure paths considered;
* no unrelated regressions found;
* documentation updated where necessary.

For payment/admission/security-sensitive features additionally:

* idempotency considered;
* concurrency considered;
* authorization considered;
* tenant isolation considered;
* abuse cases considered;
* security review performed;
* evidence recorded.

---

# Prototype Milestones

## Milestone 1 — Domain skeleton

* club
* event
* ticket type
* capacity
* order
* ticket

## Milestone 2 — Online sale

* public event page
* ticket selection
* checkout
* payment sandbox
* verified webhook
* ticket issuance

## Milestone 3 — Admission

* QR credential
* scanner PWA
* validation endpoint
* atomic redemption
* duplicate detection
* scan audit history

## Milestone 4 — Box office

* staff POS
* cash/card recording
* shared inventory
* printed/digital ticket
* optional sell-and-admit

## Milestone 5 — Club operations

* staff roles
* reporting
* cancellations/refunds
* complimentary tickets
* event dashboard

## Milestone 6 — Production hardening

* tenant isolation audit
* rate limits
* monitoring
* backups
* payment reconciliation
* deployment hardening
* load testing

## Later

* season tickets
* memberships
* reserved seating
* offline scanner fallback
* wallets
* CRM
* accounting integrations

---

# Ruflo Commands

Useful discovery/coordination commands may include:

```bash
npx ruflo --help
npx ruflo mcp list
npx ruflo plugins list
```

Claude Flow compatibility commands may also be available depending on the installed version.

Do not assume a command/tool exists solely because this document mentions a conceptual capability.

Check the current Ruflo registry.

For memory:

```bash
npx @claude-flow/cli memory search \
  --query "ticketing payment admission patterns" \
  --namespace patterns
```

Before a significant task, useful coordination sequence:

```text
Recall relevant patterns
→ inspect repository
→ route agents
→ establish ownership
→ implement
→ focused tests
→ integration tests
→ security review where needed
→ integration
→ completion evidence
```

---

# First Implementation Objective

Unless explicitly instructed otherwise, optimize early development toward this demonstrable scenario:

```text
ADMIN
creates
BELTINCI vs TRIGLAV
        ↓
sets
Adult €10
U16 €5
Capacity 1000
        ↓

SUPPORTER
selects 2 × Adult
        ↓
pays in sandbox
        ↓
receives QR tickets
        ↓

GATE STAFF
opens scanner on phone
        ↓
scans first QR
        ↓
GREEN — VALID
        ↓
scans same QR again
        ↓
RED — ALREADY USED
        ↓

ADMIN DASHBOARD
shows:
2 sold
1 admitted
€20 gross sales
```

Build this correctly before broadening the product.

---

# Guiding Principle

This project is not fundamentally a QR-code generator.

It is a transactional system coordinating:

```text
money
+ inventory
+ entitlement
+ identity
+ physical admission
```

Optimize architectural and agent decisions around protecting those transitions while keeping the prototype simple enough to ship and test with a real club.
