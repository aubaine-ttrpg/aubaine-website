import { type PerspectiveCamera, Vector3 } from 'three'
import { LABEL_GROUP_OF, type LabelGroup, type LabelKind } from '../contract/display.ts'
import { DEFAULT_LABEL_LIFT, LANDMARK_LABEL_LIFT, landmarkPlacement } from '../kernel/placement.ts'
import type { PlaceRecord, World } from '../world/model.ts'
import type { AtlasRef } from '../world/refs.ts'
import { type ReliefField, ROCK_TOP, surfaceY } from '../world/relief.ts'
import { smoothstep } from '../world/smoothstep.ts'

export const LABEL_MARKS = ['capital', 'city', 'village', 'landmark', 'hold', 'cavern'] as const
export type LabelMark = (typeof LABEL_MARKS)[number]

type Spec = {
  text: string
  kind: LabelKind
  mark: LabelMark | undefined
  x: number
  y: number
  z: number
  near: number
  far: number
  priority: number
  level: number
  ref: AtlasRef | undefined
}

type Label = Spec & {
  element: HTMLElement
  width: number
  height: number
  opacity: number
  veiled: boolean
}

const CONTINENT_TILES = 60
const NATURAL_TILES = 5
const ALOFT_LABEL_Y = 7.6
const MARGIN_X = 200
const MARGIN_Y = 50
const PAD_X = 6
const PAD_Y = 3
const UNEXPLORED_LABEL = { y: 0.6, near: 18, far: 420, priority: 1 } as const

const LAYER_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  inset: '0',
  overflow: 'hidden',
  pointerEvents: 'none',
  contain: 'strict',
  userSelect: 'none',
}

const UNEXPLORED_STYLE: Partial<CSSStyleDeclaration> = { pointerEvents: 'none' }
const SVG_NS = 'http://www.w3.org/2000/svg'
const HEXAGON_POINTS = '13,1 25,8 25,22 13,29 1,22 1,8'

function hexagonMark(): SVGSVGElement {
  const mark = document.createElementNS(SVG_NS, 'svg')
  mark.setAttribute('viewBox', '0 0 26 30')
  mark.setAttribute('class', 'au-atlas-label__mark')
  mark.setAttribute('aria-hidden', 'true')
  const shape = document.createElementNS(SVG_NS, 'polygon')
  shape.setAttribute('points', HEXAGON_POINTS)
  mark.append(shape)
  return mark
}

const LABEL_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  left: '0',
  top: '0',
  whiteSpace: 'nowrap',
  willChange: 'transform, opacity',
  pointerEvents: 'auto',
  opacity: '0',
  visibility: 'hidden',
}

function surfaceSpec(field: ReliefField, place: PlaceRecord): Spec | undefined {
  const ground = () => Math.max(0, surfaceY(field, place.centreX, place.centreZ))
  const ref: AtlasRef = { kind: 'place', place: place.index }
  const base = { text: place.name, x: place.centreX, z: place.centreZ, level: 0, ref }
  if (place.tiles.length === 0) {
    if (place.kind === 'natural' && place.skyTiles.length > 0) {
      return {
        ...base,
        kind: 'natural',
        mark: undefined,
        y: ALOFT_LABEL_Y,
        near: 30,
        far: 160,
        priority: 5,
      }
    }
    return undefined
  }
  switch (place.kind) {
    case 'continent':
      return place.tiles.length > CONTINENT_TILES
        ? {
            ...base,
            kind: 'continent',
            mark: undefined,
            y: ground() + 1.2,
            near: 95,
            far: 600,
            priority: 10,
          }
        : undefined
    case 'country':
      return {
        ...base,
        kind: 'country',
        mark: undefined,
        y: ground() + 1,
        near: 40,
        far: 260,
        priority: 8,
      }
    case 'sea':
      return { ...base, kind: 'sea', mark: undefined, y: 0.2, near: 30, far: 600, priority: 6 }
    case 'region':
      return {
        ...base,
        kind: 'region',
        mark: undefined,
        y: ground() + 0.8,
        near: 16,
        far: 95,
        priority: 4,
      }
    case 'natural':
      return place.tiles.length >= NATURAL_TILES
        ? {
            ...base,
            kind: 'natural',
            mark: undefined,
            y: ground() + 0.8,
            near: 9,
            far: 120,
            priority: 5,
          }
        : undefined
    case 'city':
      return {
        ...base,
        kind: 'city',
        mark: place.isCapital ? 'capital' : 'city',
        y: ground() + 0.9,
        near: 0,
        far: 165,
        priority: 9,
      }
    case 'village':
      return {
        ...base,
        kind: 'village',
        mark: 'village',
        y: ground() + 0.5,
        near: 0,
        far: 60,
        priority: 6,
      }
    case 'quarter':
      return {
        ...base,
        kind: 'quarter',
        mark: undefined,
        y: ground() + 0.5,
        z: place.centreZ + 0.25,
        near: 0,
        far: 18,
        priority: 3,
      }
    default:
      return undefined
  }
}

