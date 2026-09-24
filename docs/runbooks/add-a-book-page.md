# Add a book page

Produces one chapter inside a book, at its own URL, with the book's chapter navigation around it.

## The files to create and edit

Create the page:

```
data/books/<book-id>/<NN>-<slug>.md
```

Then add a chapter entry for it to `chapters` in:

```
data/books/<book-id>/book.json
```

Two steps. A markdown file that `book.json` does not list is not served, and `pnpm data:check` now fails on it.

The filename matches `^[0-9]{2}-[a-z0-9-]+$`: two digits, a hyphen, then lowercase letters, digits and hyphens. `01-bienvenue.md`, `05-le-combat.md`. The digits keep the folder in reading order and must sort the same way the book reads; they do not decide the URL. The URL comes from the chapter's `slug`.

## The fields

The markdown file carries these frontmatter fields.

| Field | Required | What it means | Allowed values |
| --- | --- | --- | --- |
| `title` | required | The printed chapter title, and what the browser tab and the chapter navigation show. | any non empty string |
| `description` | optional | The meta description for this chapter alone. Left out, the chapter falls back to the book's. | any non empty string |

Everything after the frontmatter is the chapter body. What is supported:

| Markup | Renders as |
| --- | --- |
| `## Heading` | a section heading, and a line in the page outline |
| `### Heading` | a sub-heading inside a section |
| `**bold**`, `*italic*` | bold, italic |
| `- item` | a list |
| `Terme` then a line starting with `: ` | a definition list, used for the trait and resource blocks |
| a table | a table (GitHub flavoured markdown is on) |
| `> text`, closed by `> :source[Qui parle]` | a quote framed on its own, the `:source[...]` line becoming its attribution |

| `[[Nom d'état]]` | the state, marked, with its tooltip |
| `{{Nom de compétence}}` | the Skill, marked, linking to its entry |

Rule text markup works here and resolves exactly as it does in an entry. `pnpm data:check` fails on a name that does not resolve.

Keywords are marked automatically from their spelling, so you never mark `Avantage` or `Jet` by hand. Write `**bold**`, not `***gras***`: markdown owns emphasis in a chapter.

## A complete example

`data/books/livre-du-joueur/02-l-ame.md`, opening:

```markdown
---
title: "L'Âme"
---

L'Âme est ce qui distingue le personnage une fois les chiffres égaux. Elle se décide avec le MJ, dans le ton que la table s'est donné.

Chaque personnage en porte cinq morceaux.

Phobie
: Une peur qui pèse sur ses décisions. Elle sert quand elle coûte quelque chose.

Manie
: Une habitude, une obsession, un geste qui revient.

Défaut
: Un trait durable qui lui attire des ennuis.

Spécialité
: Un domaine personnel étroit dans lequel il excelle.

Don
: Une faculté exceptionnelle qui n'appartient qu'à lui.

## Karma

La Phobie, la Manie et le Défaut portent chacun un emplacement de Karma. Un personnage conserve donc au plus trois points, un par emplacement.
```

And the file is listed, in `data/books/livre-du-joueur/book.json`:

```json
{
  "id": "livre-du-joueur",
  "order": 0,
  "title": "Livre du joueur",
  "description": "...",
  "banner": "priest-16_9-og.png",
  "pdf": "livre-du-joueur.pdf",
  "chapters": [
    { "slug": "creer-un-personnage", "file": "01-creer-un-personnage" },
    { "slug": "l-ame", "file": "02-l-ame" }
  ]
}
```

`02-l-ame` carries the slug `l-ame`, so it is served at `/fr/livres/livre-du-joueur/l-ame`. Where it sits in `chapters` decides only its place in the reading order and in the pager.

## What appears on the site

- `/fr/livres/<book-id>/<slug>` and `/en/books/<book-id>/<slug>`, or `.../<chapter-slug>/<slug>` for a section. The `title` from the frontmatter is the chapter heading and the browser tab title.
- `/fr/livres` and `/en/books`: the book card's button now reads `Lire` and points at the first chapter, if the book had no chapters before.

## Traps

**The URL is the slug, not the filename and not a position.** Insert a chapter anywhere and no existing URL moves. That is the whole reason the slug exists, so do not rename one to tidy it up.

**Two steps, and the second one is easy to forget.** A markdown file that no chapter lists is not served. Both directions now fail `pnpm data:check`: an unlisted file on disk, and a `file` with nothing behind it.

**One chapter, one page, one file.** A chapter's parts are `##` and `###` headings in its own body. The page builds its outline from the `##` ones, so a long chapter is navigable without being split.

**The filename pattern is enforced.** Two digits, an optional letter, a hyphen, then lowercase letters, digits and hyphens. No accents, no capitals, no underscore. `02-l-ame`, not `02-l-âme`.

**The prefixes have to sort into the reading order.** `pnpm data:check` compares the two, so renumber the files when you reorder the book.

**The frontmatter `title` is required.** A page without it fails the build.

**A `#` heading is rejected.** The chapter title comes from the frontmatter, so the body starts at `##`. `pnpm data:check` fails on a level one heading.

## How to check it

```
pnpm data:check
pnpm dev
```
