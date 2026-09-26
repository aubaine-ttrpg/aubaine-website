import type { SwupInstance } from './swup'

const VIEWER = '[data-plate-viewer]'
const CONTROLS = '[data-viewer-controls]'
const ZOOM_STEP = 1.3
const ZOOM_RANGE = 3
const FIT_FLOOR = 0.5
const OPENING_SCALE = 0.8
const DRAG_THRESHOLD = 4
const WHEEL_RATE = 0.002
const GLIDE_MS = 340
const ZOOMED_EPSILON = 1.001

type Point = { x: number; y: number }
type Frame = { left: number; top: number; width: number; height: number }
type View = { scale: number; x: number; y: number }

type Drag = { kind: 'drag'; start: Point; from: View; moved: boolean }
type Pinch = { kind: 'pinch'; distance: number; anchor: Point; from: View }
type Gesture = Drag | Pinch

type Viewer = {
  sheet: HTMLElement
  frame: Frame
  heart: Point
  view: View
  steered: boolean
  pointers: Map<number, Point>
  gesture: Gesture | undefined
  swallowClick: boolean
  glide: number
  teardown: AbortController
  resize: ResizeObserver
}

const viewers = new Set<Viewer>()

function numberProperty(element: HTMLElement, name: string): number {
  return Number.parseFloat(getComputedStyle(element).getPropertyValue(name))
}

function frameOf(sheet: HTMLElement): Frame {
  return {
    left: numberProperty(sheet, '--board-left'),
    top: numberProperty(sheet, '--board-top'),
    width: numberProperty(sheet, '--board-width'),
    height: numberProperty(sheet, '--board-height'),
  }
}

function heartOf(sheet: HTMLElement): Point {
  return {
    x: Number.parseFloat(sheet.dataset['heartX'] ?? '0'),
    y: Number.parseFloat(sheet.dataset['heartY'] ?? '0'),
  }
}

function fitScale(viewer: Viewer): number {
  const { clientWidth, clientHeight } = viewer.sheet
  return Math.min(clientWidth / viewer.frame.width, clientHeight / viewer.frame.height)
}

function scaleRange(viewer: Viewer): { min: number; max: number } {
  const fit = fitScale(viewer)
  return { min: fit, max: fit * ZOOM_RANGE }
}

function clampAxis(offset: number, start: number, span: number, room: number, scale: number) {
  const size = span * scale
  if (size <= room) return (room - size) / 2 - start * scale
  return Math.min(-start * scale, Math.max(room - (start + span) * scale, offset))
}

function settle(viewer: Viewer, view: View): View {
  const { min, max } = scaleRange(viewer)
  const scale = Math.min(max, Math.max(min, view.scale))
  const { frame, sheet } = viewer
  return {
    scale,
    x: clampAxis(view.x, frame.left, frame.width, sheet.clientWidth, scale),
    y: clampAxis(view.y, frame.top, frame.height, sheet.clientHeight, scale),
  }
}

function centredOn(viewer: Viewer, point: Point, scale: number): View {
  return settle(viewer, {
    scale,
    x: viewer.sheet.clientWidth / 2 - point.x * scale,
    y: viewer.sheet.clientHeight / 2 - point.y * scale,
  })
}

function selectedPoint(viewer: Viewer): Point | undefined {
  const node = viewer.sheet.querySelector<HTMLElement>('[data-node][aria-current]')
  return node ? { x: node.offsetLeft, y: node.offsetTop } : undefined
}

function openingView(viewer: Viewer): View {
  const fit = fitScale(viewer)
  if (fit >= FIT_FLOOR) return settle(viewer, { scale: fit, x: 0, y: 0 })
  return centredOn(viewer, selectedPoint(viewer) ?? viewer.heart, OPENING_SCALE)
}

function syncControls(viewer: Viewer): void {
  const { max } = scaleRange(viewer)
  const { scale } = viewer.view
  const zoomed = isZoomed(viewer)
  viewer.sheet.toggleAttribute('data-zoomed', zoomed)
  for (const button of viewer.sheet.querySelectorAll<HTMLButtonElement>('[data-view-zoom]')) {
    const action = button.dataset['viewZoom']
    button.disabled =
      (action === 'in' && scale >= max / ZOOMED_EPSILON) || (action !== 'in' && !zoomed)
  }
}

