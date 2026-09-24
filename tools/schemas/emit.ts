import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'astro/zod'

import {
  book,
  equipmentCatalogue,
  equipmentItem,
  equipmentSet,
  mediaCaptions,
  skill,
  skillList,
  skillTree,
  species,
  state,
  tagTaxonomy,
  vocabulary,
} from '../../src/lib/game/schema.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = resolve(root, 'schemas')

const CONTRACTS = [
  { file: 'skill', title: 'Compétence', schema: skill },
  { file: 'skill-tree', title: 'Arbre de compétences', schema: skillTree },
  { file: 'skill-list', title: 'Liste de compétences', schema: skillList },
  { file: 'species', title: 'Espèce', schema: species },
  { file: 'equipment-item', title: "Pièce d'équipement", schema: equipmentItem },
  { file: 'equipment-set', title: 'Panoplie', schema: equipmentSet },
  { file: 'equipment-catalogue', title: "Catalogue d'équipement", schema: equipmentCatalogue },
  { file: 'state', title: 'État', schema: state },
  { file: 'book', title: 'Livre', schema: book },
  { file: 'vocabulary', title: 'Vocabulaire du jeu', schema: z.object({ entries: vocabulary }) },
  { file: 'tags', title: 'Étiquettes des Compétences', schema: tagTaxonomy },
  { file: 'media-captions', title: 'Légendes des images', schema: mediaCaptions },
] as const

function serialize(title: string, id: string, schema: z.ZodType): string {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Record<
    string,
    unknown
  >
  return `${JSON.stringify({ $id: `https://aubaine.io/schema/${id}.json`, title, ...json }, null, 2)}\n`
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check')
  let drifted = 0

  for (const contract of CONTRACTS) {
    const path = resolve(outDir, `${contract.file}.schema.json`)
    const next = serialize(contract.title, contract.file, contract.schema)
    if (check) {
      const current = await readFile(path, 'utf8').catch(() => '')
      if (current !== next) {
        drifted += 1
        console.error(`schemas/${contract.file}.schema.json is out of date`)
      }
      continue
    }
    await writeFile(path, next, 'utf8')
  }

  if (check && drifted > 0) {
    console.error(`\n${drifted} schema file(s) drifted. Run: pnpm schemas`)
    process.exitCode = 1
    return
  }
  console.log(
    check ? 'schemas are up to date' : `wrote ${CONTRACTS.length} schema files to schemas/`,
  )
}

await main()
