# Editorial workflow

An entity file under `data/` and its rule text are written through `aubaine-content`, whose
`.claude/skills/aubaine-content/references/writing.md` holds the procedure for any entry. Lore is
written through `aubaine-lore`. The surfaces below are this skill's.

## Book chapters

Lead with the direct answer. Then the procedure, then the exceptions, then an example.

A chapter explains a mechanic and never changes it. If explaining it clearly requires a rule that is
not written anywhere, that is a design gap to report, not to fill.

## Translation

Resolve the concept first, then write English that a native reader would write. Check agreement,
register, punctuation, and terminology consistency.

An overlay holds only what changes. See `locale-en.md`.

## Interface copy

Write the pair, French and English, in one sitting. The type refuses a missing key, so there is no
half translated state to come back to.

Check what the string becomes: a hub lead is also that page's meta description. Read the leads of
the other hubs in the same locale before adding one, because they are few and they are read together
in search results whether or not anyone intended that.

## Policy pages

Frontmatter first, then the body, then the overlay. Every claim about rights, data or attribution is
verified against a file in the repository before it ships. See `site-copy.md`.

## Final pass

- Remove filler and repeated conclusions.
- Replace vague adjectives with concrete facts.
- Check vocabulary against Aubaine's data, not against memory.
- Check that game terms keep their established spelling and that every term meant to link is
  referenced by key.
- Check that no sentence added a mechanic the structured data does not carry.
- Check that no structured value was restated in prose.
- Check canon consistency against the entries and chapters that touch the same concept.
