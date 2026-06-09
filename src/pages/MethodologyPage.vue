<template>
  <section class="content-page">
    <p class="eyebrow">Methodology</p>
    <h1>Estimated, potential, equivalent</h1>

    <div class="prose">
      <p>
        replace-impact compares the dependency subtree for a current package
        with the subtree for a proposed replacement using npm registry metadata.
        The default graph includes regular dependencies and excludes optional
        and peer dependencies from installed traffic estimates.
      </p>

      <p>
        npm downloads are used as a proxy for potential install-path reach. They
        are not additive ecosystem totals and they do not model package-manager
        caches, lockfile deduplication, registry mirrors, CI caches, or local
        network behavior.
      </p>

      <p>
        Compressed package traffic uses tarball <code>Content-Length</code> when
        the browser can read it. Missing fields remain unknown and are not
        silently converted into zero.
      </p>

      <p>
        Equivalent network transfer time is calculated from bytes and fixed
        downlink profiles. It is not an install-duration claim, and it is
        displayed in hours for both monthly and yearly comparisons.
      </p>

      <p>
        Carbon estimates use fixed lifestyle equivalents for communication: 1.5
        kg CO2e per average 600 kcal meal, 1.15 kg CO2e per 10-minute warm
        shower, 0.0124 kg CO2 per smartphone charge, and $0.19 per kgCO2 for
        avoided climate damage. These are communication aids, not formal
        emissions accounting.
      </p>
    </div>
  </section>
</template>
