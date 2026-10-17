uniform sampler2D uNoise;
uniform float uTime;
uniform float uCloudSh;
uniform sampler2D uData;
uniform vec2 uGridO;
uniform vec2 uHover;
uniform float uGrid;
uniform float uBorders;
uniform vec3 uSelColor;
uniform float uFogDensity;

float N1(vec2 p) { return texture2D(uNoise, p).r; }
float N2(vec2 p) { return texture2D(uNoise, p).g; }
float N3(vec2 p) { return texture2D(uNoise, p).b; }
float NC(vec2 p) { return texture2D(uNoise, p).a; }
float fbm(vec2 p) { return N1(p) * 0.5 + N2(p * 1.31 + 0.17) * 0.3 + N3(p * 1.73 + 0.41) * 0.2; }
float h12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 h22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
vec3 voro(vec2 x) {
  vec2 n = floor(x), f = fract(x);
  float d1 = 8.0, d2 = 8.0;
  vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + h22(n + g) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = n + g; } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), h12(id));
}
vec3 lin(vec3 c) { return c * c; }
float snowLine(float z) { return 1.78 + (z / Z0_) * 0.6; }
float aaF(vec2 q) { return clamp(1.0 - length(fwidth(q)) * 0.9, 0.0, 1.0); }
float cloudShadow(vec2 xz) { return smoothstep(0.42, 0.78, N1(xz * 0.0055 + uTime * WIND * 0.00125)) * uCloudSh; }
vec4 hexAt(vec2 xz) {
  vec2 g = xz + uGridO;
  float q = 0.57735027 * g.x - 0.33333333 * g.y, r = 0.66666667 * g.y;
  vec3 c = vec3(q, r, -q - r);
  vec3 rc = floor(c + 0.5);
  vec3 df = abs(rc - c);
  if (df.x > df.y && df.x > df.z) rc.x = -rc.y - rc.z; else if (df.y > df.z) rc.y = -rc.x - rc.z;
  vec2 cen = vec2(1.7320508 * (rc.x + rc.y * 0.5), 1.5 * rc.y);
  vec2 d = g - cen;
  float p0 = d.x, p1 = 0.5 * d.x + 0.8660254 * d.y, p2 = -0.5 * d.x + 0.8660254 * d.y;
  float m = abs(p0), e = p0 >= 0.0 ? 0.0 : 3.0;
  if (abs(p1) > m) { m = abs(p1); e = p1 >= 0.0 ? 1.0 : 4.0; }
  if (abs(p2) > m) { m = abs(p2); e = p2 >= 0.0 ? 2.0 : 5.0; }
  return vec4(rc.x, rc.y, 0.8660254 - m, e);
}
vec2 hexDir(float e) {
  if (e < 0.5) return vec2(1.0, 0.0);
  if (e < 1.5) return vec2(0.0, 1.0);
  if (e < 2.5) return vec2(-1.0, 1.0);
  if (e < 3.5) return vec2(-1.0, 0.0);
  if (e < 4.5) return vec2(0.0, -1.0);
  return vec2(1.0, -1.0);
}
vec4 tileTex(vec2 qr) {
  float row = qr.y;
  float col = qr.x + floor(row * 0.5);
  if (row < 0.0 || col < 0.0 || row >= H_ || col >= W_) return vec4(0.0);
  return texture2D(uData, vec2((col + 0.5) / W_, (row + 0.5) / H_));
}
vec4 tileInfo(float tile) {
  if (tile >= NO_TILE_) return vec4(0.0);
  return texelFetch(uData, ivec2(int(mod(tile, W_)), int(floor(tile / W_))), 0);
}
void hexOverlay(vec3 p, inout vec3 col, inout vec3 emis, float onWater) {
  vec4 hx = hexAt(p.xz);
  vec4 tA = tileTex(hx.xy), tB = tileTex(hx.xy + hexDir(hx.w));
  float ed = hx.z, aa = fwidth(ed) * 1.3 + 0.0005;
  if (onWater < 0.5) {
    float cover = mix((tA.a + tB.a) * 0.5, tA.a, smoothstep(0.0, 0.35, ed));
    col *= 1.0 - cover * (0.1 + 0.12 * N2(p.xz * 2.3));
  }
  if (uGrid > 0.5) col *= mix(onWater > 0.5 ? 0.72 : 0.6, 1.0, smoothstep(0.0, 0.018 + aa, ed));
  if (uBorders > 0.5 && tA.g > 0.0 && tB.g > 0.0 && abs(tA.g - tB.g) > 0.001) {
    float line = 1.0 - smoothstep(0.03, 0.03 + aa * 1.5, ed);
    float dash = step(0.42, fract((p.x * 0.7 + p.z * 1.3) * 1.5));
    col *= 1.0 - (1.0 - smoothstep(0.03, 0.12, ed)) * 0.3;
    col = mix(col, vec3(0.98, 0.86, 0.5), line * 0.9 * (0.35 + 0.65 * dash));
    emis += vec3(0.9, 0.7, 0.3) * line * dash * 0.15;
  } else if (uBorders > 0.5 && tA.b > 0.0 && tB.b > 0.0 && abs(tA.b - tB.b) > 0.001) {
    float line = 1.0 - smoothstep(0.012, 0.012 + aa, ed);
    col = mix(col, vec3(1.0, 0.96, 0.84), line * 0.5 * step(0.5, fract((p.x * 1.1 + p.z * 0.9) * 2.6)));
  }
  if (tA.r > 0.5) {
    col = mix(col, col * 1.1 + uSelColor * 0.06, 0.55);
    if (tB.r < 0.5) {
      float l = 1.0 - smoothstep(0.018, 0.06 + aa, ed);
      float glow = 1.0 - smoothstep(0.0, 0.3, ed);
      emis += uSelColor * (l * (1.5 + 0.5 * sin(uTime * 3.0)) + glow * 0.22);
      col = mix(col, uSelColor, l * 0.55);
    }
  }
  if (abs(hx.x - uHover.x) < 0.5 && abs(hx.y - uHover.y) < 0.5) {
    float l = 1.0 - smoothstep(0.012, 0.04 + aa, ed);
    col = mix(col * 1.07, vec3(1.0), l * 0.75);
    emis += vec3(1.0, 0.95, 0.85) * l * 0.4;
  }
}
vec3 atlasFog(vec3 col, vec3 world) {
  vec3 ray = world - cameraPosition;
  float d = length(ray);
  vec3 sky = veil(ray / max(d, 1e-4));
  col = mix(col, sky, 1.0 - exp(-uFogDensity * uFogDensity * d * d));
  float u = unexplored(world.xz);
  if (u <= 0.0) return col;
  float mist = N1(world.xz * 0.045 + uTime * WIND * 0.0015) * 0.65 + N2(world.xz * 0.11 - uTime * WIND * 0.002) * 0.35;
  vec3 lit = sky * (1.04 + 0.08 * (1.0 - uNight)) + uSunCol * 0.05 * uSunInt * (1.0 - uUnder);
  vec3 cloud = mix(sky * 0.95, lit, smoothstep(0.3, 0.8, mist));
  return mix(col, mix(sky, cloud, 4.0 * u * (1.0 - u)), u);
}