function undergroundSpec(place: PlaceRecord): Spec | undefined {
  if (place.tiles.length === 0) return undefined
  const base = {
    text: place.name,
    x: place.centreX,
    y: ROCK_TOP + 0.25,
    z: place.centreZ,
    level: place.stratum,
    ref: { kind: 'place', place: place.index } satisfies AtlasRef,
  }
  switch (place.kind) {
    case 'realm':
      return { ...base, kind: 'realm', mark: undefined, near: 30, far: 420, priority: 9 }
    case 'network':
      return { ...base, kind: 'network', mark: undefined, near: 10, far: 140, priority: 6 }
    case 'hold':
      return { ...base, kind: 'hold', mark: 'hold', near: 0, far: 70, priority: 8 }
    case 'hold-quarter':
      return { ...base, kind: 'quarter', mark: undefined, near: 0, far: 20, priority: 5 }
    case 'cavern':
      return { ...base, kind: 'cavern', mark: 'cavern', near: 0, far: 70, priority: 5 }
    default:
      return undefined
  }
}

export function labelSpecs(world: World, field: ReliefField): Spec[] {
  const specs: Spec[] = []
  for (const place of world.places) {
    const spec = place.stratum > 0 ? undergroundSpec(place) : surfaceSpec(field, place)
    if (spec) specs.push(spec)
  }
  for (const landmark of world.landmarks) {
    const base = landmarkPlacement(field, landmark)
    const wide = landmark.kind === 'worldtree' || landmark.kind === 'skycity'
    specs.push({
      text: landmark.name,
      kind: 'landmark',
      mark: 'landmark',
      x: landmark.x,
      y: base.y + (LANDMARK_LABEL_LIFT[landmark.kind] ?? DEFAULT_LABEL_LIFT),
      z: landmark.z,
      near: 0,
      far: wide ? 200 : 90,
      priority: 7,
      level: 0,
      ref: { kind: 'landmark', landmark: landmark.index },
    })
  }
  return specs.sort((a, b) => b.priority - a.priority)
}

export class LabelLayer {
  readonly element: HTMLDivElement
  private readonly labels: Label[]
  private readonly projected = new Vector3()
  private groups: Readonly<Record<LabelGroup, boolean>>
  private measured = false

  constructor(
    container: HTMLElement,
    specs: Spec[],
    groups: Readonly<Record<LabelGroup, boolean>>,
    choose: (ref: AtlasRef) => void,
  ) {
    this.groups = groups
    this.element = document.createElement('div')
    this.element.className = 'au-atlas-labels'
    Object.assign(this.element.style, LAYER_STYLE)
    this.labels = specs.map((spec) => this.place(spec))
    this.element.addEventListener('click', (event) => {
      const target =
        event.target instanceof Element ? event.target.closest('.au-atlas-label') : null
      const ref = this.labels.find((entry) => entry.element === target)?.ref
      if (!ref) return
      event.stopPropagation()
      choose(ref)
    })
    this.element.addEventListener('pointerdown', (event) => event.stopPropagation())
    container.append(this.element)
  }

