import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: "..",
  envPrefix: ["VITE_", "EXPO_PUBLIC_"],
  plugins: [react()],
  server: {
    port: 8082,
    strictPort: true,
  },
});
