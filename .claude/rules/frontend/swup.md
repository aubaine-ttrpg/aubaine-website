---
paths:
  - "src/**/*.{astro,ts,tsx}"
  - "astro.config.*"
---

# Swup

- Use the official Astro integration for Swup unless a verified limitation requires manual integration.
- Maintain one application level Swup instance.
- Treat Swup as progressive navigation enhancement. Every route must work through a normal document request and without client JavaScript.
- Use current Swup hooks such as `page:view`, `content:replace`, `visit:start`, and `visit:end`.
- Initialize page specific browser behavior on initial load and after `page:view` when the official integration does not already own that lifecycle.
- Tear down page specific listeners, observers, timers, and imperative instances before content replacement when they are not owned by a framework lifecycle.
- Do not depend on next page script tags executing automatically.
- Do not add the Scripts Plugin unless third party code makes lifecycle control impossible.
- Keep site wide styles available across routes.
- Ensure head state is synchronized across navigation, including title, meta tags, canonical links, alternate locale links, structured data, `lang`, and `dir`.
- Preserve accessible announcements and focus restoration across client navigation.
- Preserve browser back, forward, anchor, and scroll expectations.
- Do not intercept downloads, external destinations, new tab links, or routes that intentionally require a full document request.
- Preload selectively. Avoid broad preloading that wastes bandwidth.
- Do not make Swup responsible for state owned by a React island.
- Do not layer another page transition system over the same navigation transition.
