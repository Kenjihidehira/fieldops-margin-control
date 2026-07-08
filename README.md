# FieldOps Margin Control

Commercial PHP + TypeScript dashboard for construction and field-service companies that need to protect project margin while coordinating crews, materials, work orders and invoices.

This is a portfolio-grade business system, not a tutorial scaffold. It demonstrates a PHP API organized with controller/service/repository layers and a TypeScript frontend that consumes live endpoints.

## Business Value

Field-service companies often lose margin through delayed work orders, material shortages, underused crews and slow invoicing. This app gives an operations manager one control tower for:

- Project margin forecast and margin-at-risk visibility
- Crew utilization monitoring
- SLA delay alerts
- Material shortage impact
- Work-order filtering
- Invoice readiness
- Simulated automation batches for purchasing, billing and dispatch

## Stack

- PHP 8.2+ with a lightweight MVC-style API
- TypeScript frontend source in `resources/ts/app.ts`
- Compiled browser module in `public/assets/app.js`
- CSS dashboard system in `public/assets/styles.css`
- JSON seed data in `data/seed.json`
- Node-based validation scripts without external packages
- Dockerfile for PHP runtime deployment

## Screens / Preview

Preview asset:

```text
docs/dashboard-preview.svg
```

Primary UI:

- KPI strip for margin, risk, crew utilization, work orders, materials and invoices
- Project margin board with risk rail
- Alert queue
- Automation suggestions
- Work-order and invoice tables

## API Endpoints

Documented in:

```text
docs/api-endpoints.md
```

Key endpoints:

- `GET /api/health`
- `GET /api/summary`
- `GET /api/projects`
- `GET /api/work-orders`
- `GET /api/invoices`
- `GET /api/alerts`
- `GET /api/automations`
- `POST /api/automations/run`

## Run Locally

Install PHP 8.2+.

```bash
php -S 127.0.0.1:8080 -t public
```

Open:

```text
http://127.0.0.1:8080
```

## Build TypeScript

This repository intentionally avoids npm dependencies. The build script transpiles the project TypeScript source used here into a browser module.

```bash
node scripts/build-ts.mjs
```

## Validation

```bash
node scripts/build-ts.mjs
node tests/business-rules.test.mjs
node tests/static-check.test.mjs
node tests/smoke.test.mjs
```

If PHP is available:

```bash
composer run lint
php -S 127.0.0.1:8080 -t public
```

## Docker

```bash
docker build -t fieldops-margin-control .
docker run --rm -p 8080:8080 fieldops-margin-control
```

## Commercial Differentials

- Practical financial operations domain, useful in freelance proposals
- API-first backend structure that can evolve into Laravel
- TypeScript frontend with real filtering and automation state
- Seed data models project economics, work orders, materials, invoices and crews
- Demo-safe automation simulation without external services or secrets

## Possible Improvements

- Replace JSON seed with MySQL/PostgreSQL
- Add Laravel migration/controllers if Composer is available
- Add authentication and role-based permissions
- Add PDF invoice export
- Add webhook integrations for QuickBooks, Slack or WhatsApp
- Add queue worker for real automation dispatch
