import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../public/demo/index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../public/demo/assets/app.js", import.meta.url), "utf8");

test("a navegacao aponta para secoes reais e as filas podem ser limpas", () => {
  for (const target of ["#cockpit", "#margin-map-section", "#sla-queue", "#projects", "#work-orders", "#billing"]) {
    assert.match(html, new RegExp(`href=["']${target}["']`));
  }
  assert.match(html, /id="clearProjectFilter"/);
  assert.match(html, /id="clearOrderFilters"/);
  assert.doesNotMatch(html, /id="companyFilter"|id="periodFilter"/);
});

test("a demo nao usa persistencia local no navegador", () => {
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
});
