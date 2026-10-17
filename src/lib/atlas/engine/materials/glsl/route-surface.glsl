varying vec2 vRUv;
varying vec3 vRW;

void routeShade(inout vec4 diffuseColor) {
#if defined(ROUTE_ROAD)
  vec3 v = voro(vec2(vRUv.x * 16.0, vRUv.y * 3.0));
  float aa = clamp(1.0 - length(fwidth(vRUv * vec2(16.0, 3.0))) * 0.7, 0.0, 1.0);
  float mo = mix(0.85, smoothstep(0.03, 0.12, v.y), aa);
  vec3 st = mix(vec3(0.62, 0.58, 0.5), vec3(0.76, 0.72, 0.62), mix(0.5, v.z, aa));
  float curb = smoothstep(0.16, 0.06, vRUv.y) + smoothstep(0.84, 0.94, vRUv.y);
  vec3 c = mix(vec3(0.3, 0.28, 0.25), st, mo);
  c = mix(c, vec3(0.52, 0.5, 0.46), curb * 0.8);
  c *= 0.9 + 0.2 * N3(vRW.xz * 0.6);
  c *= 1.0 - cloudShadow(vRW.xz) * 0.35;
  diffuseColor.rgb = lin(c);
#elif defined(ROUTE_TRAIL)
  float e = abs(vRUv.y - 0.5) * 2.0;
  float wn = N2(vec2(vRUv.x * 0.9, vRUv.y * 0.5));
  if (e > 0.62 + wn * 0.38) discard;
  vec3 c = mix(vec3(0.42, 0.32, 0.2), vec3(0.56, 0.45, 0.3), N3(vRW.xz * 1.4));
  vec3 v = voro(vec2(vRUv.x * 9.0, vRUv.y * 2.0));
  float stone = (1.0 - smoothstep(0.18, 0.26, v.x)) * step(0.62, v.z);
  c = mix(c, vec3(0.68, 0.66, 0.6), stone);
  c *= 0.85 + 0.25 * (1.0 - e);
  c *= 1.0 - cloudShadow(vRW.xz) * 0.35;
  diffuseColor.rgb = lin(c);
#else
  vec3 c = mix(vec3(0.36, 0.33, 0.3), vec3(0.52, 0.48, 0.42), N3(vRW.xz * 3.0)) * (0.85 + 0.25 * N2(vRW.xz * 6.0));
  float e = abs(vRUv.y - 0.5) * 2.0;
  c *= 1.0 - smoothstep(0.7, 1.0, e) * 0.35;
  c *= 1.0 - cloudShadow(vRW.xz) * 0.35;
  diffuseColor.rgb = lin(c);
#endif
}
