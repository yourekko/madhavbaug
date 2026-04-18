import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let base = (env.VITE_BASE_PATH ?? '/').trim() || '/';
  if (base !== '/' && !base.endsWith('/')) base = `${base}/`;

  return {
    plugins: [react()],
    base,
  };
});
