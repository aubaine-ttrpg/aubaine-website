varying vec3 vW;
varying vec3 vWN;
flat varying vec2 vBiome;
varying vec2 vBlendAo;
uniform sampler2D uSkyData;
uniform vec2 uHoverSky;

#ifdef DETAIL_REDUCED
#define FINE(term) 0.0
#else
#define FINE(term) (term)
#endif

void skyOverlay(vec3 p, inout vec3 col, inout vec3 emis) {
  vec4 hx = hexAt(p.xz);
  vec2 dn = hexDir(hx.w);
  float r1 = hx.y, c1 = hx.x + floor(r1 * 0.5), r2 = hx.y + dn.y, c2 = hx.x + dn.x + floor(r2 * 0.5);
  float sA = texture2D(uSkyData, vec2((c1 + 0.5) / W_, (r1 + 0.5) / H_)).r;
  float sB = texture2D(uSkyData, vec2((c2 + 0.5) / W_, (r2 + 0.5) / H_)).r;
  float ed = hx.z, aa = fwidth(ed) * 1.3 + 0.0005;
  if (uGrid > 0.5) col *= mix(0.62, 1.0, smoothstep(0.0, 0.018 + aa, ed));
  if (sA > 0.5) {
    col = mix(col, col * 1.1 + uSelColor * 0.06, 0.55);
    if (sB < 0.5) {
      float l = 1.0 - smoothstep(0.018, 0.06 + aa, ed);
      emis += uSelColor * l * (1.5 + 0.5 * sin(uTime * 3.0));
      col = mix(col, uSelColor, l * 0.55);
    }
  }
  if (abs(hx.x - uHoverSky.x) < 0.5 && abs(hx.y - uHoverSky.y) < 0.5) {
    float l = 1.0 - smoothstep(0.012, 0.04 + aa, ed);
    col = mix(col * 1.07, vec3(1.0), l * 0.75);
    emis += vec3(1.0, 0.95, 0.85) * l * 0.4;
  }
}
vec3 grassC(vec2 xz, float dry, float lush) {
  float a = fbm(xz * 0.016), b = N2(xz * 0.065), c = N3(xz * 0.23);
  vec3 col = mix(vec3(0.34, 0.5, 0.18), vec3(0.47, 0.6, 0.23), smoothstep(0.3, 0.72, a));
  col = mix(col, vec3(0.6, 0.56, 0.33), dry * smoothstep(0.38, 0.82, b));
  col = mix(col, vec3(0.2, 0.34, 0.12), lush * smoothstep(0.5, 0.9, b));
  return col * (0.86 + 0.2 * c + FINE((N3(xz * 7.0) - 0.5) * 0.24 * aaF(xz * 7.0)) + FINE((N2(xz * 21.0) - 0.5) * 0.18 * aaF(xz * 21.0)));
}
vec3 flowersC(vec2 xz, vec3 col, float amt) {
  float f = N3(xz * 1.6 + 7.3), g = N2(xz * 0.05);
  vec3 fc = g < 0.4 ? vec3(0.95, 0.93, 0.84) : (g < 0.62 ? vec3(0.95, 0.78, 0.26) : vec3(0.72, 0.48, 0.86));
  return mix(col, fc, smoothstep(0.82, 0.9, f) * amt * aaF(xz * 1.6));
}
vec3 rockC(vec3 p) {
  float s = p.y * 3.4 + N1(p.xz * 0.05) * 1.6;
  vec3 c = mix(vec3(0.44, 0.42, 0.39), vec3(0.62, 0.59, 0.54), N2(p.xz * 0.09));
  c *= 0.86 + 0.18 * smoothstep(0.0, 0.25, fract(s)) + (N3(p.xz * 0.9) - 0.5) * 0.25 + FINE((N2(p.xz * 6.0) - 0.5) * 0.16 * aaF(p.xz * 6.0));
  return mix(c, vec3(0.42, 0.46, 0.3), smoothstep(0.62, 0.8, N1(p.xz * 0.3)) * 0.35);
}
float windSheen(vec3 p) {
#ifdef DETAIL_REDUCED
  return 0.0;
#else
  float near = smoothstep(90.0, 30.0, length(cameraPosition - p));
  if (near <= 0.0) return 0.0;
  float gust = sin(dot(p.xz, WIND) * 1.6 - uTime * 1.3 + N1(p.xz * 0.06) * 6.0);
  return smoothstep(0.5, 1.0, gust) * (0.5 + 0.5 * N2(p.xz * 0.21 + uTime * WIND * 0.02)) * near;
#endif
}

