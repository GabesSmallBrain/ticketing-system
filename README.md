# ND Beltinci digital ticketing prototype

A local, non-official prototype sports-club ticketing system demonstrated with ND Beltinci-inspired branding. It shows the complete transaction chain: supporter → payment → order → inventory → QR entitlement → gate admission → reporting.

## Features

- Slovenian supporter ticket shop with event inventory and checkout
- Test payment callback, paid-order transition and idempotent ticket issuance
- Real QR codes containing cryptographically random opaque credentials
- Mobile-first scanner with manual fallback and duplicate-entry prevention
- Touch-friendly box office: cash, card simulation, and sell + admit
- Management dashboard with ticket sales, revenue, attendance and activity
- Prototype season-ticket proposition and tenant-aware domain fields

## Local setup

Requires a current Node.js LTS release.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. To clear presentation activity, log in as administrator and use **RESETIRAJ DEMO** (development only).

## Demo accounts

Open `/demo-login` and use a one-click local demo role:

- Administrator — dashboard, reset and box office
- Blagajnik — box office
- Varnostnik — scanner

There are no production credentials. The local role selector is intentionally simplified, while protected API routes still enforce a demo role server-side.

## Walkthrough

1. Open the public shop and select **Beltinci — Mura**.
2. Buy two *Tribuna — Odrasli* tickets (€30) with the successful test payment.
3. Open each QR ticket.
4. Open `/scanner`, enter/scan a ticket credential, and show the valid result.
5. Enter the same credential again to show **Vstopnica je že uporabljena**.
6. Open `/admin/blagajna`, sell a standing ticket for cash, then display/print it.
7. Return to `/admin` to see changed revenue and attendance.

The precise presenter script is in [docs/demo-guide.md](docs/demo-guide.md). Research provenance is in [docs/research/nd-beltinci-brand.md](docs/research/nd-beltinci-brand.md).

## Architecture

The application is a deliberately small modular monolith: public shop, box office, scanner and admin all use one ticket/order/inventory/admission model. See [docs/architecture.md](docs/architecture.md).

## Prototype limitations

- Uses a persisted local JSON data store instead of PostgreSQL; production should use migrations, transactions and database constraints.
- Payment is a deterministic local simulator; no card is charged.
- Email delivery, wallet passes, physical terminal integration and fiscalization are not implemented.
- Browser print is the printable-ticket implementation.
- The current persistence adapter is a single-process JSON store. It is deliberately not suitable for concurrent production workers; PostgreSQL transactions and constraints are required before live sales.
- Demo role sessions are server-issued for the local process, but are not a production identity system.
- Scanner currently provides a reliable manual fallback; production camera scanning needs HTTPS/device QA and offline strategy.
- Demo authentication is not production authentication; use SSO/password policy, sessions and CSRF protections in production.
- No claim is made that this is an official ND Beltinci deployment or endorsement.

## Quality commands

```bash
npm run typecheck
npm test
npm run build
npm run security
```
