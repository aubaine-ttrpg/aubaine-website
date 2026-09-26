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

The filename matches `^[0-9]{2}-[a-z0-9-]+$`: two digits, a hyphen, then lowercase letters, digits and hyphens. `01-bienvenue.md`, `10-le-combat.md`. The digits keep the folder in reading order and must sort the same way the book reads; they do not decide the URL. The URL comes from the chapter's `slug`.

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
| `> [!EXAMPLE] Titre`, a bare `>`, then the body | a light box for an example of play: it shows a rule at the table and never changes it |
| `> [!PRINCIPLE] Titre`, a bare `>`, then the body | a solemn framed box with a centred title, kept for the rules that come before all others, like the three golden rules |
| `{{clé}}` | a link to the entry the key names, with its tooltip, printing its default label |
| `{{clé\|texte}}` | the same link, printing `texte` as written |

Rule text references work here and resolve exactly as they do in an entry, with the keys the table in [data-contract.md](../data-contract.md#rule-text-markup) lists: `{{agonie}}`, `{{ATTAQU-001}}`, `{{avantage}}`, `{{jet|Jets}}`. `pnpm data:check` fails on a key that does not resolve and on `[[` anywhere.

You choose every link. Each `{{...}}` renders as a link and each bare word as text, so `Avantage` written without markup stays text, at its first appearance as anywhere else. Write `**bold**`, not `***gras***`: markdown owns emphasis in a chapter.

## A complete example

`data/books/livre-du-joueur/03-creer-un-personnage.md`, opening:

```markdown
---
title: "Créer un personnage"
description: "Les huit étapes, les trois monnaies, l'Âme, les Points de maîtrise, les ressources, les premiers PX et un exemple monté de bout en bout."
---

Créer un personnage se fait en huit étapes, dans l'ordre. Les sept premières se décident, la dernière se calcule. Ne remplissez aucune case chiffrée avant l'étape 8 : un personnage se pose d'abord, il se compte ensuite.

Prenez le temps des premières étapes. Qui est ce personnage, d'où vient-il, qu'est-ce qui le pousse sur les routes : les réponses guideront chaque chiffre que vous écrirez ensuite.

## Ce que le MJ vous donne

Un personnage neuf reçoit :

- un Arbre de Domaine ;
- un Arbre d'Archétype ;
- deux Compétences d'Espèce ;
- 25 Points d'expérience (PX) ;
- 22 Points de maîtrise (PM) ;
- 3 Points de potentiel (PP).

Le MJ annonce toute modification de cet ensemble avant que la table commence. Une partie d'un soir et une longue campagne n'ouvrent pas sur les mêmes chiffres.

## Trois monnaies

Elles ne se convertissent pas l'une dans l'autre. Une monnaie dépensée au mauvais endroit ne se récupère qu'en jeu.

PX
: Achètent les Arbres, les Compétences et leurs Niveaux.

PM
: Achètent les six {{caracteristique|Caractéristiques}}, les {{aptitude|Aptitudes}} et la {{specialite}}.

PP
: Achètent les trois voies de ressources : Vitalité, {{memoire}} et {{energie}}.
```

And the file is listed, in `data/books/livre-du-joueur/book.json`:

```json
{
  "id": "livre-du-joueur",
  "order": 0,
  "title": "Livre du joueur",
  "description": "Tout ce qu'il faut pour jouer : les trois règles d'or, le Jet, créer un personnage, les Arbres, l'équipement, l'exploration, les interactions, le combat et la progression.",
  "banner": "tableau-de-quetes-16_9-og.png",
  "chapters": [
    {
      "slug": "les-trois-regles-d-or",
      "file": "00-les-trois-regles-d-or"
    },
    {
      "slug": "bienvenue",
      "file": "01-bienvenue"
    },
    {
      "slug": "comment-jouer",
      "file": "02-comment-jouer"
    },
    {
      "slug": "creer-un-personnage",
      "file": "03-creer-un-personnage"
    },
    {
      "slug": "les-especes",
      "file": "04-les-especes"
    },
    {
      "slug": "les-arbres-et-les-competences",
      "file": "05-les-arbres-et-les-competences"
    },
    {
      "slug": "les-competences-de-base",
      "file": "06-les-competences-de-base"
    },
    {
      "slug": "l-equipement",
      "file": "07-l-equipement"
    },
    {
      "slug": "l-exploration",
      "file": "08-l-exploration"
    },
    {
      "slug": "les-interactions-sociales",
      "file": "09-les-interactions-sociales"
    },
    {
      "slug": "le-combat",
      "file": "10-le-combat"
    },
    {
      "slug": "degats-et-soins",
      "file": "11-degats-et-soins"
    },
    {
      "slug": "repos-et-progression",
      "file": "12-repos-et-progression"
    }
  ]
}
```

`03-creer-un-personnage` carries the slug `creer-un-personnage`, so it is served at `/fr/livres/livre-du-joueur/creer-un-personnage`. Where it sits in `chapters` decides only its place in the reading order and in the pager.

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

**A callout's first line is its kind and its title, and the next line is a bare `>`.** Only `EXAMPLE` and `PRINCIPLE` exist, listed by `CALLOUT_KINDS` in `src/lib/game/book-markup.ts`. `pnpm data:check` fails on another kind, a missing title, or a body written on the title line.

**A `#` heading is rejected.** The chapter title comes from the frontmatter, so the body starts at `##`. `pnpm data:check` fails on a level one heading.

## How to check it

```
pnpm data:check
pnpm dev
```
