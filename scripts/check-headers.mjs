import { apiOrigins } from "../deploy/apiEnv.ts";
import { buildHeaders } from "../deploy/securityHeaders.ts";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/check-headers.mjs <url>");
  process.exit(2);
}

const expected = buildHeaders({ apiOrigins: apiOrigins(process.env) });
const res = await fetch(url);
const bad = Object.entries(expected).filter(([name, want]) => res.headers.get(name) !== want);
for (const [name, want] of bad) console.error(`${name}\n  want: ${want}\n  got:  ${res.headers.get(name)}`);
console.log(bad.length ? `${bad.length} header(s) wrong` : "all security headers present");
process.exit(bad.length ? 1 : 0);
