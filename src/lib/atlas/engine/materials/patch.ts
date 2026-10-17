export class ShaderChunkError extends Error {
  constructor(chunk: string) {
    super(`three.js no longer provides the shader chunk ${chunk}`)
    this.name = 'ShaderChunkError'
  }
}

export type ChunkEdit = { chunk: string; with: 'after' | 'replace'; code: string }

export function editShader(source: string, edits: readonly ChunkEdit[]): string {
  let result = source
  for (const edit of edits) {
    const include = `#include <${edit.chunk}>`
    if (!result.includes(include)) throw new ShaderChunkError(edit.chunk)
    result = result.replace(include, edit.with === 'after' ? `${include}\n${edit.code}` : edit.code)
  }
  return result
}
