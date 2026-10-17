uniform sampler2D tGraded;
uniform vec2 uSrc;
uniform vec2 uSrcSize;
uniform float uSharp;
varying vec2 vUv;

#ifdef PRESENT_FXAA
vec3 sharpened(vec2 uv) {
  vec4 nw = texture2D(tGraded, uv + vec2(-0.5, -0.5) * uSrc);
  vec4 ne = texture2D(tGraded, uv + vec2(0.5, -0.5) * uSrc);
  vec4 sw = texture2D(tGraded, uv + vec2(-0.5, 0.5) * uSrc);
  vec4 se = texture2D(tGraded, uv + vec2(0.5, 0.5) * uSrc);
  vec4 m = texture2D(tGraded, uv);
  float lumaMin = min(m.a, min(min(nw.a, ne.a), min(sw.a, se.a)));
  float lumaMax = max(m.a, max(max(nw.a, ne.a), max(sw.a, se.a)));
  vec2 dir = vec2(-((nw.a + ne.a) - (sw.a + se.a)), (nw.a + sw.a) - (ne.a + se.a));
  float reduce = max((nw.a + ne.a + sw.a + se.a) * 0.03125, 1.0 / 128.0);
  dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + reduce), vec2(-8.0), vec2(8.0)) * uSrc;
  vec3 a = 0.5 * (texture2D(tGraded, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tGraded, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture2D(tGraded, uv - dir * 0.5).rgb + texture2D(tGraded, uv + dir * 0.5).rgb);
  float lb = dot(b, vec3(0.299, 0.587, 0.114));
  return (lb < lumaMin || lb > lumaMax) ? a : b;
}
#else
vec3 sharpened(vec2 uv) {
  vec2 pos = uv * uSrcSize;
  vec2 c = floor(pos - 0.5) + 0.5;
  vec2 f = pos - c;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t12 = (c + w2 / w12) * uSrc;
  vec2 t0 = (c - 1.0) * uSrc;
  vec2 t3 = (c + 2.0) * uSrc;
  vec3 sum = texture2D(tGraded, vec2(t12.x, t0.y)).rgb * (w12.x * w0.y)
    + texture2D(tGraded, vec2(t0.x, t12.y)).rgb * (w0.x * w12.y)
    + texture2D(tGraded, t12).rgb * (w12.x * w12.y)
    + texture2D(tGraded, vec2(t3.x, t12.y)).rgb * (w3.x * w12.y)
    + texture2D(tGraded, vec2(t12.x, t3.y)).rgb * (w12.x * w3.y);
  float weight = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  return max(sum / weight, vec3(0.0));
}
#endif

void main() {
  vec2 uv = vUv;
  vec3 c = sharpened(uv);
  vec3 n = texture2D(tGraded, uv - vec2(0.0, uSrc.y)).rgb;
  vec3 s = texture2D(tGraded, uv + vec2(0.0, uSrc.y)).rgb;
  vec3 e = texture2D(tGraded, uv + vec2(uSrc.x, 0.0)).rgb;
  vec3 w = texture2D(tGraded, uv - vec2(uSrc.x, 0.0)).rgb;
  vec3 lo = min(c, min(min(n, s), min(e, w)));
  vec3 hi = max(c, max(max(n, s), max(e, w)));
  vec3 amp = sqrt(clamp(min(lo, 1.0 - hi) / max(hi, vec3(1e-4)), 0.0, 1.0));
  vec3 k = -amp * uSharp;
  c = clamp((c + (n + s + e + w) * k) / (1.0 + 4.0 * k), 0.0, 1.0);
  if (uScreen > 0.0) {
    vec2 shift = aberration(uv);
    vec3 base = texture2D(tGraded, uv).rgb;
    c.r = clamp(c.r + texture2D(tGraded, uv + shift).r - base.r, 0.0, 1.0);
    c.b = clamp(c.b + texture2D(tGraded, uv - shift).b - base.b, 0.0, 1.0);
  }
  gl_FragColor = vec4(screenEffect(c, uv), 1.0);
}