function show(viewer: Viewer, view: View, glide: boolean): void {
  viewer.view = view
  const { style } = viewer.sheet
  window.clearTimeout(viewer.glide)
  viewer.sheet.toggleAttribute('data-view-gliding', glide)
  if (glide) {
    viewer.glide = window.setTimeout(
      () => viewer.sheet.removeAttribute('data-view-gliding'),
      GLIDE_MS,
    )
  }
  style.setProperty('--view-scale', String(view.scale))
  style.setProperty('--view-x', `${view.x}px`)
  style.setProperty('--view-y', `${view.y}px`)
  syncControls(viewer)
}

function localPoint(viewer: Viewer, clientX: number, clientY: number): Point {
  const box = viewer.sheet.getBoundingClientRect()
  return {
    x: clientX - box.left - viewer.sheet.clientLeft,
    y: clientY - box.top - viewer.sheet.clientTop,
  }
}

function zoomedAround(viewer: Viewer, from: View, scale: number, anchor: Point): View {
  const plateX = (anchor.x - from.x) / from.scale
  const plateY = (anchor.y - from.y) / from.scale
  const { min, max } = scaleRange(viewer)
  const next = Math.min(max, Math.max(min, scale))
  return settle(viewer, { scale: next, x: anchor.x - plateX * next, y: anchor.y - plateY * next })
}

function viewportCentre(viewer: Viewer): Point {
  return { x: viewer.sheet.clientWidth / 2, y: viewer.sheet.clientHeight / 2 }
}

function isZoomed(viewer: Viewer): boolean {
  return viewer.view.scale > scaleRange(viewer).min * ZOOMED_EPSILON
}

function onControl(viewer: Viewer, action: string | undefined): void {
  viewer.steered = action !== 'fit'
  const { scale } = viewer.view
  if (action === 'in')
    show(viewer, zoomedAround(viewer, viewer.view, scale * ZOOM_STEP, viewportCentre(viewer)), true)
  if (action === 'out')
    show(viewer, zoomedAround(viewer, viewer.view, scale / ZOOM_STEP, viewportCentre(viewer)), true)
  if (action === 'fit') show(viewer, settle(viewer, { scale: fitScale(viewer), x: 0, y: 0 }), true)
}

function pinchState(viewer: Viewer): Pinch | undefined {
  const [first, second] = [...viewer.pointers.values()]
  if (!first || !second) return undefined
  return {
    kind: 'pinch',
    distance: Math.hypot(first.x - second.x, first.y - second.y),
    anchor: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    from: viewer.view,
  }
}

function dragState(viewer: Viewer): Drag | undefined {
  const [point] = [...viewer.pointers.values()]
  if (!point || !isZoomed(viewer)) return undefined
  return { kind: 'drag', start: point, from: viewer.view, moved: false }
}

function onPointerDown(viewer: Viewer, event: PointerEvent): void {
  if (event.button !== 0) return
  if (event.target instanceof Element && event.target.closest(CONTROLS)) return
  viewer.pointers.set(event.pointerId, localPoint(viewer, event.clientX, event.clientY))
  viewer.gesture = viewer.pointers.size >= 2 ? pinchState(viewer) : dragState(viewer)
}

function onPointerMove(viewer: Viewer, event: PointerEvent): void {
  if (!viewer.pointers.has(event.pointerId)) return
  if (event.pointerType === 'mouse' && event.buttons === 0) {
    onPointerEnd(viewer, event)
    return
  }
  viewer.pointers.set(event.pointerId, localPoint(viewer, event.clientX, event.clientY))
  const gesture = viewer.gesture
  if (!gesture) return
  if (gesture.kind === 'drag') {
    const point = viewer.pointers.get(event.pointerId)
    if (!point) return
    const dx = point.x - gesture.start.x
    const dy = point.y - gesture.start.y
    if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!gesture.moved) {
      gesture.moved = true
      viewer.steered = true
      viewer.sheet.setPointerCapture(event.pointerId)
      viewer.sheet.setAttribute('data-dragging', '')
    }
    show(
      viewer,
      settle(viewer, { ...gesture.from, x: gesture.from.x + dx, y: gesture.from.y + dy }),
      false,
    )
    return
  }
  const current = pinchState(viewer)
  if (!current || gesture.distance === 0) return
  viewer.steered = true
  const scale = gesture.from.scale * (current.distance / gesture.distance)
  const zoomed = zoomedAround(viewer, gesture.from, scale, gesture.anchor)
  const pan = { x: current.anchor.x - gesture.anchor.x, y: current.anchor.y - gesture.anchor.y }
  show(viewer, settle(viewer, { ...zoomed, x: zoomed.x + pan.x, y: zoomed.y + pan.y }), false)
}

