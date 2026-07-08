import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../resources/views/dashboard.html", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../public/assets/app.js", import.meta.url), "utf8");
const docs = fs.readFileSync(new URL("../docs/api-endpoints.md", import.meta.url), "utf8");

for (const text of [
  "FieldOps Margin Control",
  "Margin Heatmap",
  "Open work orders timeline",
  "Automation suggestions",
  "SLA Queue",
  "Pending invoices"
]) {
  assert.ok(html.includes(text), `HTML should include ${text}`);
}

for (const endpoint of [
  "/api/summary",
  "/api/projects",
  "/api/work-orders",
  "/api/invoices",
  "/api/automations/run"
]) {
  assert.ok(app.includes(endpoint) || docs.includes(endpoint), `${endpoint} must be implemented/documented`);
}

assert.ok(app.includes("Auto Dispatch") || html.includes("Auto Dispatch"));
assert.ok(app.includes("fetch("), "frontend must call the PHP API");

console.log("Smoke test OK: dashboard shell, API wiring and docs are present.");
