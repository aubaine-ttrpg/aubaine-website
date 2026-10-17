import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SOUND_WORKS, type SoundCut, type SoundShape } from '../../src/lib/rights/attribution.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const originals = resolve(root, 'tmp/sounds')
const outDir = resolve(root, 'data/media/sounds')

const SAMPLE_RATE = 32000
const LOOP_LOUDNESS = { integrated: -23, truePeak: -2, range: 11 } as const
const SHOT_PEAK_DB = -3
const SHOT_FADE = { in: 0.005, out: 0.05, longest: 0.25 } as const
const ENCODING: Readonly<Record<SoundShape, { channels: number; quality: number }>> = {
  loop: { channels: 2, quality: 6 },
  shot: { channels: 1, quality: 7 },
}

type Loudness = {
  input_i: string
  input_tp: string
  input_lra: string
  input_thresh: string
  target_offset: string
}

function run(command: string, args: readonly string[]): string {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-600)}`)
  return result.stderr
}

function duration(input: string): number {
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input],
    { encoding: 'utf8' },
  )
  const seconds = Number(result.stdout.trim())
  if (!Number.isFinite(seconds)) throw new Error(`ffprobe could not read the length of ${input}`)
  return seconds
}

function window(cut: SoundCut): string[] {
  return [
    ...(cut.start === undefined ? [] : ['-ss', String(cut.start)]),
    ...(cut.length === undefined ? [] : ['-t', String(cut.length)]),
  ]
}

function shaping(cut: SoundCut, input: string): string[] {
  const filters = cut.lowpass === undefined ? [] : [`lowpass=f=${cut.lowpass}`]
  if (cut.shape === 'loop') return filters
  const length = cut.length ?? duration(input) - (cut.start ?? 0)
  const fadeOut = Math.min(SHOT_FADE.out, length * SHOT_FADE.longest)
  return [
    ...filters,
    `afade=t=in:d=${SHOT_FADE.in}`,
    `afade=t=out:st=${(length - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}`,
  ]
}

function measure(input: string, cut: SoundCut, filters: readonly string[]): string {
  return run('ffmpeg', [
    '-hide_banner',
    '-nostats',
    ...window(cut),
    '-i',
    input,
    '-af',
    filters.join(','),
    '-f',
    'null',
    '-',
  ])
}

function levelling(input: string, cut: SoundCut, shape: readonly string[]): string {
  if (cut.shape === 'shot') {
    const report = measure(input, cut, [...shape, 'volumedetect'])
    const peak = Number(/max_volume: (-?[\d.]+) dB/.exec(report)?.[1])
    if (!Number.isFinite(peak)) throw new Error(`no peak was measured for ${cut.file}`)
    return `volume=${(SHOT_PEAK_DB - peak).toFixed(2)}dB`
  }
  const target = `I=${LOOP_LOUDNESS.integrated}:TP=${LOOP_LOUDNESS.truePeak}:LRA=${LOOP_LOUDNESS.range}`
  const report = measure(input, cut, [...shape, `loudnorm=${target}:print_format=json`])
  const json = /\{[^{}]*"input_i"[^{}]*\}/.exec(report)?.[0]
  if (!json) throw new Error(`no loudness was measured for ${cut.file}`)
  const measured: Loudness = JSON.parse(json)
  return [
    `loudnorm=${target}`,
    `measured_I=${measured.input_i}`,
    `measured_TP=${measured.input_tp}`,
    `measured_LRA=${measured.input_lra}`,
    `measured_thresh=${measured.input_thresh}`,
    `offset=${measured.target_offset}`,
    'linear=true',
  ].join(':')
}

function encode(cut: SoundCut): void {
  const input = resolve(originals, cut.original)
  if (!existsSync(input)) {
    throw new Error(`${cut.original} is missing from tmp/sounds; download it from its source first`)
  }
  const shape = shaping(cut, input)
  const encoding = ENCODING[cut.shape]
  run('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-y',
    ...window(cut),
    '-i',
    input,
    '-af',
    [...shape, levelling(input, cut, shape)].join(','),
    '-ar',
    String(SAMPLE_RATE),
    '-ac',
    String(encoding.channels),
    '-c:a',
    'libmp3lame',
    '-q:a',
    String(encoding.quality),
    '-map_metadata',
    '-1',
    '-id3v2_version',
    '0',
    '-fflags',
    '+bitexact',
    '-flags:a',
    '+bitexact',
    resolve(outDir, `${cut.file}.mp3`),
  ])
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true })
  const cuts = SOUND_WORKS.flatMap((work): readonly SoundCut[] => work.cuts)
  for (const cut of cuts) encode(cut)
  console.log(`sounds: encoded ${cuts.length} files into data/media/sounds/`)
}

await main()
