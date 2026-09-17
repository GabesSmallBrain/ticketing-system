# Authorized Strix workflow

Use the current Strix project at <https://github.com/usestrix/strix>, not the
archived `strixproject/Strix` repository. It requires Docker, a supported LLM
credential, and an authorized target. Install according to the official
quickstart, configure `STRIX_LLM` and `LLM_API_KEY` (or use its supported auth
flow), then run only against staging:

```bash
strix -n --target https://staging.example.invalid
```

Use a staging database, test-only staff accounts and tickets, HTTPS, and no
production payment credentials. Review `strix_runs/*/run.json`; reproduce each
finding, classify it, fix verified findings, add a regression test, and rerun.
The non-interactive exit code is not enough evidence by itself.

This workspace has neither the `strix` executable nor Docker, and no authorized
staging URL or LLM credentials. Therefore no Strix scan has been performed.
