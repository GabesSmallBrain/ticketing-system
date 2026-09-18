# Reference-faithful redesign queue

## Staff login — 2026-09-18

**ROUTE:** `/prijava-za-osebje`

**STITCH REFERENCES:** **EXACT desktop reference:** `prijava_za_osebje_matchday_os/screen.png` (1280×1002) and `code.html`. The supplied reference establishes the staff-side—not supporter-side—dark operational surface, club identity panel, yellow action treatment, and credential-first hierarchy. No separate mobile reference was supplied; mobile is a faithful single-column adaptation of the same source.

**AUTHENTICATION AUDIT / IMPLEMENTATION:** The old browser role chooser and production `/api/demo-login` path were replaced by `POST /api/auth/login`. The server normalizes and validates email, finds an active club-scoped staff user, verifies an Argon2id password hash, creates a new opaque server-side session, and determines the role and club without accepting either from the browser. Failures are generic; successful login rotates to a new session cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production) and updates `lastLoginAt`. Logout invalidates the server-held session and clears the cookie. `/demo-login` and `/api/demo-login` return 404 in production; the development-only demo endpoint remains strictly gated for existing test workflows.

**AUTHORIZATION:** `club_admin`, `box_office`, and `gate_staff` route respectively to `/admin`, `/admin/blagajna`, and `/scanner`; direct staff routes first require an authenticated session and all existing API role guards remain server-side. The client no longer persists a selected role in browser storage. The first administrator is created only through `npm run create-admin` with one-time `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (14+ characters), and optional name/club environment variables—there is no public registration endpoint.

**PERSISTENCE LIMITATION:** The active runtime remains JSON file persistence (`data/demo.json`) with process-local session and login-rate-limit maps. This is coherent for the prototype but is **not restart-safe or multi-process safe**; PostgreSQL schema/bootstrap code exists separately but is not the runtime used by the public server. Production-grade PostgreSQL-backed staff and session persistence remains a blocker before real deployment.

**VISUAL QA:** `artifacts/visual-qa/stitch/staff-login/staff-login-mobile-v1.png`, `staff-login-mobile-v2.png`, `staff-login-desktop-v1.png`, `staff-login-desktop-v2.png`, and `staff-login-invalid-mobile.png`. 348/375/390/414/430px have no horizontal overflow; the form, error state, password reveal control, keyboard submit, and public return action remain visible. The desktop composition was checked at 1280/1366/1440/1600px.

**STATUS:** FUNCTIONAL + TECHNICAL VISUAL QA PASS. USER VISUAL APPROVAL: PENDING. Do not redesign an authenticated staff route as part of this task.

## Season tickets — 2026-09-18

**LOCKED PUBLIC ROUTES:** `/`, `/vstopnice/:slug`, `/kosarica`, `/checkout`, `/nakup/uspesen`, `/moje-vstopnice`, and `/vstopnica/:id` are visually approved and locked. This work is route-scoped to `/sezonske`; no shared public component was changed.

**ROUTE:** `/sezonske`

**STITCH REFERENCES:** **RELATED REFERENCES ONLY.** `01_javna_doma_a_stran_mobilna/screen.png` (414×1600) and its `code.html` provide the public season-card visual vocabulary: dark elevated card, yellow/blue accent, crest, sports typography, and price hierarchy. There is no direct mobile or desktop Season Tickets Stitch route reference, and no exact desktop reference exists.

**FUNCTIONAL AUDIT:** The original route was a static `120,00 €` demonstration teaser. It is now a real active `SeasonProduct` (`2026/27`, €120) with server-authoritative quantity/price, `SEASON` orders, existing demo-payment handoff, and issued `SeasonPass` entitlements. The browser never supplies the authoritative unit price. There remains no holder-price tier, season inventory/capacity, renewal, transfer, wallet, or season-pass admission support.

**CURRENT IMPLEMENTATION:** The retained premium pass composition now fetches the real active season product, offers a bounded 1–10 quantity control, displays a live total, and hands the product ID/quantity to the existing checkout surface at `/checkout?kind=season`. The server creates a pending `SEASON` order, derives the price from the persisted product, and only issues one opaque-credential `SeasonPass` per unit after successful authoritative demo-payment callback. Success and My Tickets distinguish season entitlements from event tickets. The entitlement cards explicitly state that match-day season-pass verification is not yet supported; no QR or scanner path is exposed for them.

**VISUAL QA:** `artifacts/visual-qa/stitch/season-tickets/` contains the original teaser captures plus `purchase/season-purchase-mobile.png`, `season-purchase-desktop.png`, `season-checkout-mobile.png`, `season-checkout-desktop.png`, `season-success-mobile.png`, `season-success-desktop.png`, and `season-my-tickets-mobile.png`. Mobile 348/375/390/414/430px and desktop 1280/1366/1440/1600px have no horizontal overflow. The shared menu has the `SEZONSKE VSTOPNICE` active state and closes on Escape.

**VALIDATION:** Unit tests cover no pass before payment, exact pass count, opaque unique credentials, idempotent reissue, and scanner isolation. Browser flows checked 1× (€120), 2× (€240), and 3× (€360), server rejection of quantity 11, and client price manipulation ignored by the server. Existing match checkout → payment → QR ticket flow was regression-tested.

**SEASON PURCHASE:** IMPLEMENTED.

**SEASON ENTITLEMENT ISSUANCE:** IMPLEMENTED.

**SEASON MATCH-DAY ADMISSION:** NOT YET IMPLEMENTED.

**STATUS:** PURCHASE IMPLEMENTED. VISUALLY APPROVED / LOCKED.

## My Tickets — 2026-09-18

**LOCKED PUBLIC ROUTES:** `/`, `/vstopnice/:slug`, `/kosarica`, `/checkout`, and `/nakup/uspesen` are visually approved and locked. This work is route-scoped to `/moje-vstopnice`; no shared public CSS or navigation component was changed.

**ROUTE:** `/moje-vstopnice`

**STITCH REFERENCES:** **RELATED, not exact.** `04_digitalna_vstopnica_qr_mobilna/screen.png` (598×1600) and `digitalna_vstopnica_in_qr_koda/screen.png` (1367×1600) establish the purchased-ticket dark surface, real crest, status, and matchday hierarchy. There is no dedicated My Tickets Stitch screen, so the library composition is inferred only from those related ticket references and the locked public system.

**FUNCTIONAL AUDIT / PERSISTENCE:** Supporter ticket discovery remains browser-session scoped. The page reads order IDs from `beltinci-shop-orders` and each order's device-local access token from `beltinci-order-<id>`, then requests real server-persisted order/ticket data. It survives refresh in the same browser session, but does not survive a new browser session or transfer to another device; no supporter account, email recovery, or cloud library was claimed or added. `?order=<id>` is now a strict order filter, so the success-page handoff only renders the purchased order and cannot include unrelated locally known orders.

**CURRENT IMPLEMENTATION:** Real tickets are grouped by purchase and match rather than repeated as indistinguishable fixture cards. Upcoming/past groups use actual kickoff timestamps; ticket state is independent of grouping. A group is labelled `PREKLICANE`/`DELNO PREKLICANE` when cancellation is present, `UPORABLJENE`/`DELNO UPORABLJENE` when admission is present, otherwise `PRIPRAVLJENE`. Real category quantities, constrained local club crests, venue, date, competition, and ticket routes are preserved. Multi-ticket cards open the first real ticket, whose existing ticket switcher retains access to the other tickets in that order.

**VISUAL QA:** `artifacts/visual-qa/stitch/my-tickets/` contains `my-tickets-before-mobile.png`, `my-tickets-before-desktop.png`, `my-tickets-mobile-v1.png`, `my-tickets-mobile-v2.png` (348px), `my-tickets-single-mobile.png`, `my-tickets-empty-mobile.png`, `my-tickets-desktop-v1.png`, and desktop checks at 1280/1366/1440/1600px. At 348/375/390/414/430px and all four desktop widths, the route has no horizontal overflow. The 348px capture verifies the longer `NK TRIGLAV KRANJ` name wraps naturally without clipping.

**FUNCTIONAL QA:** A real flow created a multi-type three-ticket Mura order and a second Triglav order. General My Tickets grouped both fixtures; the strict `?order=` view rendered only the selected order. A one-ticket group opened its real `/vstopnica/:id?order=...` route. The no-session empty state was captured and links back to `/`. Current demo fixtures are future-dated, so a real past-group fixture was not available without mutating product data. No cancellation/admission state was altered for visual QA.

**STATUS:** VISUALLY APPROVED / LOCKED.

## Checkout — 2026-09-18

**LOCKED PUBLIC ROUTES:** `/` and `/vstopnice/:slug` are visually approved; `/kosarica` is the accepted localhost/production baseline. The shared top-right public menu is the only public mobile navigation; no fixed bottom public navigation remains. This checkout work is route-scoped and does not redesign those pages.

**ROUTE:** `/checkout`

**STITCH REFERENCES:** `03_ko_arica_in_blagajna_mobilna/screen.png` (348×1600), specifically its customer-details, payment, order-summary, and final-action vocabulary. There is no standalone or direct desktop checkout Stitch reference; desktop is derived from the approved public desktop composition and the same Stitch component system.

**FUNCTIONAL AUDIT:** Session cart reaches checkout through `beltinci-shop-cart`. Checkout loads the selected event and active ticket types from the public API, derives item quantities and totals from that real session state, and posts the existing required `firstName`, `lastName`, `email`, event, and ticket-item contract to `/api/checkout`. The only actual payment mode is the existing demo handoff to `/placilo/:id`; the redesign does not imply real card processing. Direct empty-cart checkout now renders a deliberate return-to-home state. Client validation is inline; a failed checkout-start response is shown inline and preserves the CTA for retry.

**CURRENT IMPLEMENTATION:** A route-scoped checkout renderer adds real match context with local crests, real ticket-line/total confirmation, labeled buyer inputs, one truthful selected demo-payment method, inline field and API failure feedback, normal-flow mobile summary/CTA, and a form-primary desktop grid with a compact sticky supporting summary. No fake fees, security claims, provider options, or reservation timer were added.

**VISUAL QA:** `checkout-before-mobile.png`, `checkout-before-desktop.png`, `checkout-mobile-v1.png`, `checkout-mobile-v2.png`, `checkout-desktop-v1.png`, `checkout-desktop-v2.png`, `checkout-mobile-invalid-form.png`, and `checkout-empty-mobile.png` are in `artifacts/visual-qa/stitch/checkout/`. The mobile direct-reference target is 348px; 375/390/414/430px and desktop 1280/1366/1440/1600px have no horizontal overflow. There is no exact desktop reference/diff claim.

**FUNCTIONAL QA:** Real selection → cart → checkout carries real event, line item, quantity, and amount; a populated valid form reaches the existing `/placilo/:id` demo confirmation route. Empty cart, invalid fields, and a simulated checkout-start API failure were exercised. Locked-route regression captures are in `artifacts/visual-qa/stitch/checkout/regressions/` for `/` mobile, selection mobile, cart mobile, and cart desktop; no horizontal overflow or bottom-navigation regression was observed.

**VALIDATION:** `node --check src/web/public.js`, `npm run typecheck`, `npm run build`, and `git diff --check` pass. `npx playwright test tests/public-shop.spec.ts` has 2 passing and 2 known stale legacy-UI failures: `NASLEDNJA DOMAČA TEKMA` and `.mobile-cart`; neither is restored.

**USER VISUAL APPROVAL:** APPROVED / LOCKED.

## Purchase success — 2026-09-18

**ROUTE:** `/nakup/uspesen`

**STITCH REFERENCES:** No dedicated purchase-success reference exists. The implementation uses the confirmation, order-summary, action, and dark-surface vocabulary from `03_ko_arica_in_blagajna_mobilna` (348×1600) and the real ticket/match-identity language from `04_digitalna_vstopnica_qr_mobilna`.

**FUNCTIONAL AUDIT:** The route reads `?order=<id>` plus the device-local `beltinci-order-<id>` access token, then requests the real order and tickets. A success screen is rendered only for an order with `status: PAID`, `paymentStatus: SUCCEEDED`, and issued tickets. Missing, inaccessible, pending, failed, or ticketless orders render a safe non-success state. A one-ticket purchase links directly to its real ticket; a multi-ticket purchase uses the existing order-filtered My Tickets route. Match, competition, ticket-type quantities, total, and order reference all come from the real order/ticket response.

**CURRENT IMPLEMENTATION:** Route-scoped success confirmation with restrained green success state, real local club crests, compact match context, grouped purchase lines, dominant yellow ticket action, quiet My Tickets action, and secondary order reference. It does not claim email, PDF, wallet, SMS, provider, or security functionality that is not implemented.

**VISUAL QA:** `artifacts/visual-qa/stitch/purchase-success/` contains `purchase-success-mobile-v1.png`, `purchase-success-mobile-v2.png`, `purchase-success-desktop-v1.png`, `purchase-success-mobile-large-total.png`, and `purchase-success-missing-mobile.png`. Mobile 348px is the primary target; 375/390/414/430px and desktop 1280/1366/1440/1600px have no horizontal overflow. There is no exact-reference pixel-diff claim.

**FUNCTIONAL QA:** One-ticket purchase, multi-type three-ticket purchase, a €120 total, direct missing order, and pending payment state were checked. Pending/missing states do not show `NAKUP USPEŠEN`.

**STATUS:** VISUALLY APPROVED / LOCKED.

## Cart repair — structural root cause

`/kosarica` was visually rejected. The desktop failure came from broad legacy `.cart-summary` rules (`min-height: 510/530px`) and the generic two-column cart grid continuing to style the redesigned cart, leaving an oversized summary and an under-proportioned content column. The mobile failure came from the same cascade combined with a fixed summary bar layered over a cart layout that was still governed by desktop/mobile legacy rules. The repair scopes the cart grid and summary geometry to `.stitch-cart-layout`, removes the forced summary minimum height, and returns the mobile summary to normal document flow. The obsolete homepage bottom navigation is removed; the shared top header/menu is canonical.

## Public discovery routing cleanup — 2026-09-18

**SCOPE LOCK:** `/` is visually approved and is the public ticket-discovery page. `/vstopnice` is deliberately removed as a page and redirects to `/`. Stop after this cleanup; do not visually change `/vstopnice/:slug` or any other route.

**REFERENCE:** Stitch `01_javna_doma_a_stran_mobilna`, 414×1600. No direct desktop homepage Stitch reference exists in `stitch_nd_beltinci_matchday_ticketing`; desktop is responsive QA only.

**CURRENT HOMEPAGE STATUS:** VISUALLY APPROVED BY USER. Do not redesign `/` further. The shared public mobile menu was regression-tested against the approved homepage only.

**DEFECTS FOUND / ROOT CAUSES:**

- Season price crossed the top label rule because `.stitch-season-card > strong` used `margin-top: -35px`. Replaced with a normal two-column top row; no negative positioning remains.
- The upcoming-match accent was a border attached to the heading. It is now a distinct layout child (`i`, label, optional league badge), so no decorative line runs behind text.
- Match cards were text-only and their geometry varied with content. They now have normal-flow crest/team/role groups using local real crest assets, `minmax(0, 1fr)`, `min-width: 0`, and `overflow-wrap` for actual opponent names.
- Hero/team/meta blocks depended on inherited dimensions and did not consistently reserve space for real text. The homepage stylesheet now defines shrinkable grids, natural minimum heights, and explicit wrapping instead of clipping or offsets.
- Desktop inherited the mobile two-column main grid. It is now a deliberate responsive layout with a single hero and two equal upcoming-match cards; no exact desktop reference is claimed.
- The season package label and price were still sharing the same narrow mobile row. The mobile season header now stacks label, price, title, description, and CTA in normal flow; desktop retains separate grid columns for label and price.
- The hero-to-upcoming transition, heading-to-card transition, match-card rows, and the break before season tickets now use a shared page spacing scale (`8 / 14 / 20 / 32 / 44px`) instead of unrelated offsets.

**LATEST HOME SCREENSHOTS:**

- Mobile 414: `artifacts/visual-qa/stitch/home/home-mobile-v5.png`
- Mobile 414 diff: `artifacts/visual-qa/stitch/home/home-mobile-v5-diff.png` (RMSE 0.124138; real event data and local authentic crests intentionally differ from reference content)
- Mobile bottom-scroll / fixed-navigation QA: `artifacts/visual-qa/stitch/home/home-mobile-v5-bottom.png`
- Desktop responsive QA: `artifacts/visual-qa/stitch/home/home-desktop-v2.png`
- Baseline evidence retained: `mobile-current.png`, `desktop-current.png`, and prior homepage iterations in the same directory.

**HOMEPAGE VALIDATION:** `npm run typecheck`, `npm run build`, `node --check src/web/public.js`, and `git diff --check` pass. Browser checks at 375, 390, 414, and 430px show zero horizontal overflow. At bottom scroll, the season CTA retains 52px of clearance above the fixed 70px mobile navigation at every checked width. A simulated real API response using `NK Triglav Kranj` as the featured opponent produced a naturally expanded, non-clipped hero.

**MOBILE NAVIGATION:** A shared right-side public menu trigger is implemented through `header()` and `src/web/mobile-nav.css`. It exposes only supporter destinations plus secondary staff login, has accessible label/expanded state, visible keyboard focus, Escape dismissal, active-route state, and closes on destination selection. The homepage keeps its Stitch-mandated bottom navigation as the primary mobile destination pattern; the header menu coexists as the shared access control and staff-login entry. The approved homepage’s hero/cards/season geometry remains unchanged.

**PUBLIC ROUTE DECISION:** `/` is the approved supporter ticket-discovery/home surface. `/vstopnice` is **REDIRECT TO `/`** because a standalone listing duplicated the approved discovery experience. `/vstopnice/:slug` remains the individual match ticket-selection route and is the next separate visual target.

**NEXT ACTION:** Stop. Await a separate instruction for `/vstopnice/:slug` visual implementation.

Status labels: `NOT STARTED`, `IN PROGRESS`, `REFERENCE MATCHED`, `INFERRED DESIGN COMPLETE`, `BLOCKED`.

1. **POS `/admin/blagajna` — IN PROGRESS.** Full-bleed layout, catalogue/basket geometry, live ticket quantities and payment actions are rebuilt. Next: header/printer/cash affordances where supported, 1600×1432 comparison.
2. **Public purchase `/vstopnice/:slug` — COMPLETE / REFERENCE MATCHED.** Iterations 4–7 added the real-data club/fixture hero split, real upcoming-event cards, stadium/sector grouping, and the measured 917px grid. Final reference viewport capture: `/tmp/ref02-implementation-v7.png`; diff: `/tmp/ref02-diff-v7.png`; AE 138525 / 8.67%. Measured geometry now matches the reference’s 29px gutters, 257px hero, 495px selector, 16px gutter, and 348px sticky basket. Remaining delta is limited to unavoidable real fixture/category data, the intentionally supporter-only public navigation, and font rasterization. Focused public regression: 4/4 passed. Next: Reference 03 digital ticket.
3. **Digital ticket `/vstopnica/:id` — VISUALLY APPROVED / LOCKED.** Iterations 1–4 rebuilt the real-ticket voucher, QR quiet zone, data tiles, and right-hand status/details panels. Valid top-of-page capture: `/tmp/ref03-implementation-v4.png`; diff: `/tmp/ref03-diff-v4.png`; AE 169558 / 7.75%. The measured 1367px geometry is aligned: 85px header, x44/812 734px + 34px + 512px grid, y250 voucher/panel start, 110px band, QR at y762, and voucher bottom at y1280. Remaining visual differences are deliberately omitted mock wallet/gate/sponsor controls and public-only navigation, not a second fake operational system.
4. **Mobile scanner `/scanner` — IN PROGRESS.** Reference mobile chrome CSS staged; preserve camera, parser, admission portal and confirm lock.
5. **Admin dashboard `/admin` — IN PROGRESS (new Reference 05).** Iteration 1 implements its actual-data command panel, metric cards, sales channels, audit activity, gate-state truth/empty state, and operational notice. Capture remains environment-blocked.
6. **Admin match list `/admin/tekme` — IN PROGRESS (new Reference 06).** Iteration 1 implements the management title, aggregate cards, filter strip, and dense real-data rows linked to the existing editor. Capture remains environment-blocked.
7. **Admin ticket management `/admin/vstopnice` — IN PROGRESS (new Reference 08).** Iteration 1 rebuilds the route with real status/event/channel filtering, factual ticket state counters, dense state-coded records, authorized ticket detail links, and the existing cancellation confirmation flow. Capture remains environment-blocked.
8. **Admin orders list `/admin/narocila` — BLOCKED (new Reference 07).** No route or authorized list API exists. `/narocilo/:id` remains an inferred detail route, not a reason to fabricate a dashboard.
9. Shared tokens/components — NOT STARTED.
10. Public route model — `/` VISUALLY APPROVED / public ticket discovery; `/vstopnice` REDIRECTS TO `/`; `/vstopnice/:slug` is the next individual-selection visual target; `/kosarica`, `/checkout`, `/nakup/uspesen`, `/moje-vstopnice`, `/sezonske` NOT STARTED.
11. Staff inferred routes `/prijava-za-osebje`, `/admin/tekme/:id`, `/admin/porocila`, `/narocilo/:id` — NOT STARTED.
12. `/admin/osebje` — BLOCKED: no route, server API, or staff-domain model exists; do not fabricate it.
13. Legacy visual sweep — NOT STARTED.
14. Responsive/screenshot QA and full functional regression — NOT STARTED.

## Route matrix

| Route | Reference source | Status |
| --- | --- | --- |
| `/` | Stitch `01_javna_doma_a_stran_mobilna` | VISUALLY APPROVED |
| `/vstopnice` | none — redundant route | REDIRECT TO `/` |
| `/vstopnice/:slug` | Stitch `javna_trgovina_in_nakup_vstopnic` (917×1600) and `02_izbira_vstopnic_mobilna` (544×1600) | FUNCTIONAL / DESKTOP / MOBILE / RESPONSIVE / NAVIGATION / CART HANDOFF: PASS — USER VISUAL APPROVED |
| `/kosarica` | inferred public | NOT STARTED |
| `/checkout`, `/placilo/:id`, `/nakup/uspesen` | inferred public | NOT STARTED |
| `/moje-vstopnice` | inferred ticket | NOT STARTED |
| `/vstopnica/:id` | old Reference 03 | VISUALLY APPROVED / LOCKED |
| `/sezonske` | inferred public | PURCHASE IMPLEMENTED / VISUALLY APPROVED / LOCKED |
| `/prijava-za-osebje` | Stitch `prijava_za_osebje_matchday_os` | FUNCTIONAL + TECHNICAL VISUAL QA PASS — USER VISUAL APPROVAL PENDING |
| `/admin` | new Reference 05 | IN PROGRESS |
| `/admin/tekme` | new Reference 06 | IN PROGRESS |
| `/admin/tekme/:id` | inferred staff | NOT STARTED |
| `/admin/blagajna` | old Reference 01 | IN PROGRESS |
| `/admin/vstopnice` | new Reference 08 | IN PROGRESS |
| `/admin/porocila` | inferred staff | NOT STARTED |
| `/narocilo/:id` | inferred from new Reference 07 | NOT STARTED |
| `/admin/narocila`, `/admin/osebje` | new Reference 07 / no application route | BLOCKED |
| `/scanner` | old Reference 04 | IN PROGRESS |

## Stitch reference implementation matrix

| Route | Stitch reference | Functional | Desktop | Mobile | Responsive/tests | Artifact / next action |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | `01_javna_doma_a_stran_mobilna` | PASS | no desktop Stitch reference | VISUALLY APPROVED | 375/390/414/430px PASS | Approved homepage retains `home-mobile-v5.png`; `home-mobile-v6-nav-regression.png` confirms shared-menu regression only. |
| `/vstopnice/:slug` | `javna_trgovina_in_nakup_vstopnic` / `02_izbira_vstopnic_mobilna` | PASS: API event/types, real crests, session cart, `/kosarica` handoff | Desktop protected: 917×1600 before/after regression capture; no desktop CSS change | COMPLETE: shared public mobile header/menu, real-crest context, selectable ticket cards, fixed real-cart CTA | 375/390/414/430/544px no-overflow PASS; menu open/Escape PASS | `ticket-selection/before-mobile.png`, `ticket-selection-mobile-v1.png`, `ticket-selection-mobile-v2.png`, `ticket-selection-mobile-v2-diff.png`, `before-desktop.png`, `ticket-selection-desktop-after.png`, `ticket-selection-desktop-regression-diff.png`. User visual approval PENDING; source/reference difference remains real fixture/category data plus required shared navigation. |
| `/kosarica` | `03_ko_arica_in_blagajna_mobilna` (348×1600) | PASS: session cart, bounded quantities, real totals, `/checkout` link | no direct desktop reference | TECHNICAL IMPLEMENTATION IN PROGRESS | 348px capture and browser interaction checked | User visual approval PENDING. Stop after cart only. |
| `/vstopnica/:id` | `digitalna_vstopnica_in_qr_koda`, `04_digitalna_vstopnica_qr_mobilna` | PASS | VISUALLY APPROVED / LOCKED | VISUALLY APPROVED / LOCKED | existing ticket tests | preserve QR. |
| `/prijava-za-osebje` | `prijava_za_osebje_matchday_os` | PASS (demo) | NOT STARTED | no mobile Stitch ref | not rechecked | visual-only adaptation. |
| `/admin`, `/admin/tekme`, `/admin/vstopnice` | matching `administracija_*` references | PASS | IN PROGRESS | no mobile Stitch refs | captures exist | continue reference iteration. |
| `/admin/blagajna` | `fizi_na_blagajna_pos` | PASS | IN PROGRESS | no mobile Stitch ref | POS tests | continue reference iteration. |
| `/scanner` | `mobilni_skener_vstopnic_vhod` | PASS | no desktop Stitch ref | IN PROGRESS | scanner tests | preserve blocking dialog. |
| `/admin/narocila` | `administracija_naro_ila` | BLOCKED | DESIGN AVAILABLE — FUNCTIONAL PREREQUISITE MISSING | same | n/a | authorized orders-list API required. |

Reference-native screenshots are retained outside the repository under `/tmp`; source images remain in the supplied downloads directory and are not copied into application assets.

## Resumable handoff

**LAST COMPLETED:** Live validation of the uncommitted redesign implementation. A syntax error in the new public-home renderer and an extra scanner-status parenthesis were fixed; the dashboard’s dynamic sales-bar inline style was replaced with CSP-safe percentage classes, and its fixture heading retains the existing accessible fixture name. The working tree remains the original four redesign files; disposable demo-data mutations made by capture/test flows were removed.

**CURRENT ROUTE:** `/vstopnice/:slug` — Stitch `02_izbira_vstopnic_mobilna`, IN PROGRESS.

**CURRENT REFERENCE:** Stitch `02_izbira_vstopnic_mobilna` — ticket selection, 544×1600.

**CURRENT ITERATION:** Ticket-selection iteration 2 adds a route-scoped mobile rendering path rather than scaling the matched desktop layout. It preserves API-backed ticket categories, live capacity/prices, quantity limit, session cart, and the existing `/kosarica` continuation. A visual iteration replaces initial badges with local crests where the fixture shows them; the mobile Stitch composition itself shows the Beltinci mark in its header only.

**LATEST SCREENSHOT / DIFF:** Homepage final active iteration: `artifacts/visual-qa/stitch/home/home-mobile-v3-real-assets.png`, diff `home-mobile-v3-real-assets-diff.png` (RMSE 0.137194). Ticket selection: `artifacts/visual-qa/stitch/ticket-selection-mobile-v2.png`, diff `ticket-selection-mobile-v2-diff.png` (RMSE 0.076472). Earlier scanner/admin artifacts named above remain valid historical iterations.

**VALIDATION STATUS:** `npm run typecheck`, `npm run build`, `node --check src/web/public.js`, and `git diff --check` pass after the local-asset and mobile-selector work. Live 414px homepage and 544px selection captures loaded all required local assets. The mobile selector passes 375/390/430px no-overflow checks; a live plus click updates the real session cart and exposes `/kosarica` continuation. Earlier full-test caveats remain recorded above.

**REMAINING CONCRETE WORK:** Recheck the previously matched 917px ticket-selector desktop against its newer Stitch reference before marking the route fully complete; retain actual price/capacity figures rather than screenshot values. Then continue in Stitch order with the combined mobile cart/checkout reference. Every match surface must reuse `clubAsset()` and add only a locally verified crest when a new real opponent appears. Reference 05, 06, 08, POS, and scanner remain in progress as described above.

**SUPERSEDED NEXT ACTION:** The former standalone `/vstopnice` listing is removed. Stop after this routing cleanup; the next separate task is `/vstopnice/:slug` visual implementation.

## Latest handoff — stop after public routing cleanup

**LAST COMPLETED:** User approved `/` visually. The standalone `/vstopnice` listing was removed as redundant; the server now redirects the exact path to `/`.

**CURRENT ROUTE:** None — stop pending the next `/vstopnice/:slug` visual instruction.

**CURRENT REFERENCE:** Next: Stitch public purchase references for `/vstopnice/:slug`. Do not start without a new instruction.

**CURRENT ITERATION:** Routing cleanup only. Homepage v7 is a regression capture only; no homepage visual redesign occurred after approval.

**LATEST SCREENSHOTS:** Routing regression captures: `artifacts/visual-qa/stitch/home-mobile-v7-routing-regression.png`, `home-desktop-v3-routing-regression.png`, and `ticket-selection-routing-regression.png`.

**VALIDATION STATUS:** `npm run typecheck`, `npm run build`, `node --check src/web/public.js`, and `git diff --check` pass. `GET /` returns 200; `GET /vstopnice` returns 302 with `Location: /`; `GET /vstopnice/beltinci-mura` returns 200. Homepage public VSTOPNICE navigation points to `/`, homepage match CTAs point to real slug routes, and a ticket-selection quantity update still persists in the session cart. Focused Playwright routing/shop coverage: 2 passed; 2 legacy selector assertions failed because they expect the removed legacy homepage label (`NASLEDNJA DOMAČA TEKMA`) and obsolete `.mobile-cart`, not a separate `/vstopnice` page. No routing assertion failed.

**NEXT EXACT ACTION:** Stop. Await a separate visual implementation instruction for `/vstopnice/:slug`; do not modify any other route.

## Latest handoff — ticket selection mobile implementation

**LAST COMPLETED:** `/vstopnice/:slug` mobile Stitch implementation against `02_izbira_vstopnic_mobilna` (544×1600), while preserving the previously matched 917×1600 desktop implementation.

**FUNCTIONAL:** PASS — real event metadata, active ticket types/prices/availability, bounded quantity changes, selected state driven by the session cart, and `/kosarica` continuation remain real.

**DESKTOP:** PASS — `before-desktop.png` and `ticket-selection-desktop-after.png` show the existing desktop route remains unchanged by the mobile-scoped work.

**MOBILE:** COMPLETE — the old route-specific header is replaced by the shared public brand/menu header. The Stitch-style back/title context remains in normal page flow; the match context now uses real local ND Beltinci and opponent crests.

**RESPONSIVE / NAVIGATION:** PASS — 375, 390, 414, 430, and 544px have no horizontal overflow. The menu opens, closes with Escape, and layers above the fixed purchase summary.

**TESTS:** `node --check src/web/public.js`, `npm run typecheck`, `npm run build`, and `git diff --check` pass. The previously documented two legacy Playwright assertions remain stale and were not revived by reintroducing obsolete UI.

**VISUAL ARTIFACTS:** `artifacts/visual-qa/stitch/ticket-selection/` contains before/after mobile and desktop captures plus comparison artifacts. Mobile source comparison: RMSE 0.258302; expected remaining difference is real API content, real authentic crests, and the required shared header/menu.

**USER VISUAL APPROVAL:** PENDING.

**NEXT EXACT ACTION:** Stop. Do not begin `/kosarica` or any other route without a new user instruction.

## `/admin` — staff administration redesign, 2026-09-18

| Check | Result |
| --- | --- |
| Reference | `administracija_pregled` (1486×1510) |
| Functional | PASS — live current event, sales, revenue, attendance, availability, activity, and category data |
| Authorization | PASS — club admin allowed; box-office and gate staff receive server denial; unauthenticated staff routes redirect to login |
| API/domain | PASS — no repository/domain changes; unsupported gate telemetry and reset controls removed from the route |
| Empty/error | PASS — coherent no-match and server-error states rendered |
| Desktop design | IMPLEMENTED |
| Mobile design | IMPLEMENTED — compact role-filtered staff navigation at 390px and 430px |
| Responsive QA | PASS — desktop, narrow desktop rules, 390px, and 430px reviewed without overflow or clipped controls |
| Locked-route regression | PASS — staff login still loads and authentication/logout remain functional |
| Tests | PASS — typecheck, unit tests, build, diff check, and focused authenticated browser smoke |
| Known regression | NONE |
| User visual approval | PENDING |

### Refinement pass — 2026-09-18

| Check | Result |
| --- | --- |
| Reference alignment and spacing polish | PASS |
| `Zadnje dejavnosti` dashboard UI/data projection | REMOVED |
| Complimentary reporting model | Existing explicit `orders.channel = COMPLIMENTARY`; no price-based inference or migration required |
| Current dashboard projection | 2 paid, 0 complimentary, 2 total issued, 4,998 remaining, €30.00 revenue |
| Complimentary scanner regression | Not implemented: there is no complimentary issuance flow in this prototype yet |
| NZS fixture research | Documented in `docs/nzs-integration.md`; manual review/import only, no scheduler or scraper |
| Desktop / 390px / 430px browser QA | PASS — no horizontal overflow and no console errors |
| User visual approval | PENDING |

## Runtime database cutover ledger — 2026-09-18

| Area | Current state |
| --- | --- |
| RUNTIME DATABASE | PARTIAL — MariaDB repository introduced; remaining staff/admin and box-office route mutations require conversion |
| JSON RUNTIME SOURCE OF TRUTH | NO for new checkout, payment fulfillment, scans, and sessions; legacy mutation routes are intentionally blocked pending conversion |
| EVENTS / TICKET TYPES | MARIADB reads |
| ORDERS / ORDER ITEMS / PAYMENTS | MARIADB for public checkout and callback |
| TICKETS / ADMISSIONS | MARIADB; admission redemption is transaction-backed |
| STAFF USERS / SESSIONS | MARIADB sessions; login rate-limit remains PROCESS-LOCAL |
| SEASON PRODUCTS / ENTITLEMENTS | MARIADB for checkout and fulfillment |
| AUDIT EVENTS | MARIADB for new checkout, payment, login, and admission flows |
| PAYMENT IDEMPOTENCY | DB-BACKED order lock plus persisted issuance |
| ATOMIC ADMISSION | DB-BACKED ticket lock plus unique admission |
| CAPACITY ENFORCEMENT | DB-BACKED ticket-type lock at public checkout |

Actual schema inspection found `nd_beltinci` / ND Beltinci plus preserved `club_settings`; all core runtime tables already existed. Migration `002_runtime_order_items.sql` adds only season order-item support and optional seller attribution. Runtime cutover is not yet complete: no PASS claim is made until all remaining legacy mutation routes and integration/restart tests are converted.

### MariaDB cutover verification update

Verified in this iteration: `003_season_entitlement_units.sql` applied; `db:seed` populated development MariaDB fixtures and the €120 product; three MariaDB-backed staff accounts logged in successfully; DB-layer typecheck passed with no `@ts-nocheck`/`@ts-ignore` directive; build and diff checks passed. The legacy JSON-array domain tests are now stale and two fail because the test-only `seed()` no longer supplies runtime fixtures. The required direct database season-unit/idempotency, restart, tenant, capacity-race, and browser-flow evidence is still outstanding, so the cutover remains FAIL/PARTIAL.

Follow-up verification: season checkout now creates a relational `SEASON` order item and payment fulfillment inserts `order_item_id` plus deterministic units 1..N under the `(order_item_id, unit_number)` unique index. A direct MariaDB concurrent-callback check for a quantity-three purchase returned exactly units `[1,2,3]` under one order item. `npm test` was repaired without restoring JSON runtime: its in-memory fixture is now explicitly test-only. `npm test`, typecheck, build, diff check, and dependency audit passed. The full HTTP restart/capacity/tenant/browser matrix remains unverified.
