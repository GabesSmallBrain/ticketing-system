# Reference-faithful redesign queue

Status labels: `NOT STARTED`, `IN PROGRESS`, `REFERENCE MATCHED`, `INFERRED DESIGN COMPLETE`, `BLOCKED`.

1. **POS `/admin/blagajna` — IN PROGRESS.** Full-bleed layout, catalogue/basket geometry, live ticket quantities and payment actions are rebuilt. Next: header/printer/cash affordances where supported, 1600×1432 comparison.
2. **Public purchase `/vstopnice/:slug` — COMPLETE / REFERENCE MATCHED.** Iterations 4–7 added the real-data club/fixture hero split, real upcoming-event cards, stadium/sector grouping, and the measured 917px grid. Final reference viewport capture: `/tmp/ref02-implementation-v7.png`; diff: `/tmp/ref02-diff-v7.png`; AE 138525 / 8.67%. Measured geometry now matches the reference’s 29px gutters, 257px hero, 495px selector, 16px gutter, and 348px sticky basket. Remaining delta is limited to unavoidable real fixture/category data, the intentionally supporter-only public navigation, and font rasterization. Focused public regression: 4/4 passed. Next: Reference 03 digital ticket.
3. **Digital ticket `/vstopnica/:id` — REFERENCE MATCHED (old Reference 03).** Iterations 1–4 rebuilt the real-ticket voucher, QR quiet zone, data tiles, and right-hand status/details panels. Valid top-of-page capture: `/tmp/ref03-implementation-v4.png`; diff: `/tmp/ref03-diff-v4.png`; AE 169558 / 7.75%. The measured 1367px geometry is aligned: 85px header, x44/812 734px + 34px + 512px grid, y250 voucher/panel start, 110px band, QR at y762, and voucher bottom at y1280. Remaining visual differences are deliberately omitted mock wallet/gate/sponsor controls and public-only navigation, not a second fake operational system.
4. **Mobile scanner `/scanner` — IN PROGRESS.** Reference mobile chrome CSS staged; preserve camera, parser, admission portal and confirm lock.
5. **Admin dashboard `/admin` — NOT STARTED (new Reference 05).** Direct 1488×1600 dashboard reference.
6. **Admin match list `/admin/tekme` — NOT STARTED (new Reference 06).** Direct 1180×1600 management reference.
7. **Admin ticket management `/admin/vstopnice` — NOT STARTED (new Reference 08).** Direct 1138×1600 ticket search/status reference.
8. **Admin orders list `/admin/narocila` — BLOCKED (new Reference 07).** No route or authorized list API exists. `/narocilo/:id` remains an inferred detail route, not a reason to fabricate a dashboard.
9. Shared tokens/components — NOT STARTED.
10. Public inferred routes `/`, `/vstopnice`, `/kosarica`, `/checkout`, `/nakup/uspesen`, `/moje-vstopnice`, `/sezonske` — NOT STARTED.
11. Staff inferred routes `/prijava-za-osebje`, `/admin/tekme/:id`, `/admin/porocila`, `/narocilo/:id` — NOT STARTED.
12. `/admin/osebje` — BLOCKED: no route, server API, or staff-domain model exists; do not fabricate it.
13. Legacy visual sweep — NOT STARTED.
14. Responsive/screenshot QA and full functional regression — NOT STARTED.

## Route matrix

| Route | Reference source | Status |
| --- | --- | --- |
| `/` | inferred public | NOT STARTED |
| `/vstopnice` | inferred public | NOT STARTED |
| `/vstopnice/:slug` | old Reference 02 | REFERENCE MATCHED |
| `/kosarica` | inferred public | NOT STARTED |
| `/checkout`, `/placilo/:id`, `/nakup/uspesen` | inferred public | NOT STARTED |
| `/moje-vstopnice` | inferred ticket | NOT STARTED |
| `/vstopnica/:id` | old Reference 03 | IN PROGRESS |
| `/sezonske` | inferred public | NOT STARTED |
| `/prijava-za-osebje` | inferred staff | NOT STARTED |
| `/admin` | new Reference 05 | NOT STARTED |
| `/admin/tekme` | new Reference 06 | NOT STARTED |
| `/admin/tekme/:id` | inferred staff | NOT STARTED |
| `/admin/blagajna` | old Reference 01 | IN PROGRESS |
| `/admin/vstopnice` | new Reference 08 | NOT STARTED |
| `/admin/porocila` | inferred staff | NOT STARTED |
| `/narocilo/:id` | inferred from new Reference 07 | NOT STARTED |
| `/admin/narocila`, `/admin/osebje` | new Reference 07 / no application route | BLOCKED |
| `/scanner` | old Reference 04 | IN PROGRESS |

Reference-native screenshots are retained outside the repository under `/tmp`; source images remain in the supplied downloads directory and are not copied into application assets.

## Resumable handoff

**LAST COMPLETED:** Reference 04 iteration 3 active-view geometry correction; the live scanner header now also renders the authenticated role/connection state without changing admission behavior.

**CURRENT ROUTE:** `/scanner` — old Reference 04, IN PROGRESS.

**CURRENT ITERATION:** iteration 3 captured successfully at 544×1600: `/tmp/ref04-implementation-v3.png`; diff: `/tmp/ref04-diff-v3.png`; AE 124149 / 14.26% (improved from 20.14%). Header identity/status markup was added after that capture. Headless Chromium correctly reaches the real scanner active view, but cannot supply a camera stream, so the honest fallback message is present. No scanner-domain logic changed.

**REMAINING VISUAL DIFFERENCES:** the measured 145px header / y167 177px gate card / y356 357px camera geometry now aligns. Remaining differences are the sparse scanner header identity, the unsupported headless-camera fallback versus a real video stream, and the reference’s inline accepted mock card (the product correctly retains a blocking body-portal result). Manual-entry and bottom control density still need reference-derived polish.

**NEXT EXACT ACTION:** restart the local server after the latest build in a persistent PTY, then use a short-timeout Playwright sequence: `/demo-login` → third role button → select `VHOD 3` → `ZAČNI SKENIRANJE` → `ROČNI VNOS KODE` → submit `ndb_Iqerly2raPmLUR4nRsfn2hLTAkmsLbQE`; capture `/tmp/ref04-result-v4.png` at 544×1600 and inspect the real blocking alertdialog.
