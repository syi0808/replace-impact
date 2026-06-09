# replace-impact Implementation Plan

## 1. Objective

Build a stateless Vue/Vite web app that generates shareable dependency replacement impact reports for npm packages.

The MVP must support:

- npm package search and package detail pages
- actual npm registry and downloads API integration
- actual `e18e/module-replacements` integration
- `/report?pkg=&from=&to=` report URLs
- registry-based before/after graph estimate
- WebContainer-based experimental measurement when available
- package traffic, file count, unpacked size, network time, carbon, and PR Markdown output

Primary product copy:

```txt
A few files less.
Millions of times less work.
```

## 2. Confirmed Decisions

- UI language: English
- App style: quiet, dense, developer-facing analysis tool
- Public report state: query string only, no backend persistence
- npm API strategy: browser-side API calls first
- Dependency graph MVP: direct dependency replacement only
- `dependencies`: included in recommendation and default graph estimate
- `optionalDependencies`: shown with a badge, excluded from default estimate unless explicitly handled later
- `peerDependencies`: included in candidate discovery with caution, not treated as installed dependency traffic by default
- If `from` is not a direct dependency: show a limited report with a clear warning
- Downloads fallback: show unknown or partial estimates if npm downloads API fails
- WebContainer: included as experimental measurement, used when the browser supports it and the user triggers it

## 3. Non-Goals For This Implementation

- Formal carbon accounting
- Full package-manager-specific install behavior
- Perfect downstream deduplication modeling
- Automatic compatibility validation for replacements
- Runtime or browser bundle size analysis
- Stored historical reports
- Backend proxy or database
- Country-level network profiles

## 4. Technical Architecture

### 4.1 Stack

- Vue 3
- Vite
- TypeScript
- Vue Router
- Plain CSS with CSS variables for MVP styling
- WebContainers for experimental browser-side install measurement

### 4.2 Route Map

```txt
/                         Home/search page
/package/:pkgMatch(.*)*   Package detail page, including scoped packages
/report                   Impact report from query params
/methodology              Methodology and caveats
```

### 4.3 Source Layout

```txt
src/
  pages/
    HomePage.vue
    PackagePage.vue
    ReportPage.vue
    MethodologyPage.vue

  features/
    package-search/
      PackageSearchBox.vue
      searchPackages.ts

    replacement-recommender/
      ReplacementCandidateList.vue
      matchReplacementCandidates.ts

    impact-report/
      ImpactSummary.vue
      BeforeAfterTable.vue
      NetworkImpact.vue
      CarbonEstimate.vue
      ExperimentalMeasurement.vue
      createImpactReport.ts

    pr-markdown/
      PrMarkdownPreview.vue
      generatePrMarkdown.ts

  core/
    npm/
      registryClient.ts
      downloadsClient.ts
      tarballSizeClient.ts
      resolvePackage.ts
      resolveDependencyGraph.ts

    replacements/
      loadModuleReplacements.ts
      normalizeModuleReplacements.ts
      matchModuleReplacement.ts

    webcontainer/
      createWebContainer.ts
      runInstallMeasurement.ts
      patchPackageManifest.ts

    metrics/
      traffic.ts
      files.ts
      networkTime.ts
      carbon.ts
      formatting.ts

  types/
    package.ts
    replacement.ts
    report.ts
```

## 5. Data Integration Plan

### 5.1 npm Registry

Use npm registry endpoints from the browser:

```txt
https://registry.npmjs.org/<package>
```

Required fields:

- `dist-tags.latest`
- `versions[latest].description`
- `versions[latest].license`
- `versions[latest].repository`
- `versions[latest].dependencies`
- `versions[latest].optionalDependencies`
- `versions[latest].peerDependencies`
- `versions[latest].dist.tarball`
- `versions[latest].dist.unpackedSize`, if present
- `versions[latest].dist.fileCount`, if present

Compressed tarball bytes are measured separately from `dist.tarball`:

1. Try `HEAD <tarballUrl>` and read `Content-Length`.
2. If `HEAD` fails or omits length, try a normal `GET` only when the package is small enough or the browser permits it.
3. If compressed size cannot be measured, mark tarball traffic as `unknown`.

If metadata is missing, preserve it as `null` internally and render `unknown` at the display boundary. Do not silently treat missing values as measured savings.

### 5.2 npm Downloads

Use:

