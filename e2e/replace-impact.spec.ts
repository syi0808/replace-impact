import { expect, test, type Page, type Route } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
  "Access-Control-Expose-Headers": "content-length",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

const packages = {
  vite: registryPackage(
    "vite",
    "6.0.0",
    {
      glob: "^10.0.0",
    },
    {
      "optional-left": "^1.0.0",
    },
  ),
  "@vitejs/plugin-vue": registryPackage(
    "@vitejs/plugin-vue",
    "5.2.0",
    {},
    {},
    { vue: "^3.5.0" },
  ),
  glob: registryPackage(
    "glob",
    "10.4.5",
    { "path-scurry": "^1.11.0" },
    {},
    {},
    22,
    180_000,
  ),
  "path-scurry": registryPackage(
    "path-scurry",
    "1.11.1",
    {},
    {},
    {},
    16,
    120_000,
  ),
  tinyglobby: registryPackage("tinyglobby", "0.2.15", {}, {}, {}, 8, 42_000),
  "lighter-left": registryPackage(
    "lighter-left",
    "1.0.0",
    {},
    {},
    {},
    2,
    8_000,
  ),
  "petite-vue": registryPackage("petite-vue", "0.4.1", {}, {}, {}, 6, 25_000),
  "downloads-fail": registryPackage("downloads-fail", "1.0.0", {
    glob: "^10.0.0",
  }),
  "limit-root": registryPackage("limit-root", "1.0.0", { "chain-0": "1.0.0" }),
  "optional-left": registryPackage("optional-left", "1.0.0"),
  del: registryPackage("del", "8.0.0"),
  webpack: registryPackage("webpack", "6.0.0", { rimraf: "^5.0.0" }),
  rimraf: registryPackage("rimraf", "5.0.10"),
  eslint: registryPackage("eslint", "9.0.0"),
};

const consoleErrorsByPage = new WeakMap<Page, string[]>();
const staticBaseUrl = "http://replace-impact.test";
const staticDistDir = join(process.cwd(), "dist");
const staticMode = process.env.E2E_STATIC === "1";

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  consoleErrorsByPage.set(page, consoleErrors);
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  if (staticMode) {
    await mockStaticApp(page);
  }

  await mockExternalApis(page);
});

test.afterEach(async ({ page }) => {
  expect(consoleErrorsByPage.get(page) ?? []).toEqual([]);
});

test("home search navigates to a real package detail flow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "npm package name" }).fill("vite");
  await page.getByRole("button", { name: /analyze/i }).click();

  await expect(page).toHaveURL(/\/package\/vite$/);
  await expect(page.getByRole("heading", { name: "vite" })).toBeVisible();
  await expect(page.getByText("glob")).toBeVisible();
  await expect(page.getByText("Source: cdn.jsdelivr.net")).toBeVisible();
  await expect(
    page
      .locator(".candidate-card")
      .filter({ hasText: "optional-left" })
      .getByText("optional"),
  ).toBeVisible();
  await expect(
    page
      .locator(".candidate-card")
      .filter({ hasText: "glob" })
      .getByRole("link", { name: /view impact/i }),
  ).toHaveAttribute("href", "/report?pkg=vite&from=glob&to=tinyglobby");
});

test("scoped package route round-trips through package detail", async ({
  page,
}) => {
  await page.goto("/package/@vitejs/plugin-vue");
  await expect(
    page.getByRole("heading", { name: "@vitejs/plugin-vue" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".candidate-card")
      .filter({ hasText: "vue" })
      .getByText("peer caution"),
  ).toBeVisible();
});

test("scoped package names can be submitted from search", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("searchbox", { name: "npm package name" })
    .fill("@vitejs/plugin-vue");
  await page.getByRole("button", { name: /analyze/i }).click();

  await expect(page).toHaveURL(/\/package\/(%40|@)vitejs\/plugin-vue$/);
  await expect(
    page.getByRole("heading", { name: "@vitejs/plugin-vue" }),
  ).toBeVisible();
});

test("package page can create a manual replacement report", async ({
  page,
}) => {
  await page.goto("/package/vite");
  await page.getByLabel("Replacement package").fill("tinyglobby");
  await page.getByRole("button", { name: "Create report" }).click();

  await expect(page).toHaveURL("/report?pkg=vite&from=glob&to=tinyglobby");
});

