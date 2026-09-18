# Reference-faithful redesign queue

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
3. **Digital ticket `/vstopnica/:id` — REFERENCE MATCHED (old Reference 03).** Iterations 1–4 rebuilt the real-ticket voucher, QR quiet zone, data tiles, and right-hand status/details panels. Valid top-of-page capture: `/tmp/ref03-implementation-v4.png`; diff: `/tmp/ref03-diff-v4.png`; AE 169558 / 7.75%. The measured 1367px geometry is aligned: 85px header, x44/812 734px + 34px + 512px grid, y250 voucher/panel start, 110px band, QR at y762, and voucher bottom at y1280. Remaining visual differences are deliberately omitted mock wallet/gate/sponsor controls and public-only navigation, not a second fake operational system.
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
| `/vstopnica/:id` | old Reference 03 | IN PROGRESS |
| `/sezonske` | inferred public | NOT STARTED |
| `/prijava-za-osebje` | inferred staff | NOT STARTED |
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
| `/vstopnica/:id` | `digitalna_vstopnica_in_qr_koda`, `04_digitalna_vstopnica_qr_mobilna` | PASS | previously matched | NOT STARTED | existing ticket tests | preserve QR. |
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
