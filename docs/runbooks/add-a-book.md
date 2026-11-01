# Add a book

Files a book under one of the four Livres categories. Its card on that category's page leads either to its first chapter or straight to its PDF.

## The file to create

```
data/books/<book-id>/book.json
```

Create the folder first. The folder name is the book id and the id becomes the URL: `data/books/livre-du-joueur/book.json` serves `/fr/livres/livre-du-joueur/<chapter-slug>`. Lowercase letters, digits and hyphens, starting with a letter. The file inside is always called `book.json`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identifiant du livre, qui devient son URL. | `^[a-z][a-z0-9-]*$`, matching the folder name |
| `category` | required | Catégorie du livre : 'rules' pour un livre de règles, 'resources' pour ce qui s'imprime et aide une partie sans être un livre de règles (fiche, recueil, aide de jeu), 'adventures' pour une aventure, 'stories' pour une histoire. Elle décide la page de catégorie qui liste le livre ; chaque catégorie a sa page et son entrée au menu Livres, même vide. | `rules`, `resources`, `adventures` or `stories` (`BOOK_CATEGORIES`) |
| `order` | required | Rang du livre parmi les livres de sa catégorie. | integer, 0 or more |
| `title` | required | Titre du livre, tel que sa carte et ses pages le portent. | any non empty string |
| `description` | required | Une phrase qui dit ce que le livre contient, sous son titre. | any non empty string |
| `cover` | optional | Couverture au rapport 3:4, dans `data/media/art/`. Absente, sa carte sur la page de sa catégorie montre le sceau de sa catégorie. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `banner` | optional | Bannière au rapport 16:9, dans `data/media/art/`. Absente, le héros retombe sur la planche 16:9 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `backCover` | optional | Quatrième de couverture au rapport 3:4, dans `data/media/art/` : la planche verticale au dos du livre imprimé. Absente, le dos retombe sur la planche commune que nomme `src/lib/booklet/back-cover.ts`. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `chapters` | required | Les chapitres du livre, dans l'ordre. Vide : le livre est un téléchargement seul. | array of chapter objects, or `[]` |

A chapter is `{ "slug", "file" }`. There is no nesting: a chapter's parts are the markdown headings inside its own file.

| Field | Required | What it means | Allowed values |
| --- | --- | --- | --- |
| `slug` | required | Segment d'URL du chapitre. Il ne change pas quand le livre est réordonné. | `^[a-z][a-z0-9-]*$`, unique within the book |
| `file` | required | Fichier markdown à côté de `book.json`, sans extension. | `^[0-9]{2}-[a-z0-9-]+$` |

## A complete example

`data/books/livre-du-joueur/book.json`, cut to three of its chapters:

```json
{
  "id": "livre-du-joueur",
  "category": "rules",
  "order": 0,
  "title": "Livre du joueur",
  "description": "Tout ce qu'il faut pour jouer : les trois règles d'or, le Jet, créer un personnage, les Arbres, l'équipement, l'exploration, les interactions, le combat et la progression.",
  "cover": "livre-du-joueur-3_4-og.png",
  "banner": "tableau-de-quetes-16_9-og.png",
  "chapters": [
    { "slug": "bienvenue", "file": "01-bienvenue" },
    { "slug": "comment-jouer", "file": "02-comment-jouer" },
    { "slug": "le-combat", "file": "10-le-combat" }
  ]
}
```

That serves `/fr/livres/livre-du-joueur/bienvenue`, `.../comment-jouer` and `.../le-combat`. Each is
one page, and each builds its own outline from the `##` headings in its file.

Every `file` is a markdown file next to `book.json`: `data/books/livre-du-joueur/01-bienvenue.md`, and so on.

A download only book writes `"chapters": []`. Its PDF is the book's newest printing in the booklet register, `data/pdf/releases.json`, and the book appears only while the register holds a printing of it in every locale. `pnpm pdf` prints only books that have chapters, so a new download only book has no PDF.

## What appears on the site

- `/fr/livres` and `/en/books`: the Livres hub, a contents page with one entry per category, in the order of `BOOK_CATEGORIES`, then the archives. The header's Livres menu lists the same entries.
- The category's page, `/fr/livres/<segment>` and `/en/books/<segment>`, with the segment from `CATEGORY_SEGMENT` in `src/lib/i18n/routes.ts` (such as `/fr/livres/regles`): a select screen of the category's books, books first by `order`, then the printed aids `src/lib/game/library.ts` files there. The book's card shows its cover, or its category's seal. Its button reads `Lire` and opens the first chapter when `chapters` is not empty, or `Télécharger` and downloads the PDF when it is empty. A book with neither is left off. A category that holds nothing yet still has its page: it says so with the house empty state, offers the way back to all books, and stays out of search engines and the sitemap.
- `/fr/livres/<book-id>/<chapter-slug>` and `/en/books/<book-id>/<chapter-slug>`: the chapter's page. Both locales use the same slugs, because a slug is a machine value.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if `category` is missing or not one of the four, if two books of one category share an `order`, if the book id equals a category's URL segment (its chapters would then sit under that category's URL), if `cover`, `banner` or `backCover` names a file that is not in `data/media/art/`, if one of them breaks the naming convention or disagrees with the picture's real aspect ratio, if a `file` names a markdown file that is not in the book folder, if a markdown file in the folder is not listed by any chapter, if two chapters share a slug, or if the numeric prefixes do not sort into the reading order.

## Traps

**`order` is a rank within the category, not a label.** Give each book of a category its own number.

**A slug is the URL and a file is the file.** They are separate on purpose: `file` carries the numeric prefix that keeps the folder in reading order, and `slug` is what a reader and a link see. Reordering the book changes the prefixes, never the slugs, so no link breaks.

**A slug is permanent.** It is the one part of a chapter a reader can bookmark. Renaming one breaks every link to it, in both locales, exactly like renaming the book id.

**Slugs are not translated.** `/en/books/livre-du-joueur/bienvenue` is correct. A slug is a machine value and it is shared across locales, like an id.

**A chapter is a whole page.** Its parts are `##` and `###` headings in its own file, not more files. A book with thirty tiny pages reads worse than one with ten real chapters, and the sidebar is for chapters while the in-page outline is for their parts.

**`chapters: []` means the book is a download.** The card then links to the PDF instead. A book with neither chapters nor a PDF has nothing to serve, so it is dropped from its category's page rather than rendered as a dead card. A category left with nothing keeps its page, its entry and its menu entry, and its page says that nothing is there yet.

**The id is the URL, and so is the folder name.** They have to match. Changing either breaks existing links.

**Never write `"key": null`.** Leave the key out.

**Adding the folder is enough for a book with chapters.** The book's card on its category's page and every chapter URL appear on their own, and the first book of a category replaces its empty state.
