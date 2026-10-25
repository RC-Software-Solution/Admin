import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { API_VARS, apiOrigins } from './deploy/apiEnv.ts'
import { buildHeaders } from './deploy/securityHeaders.ts'

// A production bundle must never be built against missing or plaintext API URLs.
function requireHttpsApis(env: Record<string, string>): Plugin {
  return {
    name: 'require-https-apis',
    buildStart() {
      const bad = API_VARS.filter((k) => !env[k]?.startsWith('https://'))
      if (bad.length) this.error(`Production build needs https:// URLs for: ${bad.join(', ')}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), ...(mode === 'production' ? [requireHttpsApis(env)] : [])],
    // Preview serves the production headers so CSP breakage shows up locally, before deploy
    preview: isPreview ? { headers: buildHeaders({ apiOrigins: apiOrigins(env) }) } : undefined,
  }
})