test("report page renders primary estimates, caveats, and markdown", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-write"], {
    origin: staticMode ? staticBaseUrl : "http://127.0.0.1:4173",
  });
  await page.goto("/report?pkg=vite&from=glob&to=tinyglobby");

  await expect(page.getByRole("heading", { name: /Summary/i })).toBeVisible();
  await expect(page.getByText("direct dependency ^10.0.0")).toBeVisible();
  await expect(page.getByText("1M / mo")).toBeVisible();
  await expect(page.getByText("12M / yr")).toBeVisible();
  await expect(page.getByText("mo").first()).toBeVisible();
  await expect(page.getByText("Slow 3G")).toBeVisible();
  await expect(page.getByText("0.4 Mbps")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: /sec|min|hr|days|years$/ }).first(),
  ).toBeVisible();
  await expect(page.getByText("Communication estimate only.")).toBeVisible();
  await expect(page.getByText("Meals")).toBeVisible();
  await expect(page.getByText("Charges")).toBeVisible();
  await expect(page.getByText("Damage")).toBeVisible();

  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
});

test("limited reports and invalid query params show friendly warnings", async ({
  page,
}) => {
  await page.goto("/report?pkg=vite&from=rimraf&to=del");
  await expect(
    page.getByText("not a direct dependency of vite@6.0.0"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Summary/i })).toBeVisible();

  await page.goto("/report?pkg=bad%20name&from=glob&to=tinyglobby");
  await expect(
    page.getByText("Invalid pkg package name in this report URL."),
  ).toBeVisible();
});

test("partial API failure and negative savings stay visible", async ({
  page,
}) => {
  await page.goto("/report?pkg=downloads-fail&from=glob&to=tinyglobby");
  await expect(page.getByRole("heading", { name: /Summary/i })).toBeVisible();
  await expect(page.getByText(/Monthly downloads unavailable/)).toBeVisible();
  await expect(page.getByText("unknown").first()).toBeVisible();

  await page.goto("/report?pkg=vite&from=tinyglobby&to=glob");
  await expect(page.getByText("May increase traffic.")).toBeVisible();
});

test("graph node limit warnings are visible when triggered", async ({
  page,
}) => {
  await page.goto("/report?pkg=limit-root&from=chain-0&to=tinyglobby");
  await expect(
    page.getByText("Graph node limit of 250 packages was reached"),
  ).toBeVisible({
    timeout: 20_000,
  });
});

test("explicit report URLs work when e18e replacement data fails", async ({
  page,
}) => {
  await page.unroute(
    "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/all.json",
  );
  await page.unroute(
    "https://unpkg.com/module-replacements@latest/manifests/all.json",
  );
  await page.route(
    "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/**",
    async (route) => {
      await route.fulfill({
        status: 503,
        headers: corsHeaders,
        body: "unavailable",
      });
    },
  );
  await page.route(
    "https://unpkg.com/module-replacements@latest/manifests/**",
    async (route) => {
      await route.fulfill({
        status: 503,
        headers: corsHeaders,
        body: "unavailable",
      });
    },
  );

  await page.goto("/package/vite");
  await expect(page.getByRole("heading", { name: "vite" })).toBeVisible();
  await expect(
    page.getByText(
      "Replacement candidates unavailable. Explicit report URLs still work.",
    ),
  ).toBeVisible();

  await page.goto("/report?pkg=vite&from=glob&to=tinyglobby");
  await expect(page.getByRole("heading", { name: /Summary/i })).toBeVisible();
});

