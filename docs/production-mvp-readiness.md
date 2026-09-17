# Production MVP readiness assessment

## Status

**PRODUCTION MVP NOT READY.** This document records the pre-change baseline
and the required order of work. It intentionally does not provide a migration
that mutates the current JSON data file.

## Current architecture

The application is a TypeScript Node `http` server. `src/server.ts` serves the
vanilla-JavaScript public and staff single-page interfaces, `src/domain.ts`
contains order, ticket and admission rules, and `src/db.ts` persists a JSON
document. The same domain model is used by the shop, box office and scanner.

The scanner already requests an environment-facing camera, uses
`BarcodeDetector` with `jsQR` fallback, and sends both camera and manual input
through the same admission endpoint. QR credentials are opaque 192-bit random
values and contain no customer data.

## Launch blockers

1. `POST /api/demo-login` lets callers choose `club_admin`, `box_office`, or
   `gate_staff`, including in production. There are no user records or
   password hashes.
2. Sessions are an in-memory `Map` and data is `data/demo.json`. The lock is
   only effective inside one Node process; restart, multiple workers, and
   durable hosted operation are unsafe.
3. The browser receives a payment secret and can invoke the successful demo
   payment callback. This is not an authoritative payment provider webhook.
4. Hosted Hostinger settings, a database connection, and physical-device QA
   evidence are not present in this repository.
5. Strix is not configured or available in the local environment; no
   authorized staging target or authenticated test accounts were supplied.

## Required implementation sequence

1. Provision PostgreSQL and introduce a transaction-backed persistence layer.
   Migrate clubs, users, sessions, events, ticket types, inventory, orders,
   payments, tickets, admissions, gates and audit events. Preserve existing
   production data with an export/import rehearsal before switching traffic.
   Enforce tenant foreign keys and unique ticket credential values.
2. Implement inventory and admission transactions in PostgreSQL. Admission
   must use a conditional write or a unique admission constraint on the
   single-entry entitlement so concurrent scanners can accept exactly one
   redemption.
3. Add database-backed staff users and sessions. Use Argon2id password hashes;
   replace the demo endpoint with generic-error, rate-limited login; rotate a
   random server session at login; store expiry/revocation server-side; set
   `HttpOnly`, `Secure`, `SameSite`, `Path`, and expiry cookie attributes.
   Add CSRF protection for cookie-authenticated state-changing staff APIs.
4. Add an operator-only bootstrap command, reading initial administrator
   credentials from deployment environment variables and refusing to create a
   duplicate user. There must be no public registration or role-selection
   route. Restrict order/ticket access by staff role and customer access token.
5. Integrate hosted payment checkout and a verified, idempotent provider
   webhook. Remove browser-held payment secrets and all production test-payment
   controls before enabling sale traffic.
6. Model venue entrances/gates, scope them to club/event as appropriate, and
   save selected scanner configuration with the authenticated server session.
   Rebuild the existing vanilla setup as a three-step modal patterned after
   Cult UI onboarding; do not migrate the app to React solely for this control.
7. Add regression tests for authentication, expiration, logout, tenant and
   role isolation, CSRF, payment-webhook idempotency, PostgreSQL concurrent
   inventory/admission behavior, and production demo-route denial.
8. Deploy to an authorized staging Hostinger Node application with HTTPS,
   PostgreSQL, environment secrets, proxy-aware secure cookies, direct-route
   fallback, cache policy, HSTS at the proxy, CSP and camera permission
   headers. Then run Strix against public and authenticated scopes, reproduce
   every finding, fix verified Critical/High issues, and rerun it.
9. Complete real-device camera QA on iPhone Safari and Android Chrome using a
   real issued ticket and deliberate second scan.

## Existing baseline controls

The server currently has CSP, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy: no-referrer`, and `Permissions-Policy: camera=(self)`.
Server-side role checks protect the currently implemented admin, box-office,
and scan endpoints, but they cannot compensate for self-issued role sessions.

## Findings triage

| Severity | Verified issue | Affected invariant |
| --- | --- | --- |
| Critical | Caller-selected production demo roles | authentication / authorization |
| Critical | Browser-controlled successful payment callback | paid-ticket issuance |
| Critical | JSON state and process-local admission lock | inventory / atomic redemption |
| High | In-memory sessions disappear on restart and are not centrally revocable | session security |
| High | Same-club staff can read arbitrary guessed order/ticket records | least privilege / data access |
| High | No configured rate limit or CSRF design for staff mutations | abuse resistance |

The local Ruflo static security scan and dependency audit are useful baseline
signals only; neither is a Strix scan nor proof of application security.
