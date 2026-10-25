import { apiOrigins } from "./apiEnv.ts";
import { buildHeaders } from "./securityHeaders.ts";

const origins = apiOrigins(process.env);
const insecure = origins.filter((o) => !o.startsWith("https://"));
if (insecure.length) throw new Error(`Production CSP needs https:// API origins, got: ${insecure.join(", ")}`);

const h = buildHeaders({ apiOrigins: origins });
const custom = ["Permissions-Policy", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy"] as const;

console.log(
  JSON.stringify(
    {
      Name: "rc-admin-security-headers",
      Comment: "Security headers for the RC Admin console",
      SecurityHeadersConfig: {
        ContentSecurityPolicy: { Override: true, ContentSecurityPolicy: h["Content-Security-Policy"] },
        StrictTransportSecurity: { Override: true, AccessControlMaxAgeSec: 63072000, IncludeSubdomains: true, Preload: false },
        ContentTypeOptions: { Override: true },
        FrameOptions: { Override: true, FrameOption: "DENY" },
        ReferrerPolicy: { Override: true, ReferrerPolicy: "no-referrer" },
      },
      CustomHeadersConfig: {
        Quantity: custom.length,
        Items: custom.map((Header) => ({ Header, Value: h[Header], Override: true })),
      },
    },
    null,
    2,
  ),
);
