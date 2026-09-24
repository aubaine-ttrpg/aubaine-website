---
paths:
  - "src/**/*.{astro,ts,tsx,css}"
  - "astro.config.*"
  - "vite.config.*"
---

# Performance

- Optimize shipped JavaScript before micro optimizing execution.
- Prefer zero JavaScript Astro output for static content.
- Hydrate only interactive islands.
- Use the least eager hydration strategy that meets the user experience requirement.
- Do not ship duplicate libraries for equivalent behavior.
- Lazy load non critical interactive islands and heavy media when appropriate.
- Optimize images through Astro assets or an equivalent build pipeline.
- Always provide intrinsic image dimensions or a stable aspect ratio.
- Preload only truly critical resources.
- Avoid broad route prefetching that wastes bandwidth.
- Keep font families and weights limited.
- Prefer self hosted and subset fonts when licensing permits.
- Avoid render blocking third party scripts.
- Measure bundle impact before adding animation, search, analytics, or UI dependencies.
- Do not let transition effects hide Core Web Vitals regressions.
- Establish numeric performance budgets from an audited production baseline instead of inventing arbitrary thresholds.
