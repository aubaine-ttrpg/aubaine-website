uniform sampler2D uNoise;
uniform float uTime;
uniform vec3 uSkyHor;
uniform vec3 uSkyLow;
uniform float uFogDensity;
uniform float uCloudOp;
varying vec2 vUv;
varying float vSeed;
varying float vA;
varying vec3 vWp;
varying float vS;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c * vec2(1.0, 1.25)) * 2.0;
  float base = 1.0 - smoothstep(0.25, 1.0, d);
  float n = texture2D(uNoise, vUv * 0.55 + vSeed * 3.1 + uTime * 0.002).r * 0.6 + texture2D(uNoise, vUv * 1.3 + vSeed).g * 0.4;
  float a = smoothstep(0.28, 0.75, base * (0.55 + 0.75 * n));
  if (a < 0.01) discard;
  float lit = clamp(0.35 + vUv.y * 0.75 + (n - 0.5) * 0.6, 0.0, 1.0);
  vec3 col = mix(uSkyLow * 0.9 + vec3(0.03), mix(uSkyHor, uSunCol + vec3(0.3), 0.5) * (0.35 + 0.65 * uSunInt), lit);
  float cd = length(cameraPosition - vWp);
  a *= smoothstep(vS * 0.35, vS * 1.4, cd) * vA * uCloudOp * (vWp.y > 0.0 ? 1.0 - smoothstep(90.0, 170.0, cd) * 0.85 : 1.0);
  a *= 1.0 - unexplored(vWp.xz);
  col = mix(col, veil((vWp - cameraPosition) / max(cd, 1e-4)), 1.0 - exp(-uFogDensity * uFogDensity * cd * cd * 0.6));
  gl_FragColor = vec4(col, a);
}