void biomeShade(float idf, vec3 p, vec3 n, out vec3 col, out float r, out vec3 e, out float k) {
  int id = int(idf + 0.5);
  vec2 xz = p.xz;
  r = 0.92;
  e = vec3(0.0);
  k = 0.0;
  if (id <= 3) {
    float d = -p.y;
    vec3 sand = mix(vec3(0.76, 0.7, 0.54), vec3(0.88, 0.82, 0.65), N2(xz * 0.08));
    float rip = sin(xz.x * 5.0 + xz.y * 3.0 + N1(xz * 0.05) * 8.0) * aaF(xz * 5.0);
    sand *= 0.94 + 0.06 * rip;
    k = rip * 0.004;
    vec3 rk = mix(vec3(0.22, 0.28, 0.29), vec3(0.4, 0.42, 0.38), N3(xz * 0.3));
    float ra = smoothstep(0.35, 1.0, d) * smoothstep(0.35, 0.65, N1(xz * 0.04));
    col = mix(sand, rk, ra);
    col = mix(col, vec3(0.28, 0.42, 0.2), smoothstep(0.6, 0.8, N2(xz * 0.11)) * smoothstep(0.1, 0.4, d) * (1.0 - ra) * 0.6);
    if (id == 3) {
      float c1 = N2(xz * 0.22);
      vec3 cc = mix(vec3(0.96, 0.42, 0.5), vec3(0.6, 0.38, 0.95), N1(xz * 0.5));
      cc = mix(cc, vec3(1.0, 0.68, 0.28), smoothstep(0.5, 0.8, N3(xz * 0.35)));
      float cm = smoothstep(0.48, 0.64, c1);
      col = mix(col, cc, cm);
      k += cm * 0.02;
    }
    r = 0.8;
  } else if (id == 4) {
    col = mix(vec3(0.34, 0.35, 0.24), vec3(0.46, 0.44, 0.3), N2(xz * 0.1));
    r = 0.8;
  } else if (id == 5) {
    col = mix(vec3(0.84, 0.76, 0.58), vec3(0.95, 0.89, 0.72), N2(xz * 0.12)) * (0.94 + FINE((N3(xz * 9.0) - 0.5) * 0.12 * aaF(xz * 9.0)));
    float wet = 1.0 - smoothstep(0.0, 0.1, p.y);
    col *= 1.0 - wet * 0.32;
    r = mix(0.9, 0.3, wet);
    k = N3(xz * 1.4) * 0.003;
  } else if (id == 6) {
    col = flowersC(xz, grassC(xz, 0.55, 0.0), 0.3);
    k = N3(xz * 7.0) * 0.004;
  } else if (id == 7) {
    col = flowersC(xz, grassC(xz, 0.15, 0.45), 0.6);
    k = N2(xz * 0.3) * 0.01 + N3(xz * 7.0) * 0.004;
  } else if (id == 8) {
    vec3 v = voro(xz * 0.85);
    float cid = v.z, ed = v.y;
    vec3 crop = cid < 0.22 ? vec3(0.82, 0.68, 0.32) : cid < 0.36 ? vec3(0.44, 0.56, 0.22) : cid < 0.5 ? vec3(0.44, 0.33, 0.21) : cid < 0.6 ? vec3(0.54, 0.45, 0.68) : cid < 0.74 ? vec3(0.88, 0.76, 0.3) : vec3(0.6, 0.63, 0.3);
    float ang = cid * 6.283;
    vec2 dir = vec2(cos(ang), sin(ang));
    float aa = aaF(xz * 6.0);
    float rows = (sin(dot(xz, dir) * 34.0) * 0.5 + 0.5) * aa + 0.5 * (1.0 - aa);
    crop *= 0.84 + 0.24 * rows;
    float hedge = 1.0 - smoothstep(0.025, 0.07, ed);
    col = mix(crop, vec3(0.17, 0.28, 0.11), hedge * 0.85);
    k = rows * 0.004 + hedge * 0.014;
  } else if (id == 9) {
    col = mix(grassC(xz, 0.0, 0.8) * 0.72, vec3(0.27, 0.21, 0.13), smoothstep(0.55, 0.8, N2(xz * 0.2)) * 0.45);
  } else if (id == 10) {
    col = mix(vec3(0.21, 0.27, 0.18), vec3(0.31, 0.34, 0.25), N1(xz * 0.06));
    col = mix(col, vec3(0.42, 0.36, 0.25), smoothstep(0.6, 0.8, N2(xz * 0.15)) * 0.5);
    col *= 0.9 + FINE((N3(xz * 8.0) - 0.5) * 0.2 * aaF(xz * 8.0));
  } else if (id == 11) {
    col = mix(vec3(0.14, 0.34, 0.11), vec3(0.24, 0.44, 0.13), N1(xz * 0.05)) * (0.85 + 0.3 * N3(xz * 0.4));
  } else if (id == 12) {
    col = mix(vec3(0.33, 0.38, 0.21), vec3(0.43, 0.45, 0.26), N1(xz * 0.06));
    float pud = smoothstep(0.52, 0.58, N2(xz * 0.07) + N3(xz * 0.4) * 0.12);
    col = mix(col, vec3(0.1, 0.14, 0.11), pud);
    r = mix(0.9, 0.06, pud);
    col = mix(col, vec3(0.32, 0.42, 0.12), pud * smoothstep(0.7, 0.8, N3(xz * 0.9)) * 0.8);
  } else if (id == 13) {
    float du = sin(dot(xz, vec2(0.94, 0.34)) * 3.0 + N1(xz * 0.04) * 12.0), aa = aaF(xz * 4.0);
    float rip = sin(dot(xz, vec2(0.6, 1.0)) * 24.0 + N2(xz * 0.3) * 6.0) * aa;
    col = mix(vec3(0.8, 0.58, 0.35), vec3(0.94, 0.76, 0.5), du * 0.5 + 0.5) * (0.96 + 0.05 * rip);
    k = du * 0.03 + rip * 0.004;
  } else if (id == 14) {
    col = mix(vec3(0.68, 0.6, 0.32), vec3(0.8, 0.7, 0.41), N1(xz * 0.04));
    col = mix(col, vec3(0.44, 0.47, 0.22), smoothstep(0.6, 0.8, N2(xz * 0.09)) * 0.6) * (0.9 + 0.2 * N3(xz * 0.5));
  } else if (id == 15) {
    float band = sin(p.y * 22.0 + N1(xz * 0.05) * 6.0);
    col = mix(vec3(0.64, 0.32, 0.19), vec3(0.85, 0.57, 0.35), band * 0.5 + 0.5) * (0.85 + 0.25 * N3(xz * 0.5));
    float cr = 1.0 - smoothstep(0.0, 0.04, abs(N2(xz * 0.12) - 0.5));
    col *= 1.0 - cr * 0.4;
    k = band * 0.01 - cr * 0.01;
  } else if (id == 16) {
    col = mix(vec3(0.43, 0.46, 0.35), vec3(0.6, 0.58, 0.47), fbm(xz * 0.05));
    float rk = smoothstep(0.62, 0.7, N2(xz * 0.12));
    col = mix(col, vec3(0.52, 0.52, 0.54) * (0.8 + 0.3 * N3(xz)), rk);
    col = mix(col, vec3(0.9, 0.93, 0.97), smoothstep(0.62, 0.75, N1(xz * 0.07 + 3.1)) * 0.7);
    k = rk * 0.01;
  } else if (id == 17) {
    col = mix(vec3(0.8, 0.88, 0.96), vec3(0.95, 0.97, 1.0), N1(xz * 0.05));
    float cr = 1.0 - smoothstep(0.0, 0.05, abs(N2(xz * 0.07) - 0.5));
    col = mix(col, vec3(0.34, 0.58, 0.8), cr * 0.75);
    r = 0.32;
    k = -cr * 0.02;
    e += vec3(0.05, 0.12, 0.2) * cr * uNight;
#ifdef DETAIL_RICH
    float glint = smoothstep(0.94, 1.0, N3(xz * 7.0 + cameraPosition.xz * 0.015));
    e += vec3(1.0, 0.98, 0.94) * glint * (1.0 - uNight) * uSunInt * 0.8;
#endif
  } else if (id == 18) {
    col = rockC(p);
    r = 0.85;
    k = N3(xz * 0.5) * 0.02 + N2(xz * 6.0) * 0.006;
  } else if (id == 19) {
    col = mix(grassC(xz, 0.7, 0.0) * 0.92, rockC(p), smoothstep(0.42, 0.62, N1(xz * 0.07)));
    k = N3(xz * 0.4) * 0.012;
  } else if (id == 20) {
    col = vec3(0.11, 0.1, 0.1) * (0.75 + 0.6 * N2(xz * 0.2));
    col = mix(col, vec3(0.27, 0.25, 0.24), smoothstep(0.55, 0.75, N1(xz * 0.05)));
    float cr = 1.0 - smoothstep(0.0, 0.024, abs(N1(xz * 0.08) - 0.5)), pulse = 0.55 + 0.45 * sin(uTime * 1.3 + N2(xz * 0.05) * 12.0);
    e += vec3(1.0, 0.3, 0.04) * cr * 2.1 * pulse;
    col = mix(col, vec3(0.3, 0.07, 0.02), cr);
    r = 0.75;
    k = -cr * 0.02;
  } else if (id == 21) {
    col = mix(vec3(0.6, 0.55, 0.7), vec3(0.76, 0.71, 0.84), N1(xz * 0.06));
    float v = 1.0 - smoothstep(0.0, 0.02, abs(N2(xz * 0.05) - 0.5));
    float sp = smoothstep(0.86, 0.9, N3(xz * 1.2));
    e += vec3(0.55, 0.24, 1.0) * v * (0.95 + 0.55 * sin(uTime * 2.0 + xz.x * 0.3)) + vec3(0.8, 0.6, 1.0) * sp * 0.8;
    col = mix(col, vec3(0.38, 0.22, 0.6), v);
    k = -v * 0.015;
    r = 0.6;
  } else if (id == 22) {
    col = mix(vec3(0.22, 0.44, 0.42), vec3(0.44, 0.32, 0.52), smoothstep(0.4, 0.65, N1(xz * 0.08)));
    float sp = smoothstep(0.8, 0.86, N3(xz * 0.6));
    e += vec3(0.25, 1.0, 0.8) * sp * (0.7 + 0.5 * sin(uTime * 2.5 + xz.y)) * (0.4 + uNight * 1.8);
  } else {
    vec3 v = voro(xz * 6.5);
    float aa = aaF(xz * 6.5);
    float mortar = mix(0.82, smoothstep(0.02, 0.1, v.y), aa);
    vec3 st = mix(vec3(0.6, 0.56, 0.5), vec3(0.76, 0.72, 0.64), mix(0.5, v.z, aa)) * (0.85 + 0.22 * N3(xz * 0.8));
    col = mix(vec3(0.32, 0.3, 0.27), st, mortar);
    r = 0.78;
    k = mortar * 0.006;
  }
  if ((id >= 6 && id <= 8) || id == 14) col *= 1.0 + windSheen(p) * 0.08;
}

