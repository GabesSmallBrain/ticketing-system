# Frontend modernization decision

## A — retain the vanilla frontend

Keep the current server-rendered SPA assets and reproduce only the interaction
patterns required by operations: scanner onboarding, dialog, toast, data table,
and staff forms. This has the lowest deployment and routing risk because the
Node server already owns direct-route fallback and Playwright coverage. Cult UI
and Watermelon components cannot be directly consumed: both target React.

## B — deliberate React migration

Move `src/web` to a Vite React application while retaining the HTTP API and
domain service boundaries. This enables direct use of Cult UI/shadcn and
Watermelon catalog source, but requires reimplementing routes, accessibility,
scanner camera lifecycle, visual regression coverage, build output handling,
and Hostinger static-asset integration. It should be a separately planned
migration after production persistence and payment infrastructure are stable.

## Recommendation

Choose A for the production-foundation milestone. It minimizes security and
release risk, preserves backend/API reuse, and avoids a frontend rewrite while
the application is moving from JSON state to PostgreSQL. Reassess B after the
first authenticated production release.

## Catalog evidence

On 2026-09-17, the Watermelon hosted Streamable HTTP MCP endpoint accepted an
`initialize` JSON-RPC request at `https://mcp.watermelon.sh/mcp` and identified
itself as `watermelon-mcp` 2.0.0. It exposes `catalog_summary`,
`list_catalog_entries`, and `get_catalog_entry` (plus source discovery tools).
Ruflo 3.40.0 in this workspace exposes only local MCP server management; it
cannot register an outbound Streamable HTTP MCP catalog. A future React
migration can use the hosted endpoint directly from an MCP-capable client.
