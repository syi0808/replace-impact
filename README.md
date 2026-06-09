# replace-impact

Stateless Vue/Vite app for generating shareable npm dependency replacement impact reports.

## Local Run

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173` and try:

```txt
/report?pkg=vite&from=glob&to=tinyglobby
```

## Verification

```sh
pnpm typecheck
pnpm test
pnpm test:e2e
```

In restricted environments that cannot bind a local preview server, the E2E spec can be listed against the built app
without starting Vite:

```sh
pnpm test:e2e:static -- --list
```

## GitHub Pages

This repository includes a GitHub Actions workflow for Pages. In the repository settings, set **Pages** to deploy from
**GitHub Actions**, then push to `main`.

The Pages build uses:

```sh
pnpm build:pages
```

It builds with the `/replace-impact/` base path and copies `index.html` to `404.html` so direct links to Vue Router
routes can load on GitHub Pages.

## Data Sources

- npm registry metadata: `https://registry.npmjs.org/<package>`
- npm downloads point API: `https://api.npmjs.org/downloads/point/<period>/<package>`
- e18e replacement manifests through the `module-replacements` package CDN
- Tarball `Content-Length` when the browser can read it
- Lifestyle carbon equivalents: fixed product constants for average meals, warm showers, phone charges, and avoided
  climate damage communication

## Limitations

Reports are estimates. npm downloads are used as a proxy for install frequency and potential reach. Real-world impact depends on package manager cache behavior, registry mirrors, lockfile deduplication, CI caching, downstream dependency graphs, and local network conditions.

Carbon estimates are communication aids, not formal emissions accounting.

WebContainer measurement is experimental, user-triggered, and can be unavailable because of browser support, headers, network behavior, or package install failures. The primary report does not depend on WebContainer.

## WebContainer Ideas

WebContainer is most useful when it produces evidence that registry metadata cannot:

- Compare the original manifest and a patched manifest with the same package manager command.
- Run a script-free install audit to count actual `node_modules` packages, files, and bytes.
- Compare npm, pnpm, and yarn install shapes when browser support and package-manager bootstrapping allow it.
- Generate a patched package tarball and validate that the dependency graph still installs.
- Capture warnings from peer dependency resolution and package manager output as compatibility notes.
- Replay a provided lockfile later, if the app adds file import support, so project-specific deduplication can be measured separately from the registry estimate.
