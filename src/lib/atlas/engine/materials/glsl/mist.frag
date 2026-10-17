uniform float uInMist;
varying vec3 vW;

#if defined(DETAIL_REDUCED)
#define MIST_STEPS 3
#elif defined(DETAIL_RICH)
#define MIST_STEPS 8
#else
#define MIST_STEPS 6
#endif

const mat2 TURN_A = mat2(0.8, -0.6, 0.6, 0.8);
const mat2 TURN_B = mat2(0.28, 0.96, -0.96, 0.28);

float closing(vec2 xz) {
  vec2 low = xz - uRevealRect.xy;
  vec2 high = uRevealRect.xy + uRevealRect.zw - xz;
  float inside = min(min(low.x, high.x), min(low.y, high.y));
  return 1.0 - smoothstep(0.0, MIST_SETTLE_, inside);
}

float fogAt(vec2 xz) {
  return max(unexplored(xz), closing(xz));
}

float hazeAt(vec2 xz) {
  return max(haze(xz), closing(xz));
}

float wisps(vec2 xz, vec2 drift) {
  float billows = N1(TURN_A * xz * 0.011 + drift * 0.6);
#ifdef DETAIL_REDUCED
  return billows;
#else
  float broad = N2(TURN_B * xz * 0.024 + (billows - 0.5) * 0.12 + drift);
  float fine = N3(xz * 0.05 - drift * 1.7);
  return billows * 0.46 + broad * 0.42 + fine * 0.12;
#endif
}

float column(float y, float dy, float span, float scale) {
  float start = exp(-max(y, 0.0) / scale);
  float k = dy / scale;
  if (abs(k * span) < 1e-3) return start * span;
  return start * (1.0 - exp(-k * span)) / k;
}

void main() {
  bool inside = uInMist > 0.5;
  if (gl_FrontFacing == inside) discard;
  vec3 start = inside ? cameraPosition : vW;
  vec3 toPoint = vW - cameraPosition;
  float cd = length(toPoint);
  vec3 dir = toPoint / max(cd, 1e-4);
  vec3 base = veil(dir);
  float melt = max(1.0 - exp(-uFogDensity * uFogDensity * cd * cd * 0.6), smoothstep(MIST_MELT_FROM_, MIST_MELT_TO_, cd));
  if (melt >= 0.999 && fogAt(vW.xz) >= 0.99) {
    gl_FragColor = vec4(base, 1.0);
    return;
  }
  float day = (1.0 - uNight) * uSunInt * (1.0 - uUnder);
  vec3 pale = mix(base, vec3(dot(base, vec3(0.3333))), 0.25);
  vec3 lit = mix(pale, vec3(1.0), 0.06 + 0.32 * day) * (0.92 + 0.12 * day) + uSunCol * uSunInt * 0.06 * day;
  vec3 shadow = mix(pale, vec3(1.0), 0.03 + 0.17 * day) * 0.97;
  vec3 deep = mix(pale, base, 0.5) * 0.98;
  float glow = pow(max(dot(dir, uSunDir), 0.0), 6.0) * day;
  vec2 drift = WIND * uTime * 0.012;
  float floorT = dir.y < -1e-3 ? start.y / -dir.y : MIST_PATH_;
  float span = min(floorT, MIST_PATH_);
  float stride = span / float(MIST_STEPS);
  float jitter = h12(gl_FragCoord.xy) - 0.5;
  float through = 1.0;
  vec3 gathered = vec3(0.0);
  for (int i = 0; i < MIST_STEPS; i++) {
    float from = float(i) * stride;
    vec3 mid = start + dir * (from + stride * (0.5 + jitter * 0.8));
    float thickness = hazeAt(mid.xz);
    if (thickness <= 0.0) continue;
    float onset = pow(thickness, MIST_ONSET_);
    float scale = mix(MIST_HAZE_LOW_, MIST_HAZE_HIGH_, thickness);
    float swirl = smoothstep(0.2, 0.85, wisps(mid.xz, drift));
    float grain = mix(mix(0.75, 1.1, swirl), mix(0.4, 1.25, swirl), smoothstep(0.0, 0.5, thickness));
    float depth = MIST_DENSITY_ * onset * grain * column(start.y + dir.y * from, dir.y, stride, scale);
    float taken = 1.0 - exp(-depth);
    float height = clamp(mid.y / (scale * 2.5), 0.0, 1.0);
    vec3 colour = mix(shadow, lit, height) + uSunCol * glow * 0.2;
    gathered += through * taken * colour;
    through *= 1.0 - taken;
    if (through < 0.02) break;
  }
  float closed = smoothstep(0.9, 0.99, fogAt((start + dir * span).xz));
  gathered += through * closed * deep;
  through *= 1.0 - closed;
  float alpha = 1.0 - through;
  if (alpha < 0.01) discard;
  vec3 col = gathered / alpha;
  gl_FragColor = vec4(mix(col, base, melt), alpha);
}