#ifdef TERRAIN_UNDER
vec3 rockCol(int r) {
  if (r == 1) return vec3(0.72, 0.68, 0.58);
  if (r == 2) return vec3(0.7, 0.44, 0.3);
  if (r == 3) return vec3(0.17, 0.16, 0.16);
  if (r == 4) return vec3(0.42, 0.37, 0.52);
  if (r == 5) return vec3(0.7, 0.8, 0.88);
  if (r == 6) return vec3(0.84, 0.82, 0.78);
  return vec3(0.5, 0.48, 0.46);
}
void underTile(vec3 p, vec3 n, float rf, float kf, out vec3 col, out float rough, out vec3 emis, out float bump) {
  int r = int(rf + 0.5), k = int(kf + 0.5);
  vec2 xz = p.xz;
  vec3 rc = rockCol(r);
  emis = vec3(0.0);
  rough = 0.9;
  bump = 0.0;
  float fine = FINE((N2(xz * 6.0) - 0.5) * 0.16 * aaF(xz * 6.0));
  if (k == 0) {
    float b = N1(xz * 0.035) * 3.0 + N2(xz * 0.1) * 0.8, band = fract(b * 1.7);
    col = rc * (0.8 + 0.2 * smoothstep(0.0, 0.18, band)) * (0.86 + 0.24 * N3(xz * 0.55)) * (1.0 + fine);
    float hatch = smoothstep(0.88, 0.95, fract((xz.x + xz.y) * 1.8)) * aaF(xz * 1.8);
    col *= 1.0 - hatch * 0.16;
    float vein = (1.0 - smoothstep(0.0, 0.004 + fwidth(N1(xz * 0.028 + 3.7)), abs(N1(xz * 0.028 + 3.7) - 0.5))) * smoothstep(0.5, 0.7, N2(xz * 0.02 + 1.3));
    vec3 vc = r == 3 ? vec3(1.0, 0.35, 0.06) : r == 4 ? vec3(0.62, 0.32, 1.0) : r == 5 ? vec3(0.5, 0.85, 1.0) : vec3(0.9, 0.82, 0.62);
    col = mix(col, vc * 0.6, vein * 0.5);
    emis += (r == 3 || r == 4) ? vc * vein * 0.18 : vec3(0.0);
    col *= 0.3;
    bump = band * 0.004 - hatch * 0.002;
  } else if (k == 1 || k == 8) {
    col = mix(rc * 0.55, vec3(0.3, 0.28, 0.26), 0.5) * (0.88 + 0.2 * N3(xz * 1.3) + fine * 0.5);
    float pud = smoothstep(0.68, 0.72, N2(xz * 0.16) + N3(xz * 0.7) * 0.06);
    col = mix(col, vec3(0.05, 0.07, 0.08), pud * 0.8);
    rough = mix(0.9, 0.12, pud);
    float gr = smoothstep(0.7, 0.8, N3(xz * 3.0));
    col = mix(col, rc * 0.9, gr * 0.4);
    bump = N3(xz * 1.3) * 0.012 + gr * 0.006;
  } else if (k == 2) {
    col = vec3(0.36, 0.27, 0.19) * (0.82 + 0.3 * N3(xz * 1.6) + fine);
    float ore = smoothstep(0.82, 0.88, N2(xz * 1.4));
    col = mix(col, vec3(0.75, 0.72, 0.8), ore * 0.6);
    emis += vec3(0.6, 0.65, 0.9) * ore * 0.12;
    bump = N3(xz * 1.6) * 0.008;
  } else if (k == 3) {
    vec3 v = voro(xz * 2.4);
    col = mix(vec3(0.2, 0.16, 0.28), vec3(0.34, 0.26, 0.46), v.z) * (0.8 + 0.3 * N3(xz * 1.2));
    float sh = (1.0 - smoothstep(0.02, 0.08, v.y));
    col = mix(col, vec3(0.62, 0.42, 0.95), sh * 0.6);
    emis += vec3(0.55, 0.28, 1.0) * (sh * 0.9 + smoothstep(0.85, 0.95, v.z) * 0.8) * (0.75 + 0.25 * sin(uTime * 2.0 + v.z * 9.0));
    rough = 0.3;
    bump = sh * 0.01;
  } else if (k == 4) {
    col = vec3(0.1, 0.09, 0.09) * (0.7 + 0.6 * N2(xz * 0.4));
    float cr = 1.0 - smoothstep(0.0, 0.03, abs(N1(xz * 0.22) - 0.5));
    float pool = smoothstep(0.58, 0.64, N2(xz * 0.35));
    float pulse = 0.7 + 0.3 * sin(uTime * 1.4 + N3(xz * 0.3) * 8.0);
    col = mix(col, vec3(0.35, 0.08, 0.02), max(cr, pool));
    emis += vec3(1.0, 0.32, 0.05) * (cr * 1.8 + pool * 3.0) * pulse;
    rough = 0.7;
    bump = -cr * 0.02 - pool * 0.01;
  } else if (k == 5) {
    col = mix(vec3(0.62, 0.8, 0.92), vec3(0.85, 0.93, 1.0), N1(xz * 0.4)) * (0.9 + fine);
    float cr = 1.0 - smoothstep(0.0, 0.03, abs(N2(xz * 0.5) - 0.5));
    col = mix(col, vec3(0.25, 0.5, 0.75), cr * 0.7);
    emis += vec3(0.25, 0.6, 1.0) * (0.12 + cr * 0.3);
    rough = 0.2;
    bump = -cr * 0.012;
  } else if (k == 6) {
    col = mix(vec3(0.12, 0.28, 0.26), vec3(0.3, 0.2, 0.36), smoothstep(0.4, 0.65, N1(xz * 0.5))) * (0.85 + 0.25 * N3(xz * 1.4) + fine);
    float sp = smoothstep(0.78, 0.86, N3(xz * 2.2));
    emis += vec3(0.2, 1.0, 0.8) * sp * (0.8 + 0.4 * sin(uTime * 2.4 + xz.x * 3.0));
    bump = N3(xz * 1.4) * 0.01;
  } else if (k == 7) {
    vec3 v = voro(xz * 5.0);
    float aa = aaF(xz * 5.0);
    float mortar = mix(0.82, smoothstep(0.02, 0.09, v.y), aa);
    vec3 st = mix(vec3(0.42, 0.4, 0.37), vec3(0.56, 0.53, 0.48), mix(0.5, v.z, aa)) * (0.85 + 0.2 * N3(xz * 0.9));
    col = mix(vec3(0.18, 0.17, 0.16), st, mortar);
    rough = 0.75;
    bump = mortar * 0.006;
    vec4 hx = hexAt(xz);
    float inlay = (1.0 - smoothstep(0.0, 0.02, abs(hx.z - 0.12))) * aa;
    col = mix(col, vec3(0.85, 0.65, 0.3), inlay * 0.7);
    emis += vec3(1.0, 0.7, 0.3) * inlay * 0.25;
  } else if (k == 9) {
    col = mix(vec3(0.3, 0.24, 0.18), vec3(0.42, 0.34, 0.25), N3(xz * 1.8)) * (0.9 + fine);
    bump = N3(xz * 1.8) * 0.008;
  } else {
    col = vec3(0.22, 0.17, 0.12) * (0.8 + 0.4 * N3(xz * 1.2) + fine);
    float rv = 1.0 - smoothstep(0.0, 0.03, abs(N2(xz * 0.6) - 0.5));
    col = mix(col, vec3(0.35, 0.25, 0.14), rv);
    emis += vec3(1.0, 0.75, 0.3) * rv * 0.6 * (0.7 + 0.3 * sin(uTime * 1.5 + xz.y));
    bump = rv * 0.012;
  }
}
#endif

