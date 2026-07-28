import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Untuk GitHub Pages project (username.github.io/nama-repo/), base path harus
// '/nama-repo/'. Workflow GitHub Actions (.github/workflows/deploy.yml) otomatis
// mengisi ini lewat env var VITE_BASE_PATH saat build — tidak perlu diedit manual.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
});
