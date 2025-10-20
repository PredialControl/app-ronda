import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuração para produção (Vercel)
export default defineConfig({
  plugins: [react()],
  
  // Configurações para produção
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-label', '@radix-ui/react-select'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    }
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Configurações do servidor para produção
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
  },

  // Configurações de preview
  preview: {
    port: 3000,
    strictPort: false,
  }
})
