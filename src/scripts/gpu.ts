import type { GpuReport } from '../lib/atlas/contract/quality'

const MASKED_RENDERER = /^WebKit WebGL$/

function rendererOf(gl: WebGL2RenderingContext): string {
  const named = String(gl.getParameter(gl.RENDERER))
  if (!MASKED_RENDERER.test(named)) return named
  const debug = gl.getExtension('WEBGL_debug_renderer_info')
  return debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : named
}

export function gpuReport(gl: WebGL2RenderingContext): GpuReport {
  return {
    renderer: rendererOf(gl),
    cores: navigator.hardwareConcurrency,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  }
}
