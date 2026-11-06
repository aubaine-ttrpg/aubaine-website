export type Envelope = { readonly peak: number; readonly attack: number; readonly decay: number }

export type Band = {
  readonly type: BiquadFilterType
  readonly from: number
  readonly to: number
  readonly q: number
}

export type CadranAudio = {
  readonly context: BaseAudioContext
  readonly noise: AudioBuffer
}

export function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const data = buffer.getChannelData(0)
  let state = 0x2545f491
  for (let index = 0; index < data.length; index += 1) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    data[index] = ((state >>> 0) / 4294967296) * 2 - 1
  }
  return buffer
}

export function createLimiter(context: BaseAudioContext): DynamicsCompressorNode {
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -12
  limiter.knee.value = 8
  limiter.ratio.value = 4
  limiter.attack.value = 0.004
  limiter.release.value = 0.18
  return limiter
}

export function envelope(gain: AudioParam, when: number, shape: Envelope): number {
  const stop = when + shape.attack + shape.decay
  gain.setValueAtTime(0.0001, when)
  gain.exponentialRampToValueAtTime(shape.peak, when + shape.attack)
  gain.exponentialRampToValueAtTime(0.0001, stop)
  return stop
}

export function tone(
  audio: CadranAudio,
  destination: AudioNode,
  wave: OscillatorType,
  frequencies: readonly [number, number],
  when: number,
  shape: Envelope,
): void {
  const { context } = audio
  const oscillator = context.createOscillator()
  oscillator.type = wave
  oscillator.frequency.setValueAtTime(frequencies[0], when)
  const gain = context.createGain()
  const stop = envelope(gain.gain, when, shape)
  if (frequencies[1] !== frequencies[0]) {
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], stop)
  }
  oscillator.connect(gain).connect(destination)
  oscillator.start(when)
  oscillator.stop(stop + 0.02)
}

export function hiss(
  audio: CadranAudio,
  destination: AudioNode,
  band: Band,
  when: number,
  shape: Envelope,
): void {
  const { context } = audio
  const source = context.createBufferSource()
  source.buffer = audio.noise
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = band.type
  filter.Q.value = band.q
  filter.frequency.setValueAtTime(band.from, when)
  const gain = context.createGain()
  const stop = envelope(gain.gain, when, shape)
  if (band.to !== band.from) filter.frequency.exponentialRampToValueAtTime(band.to, stop)
  source.connect(filter).connect(gain).connect(destination)
  source.start(when, (when * 0.37) % 1.9)
  source.stop(stop + 0.02)
}

export function powerThunk(audio: CadranAudio, destination: AudioNode, when: number): void {
  tone(audio, destination, 'sine', [140, 42], when, { peak: 0.5, attack: 0.004, decay: 0.45 })
  hiss(audio, destination, { type: 'bandpass', from: 1400, to: 900, q: 0.8 }, when, {
    peak: 0.16,
    attack: 0.003,
    decay: 0.32,
  })
  hiss(audio, destination, { type: 'highpass', from: 4200, to: 4200, q: 0.5 }, when + 0.02, {
    peak: 0.05,
    attack: 0.03,
    decay: 1.1,
  })
}

export function degauss(audio: CadranAudio, destination: AudioNode, when: number): void {
  const { context } = audio
  const saw = context.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(58, when)
  saw.frequency.linearRampToValueAtTime(50, when + 0.9)
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 6
  filter.frequency.setValueAtTime(420, when)
  filter.frequency.exponentialRampToValueAtTime(180, when + 0.9)
  const body = context.createGain()
  envelope(body.gain, when, { peak: 0.22, attack: 0.06, decay: 0.85 })
  const tremolo = context.createGain()
  tremolo.gain.value = 0.6
  const wobble = context.createOscillator()
  wobble.frequency.value = 11
  const depth = context.createGain()
  depth.gain.value = 0.4
  wobble.connect(depth).connect(tremolo.gain)
  saw.connect(filter).connect(body).connect(tremolo).connect(destination)
  saw.start(when)
  wobble.start(when)
  saw.stop(when + 0.95)
  wobble.stop(when + 0.95)
}

export function ignite(audio: CadranAudio, destination: AudioNode, when: number): void {
  tone(audio, destination, 'sine', [220, 440], when, { peak: 0.07, attack: 0.12, decay: 0.55 })
  tone(audio, destination, 'triangle', [330, 330], when, { peak: 0.035, attack: 0.15, decay: 0.7 })
  hiss(audio, destination, { type: 'highpass', from: 6000, to: 6000, q: 0.7 }, when, {
    peak: 0.025,
    attack: 0.05,
    decay: 0.6,
  })
}

export function staticBurst(audio: CadranAudio, destination: AudioNode, when: number): void {
  const gate = audio.context.createGain()
  const pattern = [1, 0.25, 0.9, 0.1, 0.75, 0.3, 1, 0.15, 0.6] as const
  pattern.forEach((level, index) => {
    gate.gain.setValueAtTime(level, when + index * 0.028)
  })
  gate.connect(destination)
  hiss(audio, gate, { type: 'bandpass', from: 2200, to: 1600, q: 0.45 }, when, {
    peak: 0.13,
    attack: 0.008,
    decay: 0.24,
  })
}

export function chime(audio: CadranAudio, destination: AudioNode, when: number): void {
  for (const [frequency, delay] of [
    [659.26, 0],
    [987.77, 0.11],
  ] as const) {
    tone(audio, destination, 'sine', [frequency, frequency], when + delay, {
      peak: 0.09,
      attack: 0.005,
      decay: 1.7,
    })
    tone(audio, destination, 'sine', [frequency * 2.01, frequency * 2.01], when + delay, {
      peak: 0.022,
      attack: 0.005,
      decay: 0.9,
    })
  }
}

export function ping(audio: CadranAudio, destination: AudioNode, when: number): void {
  tone(audio, destination, 'sine', [783.99, 783.99], when, {
    peak: 0.08,
    attack: 0.004,
    decay: 1.1,
  })
  tone(audio, destination, 'sine', [1567.98, 1567.98], when, {
    peak: 0.02,
    attack: 0.004,
    decay: 0.5,
  })
}
