varying vec3 vW;
varying vec3 vWN;
flat varying vec2 vOwner;
varying vec2 vLipAo;

#ifdef DETAIL_REDUCED
#define FINE(term) 0.0
#else
#define FINE(term) (term)
#endif

vec3 lipColor(int b, vec3 p) {
  if (b == 13 || b == 5) return vec3(0.9, 0.74, 0.46);
  if (b == 15) return vec3(0.8, 0.5, 0.3);
  if (b == 17) return vec3(0.92, 0.95, 1.0);
  if (b == 16) return vec3(0.55, 0.57, 0.45);
  if (b == 20) return vec3(0.16, 0.14, 0.13);
  if (b == 21) return vec3(0.68, 0.62, 0.78);
  if (b == 22) return vec3(0.22, 0.42, 0.4);
  if (b == 23 || b == 18) return vec3(0.54, 0.52, 0.48);
  if (b == 14 || b == 19) return vec3(0.64, 0.6, 0.34);
  if (b == 10 || b == 11 || b == 9) return vec3(0.2, 0.33, 0.14);
  if (b == 8) return vec3(0.5, 0.56, 0.26);
  return vec3(0.34, 0.47, 0.18) * (0.9 + 0.2 * N2(p.xz * 0.5));
}
void wallShade(out vec3 col, out float rough, out vec3 emis, out float bump) {
  vec3 p = vW;
  vec3 n = normalize(vWN);
  int b = int(vOwner.x + 0.5);
  float depth = vLipAo.x - p.y;
  float u = p.x * 0.8 + p.z * 0.6;
  vec3 c1 = vec3(0.7, 0.66, 0.58), c2 = vec3(0.86, 0.82, 0.74), c3 = vec3(0.56, 0.51, 0.44);
  if (b == 13 || b == 15 || b == 14) { c1 = vec3(0.68, 0.38, 0.23); c2 = vec3(0.88, 0.6, 0.4); c3 = vec3(0.55, 0.28, 0.18); }
  else if (b == 20) { c1 = vec3(0.13, 0.12, 0.12); c2 = vec3(0.25, 0.22, 0.21); c3 = vec3(0.08, 0.07, 0.07); }
  else if (b == 16 || b == 17 || b == 10) { c1 = vec3(0.54, 0.58, 0.62); c2 = vec3(0.74, 0.78, 0.82); c3 = vec3(0.42, 0.46, 0.5); }
  else if (b == 21) { c1 = vec3(0.48, 0.42, 0.58); c2 = vec3(0.66, 0.6, 0.76); c3 = vec3(0.36, 0.3, 0.46); }
  else if (b == 18 || b == 19) { c1 = vec3(0.52, 0.5, 0.47); c2 = vec3(0.68, 0.65, 0.6); c3 = vec3(0.4, 0.38, 0.36); }
  float w = N1(vec2(u * 0.05, p.y * 0.03)) * 1.6 + N2(vec2(u * 0.17, p.y * 0.12)) * 0.5;
  float L = p.y * 3.2 + w, layer = fract(L), lid = floor(L);
  vec3 base = mix(c1, c2, fract(sin(lid * 12.9898 + 4.1) * 43758.5453));
  base = mix(base, c3, smoothstep(0.84, 1.0, layer) * 0.65);
  float g = N3(vec2(u * 1.1, p.y * 2.3)), f = N2(vec2(u * 0.42, p.y * 0.08)), frac = 1.0 - smoothstep(0.0, 0.028, abs(f - 0.5));
  col = base * (0.86 + 0.24 * g + FINE((N3(vec2(u * 6.0, p.y * 9.0)) - 0.5) * 0.16 * aaF(vec2(u * 6.0, p.y * 9.0)))) * (1.0 - frac * 0.36);
  float streak = smoothstep(0.55, 0.82, N1(vec2(u * 0.6, 0.11))) * smoothstep(1.4, 0.0, depth);
  col *= 1.0 - streak * 0.2;
  bump = smoothstep(0.84, 1.0, layer) * -0.012 + g * 0.006 - frac * 0.016;
  rough = 0.86;
  emis = vec3(0.0);
  float deep = smoothstep(-1.0, -2.2, p.y);
  col = mix(col, vec3(0.17, 0.16, 0.19) * (0.75 + 0.5 * N2(vec2(u * 0.2, p.y * 0.4))), deep * 0.8);
  float wet = 1.0 - smoothstep(0.0, 0.06, abs(p.y - 0.02));
#ifdef WALL_UNDER
  col *= 1.0 - wet * 0.32;
  if (p.y < 0.0) col *= vec3(0.74, 0.85, 0.88);
  col *= 0.62;
#else
  float vein = (1.0 - smoothstep(0.0, 0.016, abs(N1(vec2(u * 0.09, p.y * 0.25)) - 0.5))) * deep;
  emis += vec3(0.45, 0.22, 1.0) * vein * (1.6 + 0.7 * sin(uTime * 1.5 + u));
  col *= 1.0 - wet * 0.32;
  if (p.y < 0.0) col *= vec3(0.74, 0.85, 0.88);
  vec3 lipC = lipColor(b, p);
  float lipN = N3(vec2(u * 2.0, 0.37)) * 0.03;
  col = mix(col, vec3(0.3, 0.23, 0.16), (1.0 - smoothstep(0.015 + lipN, 0.05 + lipN, depth)) * 0.6);
  col = mix(col, lipC, 1.0 - smoothstep(0.006, 0.016 + lipN * 0.5, depth));
  col = mix(col, lipC * 0.92, smoothstep(0.62, 0.88, n.y) * 0.9);
  if (b == 9 || b == 11 || b == 22 || b == 12 || b == 7) {
    float ms = smoothstep(0.58, 0.78, N2(vec2(u * 0.5, p.y * 0.6))) * (1.0 - smoothstep(0.0, 0.6, depth));
    col = mix(col, vec3(0.24, 0.34, 0.14), ms * 0.5);
  }
  if (p.y < 3.6) {
    float sl = snowLine(p.z);
    float sn = smoothstep(sl, sl + 0.2, p.y) * smoothstep(0.25, 0.7, n.y + 0.45 * N2(p.xz * 0.3));
    col = mix(col, vec3(0.92, 0.95, 1.0), sn * 0.85);
  }
  if (b == 17) col = mix(col, vec3(0.72, 0.86, 0.95), 0.45);
#endif
  col *= 1.0 - cloudShadow(p.xz) * 0.28;
  vec4 td = tileInfo(vOwner.y);
  if (td.r > 0.5) {
    col = mix(col, col * 1.12 + uSelColor * 0.08, 0.5);
    emis += uSelColor * 0.05;
  }
  col = lin(col) * mix(vLipAo.y, 1.0, 0.35);
  emis *= 0.7 + uNight * 0.8;
}
