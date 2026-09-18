# Hostinger deployment

This archive is a Node.js application, not a static site. It requires a managed
PostgreSQL instance reachable through `DATABASE_URL`; JSON files are not a
production datastore.

In Hostinger hPanel, create a **Node.js Web App** (not a static website/Website Builder entry) and upload this archive or connect its contents to a Git repository. Attach the intended hostname to that Node.js app; a static Hostinger site cannot serve this application's API or direct-route fallback.

Use:

```text
Node.js: 22.x
Build command: npm install --include=dev
Build command: npm run build
Start command: npm run start
Entry file: dist/server.js
NODE_ENV: production
```

Set `PORT` only if Hostinger supplies one. Do not upload an `.env` file or any API keys.
Set secrets in hPanel: `DATABASE_URL`, `SESSION_SECRET` (32+ random bytes),
`APP_ORIGIN`, `PAYMENT_PROVIDER`, and `PAYMENT_WEBHOOK_SECRET`. The process
fails at startup in production when any is absent or `PAYMENT_PROVIDER=demo`.

Run `npm run db:migrate` exactly once against the production database, then run
`npm run create-admin` with one-time `BOOTSTRAP_ADMIN_EMAIL`,
`BOOTSTRAP_ADMIN_PASSWORD` (14+ characters), `BOOTSTRAP_ADMIN_NAME`, and
`BOOTSTRAP_CLUB_ID` environment values. Remove those bootstrap values after a
successful run. There is no public staff registration path.

`npm run build` creates one coherent production artifact: `dist/` contains the
compiled Node server and a complete copied `dist/web/` static tree. Upload the
entire freshly built project (including `dist/web`, `package.json`, and the
lockfile), or let hPanel run the build command from a clean Git checkout. Do
not upload the historical `nd-beltinci-hostinger-upload.zip`, individual CSS
files, or a `dist/` directory from a different build: `dist/server.js` serves
`dist/web` in production. Replace the whole deployment directory atomically
and restart the Node app after deployment.

Verify after deploy in a fresh browser context: `/public.css`, `/public.js`,
`/home.css`, `/mobile-nav.css`, and `/assets/clubs/ns-mura.png` must all return
200 with their correct MIME types. The static server sets `nosniff`, so HTML
fallback responses for CSS or JavaScript are deployment blockers.

Deploy a staging application first with a separate database, non-production
payment credentials, staff test accounts, HTTPS, and an authorized Strix target.
