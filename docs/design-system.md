# Beltinci Matchday OS design system

Source: Stitch project **ND Beltinci Matchday Ticketing** (project `10115400894221031122`), inspected 17 September 2026.

## Reference screens

| Stitch reference | Used for |
| --- | --- |
| Javna trgovina in nakup vstopnic | public header, fixture hierarchy, ticket selectors, basket and checkout |
| Digitalna vstopnica in QR koda | wallet, ticket stub, QR treatment and ticket metadata |
| Fizična blagajna (POS) | high-density sale workspace, large quantity controls and payment total |
| Skener vstopnic na vhodu | camera workspace, validation state and admission details |
| Administratorski nadzorni center in poročila | operational navigation, metric cards, compact table/filter and activity patterns |
| Predogled tiskanja vstopnic | voucher/stub and print-safe ticket patterns |
| crest asset | compact club-mark treatment |

## Tokens

- Canvas `#f9f9ff`; layered surfaces `#ffffff`, `#f0f3ff`, `#e7eeff`, `#dee8ff`; structural border `#d3c5ac` / `#cbd5e1`.
- Ink `#111c2d`; muted ink `#4f4633`; midnight `#0f172a` / `#263143`.
- Strike yellow `#eab308` (dark text); yellow-dark `#785a00`; success pitch green `#10b981`; warning `#f59e0b`; danger `#ef4444`.
- Headlines: Barlow Condensed, 700–800, uppercase. Body: Work Sans. Operational references and money: JetBrains Mono. System fallbacks are retained because the CSP deliberately allows only same-origin assets.
- Eight-point rhythm: 4, 8, 16, 24, 36 and 56px. Desktop outer margin 40px; mobile gutter 16px.
- Tight 4px controls, 8px large modules, full pills only for statuses. Cards use crisp 1px containment, not soft floating shadows. Active ticket/modals may use the MCP's directional navy `8px 8px 0` shadow.

## Component rules

- **Public header:** dark matchday bar; only supporter navigation plus a secondary staff-login link.
- **Staff shell:** midnight operational bar/rail, yellow active indicator, contextual actions and monospaced metadata. It is never shown in the public shell.
- **Buttons:** yellow primary, midnight secondary, white outlined tertiary; minimum 48px hit area. Labels are condensed uppercase.
- **Inputs/tables:** heavy pale-slate border; midnight 2px focus ring with yellow halo; labels are uppercase condensed/monospaced.
- **Cards/tickets:** square-ish modules with strong top/rule accents. Digital tickets use a perforated dashed divider and side cut-outs. QR is always black on a white, padded field.
- **Status:** green valid/open, red rejected/cancelled, amber pending, slate used/neutral. Status always pairs color with text.
- **Scanner:** true camera video sits in a dark viewport; successful/rejected decisions are a body-portal, fixed fullscreen alert dialog. The dialog is the interaction lock and is dismissed only by POTRDI.

## Responsive rules

Public purchase, wallet and scanner begin as one column at 320px. At 640px modules can split; at 1024px checkout/POS use a sticky summary/panel. Tables become labelled card rows on narrow screens. No primary action is hidden behind horizontal scrolling. Scanner controls keep 48px targets and full-width confirmation on phones.

## Route mapping

Direct MCP references: public purchase (`/`, `/vstopnice`, `/vstopnice/:slug`, `/kosarica`, `/checkout`, `/placilo/:id`, `/nakup/uspesen`), wallet (`/moje-vstopnice`, `/vstopnica/:id`), POS (`/admin/blagajna`), scanner (`/scanner`).

Inferred from the same component vocabulary: `/sezonske`, `/prijava-za-osebje`, `/admin`, `/admin/tekme`, `/admin/tekme/:id`, `/admin/vstopnice`, and `/admin/porocila`. There is no current `/admin/osebje` implementation or API, so it is not represented as a fake screen.
