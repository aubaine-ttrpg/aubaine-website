export type Work = Iterator<unknown, void>

type Job = { key: string; priority: number; order: number; work: Work }

const SLICE_MS = 8

export class JobQueue {
  private jobs: Job[] = []
  private added = 0
  private scheduled = false
  private readonly wake = new MessageChannel()
  private readonly fail: (error: unknown) => void
  private readonly finished: (key: string) => void

  constructor(fail: (error: unknown) => void, finished: (key: string) => void) {
    this.fail = fail
    this.finished = finished
    this.wake.port1.onmessage = () => this.slice()
  }

  keys(): string[] {
    return this.jobs.map((job) => job.key)
  }

  add(key: string, priority: number, work: Work): void {
    this.jobs.push({ key, priority, order: this.added++, work })
    this.schedule()
  }

  reprioritise(priority: (key: string, current: number) => number): void {
    for (const job of this.jobs) job.priority = priority(job.key, job.priority)
  }

  cancel(matches: (key: string) => boolean): void {
    this.jobs = this.jobs.filter((job) => !matches(job.key))
  }

  close(): void {
    this.jobs = []
    this.wake.port1.close()
  }

  private schedule(): void {
    if (this.scheduled || this.jobs.length === 0) return
    this.scheduled = true
    this.wake.port2.postMessage(undefined)
  }

  private next(): Job | undefined {
    let best: Job | undefined
    for (const job of this.jobs) {
      if (
        !best ||
        job.priority < best.priority ||
        (job.priority === best.priority && job.order < best.order)
      ) {
        best = job
      }
    }
    return best
  }

  private slice(): void {
    this.scheduled = false
    const deadline = performance.now() + SLICE_MS
    try {
      while (performance.now() < deadline) {
        const job = this.next()
        if (!job) break
        if (job.work.next().done) {
          this.jobs = this.jobs.filter((other) => other !== job)
          this.finished(job.key)
        }
      }
    } catch (error) {
      this.jobs = []
      this.fail(error)
      return
    }
    this.schedule()
  }
}
