# Hostinger deployment

This archive is a Node.js application, not a static site.

In Hostinger hPanel, create a **Node.js Web App** (not a static website/Website Builder entry) and upload this archive or connect its contents to a Git repository. Attach the intended hostname to that Node.js app; a static Hostinger site cannot serve this application's API or direct-route fallback.

Use:

```text
Node.js: 22.x
Build command: npm install --include=dev
Start command: npm run start
Entry file: dist/server.js
NODE_ENV: production
```

Set `PORT` only if Hostinger supplies one. Do not upload an `.env` file or any API keys.

The application writes demo state to `data/demo.json`, so that directory must remain writable. This is a demonstration system only: payments and staff authentication are simulated, and its JSON data store is not suitable for real ticket sales.