```txt
https://api.npmjs.org/downloads/point/last-month/<package>
https://api.npmjs.org/downloads/point/last-year/<package>
```

The app uses package downloads as a proxy for install-path reach.

### 5.3 e18e/module-replacements

Implementation must first isolate the external data shape behind:

```ts
loadModuleReplacements(): Promise<ReplacementRule[]>
```

`ReplacementRule` normalized shape:

```ts
type ReplacementRule = {
  from: string
  to: string
  type: "native" | "preferred" | "micro-utility" | "ecosystem-recommendation" | "unknown"
  caution?: string
  sourceUrl?: string
  docsUrl?: string
}
```

The actual upstream source may change format, so all parsing logic must stay inside `normalizeModuleReplacements.ts`.

Fallback behavior:

- If upstream loading fails, show dependency lists but mark replacement candidates unavailable.
- Report URLs with explicit `from` and `to` still work without e18e data.

## 6. Registry-Based Impact Calculation

### 6.1 Graph Scope

For MVP, calculate:

- before subtree: `from@resolvedRange` and its dependency subtree
- after subtree: `to@latest` and its dependency subtree
- root package metadata: used for context and direct dependency validation

The app does not rewrite or fully solve the root package lockfile in the registry estimate.

### 6.2 Traversal Rules

- Include `dependencies`
- Exclude `optionalDependencies` from default graph estimate
- Exclude `peerDependencies` from graph estimate, but surface them as compatibility caution
- Resolve version ranges conservatively using npm registry metadata
- Avoid infinite loops using `name@version` visited keys
- Limit traversal depth and node count to protect the browser

Default limits:

```ts
const graphLimits = {
  maxDepth: 8,
  maxNodes: 250
}
```

If limits are hit, show a partial-estimate warning.

### 6.3 Snapshot Shape

```ts
type PackageSnapshot = {
  packageCount: number
  fileCount: number | null
  tarballBytes: number | null
  unpackedBytes: number | null
  dependencyNodes: string[]
  warnings: string[]
}
```

### 6.4 Savings Rules

If both before and after values are known:

```ts
saving = before - after
```

If either side is unknown:

- show `unknown`
- omit aggregate monthly/yearly value for that metric
- keep the rest of the report usable

Negative savings are valid and must be displayed as increases.

## 7. Metrics

### 7.1 Package Traffic

Use tarball compressed size when available.

```ts
trafficSavedPerInstall = before.tarballBytes - after.tarballBytes
periodTrafficAvoided = trafficSavedPerInstall * downloads
```

Label:

```txt
Potential package traffic avoided
```

### 7.2 Files Not Unpacked

Use registry `fileCount` when available.

```ts
filesSavedPerInstall = before.fileCount - after.fileCount
periodFilesNotUnpacked = filesSavedPerInstall * downloads
```

Label:

```txt
Files not unpacked
```

### 7.3 Unpacked Size

Use `dist.unpackedSize` when available.

```ts
unpackedBytesSavedPerInstall = before.unpackedBytes - after.unpackedBytes
```

Label:

```txt
Filesystem work avoided
```

### 7.4 Network Transfer Time

Use fixed MVP profiles:

```ts
const networkProfiles = {
  "lighthouse-mobile": { label: "Lighthouse mobile", downlinkMbps: 1.6 },
  "regular-3g": { label: "Regular 3G", downlinkMbps: 0.75 },
  "slow-3g": { label: "Slow 3G", downlinkMbps: 0.4 },
  "2g": { label: "2G", downlinkMbps: 0.05 }
}
```

Formula:

```ts
seconds = trafficBytes * 8 / downlinkBps
```

Label:

```txt
Equivalent network transfer time avoided
```

Never label this as install time saved.

### 7.5 Carbon Estimate

MVP assumptions:

```ts
const carbonAssumptions = {
  energyIntensityKWhPerGB: 0.194,
  gridIntensityKgCO2ePerKWh: 0.494
}
```

Formula:

```ts
energyKWh = trafficAvoidedGB * energyIntensityKWhPerGB
carbonKgCO2e = energyKWh * gridIntensityKgCO2ePerKWh
```

Label:

```txt
Estimated emissions avoided
```

Always show:

```txt
Carbon estimates are communication aids, not formal emissions accounting.
```

## 8. WebContainer Experimental Measurement

### 8.1 Trigger Model

WebContainer measurement must not block the normal report.

