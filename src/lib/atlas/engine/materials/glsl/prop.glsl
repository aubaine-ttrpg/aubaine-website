varying float vKind;
varying vec3 vLocal;
varying vec3 vW;
varying vec3 vWN;
varying vec3 vIP;
varying vec3 vColour;

void propShade(inout vec3 col, out float rough, out float metal, out vec3 emis, out float bump) {
  int k = int(vKind + 0.5);
  vec3 lp = vLocal;
  vec3 p = vW;
  vec3 n = normalize(vWN);
  rough = 0.85;
  metal = 0.0;
  emis = vec3(0.0);
  bump = 0.0;
  float rnd = h12(vIP.xz * 13.7);
  if (k == 1) {
    float s = N2(vec2(atan(lp.z, lp.x) * 0.6, lp.y * 3.0));
    col *= 0.72 + 0.45 * s;
    bump = s * 0.003;
  } else if (k == 2 || k == 21) {
    float l = N3(p.xz * 2.3 + p.y * 1.9);
    col *= 0.7 + 0.5 * l;
    col *= 0.62 + 0.5 * (n.y * 0.5 + 0.5);
    if (k == 2) col *= 0.6 + 0.48 * smoothstep(0.3, 1.0, lp.y);
    col *= 0.85 + 0.3 * rnd;
    if (k == 2) {
      float sn = smoothstep(-0.55 * Z0_, -0.8 * Z0_, p.z) * smoothstep(0.2, 0.8, n.y);
      col = mix(col, vec3(0.82, 0.86, 0.92), sn * 0.85);
      float hs = smoothstep(snowLine(p.z) - 0.1, snowLine(p.z) + 0.25, p.y) * smoothstep(0.3, 0.9, n.y);
      col = mix(col, vec3(0.85, 0.88, 0.94), hs);
    }
    rough = 0.72;
    bump = l * 0.004;
    if (k == 21) {
      col = mix(col * vec3(0.5, 0.6, 0.78), col * 1.28, smoothstep(-0.5, 0.75, n.y));
      col = mix(col, col * vec3(1.18, 1.12, 0.72), smoothstep(0.6, 0.9, N1(p.xz * 0.3 + p.y * 0.2)) * 0.4);
      float rim = pow(1.0 - abs(dot(n, normalize(cameraPosition - p))), 3.0);
      emis += vec3(0.25, 0.55, 1.0) * rim * uNight * 0.5;
    }
  } else if (k == 3 || k == 20) {
    vec2 bp = vec2((lp.x + lp.z) * 30.0, lp.y * 46.0);
    bp.x += floor(bp.y) * 0.5;
    vec2 f = fract(bp);
    float aa = clamp(1.0 - length(fwidth(bp)) * 0.6, 0.0, 1.0);
    float mo = smoothstep(0.0, 0.08, f.x) * smoothstep(1.0, 0.92, f.x) * smoothstep(0.0, 0.14, f.y) * smoothstep(1.0, 0.86, f.y);
    col *= mix(0.88, 0.72 + 0.28 * mo, aa) * (0.92 + 0.16 * h12(floor(bp) + rnd));
    bump = mo * aa * 0.0015;
#ifdef PROP_CUTOUT
    if (k == 20 && lp.y > 0.38 && fract(lp.x * 9.0) > 0.5) discard;
#endif
  } else if (k == 4) {
    float rr = fract(lp.y * 70.0 + lp.z * 70.0);
    float aa = clamp(1.0 - fwidth(lp.y * 70.0) * 0.8, 0.0, 1.0);
    col *= mix(0.9, 0.75 + 0.3 * smoothstep(0.0, 0.25, rr), aa) * (0.85 + 0.3 * N3(p.xz * 3.0));
    rough = 0.7;
  } else if (k == 5) {
    float pl = fract((lp.x + lp.y * 0.1) * 60.0);
    col *= 0.75 + 0.3 * smoothstep(0.0, 0.15, pl) * smoothstep(1.0, 0.85, pl);
    col *= 0.85 + 0.25 * N3(lp.xz * 9.0);
    rough = 0.8;
  } else if (k == 6) {
    float v = abs(n.y);
    vec2 wq = vec2((lp.x + lp.z) * 40.0, lp.y * 34.0);
    vec2 wf = fract(wq);
    float aa = clamp(1.0 - length(fwidth(wq)) * 0.5, 0.0, 1.0);
    float win = step(v, 0.35) * step(0.3, wf.x) * step(wf.x, 0.72) * step(0.32, wf.y) * step(wf.y, 0.78) * step(0.008, lp.y) * aa;
    float lit = step(0.42, h12(floor(wq) + vIP.xz * 7.0));
    col = mix(col * (0.9 + 0.12 * N3(lp.xy * 8.0)), vec3(0.06, 0.07, 0.1), win * 0.85);
    emis += vec3(1.0, 0.62, 0.25) * win * lit * uNight * 2.4;
    rough = 0.82;
  } else if (k == 7) {
    metal = 0.75;
    rough = 0.38;
    col *= 0.9 + 0.2 * N3(lp.xz * 6.0);
  } else if (k == 8) {
    float pul = 0.65 + 0.35 * sin(uTime * 2.2 + vIP.x * 1.7 + lp.y * 4.0);
    float fr = pow(1.0 - abs(dot(n, normalize(cameraPosition - p))), 2.0);
    emis += col * (1.4 * pul + fr * 2.0) * (0.7 + uNight * 0.9);
    rough = 0.12;
    metal = 0.1;
  } else if (k == 9) {
    col *= 0.85 + 0.2 * step(0.5, fract(lp.y * 18.0)) * 0.4;
    rough = 0.9;
  } else if (k == 10) {
    float pul = 0.7 + 0.3 * sin(uTime * 3.0 + p.x * 4.0);
    emis += col * 3.0 * pul;
  } else if (k == 11 || k == 24 || k == 26) {
    float s = N2(vec2(lp.x + lp.z, lp.y) * 2.2 + rnd);
    col *= 0.74 + 0.36 * s + (N3(lp.xz * 9.0 + lp.y * 7.0) - 0.5) * 0.2;
    col = mix(col, vec3(0.2, 0.26, 0.1), smoothstep(0.62, 0.78, N1(lp.xz * 3.0 + rnd)) * smoothstep(0.2, 0.9, n.y) * 0.45);
    bump = s * 0.006;
    float sl = snowLine(p.z);
    float sn = smoothstep(sl - 0.1, sl + 0.2, p.y + (N3(p.xz * 0.6) - 0.5) * 0.3) * smoothstep(0.35, 0.8, n.y);
    if (k != 24) col = mix(col, vec3(0.9, 0.93, 0.98), sn * smoothstep(0.55, 0.78, n.y));
    if (k == 24) {
      float lv = 1.0 - smoothstep(0.0, 0.05, abs(N1(vec2(atan(lp.z, lp.x) * 0.5, lp.y * 0.12)) - 0.5));
      float pul = 0.6 + 0.4 * sin(uTime * 1.6 + lp.y * 3.0);
      emis += vec3(1.0, 0.3, 0.04) * lv * 3.0 * pul * smoothstep(1.0, 0.55, lp.y);
      col = mix(col, vec3(0.2, 0.05, 0.02), lv);
    }
    if (k == 26) {
      float rn = step(0.86, N3(vec2(lp.x * 20.0 + lp.z * 20.0, lp.y * 12.0)));
      emis += vec3(0.4, 0.75, 1.0) * rn * (0.8 + uNight * 2.0) * (0.6 + 0.4 * sin(uTime * 2.0 + rnd * 6.0));
    }
    rough = 0.9;
  } else if (k == 12) {
    rough = 0.12;
    col *= 0.85 + 0.3 * N3(lp.xy * 9.0);
    emis += vec3(0.08, 0.18, 0.28) * (0.3 + uNight);
  } else if (k == 13) {
    float sp = smoothstep(0.66, 0.74, N3(lp.xz * 14.0 + rnd));
    col = mix(col, vec3(0.9, 0.95, 0.8), sp * 0.6);
    emis += vec3(0.2, 1.0, 0.75) * (sp * 1.6 + 0.22) * (0.35 + uNight * 2.0);
    rough = 0.5;
  } else if (k == 14) {
    emis += vec3(1.0, 0.72, 0.35) * (0.15 + uNight * 3.2);
  } else if (k == 15) {
    metal = 0.95;
    rough = 0.28;
  } else if (k == 18) {
    float cr = 1.0 - smoothstep(0.0, 0.05, abs(N2(lp.xz * 4.0 + lp.y) - 0.5));
    col *= 0.85 + 0.2 * N3(lp.xy * 6.0) - cr * 0.3;
    rough = 0.6;
  } else if (k == 22) {
#ifdef PROP_CUTOUT
    if (N2(lp.xy * 3.0 + 0.3) > 0.64 || N3(lp.xy * 7.0) > 0.78) discard;
#endif
    rough = 0.9;
  } else if (k == 23) {
    float a = atan(lp.z, lp.x) * 9.0;
    float fa = fract(a);
    float lv = fract(lp.y * 12.0);
    float arch = step(0.25, fa) * step(fa, 0.75) * step(lv, 0.72) * step(0.0, length(vec2((fa - 0.5) * 2.0, (lv - 0.52) * 2.6)) < 1.0 || lv < 0.52 ? 1.0 : 0.0);
    col = mix(col, vec3(0.08, 0.07, 0.06), arch * 0.85);
  } else if (k == 25) {
    col = mix(vec3(0.85, 0.12, 0.1), vec3(0.95, 0.94, 0.9), step(0.5, fract(lp.y * 9.0)));
    col = lin(col);
  }
  if (k != 8 && k != 10 && k != 14) col *= 1.0 - cloudShadow(p.xz) * 0.35;
}
