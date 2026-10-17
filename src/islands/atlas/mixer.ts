import {
  masterGain,
  SOUND_CATEGORIES,
  type SoundCategory,
  type SoundPreferences,
  volumeGain,
} from '../../scripts/sound-preferences'

const SAMPLE_RATE = 32000
const LOOP_OVERLAP = 1.5
const SCHEDULE_AHEAD = 2
const START_DELAY = 0.05
const BED_GLIDE = 0.6
const VOLUME_GLIDE = 0.05
const QUIET_GLIDE = 0.03
const SUSPEND_AFTER_MS = 150
const SILENT = 0.001
const AUDIBLE = 0.03
const RELEASE_AFTER = 30
const PITCH_SPREAD = 0.05
const CUTOFF = { lowest: 500, highest: 15000 } as const
const CURVE_POINTS = 64

const FADE_IN = Float32Array.from({ length: CURVE_POINTS }, (_, index) =>
  Math.sin(((index / (CURVE_POINTS - 1)) * Math.PI) / 2),
)
const FADE_OUT = FADE_IN.slice().reverse()

type Loop = {
  readonly output: GainNode
  readonly filter: BiquadFilterNode
  readonly sources: Set<AudioBufferSourceNode>
  level: number
  next: number
  quietSince: number | undefined
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function cutoff(brightness: number): number {
  return CUTOFF.lowest * (CUTOFF.highest / CUTOFF.lowest) ** clamp01(brightness)
}

export class Mixer {
  private readonly context: AudioContext
  private readonly master: GainNode
  private readonly categories: Record<SoundCategory, GainNode>
  private readonly urls: ReadonlyMap<string, string>
  private readonly pending = new Map<string, Promise<AudioBuffer | undefined>>()
  private readonly decoded = new Map<string, AudioBuffer>()
  private readonly loops = new Map<string, Loop>()
  private shots = 0
  private quieting = 0

  constructor(urls: ReadonlyMap<string, string>, preferences: SoundPreferences) {
    this.urls = urls
    this.context = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'balanced' })
    this.master = this.context.createGain()
    this.master.gain.value = masterGain(preferences)
    this.master.connect(this.context.destination)
    this.categories = {
      ambience: this.channel(preferences.levels.ambience),
      effects: this.channel(preferences.levels.effects),
      interface: this.channel(preferences.levels.interface),
    }
    void this.context.resume()
  }

  get running(): boolean {
    return this.context.state === 'running'
  }

  get playingShots(): number {
    return this.shots
  }

  wake(preferences: SoundPreferences): void {
    window.clearTimeout(this.quieting)
    const now = this.context.currentTime
    this.master.gain.setTargetAtTime(masterGain(preferences), now, VOLUME_GLIDE)
    for (const category of SOUND_CATEGORIES) {
      const level = volumeGain(preferences.levels[category])
      this.categories[category].gain.setTargetAtTime(level, now, VOLUME_GLIDE)
    }
    void this.context.resume()
  }

  quiet(): void {
    window.clearTimeout(this.quieting)
    this.master.gain.setTargetAtTime(0, this.context.currentTime, QUIET_GLIDE)
    this.quieting = window.setTimeout(() => void this.context.suspend(), SUSPEND_AFTER_MS)
  }

  close(): void {
    window.clearTimeout(this.quieting)
    void this.context.close()
  }

  preload(names: Iterable<string>): void {
    for (const name of names) void this.load(name)
  }

  loop(name: string, level: number, brightness: number): void {
    let loop = this.loops.get(name)
    if (!loop) {
      if (level < AUDIBLE) return
      loop = this.createLoop()
      this.loops.set(name, loop)
    }
    const now = this.context.currentTime
    loop.level = level
    loop.output.gain.setTargetAtTime(level, now, BED_GLIDE)
    loop.filter.frequency.setTargetAtTime(cutoff(brightness), now, BED_GLIDE)
  }

  tick(): void {
    const now = this.context.currentTime
    for (const [name, loop] of this.loops) {
      if (loop.level > SILENT) {
        loop.quietSince = undefined
        const buffer = this.decoded.get(name)
        if (buffer) this.schedule(loop, buffer, now)
        else void this.load(name)
        continue
      }
      loop.quietSince ??= now
      if (now - loop.quietSince > RELEASE_AFTER) this.release(name, loop)
    }
  }

  shot(name: string, category: SoundCategory, gain: number, pan: number, spread: boolean): void {
    const buffer = this.decoded.get(name)
    if (!buffer || !this.running) return
    const source = this.context.createBufferSource()
    source.buffer = buffer
    if (spread) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * PITCH_SPREAD
    const level = this.context.createGain()
    level.gain.value = gain
    const panner = this.context.createStereoPanner()
    panner.pan.value = pan
    source.connect(level).connect(panner).connect(this.categories[category])
    this.shots += 1
    source.addEventListener('ended', () => {
      this.shots -= 1
      level.disconnect()
      panner.disconnect()
    })
    source.start()
  }

  private channel(volume: number): GainNode {
    const gain = this.context.createGain()
    gain.gain.value = volumeGain(volume)
    gain.connect(this.master)
    return gain
  }

  private createLoop(): Loop {
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = Math.SQRT1_2
    filter.frequency.value = CUTOFF.highest
    const output = this.context.createGain()
    output.gain.value = 0
    filter.connect(output).connect(this.categories.ambience)
    return { output, filter, sources: new Set(), level: 0, next: 0, quietSince: undefined }
  }

  private schedule(loop: Loop, buffer: AudioBuffer, now: number): void {
    if (loop.next < now) loop.next = now + START_DELAY
    const period = buffer.duration - LOOP_OVERLAP
    while (loop.next < now + SCHEDULE_AHEAD) {
      this.segment(loop, buffer, loop.next)
      loop.next += period
    }
  }

  private segment(loop: Loop, buffer: AudioBuffer, at: number): void {
    const source = this.context.createBufferSource()
    source.buffer = buffer
    const envelope = this.context.createGain()
    envelope.gain.setValueCurveAtTime(FADE_IN, at, LOOP_OVERLAP)
    envelope.gain.setValueCurveAtTime(FADE_OUT, at + buffer.duration - LOOP_OVERLAP, LOOP_OVERLAP)
    source.connect(envelope).connect(loop.filter)
    loop.sources.add(source)
    source.addEventListener('ended', () => {
      envelope.disconnect()
      loop.sources.delete(source)
    })
    source.start(at)
  }

  private release(name: string, loop: Loop): void {
    for (const source of loop.sources) source.stop()
    loop.output.disconnect()
    this.loops.delete(name)
    this.pending.delete(name)
    this.decoded.delete(name)
  }

  private load(name: string): Promise<AudioBuffer | undefined> {
    const known = this.pending.get(name)
    if (known) return known
    const loading = this.decode(name).then((buffer) => {
      if (buffer && this.pending.get(name) === loading) this.decoded.set(name, buffer)
      return buffer
    })
    this.pending.set(name, loading)
    return loading
  }

  private async decode(name: string): Promise<AudioBuffer | undefined> {
    const url = this.urls.get(name)
    if (!url) {
      console.error(`[atlas] no sound file is named ${name}`)
      return undefined
    }
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`the server answered ${response.status}`)
      return await this.context.decodeAudioData(await response.arrayBuffer())
    } catch (error) {
      if (this.context.state !== 'closed') {
        console.warn(`[atlas] the sound ${name} could not be played`, error)
      }
      return undefined
    }
  }
}
