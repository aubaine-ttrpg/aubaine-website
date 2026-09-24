---
paths:
  - "src/**/*.tsx"
---

# Motion For React

- Use the modern `motion` package and `motion/react` imports for a new project.
- Do not mix `motion/react` and legacy `framer-motion` imports.
- Use Motion only inside React islands unless a concrete integration requires otherwise.
- Use CSS for simple hover, focus, opacity, and transform transitions that do not require React state.
- Use Motion for state driven animation, presence, gestures, layout animation, and coordinated interactive sequences.
- Prefer transforms and opacity for frequent animation.
- Avoid expensive layout animation when transforms can express the same result.
- Respect the user's reduced motion preference globally and in custom interactions.
- Keep essential information available without an animation completing.
- Avoid long entrance sequences on reference and wiki pages.
- Keep motion variants close to the component that owns them unless they are genuinely shared.
- Consider `LazyMotion` and the smaller `m` component when Motion becomes a meaningful share of client JavaScript.
- Do not run Swup page transitions and React presence animation over the same page container.
