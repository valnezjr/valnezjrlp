import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages de projeto (valnezjr.github.io/valnezjrlp/) serve sob
  // subpasta, não raiz — só em build de produção; o dev server continua
  // em "/". Preview/deploy de desenvolvimento, ver docs/architecture.md.
  base: process.env.NODE_ENV === 'production' ? '/valnezjrlp/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
