---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
  - "package-lock.json"
  - "yarn.lock"
  - "bun.lock"
  - "astro.config.*"
  - "vite.config.*"
---

# Dependencies

- Use the package manager selected by the lockfile.
- Keep one lockfile.
- Add a dependency only when it clearly reduces complexity or supplies non trivial maintained behavior.
- Check whether the browser, Astro, React, Swup, Motion, or Cloudflare already provides the capability.
- Prefer actively maintained ESM packages with clear ownership and TypeScript support.
- Avoid packages that require Node APIs in Cloudflare runtime code.
- Avoid adding a second library for routing, animation, schema validation, formatting, linting, or testing when one is already established.
- Remove unused dependencies promptly.
- Keep dependency upgrades scoped and review breaking changes before adapting code.
- Do not hide dependency warnings with blanket overrides.
