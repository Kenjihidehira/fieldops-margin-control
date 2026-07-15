import assert from "node:assert/strict";
import test from "node:test";
import seed from "../data/seed.json" with { type: "json" };
import { applyAction, buildDashboard, cloneSeed, normalizeState } from "../lib/domain.js";

test("dashboard calcula margem, SLA e caixa", () => {
  const dashboard = buildDashboard(cloneSeed(seed));
  assert.equal(dashboard.projects.projects.length, seed.projects.length);
  assert.ok(dashboard.summary.marginAtRisk > 0);
  assert.ok(dashboard.alerts.alerts.length > 0);
});

test("filtros de ordem sao combinados", () => {
  const params = new URLSearchParams({ priority: "critical", search: "P-10008" });
  const dashboard = buildDashboard(cloneSeed(seed), params);
  assert.equal(dashboard.workOrders.count, 1);
});

test("despacho registra auditoria sem resolver ordem automaticamente", () => {
  const original = cloneSeed(seed);
  const next = applyAction(original, { action: "run_automations" });
  assert.deepEqual(next.workOrders, original.workOrders);
  assert.ok(next.lastAutomation.sent > 0);
});

test("estado invalido e acao desconhecida sao tratados", () => {
  assert.deepEqual(normalizeState({}, seed), seed);
  assert.throws(() => applyAction(cloneSeed(seed), { action: "close_all" }), /nao suportada/);
});
