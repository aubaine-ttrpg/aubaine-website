import { type Camera, Vector3 } from 'three'
import { SQRT3 } from '../world/grid.ts'

export type Hud = { compass?: HTMLElement; scaleBar?: HTMLElement; scaleText?: HTMLElement }

const NICE_KM = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500]
const SCALE_PIXELS = 130
const MIN_BAR = 8

export class HudView {
  private hud: Hud = {}
  private readonly format: Intl.NumberFormat
  private readonly a = new Vector3()
  private readonly b = new Vector3()
  private readonly right = new Vector3()

  constructor(locale: string) {
    this.format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  }

  bind(hud: Hud): void {
    this.hud = hud
  }

  update(
    camera: Camera,
    target: { x: number; y: number; z: number },
    yaw: number,
    width: number,
    height: number,
    hexKm: number,
  ): void {
    const { compass, scaleBar, scaleText } = this.hud
    if (compass) compass.style.transform = `rotate(${((yaw * 180) / Math.PI).toFixed(1)}deg)`
    if (!scaleBar && !scaleText) return
    this.a.set(target.x, target.y, target.z).project(camera)
    this.right.setFromMatrixColumn(camera.matrixWorld, 0)
    this.b
      .set(target.x + this.right.x, target.y + this.right.y, target.z + this.right.z)
      .project(camera)
    const pixelsPerUnit = Math.hypot(
      ((this.b.x - this.a.x) * width) / 2,
      ((this.b.y - this.a.y) * height) / 2,
    )
    const pixelsPerKm = pixelsPerUnit / (hexKm / SQRT3)
    let km = NICE_KM[0] ?? 1
    for (const nice of NICE_KM) if (nice * pixelsPerKm <= SCALE_PIXELS) km = nice
    if (scaleBar) scaleBar.style.width = `${Math.max(MIN_BAR, km * pixelsPerKm).toFixed(0)}px`
    if (scaleText) scaleText.textContent = `${this.format.format(km)} km`
  }
}
