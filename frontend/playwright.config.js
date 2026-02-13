// playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e", 
  timeout: 30 * 1000,
  use: {
    headless: true, 
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm run dev", 
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: "npm start --prefix ../backend", 
      port: 5000,
      reuseExistingServer: true,
    }
  ],
});
