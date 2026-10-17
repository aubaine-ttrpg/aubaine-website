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
