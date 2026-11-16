import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The API server (server/index.js) runs on API_PORT (default 8787).
// Vite forwards /api requests to it, so the browser only talks to one origin.
const apiTarget = `http://localhost:${process.env.API_PORT || 8787}`;
const proxy = { '/api': { target: apiTarget, changeOrigin: false } };

/**
 * Safety check: anything in a VITE_* variable is bundled into the browser
 * code. Refuse to start/build if a server-only secret ended up there.
 */
function assertNoSecretsInClientEnv(env) {
  const problems = [];
  for (const [name, raw] of Object.entries(env)) {
    if (!name.startsWith('VITE_')) continue;
    const value = String(raw ?? '').trim();
    if (/ANTHROPIC|SECRET|SERVICE_ROLE|JUDGE0_(AUTH|RAPIDAPI)/i.test(name)) problems.push(`${name} looks like a server-only setting`);
    if (value.startsWith('sb_secret_')) problems.push(`${name} contains a Supabase SECRET key (sb_secret_…)`);
    if (value.startsWith('sk-ant-')) problems.push(`${name} contains an Anthropic API key`);
    // Legacy Supabase keys are JWTs; reject one whose role is service_role.
    const parts = value.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload?.role === 'service_role') problems.push(`${name} contains the Supabase service_role key`);
      } catch {
        /* not a JWT */
      }
    }
  }
  if (problems.length) {
    throw new Error(
      `Refusing to expose secrets to the browser:\n  - ${problems.join('\n  - ')}\n` +
        'Move these to non-VITE_ variables (e.g. SUPABASE_SECRET_KEY, ANTHROPIC_API_KEY); only the API server should read them.',
    );
  }
}

// Vite configuration – https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  assertNoSecretsInClientEnv({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env });
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy,
    },
    preview: {
      proxy,
    },
    build: {
      rollupOptions: {
        // Keep the Supabase SDK in its own cacheable chunk.
        output: { manualChunks: { supabase: ['@supabase/supabase-js'] } },
      },
    },
  };
});
