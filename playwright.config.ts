import { defineConfig, devices } from "@playwright/test";

const staticMode = process.env.E2E_STATIC === "1";
const chromeExecutable = process.env.PLAYWRIGHT_CHROME_EXECUTABLE;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: staticMode
      ? "http://replace-impact.test"
      : "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: chromeExecutable
      ? {
          executablePath: chromeExecutable,
        }
      : undefined,
  },
  webServer: staticMode
    ? undefined
    : {
        command:
          "pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
