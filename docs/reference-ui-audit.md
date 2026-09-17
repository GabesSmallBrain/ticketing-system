# Reference UI audit

The four supplied images were visually inspected at native resolution on 17 September 2026. They supersede all prior visual directions.

## Reference 01 — physical box office

- **Target route:** `/admin/blagajna`; **viewport:** 1600 × 1432 desktop.
- **Canvas:** near-black blue `#071225`; header `#050b14`; panels `#101c31` / `#17243a`; cards are subtly lighter than canvas.
- **Header/navigation:** 100px global bar, logo at x50, current-match capsule at x277, condensed uppercase navigation, person identity at right. A 72px status strip follows.
- **Main grid:** 860px ticket catalogue left, 602px sticky basket right; 50px page gutter; 20px gutters. Catalogue starts with a 36px condensed heading; four 419 × 200 category cards form two columns, followed by a full-width special category and printer strip.
- **Basket:** 602px wide dark panel, about 890px tall. It contains order rows, a 118px total slab, payment segmented control, quick cash chips, green change slab and a 80px yellow completion control.
- **Typography:** Barlow Condensed heavy all-caps for headings/actions; Work Sans for body; narrow/mono numerals. White primary text, muted slate labels, yellow price/primary actions, blue quantity/payment selection, emerald success, red exception.
- **Geometry:** 12–14px large-card radius; 8px controls; no soft gradients; dark structural borders and shallow shadows only.
- **Special interactions:** quantity controls are 62px square tap targets; basket remains visible while the catalogue scrolls. Cash/change controls shown by the reference are not implemented unless backed by data.

## Reference 02 — public ticket purchase

- **Target route:** `/vstopnice/:slug` (also establishes public header and checkout components); **viewport:** 917 × 1600 portrait.
- **Canvas/header:** same midnight canvas and compact 57px dark global header; selected public tab is an electric-blue 48px button.
- **Content:** 29px side gutters; large 888 × 257 hero/fixture at top, then a 2:1 selection/basket split. Category groups use 495px wide dark cards; summary is 348px sticky card.
- **Components:** yellow 4px price/actions, blue tab/quantity buttons, stacked information strip, compact upcoming-match cards, deep footer.
- **Mobile behavior:** the supplied portrait composition keeps the order summary as the second column-sized module; at phone widths it must become a fixed/cart-first action rather than overflow.

## Reference 03 — digital ticket

- **Target route:** `/vstopnica/:id`; **viewport:** 1367 × 1600 desktop.
- **Canvas/header:** midnight full-bleed, 85px header. Large page title at x43/y168; wallet tabs at upper right.
- **Grid:** 734px ticket area plus 513px information/action column; 34px gutter. Ticket uses a dark, perforated voucher with a 110px blue-to-yellow band, data tiles, dashed divider and an isolated white QR quiet-zone.
- **Typography/colors:** same family; oversized `DIGITALNA VSTOPNICA & QR`, yellow data emphasis, emerald status pill. White QR field is the only bright ticket field.
- **Fixed/sticky:** no fake wallet, NFC, delivery, queue, or sponsor interactions are to be added without backend support.

## Reference 04 — mobile scanner

- **Target route:** `/scanner`; **viewport:** 544 × 1600 mobile.
- **Canvas:** white top chrome with a dark operational camera and gate card; 22px horizontal gutter.
- **Header:** 145px tall compact scanner identity/status area. Gate selector is 238 × 39 at left; online/battery/actor appear at right.
- **Main:** dark gate context card, 357px scanner viewport with dotted grid/yellow crosshair, then a high-priority result module. Green accepted header transitions to a white result body.
- **Controls:** 48px+ manual entry and confirmation targets; mobile bottom navigation. The real video replaces only the simulated scan preview—the frame, dimensions and foreground result hierarchy remain.
- **Special interaction:** scanning pauses before validation; the result is a fixed body portal above all camera/navigation layers and requires `POTRDI` before rearming.

## Shared reconstruction tokens

`--ref-canvas #071225`, `--ref-header #050b14`, `--ref-panel #101c31`, `--ref-panel-raised #1d2a40`, `--ref-border #22324c`, `--ref-blue #0f6edc`, `--ref-yellow #ffd21f`, `--ref-green #00e58c`, `--ref-red #ff4d55`, `--ref-muted #8190a8`. Use 8px spacing rhythm, 12px panel radius, 8px controls, and only tight structural shadowing.
