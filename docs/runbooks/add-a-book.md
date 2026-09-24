# Add a book

Produces one card on the resources page, leading either to a readable chapter or straight to a PDF download.

## The file to create

```
data/books/<book-id>/book.json
```

Create the folder first. The folder name is the book id and the id becomes the URL: `data/books/livre-du-joueur/book.json` serves `/fr/livres/livre-du-joueur/<chapter-slug>`. Lowercase letters, digits and hyphens, starting with a letter. The file inside is always called `book.json`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identifiant du livre, qui devient son URL. | `^[a-z][a-z0-9-]*$`, matching the folder name |
| `order` | required | Rang du livre dans le menu et sur la page des livres. | integer, 0 or more |
| `title` | required | The printed title. | any non empty string |
| `description` | required | The line printed on the card. | any non empty string |
| `cover` | optional | Couverture au rapport 3:4, dans `data/media/art/`. Absente, la carte retombe sur la bannière, puis sur la planche 16:9 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `banner` | optional | Bannière au rapport 16:9, dans `data/media/art/`. Absente, le héros retombe sur la planche 16:9 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `pdf` | optional | Nom de fichier du PDF, dans `data/media/pdf/`. | a `.pdf` filename that exists |
| `chapters` | required | Les chapitres du livre, dans l'ordre. Vide : le livre est un téléchargement seul. | array of chapter objects, or `[]` |

A chapter is `{ "slug", "file" }`. There is no nesting: a chapter's parts are the markdown headings inside its own file.

| Field | Required | What it means | Allowed values |
| --- | --- | --- | --- |
| `slug` | required | Segment d'URL du chapitre. Il ne change pas quand le livre est réordonné. | `^[a-z][a-z0-9-]*$`, unique within the book |
| `file` | required | Fichier markdown à côté de `book.json`, sans extension. | `^[0-9]{2}-[a-z0-9-]+$` |

## A complete example

`data/books/livre-du-joueur/book.json`:

```json
{
  "id": "livre-du-joueur",
  "order": 0,
  "title": "Livre du joueur",
  "description": "...",
  "banner": "tableau-de-quetes-16_9-og.png",
  "chapters": [
    { "slug": "bienvenue", "file": "01-bienvenue" },
    { "slug": "comment-jouer", "file": "02-comment-jouer" },
    { "slug": "le-combat", "file": "05-le-combat" }
  ]
}
```

That serves `/fr/livres/livre-du-joueur/bienvenue`, `.../comment-jouer` and `.../le-combat`. Each is
one page, and each builds its own outline from the `##` headings in its file.

Every `file` is a markdown file next to `book.json`: `data/books/livre-du-joueur/01-creer-un-personnage.md`, and so on.

A download only book writes `"chapters": []` and keeps its `pdf`.

## What appears on the site

- `/fr/livres` and `/en/books`: a card with the banner, the title and the description, ranked by `order`. The button reads `Lire` and links to the first chapter when `chapters` is not empty, or `Télécharger` and links to the PDF when it is empty. A book with neither is left off the page entirely.
- `/fr/livres/<book-id>/<chapter-slug>` and `/en/books/<book-id>/<chapter-slug>`, plus `.../<chapter-slug>/<section-slug>` for a section. Both locales use the same slugs, because a slug is a machine value.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if `cover` or `banner` names a file that is not in `data/media/art/`, if either breaks the naming convention or disagrees with the picture's real aspect ratio, if `pdf` names a file that is not in `data/media/pdf/`, if a `file` names a markdown file that is not in the book folder, if a markdown file in the folder is not listed by any chapter, if two chapters share a slug, or if the numeric prefixes do not sort into the reading order.

## Traps

**`order` is a rank, not a label.** Two books sharing an `order` is not rejected but the tie is resolved arbitrarily. Give each book its own number.

**A slug is the URL and a file is the file.** They are separate on purpose: `file` carries the numeric prefix that keeps the folder in reading order, and `slug` is what a reader and a link see. Reordering the book changes the prefixes, never the slugs, so no link breaks.

**A slug is permanent.** It is the one part of a chapter a reader can bookmark. Renaming one breaks every link to it, in both locales, exactly like renaming the book id.

**Slugs are not translated.** `/en/books/livre-du-joueur/l-ame` is correct. A slug is a machine value and it is shared across locales, like an id.

**A chapter is a whole page.** Its parts are `##` and `###` headings in its own file, not more files. A book with thirty tiny pages reads worse than one with ten real chapters, and the sidebar is for chapters while the in-page outline is for their parts.

**`chapters: []` means the book is a download.** The card then links to the PDF instead. A book with neither chapters nor a PDF has nothing to serve, so it is dropped from the resources page and the header menu rather than rendered as a dead card.

**The id is the URL, and so is the folder name.** They have to match. Changing either breaks existing links.

**Never write `"key": null`.** Leave the key out.

**Adding the folder is enough.** The card on the resources page and every chapter URL appear on their own.
