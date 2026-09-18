# NZS fixture integration preparation

## Official source inspected

The official NZS ND Beltinci fixture page is:

`https://www.nzs.si/klubi/moski/2-slovenska-nogometna-liga/klubi/nd-beltinci/tekme`

The page is server-rendered HTML. It exposes upcoming and completed 2026/27
fixtures with club names, competition, round, date/time where published, venue,
and links to an official match-detail URL. Completed match details additionally
show status/result and may show attendance. No documented, stable public API or
numeric match identifier was found during this research pass.

## Retrieval recommendation

Use the official HTML list and detail URLs as the initial read-only source. Do
not scrape on page load, bypass access controls, or make NZS the ticketing
authority. Cache a successful pull, use conditional/low-frequency fetches, and
stop a run on structural parse errors rather than applying partial updates.

The canonical external reference should be the NZS detail URL, not an opponent
name or a URL slug parsed into local business identity. The detail URL carries
the competition/season/fixture context and should be stored alongside the
source name when import support is implemented.

## Available football facts

- competition and season (`2. SNL 26/27`)
- round
- home and away club names
- kickoff date/time when scheduled
- venue
- official detail URL
- match status and score for completed matches
- attendance when published on the detail page

## Proposed mapping and ownership

First implement an import-preview/staging record keyed by:

```text
external_source = NZS
external_match_url = canonical NZS detail URL
```

Match a local event only after a staff member confirms the candidate using the
full fixture tuple: competition/season, home club, away club, and kickoff. Do
not match on opponent name alone. If a later schema addition is justified,
`events` may retain the approved source, canonical URL, and last-sync timestamp;
keep external round, result, and source payload in a separate fixture metadata
record rather than expanding ticketing state.

NZS may propose football metadata (clubs, kickoff, venue, round, status, and
result). The club remains authoritative for ticket types, capacity, sales
windows, prices, orders, payments, ticket issuance, complimentary issuance, and
admissions. A kickoff/venue change must be shown as a pending update for staff
review; it must not silently overwrite club-controlled ticket configuration.

## Failure and next step

On fetch, parse, or identity ambiguity failure: retain the last accepted
fixture metadata, record the failure for staff visibility, and make no event
changes. The next implementation should be a staff-reviewed import preview for
one season, with fixture metadata isolated from the ticketing event model. Do
not add a scheduled synchronizer until that review flow and conflict policy are
tested.
