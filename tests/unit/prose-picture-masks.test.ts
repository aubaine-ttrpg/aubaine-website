import { describe, expect, it } from 'vitest'

import { FRAME } from '../../src/lib/art-effect/presets'
import {
  GLAZED_PICTURE,
  PICTURE_MASKS,
  PICTURE_RELIEFS,
  rehypeProsePictureMasks,
} from '../../src/lib/game/book-markup'

type Root = Parameters<ReturnType<typeof rehypeProsePictureMasks>>[0]
type Child = Root['children'][number]
type Element = Extract<Child, { type: 'element' }>

const picture = (properties: Element['properties']): Element => ({
  type: 'element',
  tagName: 'img',
  properties: { src: '../../media/art/nnor-marchand-3_4-og.png', alt: '', ...properties },
  children: [],
})

function maskedPicture(properties: Element['properties']): Element {
  const tree: Root = {
    type: 'root',
    children: [{ type: 'element', tagName: 'p', properties: {}, children: [picture(properties)] }],
  }
  rehypeProsePictureMasks()(tree)
  const paragraph = tree.children[0]
  const image = paragraph?.type === 'element' ? paragraph.children[0] : undefined
  if (image?.type !== 'element') throw new Error('the picture left no element behind')
  return image
}

describe('prose picture masks', () => {
  it('turns the title of a picture into its mask', () => {
    const image = maskedPicture({ title: 'torn' })
    expect(image.properties['data-mask']).toBe('torn')
    expect(image.properties['title']).toBeUndefined()
    expect(image.properties['src']).toBe('../../media/art/nnor-marchand-3_4-og.png')
  })

  it('names the ratio of a masked picture so its shape can follow it', () => {
    expect(maskedPicture({ title: 'torn' }).properties['data-ratio']).toBe('3_4')
    const wide = maskedPicture({ title: 'torn', src: '../../media/art/nnor-marchand-16_9-og.png' })
    expect(wide.properties['data-ratio']).toBe('16_9')
  })

  it('accepts every listed mask', () => {
    for (const mask of PICTURE_MASKS) {
      expect(maskedPicture({ title: mask }).properties['data-mask']).toBe(mask)
    }
  })

  it('leaves a picture without a title unmasked', () => {
    expect(maskedPicture({}).properties['data-mask']).toBeUndefined()
  })

  it('refuses a mask that does not exist', () => {
    expect(() => maskedPicture({ title: 'cloud' })).toThrow(/"cloud"/)
  })

  it('wraps a picture with a relief so the filter sees its mask', () => {
    const relief = maskedPicture({ title: 'rupture torch' })
    expect(relief.tagName).toBe('span')
    expect(relief.properties['data-relief']).toBe('torch')
    const image = relief.children[0]
    expect(image?.type === 'element' ? image.properties['data-mask'] : undefined).toBe('rupture')
  })

  it('accepts every listed relief', () => {
    for (const relief of PICTURE_RELIEFS) {
      expect(maskedPicture({ title: `torn ${relief}` }).properties['data-relief']).toBe(relief)
    }
  })

  it('refuses a relief that does not exist, or a third word', () => {
    expect(() => maskedPicture({ title: 'torn glow' })).toThrow(/"glow"/)
    expect(() => maskedPicture({ title: 'torn torch deep' })).toThrow(/"torch deep"/)
  })

  it('frames a glazed picture and puts it under glass, keeping its ratio and alt', () => {
    const frame = maskedPicture({
      title: GLAZED_PICTURE,
      alt: 'Une toile',
      src: '../../media/art/les-naufrages-de-la-venue-3_2-og.png',
    })
    expect(frame.tagName).toBe('span')
    expect(frame.properties['className']).toBe('au-prose__frame')
    const { slice } = FRAME
    expect(frame.properties['style']).toContain(
      `--au-frame-slice:${slice.top} ${slice.right} ${slice.bottom} ${slice.left}`,
    )
    expect(frame.properties['style']).toContain(
      `--au-frame-share:${((100 * slice.left) / FRAME.width).toFixed(4)}`,
    )
    const moulding = frame.children[0]
    if (moulding?.type !== 'element') throw new Error('the frame holds no moulding')
    expect(moulding.properties['className']).toBe('au-prose__moulding')
    const glass = moulding.children[0]
    if (glass?.type !== 'element') throw new Error('the moulding holds no glass')
    expect(glass.properties['data-relief']).toBe('glass')
    expect(glass.properties['data-ratio']).toBe('3_2')
    const image = glass.children[0]
    if (image?.type !== 'element') throw new Error('the glass holds no picture')
    expect(image.tagName).toBe('img')
    expect(image.properties['alt']).toBe('Une toile')
    expect(image.properties['title']).toBeUndefined()
    expect(image.properties['data-mask']).toBeUndefined()
  })

  it('refuses a second word after glazed', () => {
    expect(() => maskedPicture({ title: `${GLAZED_PICTURE} torch` })).toThrow(/no second word/)
  })
})
