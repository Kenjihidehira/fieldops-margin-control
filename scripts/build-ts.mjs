import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "resources", "ts", "app.ts");
const targetPath = path.join(root, "public", "assets", "app.js");

let source = fs.readFileSync(sourcePath, "utf8");

source = source
  .replace(/type\s+\w+\s*=\s*\{[\s\S]*?\};\n\n/g, "")
  .replace(/\?: RequestInit/g, "")
  .replace(/: DashboardState/g, "")
  .replace(/: Project\[\]/g, "")
  .replace(/: Project/g, "")
  .replace(/: HTMLElement/g, "")
  .replace(/: string/g, "")
  .replace(/: number/g, "")
  .replace(/: void/g, "")
  .replace(/: Promise<any>/g, "")
  .replace(/: Promise<void>/g, "")
  .replace(/: RequestInit/g, "")
  .replace(/: any/g, "")
  .replace(/ as HTMLElement/g, "")
  .replace(/ as HTMLSelectElement/g, "")
  .replace(/ as HTMLInputElement/g, "");

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, source);
console.log(`Built ${path.relative(root, targetPath)}`);
