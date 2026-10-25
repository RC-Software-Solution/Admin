interface Inputs {
  /** Every origin the console calls (from apiOrigins). */
  apiOrigins: string[];
}

export function buildHeaders({ apiOrigins }: Inputs) {
  const csp = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    // ponytail: any https image host because image_url has no fixed origin yet; pin to the media bucket once uploads exist
    "img-src 'self' data: https:",
    `connect-src ${["'self'", ...apiOrigins].join(" ")}`,
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  } as const;
}
