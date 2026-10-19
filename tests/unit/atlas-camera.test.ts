import { OrthographicCamera, Raycaster, Vector2 } from 'three'
import { describe, expect, it } from 'vitest'

import { CameraRig, isoPitch, reliefPitch, VIEW_MODES } from '../../src/lib/atlas/engine/camera-rig'

const FRAME_S = 1 / 60
const REACH = { x: 100, z: 80 }
const HARBOUR = { x: 40, z: -20, dist: 30 }

function rigFor(animated: boolean): CameraRig {
  return new CameraRig('iso', REACH.x, REACH.z, animated)
}

describe('the camera with animations on', () => {
  it('eases into the opening framing', () => {
    const camera = rigFor(true)
    camera.update(FRAME_S, 0)
    expect(camera.rig.dist).toBeGreaterThan(camera.goal.dist)
  })

  it('flies to a place over several frames', () => {
    const camera = rigFor(true)
    camera.flyTo(HARBOUR.x, HARBOUR.z, HARBOUR.dist)
    camera.update(FRAME_S, 0)
    expect(camera.flying).toBe(true)
    expect(camera.rig.x).not.toBe(HARBOUR.x)
  })
})

describe('the camera with animations off', () => {
  it('opens on its framing in the first frame', () => {
    const camera = rigFor(false)
    camera.update(FRAME_S, 0)
    expect(camera.rig).toEqual(camera.goal)
  })

  it('cuts to a place instead of flying', () => {
    const camera = rigFor(false)
    camera.flyTo(HARBOUR.x, HARBOUR.z, HARBOUR.dist)
    expect(camera.flying).toBe(false)
    camera.update(FRAME_S, 0)
    expect(camera.rig).toMatchObject(HARBOUR)
  })

  it('lands a flight in progress at its destination', () => {
    const camera = rigFor(true)
    camera.flyTo(HARBOUR.x, HARBOUR.z, HARBOUR.dist)
    camera.update(FRAME_S, 0)
    camera.setAnimated(false)
    expect(camera.flying).toBe(false)
    camera.update(FRAME_S, 0)
    expect(camera.rig).toMatchObject(HARBOUR)
  })

  it('settles after the frame that reaches its goal', () => {
    const camera = rigFor(false)
    expect(camera.update(FRAME_S, 0)).toBe(true)
    expect(camera.update(FRAME_S, 0)).toBe(false)
  })
})

describe('the relief view', () => {
  const distances = [4, 30, 90, 168, 330]

  it('looks lower than the 3/4 view at every distance', () => {
    for (const dist of distances) expect(reliefPitch(dist)).toBeLessThan(isoPitch(dist))
  })

  it('rises as the reader zooms out, from a grazing angle to below the lowest 3/4 pitch', () => {
    const pitches = distances.map(reliefPitch)
    expect([...pitches].sort((a, b) => a - b)).toEqual(pitches)
    expect(Math.min(...pitches)).toBeGreaterThan(0.2)
    expect(Math.max(...pitches)).toBeLessThan(isoPitch(VIEW_MODES.iso.min))
  })

  it('keeps that pitch as the camera zooms', () => {
    const camera = new CameraRig('relief', REACH.x, REACH.z, false)
    camera.zoom(0.5)
    camera.update(FRAME_S, 0)
    expect(camera.rig.pitch).toBeCloseTo(reliefPitch(camera.rig.dist))
  })
})

