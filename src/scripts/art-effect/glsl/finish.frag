uniform sampler2D uGraded;
uniform float uSharpness;

#ifdef CANVAS
uniform vec3 uCanvasSurface;
uniform vec2 uLight;
#endif

out vec4 outColor;

vec3 at(ivec2 p) {
  return texelFetch(uGraded, clamp(p, ivec2(0), textureSize(uGraded, 0) - 1), 0).rgb;
}

#ifdef CANVAS
float threadHeight(vec2 q) {
  vec2 cell = floor(q);
  vec2 f = q - cell;
  float jitter = hash3(ivec2(cell), 29u).x;
  bool warp = mod(cell.x + cell.y, 2.0) < 1.0;
  float across = warp ? f.x : f.y;
  float along = warp ? f.y : f.x;
  return sin(3.14159265 * across) * (0.65 + 0.35 * sin(3.14159265 * along)) * (0.85 + 0.3 * jitter);
}
#endif

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec3 a = at(p + ivec2(-1, 1));
  vec3 b = at(p + ivec2(0, 1));
  vec3 c = at(p + ivec2(1, 1));
  vec3 d = at(p + ivec2(-1, 0));
  vec3 e = at(p);
  vec3 f = at(p + ivec2(1, 0));
  vec3 g = at(p + ivec2(-1, -1));
  vec3 h = at(p + ivec2(0, -1));
  vec3 i = at(p + ivec2(1, -1));

  vec3 low = min(min(min(d, e), min(f, b)), h);
  low += min(low, min(min(a, c), min(g, i)));
  vec3 high = max(max(max(d, e), max(f, b)), h);
  high += max(high, max(max(a, c), max(g, i)));
  vec3 amplitude = sqrt(clamp(min(low, 2.0 - high) / max(high, vec3(1e-5)), 0.0, 1.0));
  vec3 weight = amplitude * (-1.0 / mix(8.0, 5.0, uSharpness));
  vec3 color = clamp((b * weight + d * weight + f * weight + h * weight + e) / (1.0 + 4.0 * weight), 0.0, 1.0);

#ifdef CANVAS
  float la = luminance(a), lb = luminance(b), lc = luminance(c), ld = luminance(d);
  float lf = luminance(f), lg = luminance(g), lh = luminance(h), li = luminance(i);
  vec2 relief = 0.25 * vec2((lc + 2.0 * lf + li) - (la + 2.0 * ld + lg), (la + 2.0 * lb + lc) - (lg + 2.0 * lh + li));
  float spread = max(max(max(la, lb), max(lc, ld)), max(max(lf, lg), max(lh, li))) -
    min(min(min(la, lb), min(lc, ld)), min(min(lf, lg), min(lh, li)));
  vec2 q = vec2(p) / uCanvasSurface.y;
  float onePixel = 1.0 / uCanvasSurface.y;
  float thread = threadHeight(q);
  vec2 slope = vec2(threadHeight(q + vec2(onePixel, 0.0)) - thread, threadHeight(q + vec2(0.0, onePixel)) - thread) / onePixel;
  float calm = 1.0 - smoothstep(0.03, 0.15, spread);
  color *= 1.0 + uCanvasSurface.z * emboss(relief, uLight) +
    uCanvasSurface.x * mix(0.5, 1.0, calm) * (emboss(slope, uLight) * 0.5 + (thread - 0.55) * 0.6);
#endif

  outColor = vec4(color, 1.0);
}
