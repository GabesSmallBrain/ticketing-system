# Reference-faithful redesign queue

Status labels: `COMPLETE`, `IN PROGRESS`, `QUEUED`, `BLOCKED`.

1. **POS `/admin/blagajna` — IN PROGRESS.** Full-bleed layout, catalogue/basket geometry, live ticket quantities and payment actions are rebuilt. Next: header/printer/cash affordances where supported, 1600×1432 comparison.
2. **Public purchase `/vstopnice/:slug` — COMPLETE / REFERENCE MATCHED.** Iterations 4–7 added the real-data club/fixture hero split, real upcoming-event cards, stadium/sector grouping, and the measured 917px grid. Final reference viewport capture: `/tmp/ref02-implementation-v7.png`; diff: `/tmp/ref02-diff-v7.png`; AE 138525 / 8.67%. Measured geometry now matches the reference’s 29px gutters, 257px hero, 495px selector, 16px gutter, and 348px sticky basket. Remaining delta is limited to unavoidable real fixture/category data, the intentionally supporter-only public navigation, and font rasterization. Focused public regression: 4/4 passed. Next: Reference 03 digital ticket.
3. **Digital ticket `/vstopnica/:id` — QUEUED.** Reconstruct voucher plus right operational column without fake wallet features.
4. **Mobile scanner `/scanner` — IN PROGRESS.** Reference mobile chrome CSS staged; preserve camera, parser, admission portal and confirm lock.
5. Shared tokens/components — QUEUED.
6. Public inferred routes `/`, `/vstopnice`, `/kosarica`, `/checkout`, `/nakup/uspesen`, `/moje-vstopnice`, `/sezonske` — QUEUED.
7. Staff inferred routes `/prijava-za-osebje`, `/admin`, `/admin/tekme`, `/admin/tekme/:id`, `/admin/vstopnice`, `/admin/porocila` — QUEUED.
8. `/admin/osebje` — BLOCKED: no route, server API, or staff-domain model exists; do not fabricate it.
9. Legacy visual sweep — QUEUED.
10. Responsive/screenshot QA and full functional regression — QUEUED.

Reference-native screenshots are retained outside the repository under `/tmp`; source images remain in the supplied downloads directory and are not copied into application assets.
