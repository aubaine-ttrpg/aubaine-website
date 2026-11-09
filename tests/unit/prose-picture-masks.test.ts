import { describe, expect, it } from 'vitest'

import { FRAME_KINDS, FRAMES, type FrameKind, GLAZED_FRAME } from '../../src/lib/art-effect/presets'
import {
  ALMANACH_PICTURE,
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

  function frameStyleOf(frame: FrameKind): string[] {
    const { slice, width } = FRAMES[frame]
    return [
      `--au-frame-slice:${slice.top} ${slice.right} ${slice.bottom} ${slice.left}`,
      `--au-frame-share:${((100 * slice.left) / width).toFixed(4)}`,
    ]
  }

  it('frames a glazed picture and puts it under glass, keeping its ratio and alt', () => {
    const frame = maskedPicture({
      title: GLAZED_PICTURE,
      alt: 'Une toile',
      src: '../../media/art/les-naufrages-de-la-venue-3_2-og.png',
    })
    expect(frame.tagName).toBe('span')
    expect(frame.properties['className']).toBe('au-prose__frame')
    expect(frame.properties['data-frame']).toBe(GLAZED_FRAME)
    for (const property of frameStyleOf(GLAZED_FRAME)) {
      expect(frame.properties['style']).toContain(property)
    }
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

  it('hangs a glazed picture in the frame its second word names', () => {
    for (const kind of FRAME_KINDS) {
      const frame = maskedPicture({
        title: `${GLAZED_PICTURE} ${kind}`,
        src: '../../media/art/enluminure-11_12-og.png',
      })
      expect(frame.properties['data-frame']).toBe(kind)
      for (const property of frameStyleOf(kind)) {
        expect(frame.properties['style']).toContain(property)
      }
    }
  })

  it('refuses a glazed picture in a frame that does not exist, or with a third word', () => {
    expect(() => maskedPicture({ title: `${GLAZED_PICTURE} torch` })).toThrow(/one of the frames/)
    const [kind] = FRAME_KINDS
    expect(() => maskedPicture({ title: `${GLAZED_PICTURE} ${kind} torch` })).toThrow(
      /one of the frames/,
    )
  })

  it('stands a picture in an almanach of the named style, keeping its alt', () => {
    const stage = maskedPicture({
      title: `${ALMANACH_PICTURE} humain`,
      alt: 'Une bibliothèque',
      src: '../../media/art/bibliotheque-des-oracles-16_9-og.png',
    })
    expect(stage.tagName).toBe('span')
    expect(stage.properties['className']).toBe('au-almanach__stage')
    expect(stage.properties['data-almanach']).toBe('')
    expect(stage.properties['data-almanach-style']).toBe('humain')
    const image = stage.children[0]
    if (image?.type !== 'element') throw new Error('the almanach holds no picture')
    expect(image.tagName).toBe('img')
    expect(image.properties['alt']).toBe('Une bibliothèque')
    expect(image.properties['data-almanach-picture']).toBe('')
    expect(image.properties['data-fit']).toBe('cover')
    expect(image.properties['title']).toBeUndefined()
  })

  it('stands a picture in the default almanach when the word names no style', () => {
    const stage = maskedPicture({
      title: ALMANACH_PICTURE,
      src: '../../media/art/bibliotheque-des-oracles-16_9-og.png',
    })
    expect(stage.properties['data-almanach']).toBe('')
    expect(stage.properties['data-almanach-style']).toBeUndefined()
    const image = stage.children[0]
    if (image?.type !== 'element') throw new Error('the almanach holds no picture')
    expect(image.properties['data-fit']).toBe('cover')
  })

  it('refuses an almanach with a second name, or with a malformed one', () => {
    const wide = '../../media/art/bibliotheque-des-oracles-16_9-og.png'
    expect(() => maskedPicture({ title: `${ALMANACH_PICTURE} humain elfe`, src: wide })).toThrow(
      /name of an almanach style/,
    )
    expect(() => maskedPicture({ title: `${ALMANACH_PICTURE} Humain`, src: wide })).toThrow(
      /name of an almanach style/,
    )
  })

  it('refuses an almanach around a portrait, which the tube cannot show whole', () => {
    expect(() => maskedPicture({ title: `${ALMANACH_PICTURE} humain` })).toThrow(/portrait/)
    expect(() =>
      maskedPicture({ title: ALMANACH_PICTURE, src: '../../media/art/enluminure-11_12-og.png' }),
    ).toThrow(/portrait/)
  })
})
