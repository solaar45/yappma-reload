import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { fileURLToPath } from 'url'

// __dirname Ersatz für ESM (Vite Standard)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // 1. Tailwind v4 Integration
    tailwindcss(), 
    
    // 2. React Plugin mit aktivem React Compiler (React 19)
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', { target: '19' }]
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ auf den src-Ordner mappen (für shadcn/ui)
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
