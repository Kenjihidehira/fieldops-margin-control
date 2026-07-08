import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "public/index.php",
  "resources/views/dashboard.html",
  "resources/ts/app.ts",
  "public/assets/styles.css",
  "data/seed.json",
  "src/Controllers/ApiController.php",
  "src/Services/MarginControlService.php",
  "src/Data/FieldOpsRepository.php",
  "src/Support/Response.php",
  "docs/api-endpoints.md",
  "docs/dashboard-preview.svg",
  "README.md",
  "Dockerfile"
];

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(new URL(`../${file}`, import.meta.url)), `${file} is missing`);
}

const phpFiles = requiredFiles.filter((file) => file.endsWith(".php"));
for (const file of phpFiles) {
  const content = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.match(content, /declare\(strict_types=1\)/, `${file} must use strict types`);
  assert.equal((content.match(/\{/g) || []).length, (content.match(/\}/g) || []).length, `${file} has unbalanced braces`);
}

const css = fs.readFileSync(new URL("../public/assets/styles.css", import.meta.url), "utf8");
assert.ok(css.includes("@media (max-width: 820px)"), "responsive mobile breakpoint is required");
assert.ok(css.includes("--green") && css.includes("--coral") && css.includes("--cyan"), "dashboard palette tokens are missing");

const build = spawnSync(process.execPath, ["scripts/build-ts.mjs"], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8"
});
assert.equal(build.status, 0, build.stderr || build.stdout);

const check = spawnSync(process.execPath, ["--check", "public/assets/app.js"], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8"
});
assert.equal(check.status, 0, check.stderr || check.stdout);

console.log("Static checks OK: project files, PHP structure, CSS and built JS are valid.");
