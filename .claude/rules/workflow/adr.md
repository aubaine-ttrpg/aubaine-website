# Architecture Decision Records

- Record a choice that is hard to reverse, or that a future contributor will reasonably question, as
  a record under `docs/adr/`, in the same change as the code it explains.
- `docs/adr/README.md` owns when to write one, the format, the numbering, and the amend and
  supersede policy. `docs/adr/template.md` owns the skeleton. Read them rather than reproducing
  their rules anywhere else.
- Write and amend records through the `aubaine-adr` skill.
- Link a record from the rule or document that needs it. Do not restate its reasoning in a second
  place.
- Skip the record for a trivial or easily reversible choice. The set stays useful only while it
  stays small.
- Do not assert a version, measurement, vendor limit, or conformance status in a record that was not
  verified against the repository or a primary source.
- Never rewrite an accepted decision in place, renumber a record, or delete one.