async function mockExternalApis(page: Page): Promise<void> {
  await page.route(
    "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/all.json",
    async (route) => {
      await fulfillJson(route, {
        replacements: [
          {
            moduleName: "glob",
            replacement: "tinyglobby",
            type: "preferred",
            caution: "Check advanced glob pattern behavior before replacing.",
          },
          {
            moduleName: "optional-left",
            replacement: "lighter-left",
            type: "micro-utility",
            caution: "Optional dependency; verify install targets.",
          },
          {
            moduleName: "vue",
            replacement: "petite-vue",
            type: "ecosystem-recommendation",
            caution:
              "Peer dependency candidate; verify compatibility before replacing.",
          },
        ],
      });
    },
  );

  await page.route(
    "https://unpkg.com/module-replacements@latest/manifests/all.json",
    async (route) => {
      await fulfillJson(route, { replacements: [] });
    },
  );

  await page.route(
    "https://api.npmjs.org/downloads/point/**",
    async (route) => {
      const url = route.request().url();
      if (decodeURIComponent(url).endsWith("/downloads-fail")) {
        await route.fulfill({ status: 503, headers: corsHeaders, body: "{}" });
        return;
      }

      await fulfillJson(route, {
        downloads: url.includes("last-year") ? 12_000_000 : 1_000_000,
      });
    },
  );

  await page.route("https://tarballs.example.test/**", async (route) => {
    const name =
      route.request().url().split("/").pop()?.replace(".tgz", "") ?? "";
    const size =
      name === "tinyglobby" ? 9_000 : name === "path-scurry" ? 24_000 : 36_000;
    await route.fulfill({
      status: 200,
      headers: {
        ...corsHeaders,
        "content-length": String(size),
      },
      body: route.request().method() === "HEAD" ? "" : "x".repeat(size),
    });
  });

  await page.route(
    "https://registry.npmjs.org/-/v1/search**",
    async (route) => {
      await fulfillJson(route, {
        objects: [
          {
            package: {
              name: "vite",
              version: "6.0.0",
              description: "Next generation frontend tooling",
            },
            score: { final: 0.99 },
          },
        ],
      });
    },
  );

  await page.route("https://registry.npmjs.org/**", async (route) => {
    const path = new URL(route.request().url()).pathname.slice(1);
    if (path.startsWith("-/v1/search")) {
      await fulfillJson(route, {
        objects: [
          {
            package: {
              name: "vite",
              version: "6.0.0",
              description: "Next generation frontend tooling",
            },
            score: { final: 0.99 },
          },
        ],
      });
      return;
    }

    const name = decodeURIComponent(path);
    if (name.startsWith("chain-")) {
      await fulfillJson(route, chainPackage(name));
      return;
    }

    const fixture = packages[name as keyof typeof packages];

    if (!fixture) {
      await route.fulfill({ status: 404, headers: corsHeaders, body: "{}" });
      return;
    }

    await fulfillJson(route, fixture);
  });
}

async function mockStaticApp(page: Page): Promise<void> {
  await page.route(`${staticBaseUrl}/**`, async (route) => {
    const url = new URL(route.request().url());
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath =
      pathname === "/" || !extname(pathname)
        ? join(staticDistDir, "index.html")
        : join(staticDistDir, pathname.replace(/^\//, ""));

    try {
      const body = await readFile(requestedPath);
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": contentTypeFor(requestedPath),
        },
        body,
      });
    } catch {
      const body = await readFile(join(staticDistDir, "index.html"));
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/html",
        },
        body,
      });
    }
  });
}

function contentTypeFor(pathname: string): string {
  switch (extname(pathname)) {
    case ".html":
      return "text/html";
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

function chainPackage(name: string) {
  const index = Number(name.replace("chain-", ""));
  const dependencies =
    Number.isFinite(index) && index < 260
      ? { [`chain-${index + 1}`]: "1.0.0" }
      : {};

  return registryPackage(name, "1.0.0", dependencies, {}, {}, 1, 1_000);
}

function registryPackage(
  name: string,
  version = "1.0.0",
  dependencies: Record<string, string> = {},
  optionalDependencies: Record<string, string> = {},
  peerDependencies: Record<string, string> = {},
  fileCount = 10,
  unpackedSize = 50_000,
) {
  return {
    name,
    "dist-tags": { latest: version },
    versions: {
      [version]: {
        name,
        version,
        description: `${name} fixture package`,
        license: "MIT",
        repository: {
          type: "git",
          url: `git+https://github.com/example/${name.replace("/", "-")}.git`,
        },
        dependencies,
        optionalDependencies,
        peerDependencies,
        dist: {
          tarball: `https://tarballs.example.test/${encodeURIComponent(name)}.tgz`,
          fileCount,
          unpackedSize,
        },
      },
    },
  };
}

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
