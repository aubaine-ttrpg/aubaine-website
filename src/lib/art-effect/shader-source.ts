export const SHADER_PREAMBLE = '#version 300 es\nprecision highp float;\nprecision highp int;\n'

export type ShaderLibrary = { common: string; present: string }

export type FragmentParts = { defines: readonly string[]; presents: boolean; body: string }

export function fragmentSource(
  library: ShaderLibrary,
  { defines, presents, body }: FragmentParts,
): string {
  const declared = defines.map((name) => `#define ${name}\n`).join('')
  return `${SHADER_PREAMBLE}${declared}${library.common}\n${presents ? `${library.present}\n` : ''}${body}`
}

export function vertexSource(body: string): string {
  return `${SHADER_PREAMBLE}${body}`
}
