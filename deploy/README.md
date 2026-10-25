# Deploying the Admin console

Hosted as static files in a private S3 bucket behind CloudFront (see `AWS-INFRASTRUCTURE-PLAYBOOK.md` §8). There is no server process.

## Build (CI or a clean checkout on Node >= 24.22.1)

```bash
npm ci --ignore-scripts
export VITE_USER_API=https://admin.<domain>/api VITE_ANALYTICS_API=https://admin.<domain>/api \
  VITE_LOCATIONS_API=https://admin.<domain>/api VITE_MENU_API=https://admin.<domain>/api \
  VITE_ORDER_API=https://admin.<domain>/api
npm run build                      # fails unless all five are https://
node scripts/check-bundle.mjs dist # fails on localhost URLs, secrets, source maps
```

Build production artifacts in the default production mode only (`npm run build`, never with `--mode staging` or any other mode): only mode=production enforces the https guard. `--mode staging` is for local rehearsal against `http://localhost`: `npx vite build --mode staging`, then `npx vite preview --mode staging --port 4173`, then `node scripts/check-headers.mjs http://localhost:4173/` to verify the headers.

`scripts/check-bundle.mjs` and the CI workflow (`.github/workflows/ci.yml`) run the same checks, so a release candidate should be a commit whose CI run is green.

## Security headers

The CloudFront response-headers policy is generated from the same source as the preview headers. With the REAL production https API URLs exported (the five variables above):

```bash
node deploy/printCloudFrontPolicy.ts > policy.json
```

The printer refuses non-https origins and uses whichever five URLs are exported, so wrong values give a wrong CSP `connect-src`. Attach the policy ONLY to the Admin distribution: it sets `Cross-Origin-Resource-Policy: same-origin`, which would break any other distribution that serves images or assets to the Admin.

## Upload

Hashed assets are immutable; everything else must revalidate. Upload assets first so a new `index.html` never points at files that do not exist yet. No `--delete`: old assets stay so clients holding the previous `index.html` keep working and rollback is instant.

```bash
aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public,max-age=31536000,immutable"
aws s3 sync dist "s3://$BUCKET" --exclude "assets/*" --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/" "/index.html" "/vite.svg"
```

`"/"` is purged too so a default-root-object request is not served stale.

## Verify the release

```bash
node scripts/check-headers.mjs https://admin.<domain>/   # needs the same five variables exported
curl -sI https://admin.<domain>/ | grep -i cache-control # expect: no-cache
curl -s -o /dev/null -w "%{http_code}\n" https://admin.<domain>/users  # expect: 200 (SPA fallback)
```

## Roll back

The bucket has versioning on. Restore the previous `index.html` (it references the previous hashed assets, which are still in the bucket):

```bash
aws s3api list-object-versions --bucket "$BUCKET" --prefix index.html --max-items 5
aws s3api copy-object --bucket "$BUCKET" --key index.html \
  --copy-source "$BUCKET/index.html?versionId=<previous-version-id>" \
  --cache-control "no-cache" --metadata-directive REPLACE --content-type text/html
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/" "/index.html"
```

Prune assets older than 30 days from the bucket occasionally (a lifecycle rule on the `assets/` prefix does it).
