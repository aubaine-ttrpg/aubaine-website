---
paths:
  - "src/**/*.{astro,tsx}"
  - "src/assets/**/*"
  - "public/**/*"
---

# Images And Media

- Use Astro's image pipeline for local images when possible.
- Provide intrinsic dimensions or a stable aspect ratio.
- Avoid layout shifts from media.
- Generate responsive image sizes instead of serving one oversized source everywhere.
- Use modern formats when compatible with the asset pipeline and quality requirements.
- Keep above the fold hero media intentional and compressed.
- Lazy load non critical images and embeds.
- Do not lazy load the primary above the fold image when doing so harms loading performance.
- Keep decorative imagery out of the accessibility tree.
- Write alternative text for the information conveyed by the image, not for search keywords.
- Avoid autoplaying background video on content pages.
- Provide poster images and reduced motion behavior for video when video is required.
