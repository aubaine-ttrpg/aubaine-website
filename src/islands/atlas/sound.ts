import type { AtlasEngine } from '../../lib/atlas/engine/atlas-engine'
import { BEDS, CALLS, type Call, type HeardCall, listen } from '../../lib/atlas/world/soundscape'
import { onSoundPreferences, soundPreferences } from '../../scripts/sound-preferences'
import { Mixer } from './mixer'

export const CUES = ['select', 'open', 'close', 'route'] as const
export type Cue = (typeof CUES)[number]

const SOUNDS = '/data/media/sounds/'

const FILES = import.meta.glob<string>('/data/media/sounds/*.mp3', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

const LISTEN_EVERY_MS = 250
const CALL_GAP_MS = 3000
const CALL_VOICES = 2
const CALL_WAIT_MS = { least: 10000, most: 30000 } as const
const UNLOCK_EVENTS = ['pointerdown', 'keydown'] as const

export function cueFile(cue: Cue): string {
  return `cue-${cue}`
}

export const ATLAS_SOUNDS: readonly string[] = [...BEDS, ...CALLS, ...CUES.map(cueFile)]

function soundUrls(): ReadonlyMap<string, string> {
  const urls = new Map<string, string>()
  for (const name of ATLAS_SOUNDS) {
    const url = FILES[`${SOUNDS}${name}.mp3`]
    if (!url) throw new Error(`the Atlas has no sound file named ${name}`)
    urls.set(name, url)
  }
  return urls
}

function callWait(): number {
  return CALL_WAIT_MS.least + Math.random() * (CALL_WAIT_MS.most - CALL_WAIT_MS.least)
}

function loudest(calls: readonly HeardCall[], call: Call): HeardCall | undefined {
  let best: HeardCall | undefined
  for (const heard of calls) {
    if (heard.call === call && (!best || heard.gain > best.gain)) best = heard
  }
  return best
}

export class AtlasSound {
  private readonly urls = soundUrls()
  private readonly stop = new AbortController()
  private readonly nextCall = new Map<Call, number>()
  private readonly unsubscribe: () => void
  private mixer: Mixer | undefined
  private engine: AtlasEngine | undefined
  private revealed = false
  private suspended = false
  private timer = 0
  private lastCall = 0

  constructor() {
    const { signal } = this.stop
    this.unsubscribe = onSoundPreferences(() => this.sync())
    document.addEventListener('visibilitychange', () => this.sync(), { signal })
    for (const type of UNLOCK_EVENTS) {
      window.addEventListener(type, () => this.unlock(), { signal })
    }
  }

  attach(engine: AtlasEngine): () => void {
    this.engine = engine
    return () => {
      if (this.engine === engine) this.engine = undefined
    }
  }

  reveal(): void {
    this.revealed = true
    this.sync()
  }

  suspend(): void {
    this.suspended = true
    this.sync()
  }

  resume(): void {
    this.suspended = false
    this.sync()
  }

  cue(cue: Cue): void {
    this.mixer?.shot(cueFile(cue), 'interface', 1, 0, false)
  }

  dispose(): void {
    this.stop.abort()
    this.unsubscribe()
    window.clearInterval(this.timer)
    this.timer = 0
    this.mixer?.close()
    this.mixer = undefined
  }

  private unlock(): void {
    if (!this.mixer) this.sync()
  }

  private sync(): void {
    const preferences = soundPreferences()
    const audible = !preferences.muted && this.revealed && !this.suspended && !document.hidden
    if (!audible) {
      this.pause()
      return
    }
    if (!this.mixer) {
      if (!navigator.userActivation.hasBeenActive) return
      this.mixer = new Mixer(this.urls, preferences)
      this.mixer.preload([...CALLS, ...CUES.map(cueFile)])
    }
    this.mixer.wake(preferences)
    if (this.timer === 0) this.timer = window.setInterval(() => this.listen(), LISTEN_EVERY_MS)
  }

  private pause(): void {
    window.clearInterval(this.timer)
    this.timer = 0
    this.mixer?.quiet()
  }

  private listen(): void {
    const { mixer, engine } = this
    if (!mixer) return
    if (engine) {
      const { rig } = engine.rig
      const heard = listen(
        engine.world,
        engine.grid,
        {
          x: rig.x,
          z: rig.z,
          dist: rig.dist,
          yaw: rig.yaw,
          level: engine.currentLevel,
          night: engine.night,
        },
        (tile) => engine.discovered({ kind: 'tile', tile }),
      )
      for (const bed of BEDS) mixer.loop(bed, heard.beds[bed], bed === 'wind' ? heard.airy : 1)
      if (!engine.rig.flying) this.call(mixer, heard.calls)
    }
    mixer.tick()
  }

  private call(mixer: Mixer, calls: readonly HeardCall[]): void {
    const now = performance.now()
    if (now - this.lastCall < CALL_GAP_MS || mixer.playingShots >= CALL_VOICES) return
    for (const call of CALLS) {
      const due = this.nextCall.get(call)
      if (due === undefined) {
        this.nextCall.set(call, now + callWait() / 2)
        continue
      }
      if (now < due) continue
      this.nextCall.set(call, now + callWait())
      const heard = loudest(calls, call)
      if (!heard) continue
      const pan = heard.kind === 'point' ? heard.pan : Math.random() * 2 - 1
      mixer.shot(call, 'effects', heard.gain, pan, true)
      this.lastCall = now
      return
    }
  }
}
