import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Your port setting was 8080, but Vite's default is 5173. 
  // I'll keep your 8080, but 5173 is what I used in the backend config.
  // Let's change it to 5173 to match the backend CORS setting.
  server: {
    host: "::",
    port: 5173, 
  },
  plugins: [react()], // Removed the 'lovable-tagger' plugin
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});