The report page first renders the registry estimate, then provides an experimental action:

```txt
Run browser install measurement
```

### 8.2 Measurement Flow

Before:

```bash
npm init -y
npm install <pkg>@latest
```

After:

```bash
npm init -y
npm pack <generated patched package directory>
npm install <patched package tarball>
```

The generated patched package directory contains a minimal `package.json` copied from the registry manifest:

- same package name
- same latest version with a local suffix when needed
- same `dependencies`, except `from` is removed and `to` is added
- no lifecycle scripts

This measures dependency install shape, not package source file contents.

If creating a patched tarball fails in the browser, the implementation falls back to a clearly labeled subtree approximation:

- install `from` subtree
- install `to` subtree
- compare `node_modules` package count, file count, and size

This approximation must be labeled separately from registry estimate.

### 8.3 Failure Handling

WebContainer can fail due to browser support, network, headers, package scripts, or install behavior.

On failure:

- keep registry report visible
- show the error in a compact panel
- mark experimental measurement as unavailable

## 9. User Experience Plan

### 9.1 Home Page

Primary controls:

- package search input
- example report links
- recent or common replacement examples

Acceptance-level behavior:

- Searching `vite` navigates to `/package/vite`
- Scoped packages can be submitted, for example `@vitejs/plugin-vue`
- Example links navigate to valid report URLs

### 9.2 Package Page

Display:

- package name and latest version
- description, license, repository
- direct dependencies
- optional dependencies with badge
- peer dependencies with caution badge
- replacement candidates from e18e data

Candidate action:

```txt
View impact
```

Navigates to:

```txt
/report?pkg=<pkg>&from=<from>&to=<to>
```

### 9.3 Report Page

Display:

- package and replacement header
- direct dependency status
- hero impact summary
- monthly and yearly metric cards
- before/after comparison table
- network transfer profiles
- downstream reach note
- carbon estimate and assumptions
- PR Markdown preview and copy button
- methodology and caveats
- experimental WebContainer panel

For negative or neutral results, show the result honestly:

```txt
This replacement may increase package traffic.
```

### 9.4 Copy Tone

Use estimated, potential, and equivalent consistently.

Avoid:

- actual traffic saved
- guaranteed improvement
- install time saved
- safe replacement

## 10. PR Markdown Generation

The generated Markdown must include:

- replacement statement
- monthly and yearly table
- report URL
- methodology note
- caveat note

Example structure:

```md
### Dependency replacement impact estimate

This PR replaces `glob` with `tinyglobby` in `vite`.

Small per-install savings can compound across the ecosystem.

| Metric | Monthly estimate | Yearly estimate |
|---|---:|---:|
| Package traffic avoided | ~3.8 TB | ~45.6 TB |
| Files not unpacked | ~1.47B | ~17.6B |
| Direct npm install paths improved | ~8.2M | ~98.4M |
| Slow-mobile transfer time avoided | ~199 days | ~6.5 years |
| Estimated emissions avoided | ~X kg CO2e | ~Y kg CO2e |

Report: `/report?pkg=vite&from=glob&to=tinyglobby`

These figures are estimates. npm downloads are used as a proxy for install frequency. Real-world impact depends on package manager cache behavior, registry mirrors, lockfile deduplication, CI caching, and downstream dependency graphs.
```

## 11. Implementation Milestones

### Milestone 1. Project Scaffold And Static UI

Deliverables:

- Vite Vue TypeScript project
- route structure
- base layout and responsive CSS
- static home, package, and report pages
- sample impact report data

Acceptance criteria:

- `npm install` completes
- `npm run dev` starts the app
- `/`, `/package/vite`, and `/report?pkg=vite&from=glob&to=tinyglobby` render without runtime errors
- desktop width around 1440px has no overlapping text
- mobile width around 390px has no clipped primary controls
- report page includes the required caveat language

### Milestone 2. npm API Integration

Deliverables:

- npm registry client
- npm downloads client
- package detail loading state
- error and partial-data states

Acceptance criteria:

- Searching `vite` loads real latest package metadata
- `/package/vite` shows real direct dependencies
- `/package/@vitejs/plugin-vue` handles scoped package routing
- downloads API values are shown on the report page
- API failures show actionable error states without a blank page
- failed downloads API does not prevent registry metrics from rendering

### Milestone 3. e18e Replacement Integration

Deliverables:

- external replacement loader
- normalized replacement rules
- candidate matcher
- candidate cards on package page