describe('the camera on the parchment', () => {
  const ASPECT = 16 / 9

  function tiltedRig(animated: boolean): CameraRig {
    const camera = new CameraRig('relief', REACH.x, REACH.z, animated)
    camera.turn(0.8, 0)
    camera.update(1, 0)
    return camera
  }

  function lockedRig(): CameraRig {
    const camera = tiltedRig(true)
    camera.lock(false)
    return camera
  }

  function tiltFrames(camera: CameraRig, label: string): number {
    let previous = camera.tiltProgress
    let frames = 0
    while (camera.tilting && frames < 600) {
      camera.update(FRAME_S, 0)
      expect(camera.tiltProgress, label).toBeGreaterThanOrEqual(previous)
      previous = camera.tiltProgress
      frames += 1
    }
    return frames
  }

  it('climbs to a top view with north up', () => {
    const camera = tiltedRig(true)
    camera.lock()
    expect(camera.view).toBe('top')
    expect(camera.tilting).toBe(true)
    tiltFrames(camera, 'climb')
    expect(camera.rig.pitch).toBe(camera.goal.pitch)
    expect(camera.rig.yaw).toBe(0)
    expect(camera.rig.fov).toBe(VIEW_MODES.top.fov)
  })

  it('climbs and descends at the same pace from and to every view', () => {
    for (const view of ['top', 'iso', 'relief', 'free'] as const) {
      const camera = new CameraRig(view, REACH.x, REACH.z, true)
      camera.update(1, 0)
      camera.lock()
      expect(tiltFrames(camera, `${view} climb`) * FRAME_S, view).toBeCloseTo(0.7, 1)
      expect(camera.tiltProgress).toBe(1)
      camera.unlock()
      expect(camera.tilting, view).toBe(true)
      expect(tiltFrames(camera, `${view} descent`) * FRAME_S, view).toBeCloseTo(0.7, 1)
      expect(camera.rig.pitch, view).toBe(camera.goal.pitch)
      expect(camera.rig.fov, view).toBe(VIEW_MODES[view].fov)
    }
  })

  it('turns back from the middle of a climb without a jump', () => {
    const camera = tiltedRig(true)
    camera.lock()
    for (let frame = 0; frame < 15; frame++) camera.update(FRAME_S, 0)
    const pitch = camera.rig.pitch
    camera.unlock()
    expect(camera.view).toBe('relief')
    camera.update(FRAME_S, 0)
    expect(Math.abs(camera.rig.pitch - pitch)).toBeLessThan(0.05)
    tiltFrames(camera, 'back')
    expect(camera.rig.pitch).toBe(camera.goal.pitch)
  })

  it('snaps when animations are off or the lock is not animated', () => {
    const still = tiltedRig(false)
    still.lock()
    expect(still.tilting).toBe(false)
    expect(still.rig.pitch).toBe(still.goal.pitch)
    const snapped = lockedRig()
    expect(snapped.tilting).toBe(false)
    expect(snapped.rig.yaw).toBe(0)
    expect(snapped.rig.fov).toBe(VIEW_MODES.top.fov)
  })

  it('keeps the chosen view while locked and returns to it when unlocked', () => {
    const camera = lockedRig()
    camera.setView('free')
    expect(camera.view).toBe('top')
    expect(camera.chosenView).toBe('free')
    camera.unlock()
    expect(camera.view).toBe('free')
    expect(camera.goal.fov).toBe(VIEW_MODES.free.fov)
  })

  it('does not turn while locked', () => {
    const camera = lockedRig()
    camera.pinch(40, 1.2)
    expect(camera.goal.yaw).toBe(0)
  })

  it('frames as much ground as the top view at the same distance', () => {
    const camera = lockedRig()
    camera.update(1, 0)
    const ortho = new OrthographicCamera()
    camera.applyParchment(ortho, ASPECT)
    const half = camera.rig.dist * Math.tan((camera.rig.fov * Math.PI) / 360)
    expect(ortho.top).toBeCloseTo(half, 6)
    expect(ortho.right).toBeCloseTo(half * ASPECT, 6)
  })

  it('casts the centre ray straight down through the point it frames', () => {
    const camera = lockedRig()
    camera.pan(12, -7)
    camera.update(1, 0)
    const ortho = new OrthographicCamera()
    camera.applyParchment(ortho, ASPECT)
    ortho.updateMatrixWorld()
    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(0, 0), ortho)
    const { origin, direction } = raycaster.ray
    expect(direction.y).toBeCloseTo(-1, 6)
    expect(origin.x).toBeCloseTo(camera.rig.x, 4)
    expect(origin.z).toBeCloseTo(camera.rig.z, 4)
  })

  it('keeps every height on screen, from the floors below to the sky above', () => {
    const camera = lockedRig()
    camera.update(1, 0)
    const ortho = new OrthographicCamera()
    camera.applyParchment(ortho, ASPECT)
    ortho.updateMatrixWorld()
    for (const height of [-60, 0, 7.6, 40]) {
      const depth = ortho.position.y - height
      expect(depth, `height ${height}`).toBeGreaterThan(ortho.near)
      expect(depth, `height ${height}`).toBeLessThan(ortho.far)
    }
  })
})
