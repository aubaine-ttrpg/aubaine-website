---
paths:
  - "data/**/*.json"
  - "data/**/*.md"
  - "src/pages/**/*"
  - "src/layouts/**/*"
  - "src/pages/robots.txt.ts"
---

# Generative Discovery

- Optimize for retrieval and citation by making content original, specific, clear, well structured, and attributable.
- Do not create content solely to target generative systems.
- Serve the same canonical source content to people, search crawlers, and generative search crawlers.
- Give each page a clear entity, topic, or question focus.
- Put the direct definition or core answer near the beginning when the page type supports it.
- Use descriptive headings that expose the information structure.
- Keep facts close to the entity or claim they describe.
- Define uncommon setting terms before relying on them heavily.
- Use the stable identifiers Aubaine already has, meaning entity ids, skill titles, and state names, when they disambiguate an entity.
- Link related concepts through descriptive internal links.
- Use tables only for genuinely tabular facts.
- Use lists when order or membership matters.
- Distinguish fact from editorial interpretation.
- Do not add hidden summaries, synthetic question blocks, or structured data unsupported by visible content.
- Do not manufacture a frequently asked questions section for search visibility.
- Do not pad a page to reach a word count.
- Do not stack localized names, English aliases, abbreviations, and synonyms into one sentence.
- Unique local context is worth more than the same generic introduction paraphrased across hundreds of entries.
- Do not create `llms.txt` as a ranking tactic. Add it only if a concrete consumer or product requirement justifies maintaining it.
- If public discoverability in ChatGPT Search is desired, do not block OAI-SearchBot from public indexable content.
- Treat OAI-SearchBot access and GPTBot training access as separate policy decisions.