Acceptance criteria:

- package dependencies are matched against actual e18e replacement data
- each candidate shows `from`, `to`, source, and compatibility caution
- peer dependency candidates are shown with a caution badge
- optional dependency candidates are shown with an optional badge
- if e18e data fails to load, explicit report URLs still work

### Milestone 4. Registry-Based Impact Estimate

Deliverables:

- dependency subtree resolver
- before/after snapshot calculation
- metric calculations
- unknown and negative result handling

Acceptance criteria:

- `/report?pkg=vite&from=glob&to=tinyglobby` calculates before and after snapshots from registry data
- direct `from` dependency status is visible
- if `from` is not a direct dependency, a limited report warning is visible
- negative savings are displayed as increases, not hidden
- graph depth or node limit warnings are visible when triggered
- no metric displays fabricated values when source data is missing

### Milestone 5. Report Polish And PR Markdown

Deliverables:

- final report layout
- network profile table
- carbon estimate panel
- methodology panel
- copyable PR Markdown

Acceptance criteria:

- monthly and yearly estimates are visible when downloads and per-install savings are known
- slow-mobile transfer time uses `0.4 Mbps`
- carbon panel shows both assumptions
- copy button writes Markdown to clipboard when browser permission allows it
- generated Markdown includes report URL and caveats
- all user-facing copy uses estimated/potential/equivalent wording

### Milestone 6. WebContainer Experimental Measurement

Deliverables:

- lazy WebContainer loader
- experimental measurement panel
- install measurement runner
- failure and unsupported-browser states

Acceptance criteria:

- WebContainer code is not required for initial report rendering
- clicking the experimental action starts measurement when supported
- unsupported environments show a clear unavailable state
- measurement errors do not break the registry estimate
- successful measurement shows package count, file count, and node_modules size if available
- experimental results are visually labeled as experimental and not mixed into primary estimates

### Milestone 7. Verification And Release Readiness

Deliverables:

- formatting/typecheck scripts
- focused unit tests for metrics and formatting
- browser smoke test notes
- README with local run instructions

Acceptance criteria:

- `npm run typecheck` passes
- metric formula tests pass
- formatting utility tests pass
- app loads at local dev URL
- report page smoke test passes for at least one known URL
- README explains limitations, APIs used, and WebContainer caveats

## 12. Cross-Cutting Acceptance Criteria

The implementation is acceptable only if:

- The app remains usable when one API source fails.
- Every estimate has visible methodology or caveat text.
- The report URL is shareable without local state.
- The UI never claims replacement safety.
- The UI never claims exact real-world install savings.
- Browser console has no uncaught runtime errors during normal home, package, and report flows.
- Public query params are validated and invalid input shows a friendly error.
- Scoped package names round-trip correctly through routes and query strings.
- All metrics preserve sign, including regressions.
- The main report can be generated without WebContainer.

## 13. Key Risks And Mitigations

| Risk | Mitigation |
|---|---|
| npm registry CORS or rate limits | Keep clients isolated so a proxy can be added later |
| e18e data format changes | Normalize behind one loader module |
| Missing `fileCount` or `unpackedSize` | Show unknown and partial report instead of fabricated values |
| Complex semver resolution | Start with conservative latest/range-compatible resolver and show partial warnings |
| WebContainer browser/header requirements | Keep as user-triggered experimental panel |
| Carbon overclaiming | Always label as estimate and show assumptions |
| Downstream double counting | Use npm downloads as reach proxy and include "Potential reach, not additive total" |

## 14. Initial Build Order

1. Scaffold Vue/Vite TypeScript app.
2. Build static routes and visual shell.
3. Implement metric and formatting utilities with tests.
4. Implement npm registry and downloads clients.
5. Implement package page and search flow.
6. Implement e18e loader and candidate matching.
7. Implement registry graph resolver.
8. Implement report page with partial/negative states.
9. Implement PR Markdown generation and copy.
10. Add WebContainer experimental panel.
11. Run typecheck, tests, and browser smoke verification.

## 15. Definition Of Done

The MVP is done when a user can open:

```txt
/report?pkg=vite&from=glob&to=tinyglobby
```

and receive a real, shareable report based on live npm metadata and downloads, with clear estimates for traffic, files, network transfer time, carbon, and PR Markdown, while still getting a usable report if WebContainer measurement is unsupported or fails.
