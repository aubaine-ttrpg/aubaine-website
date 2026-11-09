import { type ParseArgsOptionsConfig, parseArgs } from 'node:util'

import type { Corpus, ResolvedSpecies } from '../../src/lib/game/build.ts'
import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import { flattenText, termLabels } from '../../src/lib/game/richtext.ts'
import { type LoreKind, type LoreTarget, type PagePart, pageParts } from './survey.ts'

export const LORE_DIR: Record<LoreKind, string> = { species: 'species', tree: 'skill-trees' }

export async function loreTargets(root: string): Promise<LoreTarget[]> {
  const [fr, en] = await Promise.all([readCorpus(root, 'fr'), readCorpus(root, 'en')])
  const named = (kind: LoreKind, id: string, names: (string | undefined)[]): LoreTarget => ({
    kind,
    id,
    names: [...new Set(names.filter((name): name is string => name !== undefined))],
  })
  return [
    ...fr.species.map((species) =>
      named('species', species.id, [species.name, en.speciesById.get(species.id)?.name]),
    ),
    ...fr.trees.map((tree) => named('tree', tree.id, [tree.name, en.treesById.get(tree.id)?.name])),
  ]
}

export function targetArgumentsOf<Options extends ParseArgsOptionsConfig>(
  args: string[],
  options: Options,
) {
  try {
    const { values, positionals } = parseArgs({
      args: args[0] === '--' ? args.slice(1) : args,
      options,
      allowPositionals: true,
    })
    if (positionals.length > 1) {
      return new Error(`one id or name, got ${positionals.length}: ${positionals.join(', ')}`)
    }
    return { query: positionals[0], values }
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
}

export function playParts(species: ResolvedSpecies | undefined): PagePart[] {
  return [
    { label: 'roleplay.text', text: species?.roleplay?.text },
    ...(species?.subspecies ?? []).map((sub) => ({
      label: `sub-species ${sub.id}`,
      text: sub.text,
    })),
    { label: 'naming', text: species?.naming },
  ].flatMap((part) => (part.text === undefined ? [] : [{ label: part.label, text: part.text }]))
}

export function pagePrinter(corpus: Corpus): (text: string) => string {
  const labelOf = termLabels(corpus.terms)
  return (text) =>
    text
      .split('\n')
      .map((line) => flattenText(line, labelOf))
      .join('\n')
}

export function printedPage(
  markdown: string,
  corpus: Corpus,
  species: ResolvedSpecies | undefined,
): PagePart[] {
  const printed = pagePrinter(corpus)
  return pageParts(
    printed(markdown),
    playParts(species).map((part) => ({ ...part, text: printed(part.text) })),
  )
}
