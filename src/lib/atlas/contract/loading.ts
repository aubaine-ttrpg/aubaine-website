export const LOAD_MILESTONES = ['code', 'world', 'compiled', 'drawn'] as const
export type LoadMilestone = (typeof LOAD_MILESTONES)[number]

export const SURFACE_JOBS = [
  'textures',
  'terrain',
  'water',
  'sky',
  'landmarks',
  'routes',
  'props',
  'effects',
] as const
export type SurfaceJob = (typeof SURFACE_JOBS)[number]

export type LoadState = { fraction: number }

const MILESTONE_WEIGHTS: Readonly<Record<LoadMilestone, number>> = {
  code: 18,
  world: 22,
  compiled: 8,
  drawn: 2,
}

const JOB_WEIGHTS: Readonly<Record<SurfaceJob, number>> = {
  textures: 2,
  terrain: 26,
  water: 3,
  sky: 3,
  landmarks: 3,
  routes: 4,
  props: 6,
  effects: 3,
}

const JOB_TOTAL = SURFACE_JOBS.reduce((sum, job) => sum + JOB_WEIGHTS[job], 0)
const MAP_TOTAL = LOAD_MILESTONES.reduce((sum, key) => sum + MILESTONE_WEIGHTS[key], 0) + JOB_TOTAL
const LIST_TOTAL = MILESTONE_WEIGHTS.code + MILESTONE_WEIGHTS.world

function surfaceJob(key: string): SurfaceJob | undefined {
  const family = key.split(':', 1)[0]
  return SURFACE_JOBS.find((job) => job === family)
}

const kindOf = (value: unknown): unknown =>
  typeof value === 'object' && value !== null && 'kind' in value ? value.kind : undefined

export class LoadProgress {
  private map: boolean
  private readonly planned = new Map<SurfaceJob, number>()
  private readonly done = new Map<SurfaceJob, number>()
  private readonly reached = new Set<LoadMilestone>()
  private planArrived = false

  constructor(map: boolean) {
    this.map = map
  }

  reach(milestone: LoadMilestone): void {
    this.reached.add(milestone)
  }

  withoutMap(): void {
    this.map = false
  }

  receive(message: unknown): void {
    if (typeof message !== 'object' || message === null) return
    const kind = kindOf(message)
    if (kind === 'world') this.reach('world')
    if (kind === 'plan' && 'jobs' in message && Array.isArray(message.jobs)) {
      this.planArrived = true
      for (const key of message.jobs) {
        const job = typeof key === 'string' ? surfaceJob(key) : undefined
        if (job) this.planned.set(job, (this.planned.get(job) ?? 0) + 1)
      }
    }
    if (kind === 'done' && 'job' in message && typeof message.job === 'string') {
      const job = surfaceJob(message.job)
      if (job) this.done.set(job, (this.done.get(job) ?? 0) + 1)
    }
  }

  get state(): LoadState {
    const has = (milestone: LoadMilestone) => this.reached.has(milestone)
    if (!this.map) {
      const fraction =
        ((has('code') ? MILESTONE_WEIGHTS.code : 0) +
          (has('world') ? MILESTONE_WEIGHTS.world : 0)) /
        LIST_TOTAL
      return { fraction }
    }
    let weight = 0
    for (const milestone of LOAD_MILESTONES)
      if (has(milestone)) weight += MILESTONE_WEIGHTS[milestone]
    for (const job of SURFACE_JOBS) weight += JOB_WEIGHTS[job] * this.share(job)
    return { fraction: Math.min(1, weight / MAP_TOTAL) }
  }

  private share(job: SurfaceJob): number {
    const planned = this.planned.get(job) ?? 0
    if (planned === 0) return this.planArrived ? 1 : 0
    return Math.min(1, (this.done.get(job) ?? 0) / planned)
  }
}
