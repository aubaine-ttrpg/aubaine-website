import type { GpuReport } from '../lib/atlas/contract/quality'

export function gpuReport(gl: WebGL2RenderingContext): GpuReport {
  const debug = gl.getExtension('WEBGL_debug_renderer_info')
  return {
    renderer: String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)),
    cores: navigator.hardwareConcurrency,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  }
}
