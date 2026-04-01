// vite.config.prod.ts
import { defineConfig } from "file:///sessions/determined-sleepy-brahmagupta/mnt/App%20Ronda/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/determined-sleepy-brahmagupta/mnt/App%20Ronda/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/sessions/determined-sleepy-brahmagupta/mnt/App Ronda";
var vite_config_prod_default = defineConfig({
  plugins: [react()],
  // Configurações para produção
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-slot", "@radix-ui/react-label", "@radix-ui/react-select"],
          utils: ["clsx", "tailwind-merge", "class-variance-authority"]
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Configurações do servidor para produção
  server: {
    host: "0.0.0.0",
    port: 3e3,
    strictPort: false
  },
  // Configurações de preview
  preview: {
    port: 3e3,
    strictPort: false
  }
});
export {
  vite_config_prod_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcucHJvZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9kZXRlcm1pbmVkLXNsZWVweS1icmFobWFndXB0YS9tbnQvQXBwIFJvbmRhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvZGV0ZXJtaW5lZC1zbGVlcHktYnJhaG1hZ3VwdGEvbW50L0FwcCBSb25kYS92aXRlLmNvbmZpZy5wcm9kLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9kZXRlcm1pbmVkLXNsZWVweS1icmFobWFndXB0YS9tbnQvQXBwJTIwUm9uZGEvdml0ZS5jb25maWcucHJvZC50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbi8vIENvbmZpZ3VyYVx1MDBFN1x1MDBFM28gcGFyYSBwcm9kdVx1MDBFN1x1MDBFM28gKFZlcmNlbClcclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgXHJcbiAgLy8gQ29uZmlndXJhXHUwMEU3XHUwMEY1ZXMgcGFyYSBwcm9kdVx1MDBFN1x1MDBFM29cclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgbWluaWZ5OiB0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcclxuICAgICAgICAgIHVpOiBbJ0ByYWRpeC11aS9yZWFjdC1zbG90JywgJ0ByYWRpeC11aS9yZWFjdC1sYWJlbCcsICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0J10sXHJcbiAgICAgICAgICB1dGlsczogWydjbHN4JywgJ3RhaWx3aW5kLW1lcmdlJywgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eSddXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIENvbmZpZ3VyYVx1MDBFN1x1MDBGNWVzIGRvIHNlcnZpZG9yIHBhcmEgcHJvZHVcdTAwRTdcdTAwRTNvXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiAnMC4wLjAuMCcsXHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXHJcbiAgfSxcclxuXHJcbiAgLy8gQ29uZmlndXJhXHUwMEU3XHUwMEY1ZXMgZGUgcHJldmlld1xyXG4gIHByZXZpZXc6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSxcclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlYsU0FBUyxvQkFBb0I7QUFDMVgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLDJCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUE7QUFBQSxFQUdqQixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsSUFBSSxDQUFDLHdCQUF3Qix5QkFBeUIsd0JBQXdCO0FBQUEsVUFDOUUsT0FBTyxDQUFDLFFBQVEsa0JBQWtCLDBCQUEwQjtBQUFBLFFBQzlEO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNkO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNkO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
