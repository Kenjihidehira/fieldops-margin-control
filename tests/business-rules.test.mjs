import assert from "node:assert/strict";
import fs from "node:fs";

const seed = JSON.parse(fs.readFileSync(new URL("../data/seed.json", import.meta.url), "utf8"));

function enrichProject(project) {
  const forecastMargin = ((project.contractValue - project.forecastCost) / project.contractValue) * 100;
  const targetDollars = project.contractValue * (project.marginTarget / 100);
  const forecastDollars = project.contractValue - project.forecastCost;
  return {
    ...project,
    forecastMargin: Number(forecastMargin.toFixed(1)),
    marginAtRisk: Math.max(0, Math.round(targetDollars - forecastDollars))
  };
}

const projects = seed.projects.map(enrichProject);
const contractValue = projects.reduce((total, project) => total + project.contractValue, 0);
const forecastCost = projects.reduce((total, project) => total + project.forecastCost, 0);
const totalMarginPercent = Number((((contractValue - forecastCost) / contractValue) * 100).toFixed(1));
const materialShortages = seed.materials.filter((material) => material.available < material.minimum);
const delayedOrders = seed.workOrders.filter((order) => order.sla !== "on_track");
const readyInvoices = seed.invoices.filter((invoice) => invoice.state === "ready");

assert.equal(projects.length, 6, "expected six commercial demo projects");
assert.equal(totalMarginPercent, 12.8, "a margem do portfólio deve corresponder à economia dos dados de exemplo");
assert.equal(materialShortages.length, 4, "material shortage count should be commercially relevant");
assert.equal(delayedOrders.length, 3, "SLA queue should include breached and at-risk work orders");
assert.equal(readyInvoices.length, 3, "billing automation needs ready invoices");
assert.ok(projects.some((project) => project.marginAtRisk > 90000), "must expose high margin-at-risk project");

console.log("Business rules OK: margin, SLA, material and billing scenarios are coherent.");
