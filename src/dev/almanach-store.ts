import { mkdir, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { ALMANACH_STYLE_ID } from '../lib/art-effect/almanach-look.ts'
import { almanachStyle } from '../lib/game/schema.ts'

export const ALMANACH_SAVE_PATH = '/__aubaine/almanachs/'

const BODY_LIMIT = 16_384

export type AlmanachSaveRequest = {
  readonly method: string | undefined
  readonly path: string | undefined
  readonly origin: string | undefined
  readonly host: string | undefined
  readonly body: string
}

export type AlmanachSave =
  | { readonly ok: true; readonly id: string; readonly json: string }
  | { readonly ok: false; readonly status: 400 | 403 | 405; readonly reason: string }

function sameOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (origin === undefined || host === undefined) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function parsed(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch {
    return undefined
  }
}

export function almanachSave(request: AlmanachSaveRequest): AlmanachSave {
  if (request.method !== 'PUT') {
    return { ok: false, status: 405, reason: 'only PUT saves an almanach style' }
  }
  if (!sameOrigin(request.origin, request.host)) {
    return { ok: false, status: 403, reason: 'a style is saved from the dev server itself' }
  }
  const id = (request.path ?? '').replace(/^\//, '')
  if (!ALMANACH_STYLE_ID.test(id)) {
    return { ok: false, status: 400, reason: `${id} is not a style name in lowercase-with-dashes` }
  }
  const style = almanachStyle.safeParse(parsed(request.body))
  if (!style.success) {
    const fields = style.error.issues.map((issue) => issue.path.join('.') || 'the body')
    return { ok: false, status: 400, reason: `invalid ${[...new Set(fields)].join(', ')}` }
  }
  return { ok: true, id, json: `${JSON.stringify(style.data, null, 2)}\n` }
}

function readBody(request: IncomingMessage): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > BODY_LIMIT) {
        resolve(undefined)
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

function answer(response: ServerResponse, status: number, body: Record<string, string>): void {
  response.statusCode = status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

export async function saveAlmanachStyle(
  request: IncomingMessage,
  response: ServerResponse,
  directory: URL,
): Promise<void> {
  const body = await readBody(request)
  if (body === undefined) {
    answer(response, 413, { error: `a style is at most ${BODY_LIMIT} bytes` })
    return
  }
  const save = almanachSave({
    method: request.method,
    path: request.url,
    origin: request.headers.origin,
    host: request.headers.host,
    body,
  })
  if (!save.ok) {
    answer(response, save.status, { error: save.reason })
    return
  }
  await mkdir(directory, { recursive: true })
  await writeFile(new URL(`${save.id}.json`, directory), save.json, 'utf8')
  answer(response, 200, { id: save.id })
}
