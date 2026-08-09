import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Fails the build when Supabase config is missing, rather than throwing in the
// browser at runtime. Vite inlines env at build time, so a Vercel variable
// change requires a redeploy with the build cache cleared.
function requireEnv() {
  return {
    name: 'qseat-require-env',
    config(_c: unknown, { command, mode }: { command: string; mode: string }) {
      const env = loadEnv(mode, process.cwd(), '')
      const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter(
        (k) => !env[k] || !env[k].trim(),
      )
      if (!missing.length) return
      const msg = `qseat-app: missing ${missing.join(', ')} — see .env.example`
      if (command === 'build') throw new Error(msg)
      console.warn(`\n\u001b[33m${msg}\u001b[0m\n`)
    },
  }
}

export default defineConfig({ plugins: [requireEnv(), react()] })
