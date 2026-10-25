import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  [/localhost:40\d\d/, "dev API fallback URL"],
  [/VITE_ADMIN/, "admin credential variable"],
  [/internal-dev-key/, "dev internal API key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/sourceMappingURL=/, "source map reference"],
];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const problems = [];
for (const file of walk(process.argv[2] ?? "dist")) {
  if (file.endsWith(".map")) problems.push(`${file}: source map shipped`);
  if (!/\.(js|css|html)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [re, why] of FORBIDDEN) if (re.test(text)) problems.push(`${file}: ${why}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("bundle clean");
