# API Endpoints

Base URL when running locally:

```text
http://127.0.0.1:8080
```

## Health

```http
GET /api/health
```

Returns service status.

## Summary

```http
GET /api/summary
```

Returns portfolio-level KPIs: margin percent, margin dollars, margin at risk, crew utilization, work-order count, material shortages, invoice value and SLA delays.

## Projects

```http
GET /api/projects
```

Returns enriched project economics with forecast margin, forecast profit, margin gap, margin at risk and health score.

## Work Orders

```http
GET /api/work-orders?status=all&priority=all&search=riverside
```

Supported query params:

- `status`: `all`, `in_progress`, `waiting_parts`, `scheduled`, `blocked`
- `priority`: `all`, `critical`, `high`, `medium`, `low`
- `search`: free-text match across work order, project and customer

## Invoices

```http
GET /api/invoices?state=ready
```

Supported states: `all`, `ready`, `overdue`, `draft`.

## Alerts

```http
GET /api/alerts
```

Returns operational alerts combining SLA, material, budget, crew and billing risk.

## Automation Suggestions

```http
GET /api/automations
```

Returns simulated automation opportunities for purchasing, billing and dispatch.

## Run Automations

```http
POST /api/automations/run
Content-Type: application/json

{"limit":3}
```

Returns a simulated batch result. This is intentionally a demo-safe operation and does not send external messages.
