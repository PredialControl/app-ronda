import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin para servir supervisor.html em /supervisor/*
function supervisorPlugin(): Plugin {
  return {
    name: 'supervisor-html-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/supervisor')) {
          req.url = '/supervisor.html';
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), supervisorPlugin()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    host: '0.0.0.0',
    // port: 1420, // Commented out to allow dynamic port
    strictPort: false,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Build com múltiplas páginas (index + supervisor)
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        supervisor: path.resolve(__dirname, 'supervisor.html'),
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
