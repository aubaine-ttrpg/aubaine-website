import { createHash } from 'node:crypto'

import { baseService } from 'astro/assets'
import sharpService from 'astro/assets/services/sharp'

import { type AssetClaim, licenceClaim } from './claim.ts'
import { stampJpeg } from './jpeg.ts'
import { stampPng } from './png.ts'
import { stampWebp } from './webp.ts'
import { xmpPacket } from './xmp.ts'

const CLAIM = licenceClaim()

const RIGHTS = createHash('sha256').update(xmpPacket(CLAIM)).digest('hex').slice(0, 8)

const WRITERS: Record<string, (bytes: Uint8Array, claim: AssetClaim) => Uint8Array> = {
  webp: stampWebp,
  png: stampPng,
  jpeg: stampJpeg,
  jpg: stampJpeg,
}

const service: typeof sharpService = {
  ...sharpService,

  propertiesToHash: [...(baseService.propertiesToHash ?? []), 'rights'],

  async validateOptions(options, config, logger) {
    const validated = (await sharpService.validateOptions?.(options, config, logger)) ?? options
    validated.rights = RIGHTS
    return validated
  },

  async transform(bytes, transform, config, logger) {
    const result = await sharpService.transform(bytes, transform, config, logger)
    if (result.format === 'svg') return result
    const writer = WRITERS[result.format]
    if (writer === undefined) {
      throw new Error(`src/lib/rights has no writer for ${result.format}`)
    }
    return { ...result, data: writer(result.data, CLAIM) }
  },
}

export default service