void terrainShade(out vec3 col, out float rough, out vec3 emis, out float bump) {
  vec3 p = vW;
  vec3 n = normalize(vWN);
#ifdef TERRAIN_UNDER
  underTile(p, n, vBiome.x, vBiome.y, col, rough, emis, bump);
  col = lin(col);
  hexOverlay(p, col, emis, 0.0);
  emis *= 1.3;
#else
  float bA = vBiome.x, bB = vBiome.y, bl = vBlendAo.x;
  vec3 cA;
  float rA, kA;
  vec3 eA;
  biomeShade(bA, p, n, cA, rA, eA, kA);
#if !defined(TERRAIN_SKY) && !defined(DETAIL_REDUCED)
  if (bl > 0.1 && abs(bA - bB) > 0.5) {
    vec3 cB;
    float rB, kB;
    vec3 eB;
    biomeShade(bB, p, n, cB, rB, eB, kB);
    float nn = (N2(p.xz * 0.25) - 0.5) * 0.3 + (N3(p.xz * 0.9) - 0.5) * 0.12;
    float th = bA > bB ? 1.0 - bl : bl, wh = smoothstep(0.3, 0.7, th + nn);
    vec3 cH = bA > bB ? cA : cB, cL = bA > bB ? cB : cA;
    float rH = bA > bB ? rA : rB, rL = bA > bB ? rB : rA, kH = bA > bB ? kA : kB, kL = bA > bB ? kB : kA;
    vec3 eH = bA > bB ? eA : eB, eL = bA > bB ? eB : eA;
    cA = mix(cL, cH, wh);
    rA = mix(rL, rH, wh);
    kA = mix(kL, kH, wh);
    eA = mix(eL, eH, wh);
  }
#endif
  col = cA;
  rough = rA;
  emis = eA;
  bump = kA;
#ifdef TERRAIN_SKY
  bool sky = true;
#else
  bool sky = p.y > 3.6;
#endif
  if (p.y > 0.03) {
    float hi = smoothstep(1.0, 2.2, p.y) * (sky ? 0.0 : 1.0);
    col = mix(col, col * vec3(1.06, 1.0, 0.86) + vec3(0.03, 0.02, 0.0), hi * 0.5);
    float steep = smoothstep(0.42, 0.62, 1.0 - n.y);
    col = mix(col, rockC(p), steep);
    bump = mix(bump, N3(p.xz * 0.6) * 0.015, steep);
    if (!sky) {
      float sl = snowLine(p.z);
      float sn = smoothstep(sl - 0.12, sl + 0.18, p.y + (N2(p.xz * 0.1) - 0.5) * 0.35) * smoothstep(0.5, 0.78, n.y);
      col = mix(col, vec3(0.93, 0.96, 1.0), sn);
      rough = mix(rough, 0.45, sn);
      emis += vec3(0.6, 0.7, 0.9) * smoothstep(0.92, 0.96, N3(p.xz * 2.7)) * sn * 0.15;
    }
    float wet = 1.0 - smoothstep(0.03, 0.09, p.y);
    col *= 1.0 - wet * 0.25;
  }
#ifndef DETAIL_REDUCED
  else {
    float c1 = NC(p.xz * 0.11 + uTime * vec2(0.013, 0.021)), c2 = NC(p.xz * 0.14 - uTime * vec2(0.017, 0.011));
    col += vec3(0.75, 0.95, 1.0) * pow(min(c1, c2) * 1.25, 3.0) * 0.45 * exp(p.y * 1.4) * max(uSunDir.y, 0.1);
  }
#endif
  col *= 1.0 - cloudShadow(p.xz) * 0.36;
  col = lin(col) * vBlendAo.y;
#ifdef TERRAIN_SKY
  skyOverlay(p, col, emis);
#else
  if (!sky) hexOverlay(p, col, emis, 0.0);
#endif
  emis *= 0.65 + uNight * 0.9;
#endif
}