function onPointerEnd(viewer: Viewer, event: PointerEvent): void {
  if (!viewer.pointers.delete(event.pointerId)) return
  const gesture = viewer.gesture
  if (gesture?.kind === 'drag' && gesture.moved) {
    viewer.swallowClick = true
    window.setTimeout(() => {
      viewer.swallowClick = false
    }, 0)
  }
  viewer.sheet.removeAttribute('data-dragging')
  viewer.gesture = viewer.pointers.size > 0 ? dragState(viewer) : undefined
}

function onClickCapture(viewer: Viewer, event: MouseEvent): void {
  const control =
    event.target instanceof Element ? event.target.closest<HTMLElement>('[data-view-zoom]') : null
  if (control) {
    onControl(viewer, control.dataset['viewZoom'])
    return
  }
  if (!viewer.swallowClick) return
  viewer.swallowClick = false
  event.preventDefault()
  event.stopPropagation()
}

function onWheel(viewer: Viewer, event: WheelEvent): void {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  viewer.steered = true
  const anchor = localPoint(viewer, event.clientX, event.clientY)
  show(
    viewer,
    zoomedAround(
      viewer,
      viewer.view,
      viewer.view.scale * Math.exp(-event.deltaY * WHEEL_RATE),
      anchor,
    ),
    false,
  )
}

function onKey(viewer: Viewer, event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const action =
    event.key === '+' || event.key === '='
      ? 'in'
      : event.key === '-'
        ? 'out'
        : event.key === '0'
          ? 'fit'
          : undefined
  if (!action) return
  event.preventDefault()
  onControl(viewer, action)
}

function onFocus(viewer: Viewer, event: FocusEvent): void {
  const node =
    event.target instanceof Element ? event.target.closest<HTMLElement>('[data-node]') : null
  if (!node) return
  const box = node.getBoundingClientRect()
  const frame = viewer.sheet.getBoundingClientRect()
  const visible =
    box.left >= frame.left &&
    box.right <= frame.right &&
    box.top >= frame.top &&
    box.bottom <= frame.bottom
  if (visible) return
  show(
    viewer,
    centredOn(viewer, { x: node.offsetLeft, y: node.offsetTop }, viewer.view.scale),
    true,
  )
}

function mount(sheet: HTMLElement): void {
  const teardown = new AbortController()
  const viewer: Viewer = {
    sheet,
    frame: frameOf(sheet),
    heart: heartOf(sheet),
    view: { scale: 1, x: 0, y: 0 },
    steered: false,
    pointers: new Map(),
    gesture: undefined,
    swallowClick: false,
    glide: 0,
    teardown,
    resize: new ResizeObserver(() => {
      show(viewer, viewer.steered ? settle(viewer, viewer.view) : openingView(viewer), false)
    }),
  }
  const options = { signal: teardown.signal }
  sheet.addEventListener('pointerdown', (event) => onPointerDown(viewer, event), options)
  sheet.addEventListener('pointermove', (event) => onPointerMove(viewer, event), options)
  sheet.addEventListener('pointerup', (event) => onPointerEnd(viewer, event), options)
  sheet.addEventListener('pointercancel', (event) => onPointerEnd(viewer, event), options)
  sheet.addEventListener('click', (event) => onClickCapture(viewer, event), {
    ...options,
    capture: true,
  })
  sheet.addEventListener('dragstart', (event) => event.preventDefault(), options)
  sheet.addEventListener('wheel', (event) => onWheel(viewer, event), { ...options, passive: false })
  sheet.addEventListener('keydown', (event) => onKey(viewer, event), options)
  sheet.addEventListener('focusin', (event) => onFocus(viewer, event), options)
  viewer.resize.observe(sheet)
  sheet.querySelector<HTMLElement>(CONTROLS)?.removeAttribute('hidden')
  show(viewer, openingView(viewer), false)
  viewers.add(viewer)
}

function unmount(viewer: Viewer): void {
  viewer.teardown.abort()
  viewer.resize.disconnect()
  window.clearTimeout(viewer.glide)
  viewers.delete(viewer)
}

function syncViewers(): void {
  for (const viewer of viewers) {
    if (!viewer.sheet.isConnected) unmount(viewer)
  }
  const mounted = new Set([...viewers].map((viewer) => viewer.sheet))
  for (const sheet of document.querySelectorAll<HTMLElement>(VIEWER)) {
    if (!mounted.has(sheet)) mount(sheet)
  }
}

export function bindPlateViewer(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncViewers)
  syncViewers()
}