  remeasure(): void {
    this.measured = false
  }

  veil(hidden: (x: number, z: number) => boolean): void {
    for (const label of this.labels)
      label.veiled = label.ref !== undefined && hidden(label.x, label.z)
  }

  markUnexplored(points: readonly { x: number; z: number }[], text: string): void {
    for (const point of points) {
      this.labels.push(
        this.place({
          text,
          kind: 'unexplored',
          mark: undefined,
          x: point.x,
          y: UNEXPLORED_LABEL.y,
          z: point.z,
          near: UNEXPLORED_LABEL.near,
          far: UNEXPLORED_LABEL.far,
          priority: UNEXPLORED_LABEL.priority,
          level: 0,
          ref: undefined,
        }),
      )
    }
    this.measured = false
  }

  private place(spec: Spec): Label {
    const element = spec.ref ? document.createElement('button') : document.createElement('span')
    if (element instanceof HTMLButtonElement) {
      element.type = 'button'
      element.tabIndex = -1
    } else element.setAttribute('aria-hidden', 'true')
    element.className = `au-atlas-label au-atlas-label--${spec.kind}`
    if (spec.mark) element.dataset['mark'] = spec.mark
    element.textContent = spec.text
    if (spec.mark) element.prepend(hexagonMark())
    Object.assign(element.style, LABEL_STYLE, spec.ref ? {} : UNEXPLORED_STYLE)
    this.element.append(element)
    return { ...spec, element, width: 0, height: 0, opacity: 0, veiled: false }
  }

  setGroups(groups: Readonly<Record<LabelGroup, boolean>>): void {
    this.groups = groups
    this.element.hidden = !Object.values(groups).some(Boolean)
  }

  update(
    camera: PerspectiveCamera,
    width: number,
    height: number,
    distance: number,
    level: number,
  ): void {
    if (this.element.hidden) return
    if (!this.measured) {
      for (const label of this.labels) {
        label.width = label.element.offsetWidth || 80
        label.height = label.element.offsetHeight || 16
      }
      this.measured = true
    }
    const taken: [number, number, number, number][] = []
    for (const label of this.labels) {
      let shown = label.level === level && !label.veiled && this.groups[LABEL_GROUP_OF[label.kind]]
      let opacity = 0
      let sx = 0
      let sy = 0
      if (shown) {
        const rise =
          smoothstep(label.near * 0.85, label.near * 1.12 + 0.01, distance) ||
          (label.near === 0 ? 1 : 0)
        opacity = Math.min(rise, 1 - smoothstep(label.far * 0.85, label.far, distance))
        shown = opacity > 0.02
      }
      if (shown) {
        this.projected.set(label.x, label.y, label.z).project(camera)
        if (this.projected.z > 1 || this.projected.z < -1) shown = false
        sx = (this.projected.x * 0.5 + 0.5) * width
        sy = (-this.projected.y * 0.5 + 0.5) * height
        if (sx < -MARGIN_X || sx > width + MARGIN_X || sy < -MARGIN_Y || sy > height + MARGIN_Y)
          shown = false
      }
      if (shown) {
        const box: [number, number, number, number] = [
          sx - label.width / 2 - PAD_X,
          sy - label.height / 2 - PAD_Y,
          sx + label.width / 2 + PAD_X,
          sy + label.height / 2 + PAD_Y,
        ]
        if (
          taken.some(
            (other) =>
              box[0] < other[2] && box[2] > other[0] && box[1] < other[3] && box[3] > other[1],
          )
        ) {
          shown = false
        } else taken.push(box)
      }
      const target = shown ? opacity : 0
      if (shown) {
        label.element.style.transform = `translate3d(${(sx - label.width / 2).toFixed(1)}px,${(sy - label.height / 2).toFixed(1)}px,0)`
      }
      if (Math.abs(target - label.opacity) > 0.01) {
        label.element.style.opacity = target.toFixed(2)
        label.element.style.visibility = target > 0.01 ? 'visible' : 'hidden'
        label.opacity = target
      }
    }
  }

  dispose(): void {
    this.element.remove()
  }
}
