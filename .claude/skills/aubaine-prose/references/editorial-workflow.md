# Editorial workflow

## Any entry

1. Identify the entity kind and open its runbook in `docs/runbooks/`.
2. Read two or three siblings in the same directory. They carry the register, the terminology, and
   the level of detail Aubaine has settled on. Take them only from entries whose resolved status
   is `playtest`, `beta` or `balanced`. A `draft` is lorem ipsum or unverified text and is never a
   model, however finished it looks. Resolve the status as the build does: an entry that writes
   none inherits it from what owns it, and the `status` field in `src/lib/game/schema.ts` says
   from what. When the directory holds no settled sibling, read the nearest settled entries of the
   same kind elsewhere, and name the ones you used when you report.
3. Build the field skeleton from the schema. Decide every structured value before writing a sentence.
4. Write the mechanic until it is internally complete: trigger, subject, resolution, outcome, ending.
5. Apply keyword spelling.
6. Add flavor only where it gives the entry identity, and only where it cannot be read as a rule.
7. Run `pnpm data:check`, then look at the page.

## Rule text

Precision outranks style. The reader is at a table, mid turn, deciding what happens.

Confirm every trigger, cost, target, resolution step, outcome, duration, limit, and reset condition
that the mechanic actually has, and none that it does not.

Write prose only after the mechanic is complete. Prose written first tends to invent mechanics to
justify its sentences.

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
- Check that keywords are spelled canonically.
- Check that no sentence added a mechanic the structured data does not carry.
- Check that no structured value was restated in prose.
- Check canon consistency against the entries and chapters that touch the same concept.
