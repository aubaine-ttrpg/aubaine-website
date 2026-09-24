# Source hierarchy

Resolve any content question in this order.

1. `src/lib/game/schema.ts`, the contract. What the schema allows is what exists.
2. `docs/data-contract.md`, the model: one entity per file, what is derived, how files are written.
3. `docs/runbooks/`, the procedure for the specific entity kind.
4. Existing canonical entries under `data/`, for register and established terminology.
5. `data/meta/*.json`, the closed vocabularies, plus `RULE_TERMS` in `src/lib/game/build.ts`.
6. Book chapters under `data/books/`, for how a mechanic has already been explained and for the
   language the game uses in prose.
7. The printed plates in `data/media/pdf/`, for how the render treats a page.

A lower source can reveal a useful pattern or raise a question. It can never silently override a
higher one.

Nothing outside this list can resolve an Aubaine design question. If the repository does not decide
something, the answer is that it is undecided, and that is worth reporting rather than filling in.

Each of these is read, not remembered. A vocabulary copied out of its source is a defect waiting to
happen, because the source grows and the copy does not.
