varying vec2 vUv;
varying vec3 vW;

void main() {
  float s = texture2D(uNoise, vec2(vUv.x * 2.0, vUv.y * 0.9 - uTime * 0.55)).g;
  float s2 = texture2D(uNoise, vec2(vUv.x * 5.0 + 0.3, vUv.y * 1.8 - uTime * 1.1)).b;
  float st = smoothstep(0.35, 0.8, s * 0.6 + s2 * 0.5);
  float edge = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
  float a = edge * (0.42 + 0.58 * st);
#ifdef FALL_FADES
  a *= smoothstep(1.0, 0.25, vUv.y);
#endif
  vec3 col = mix(vec3(0.5, 0.72, 0.82), vec3(1.0), st) * (0.4 + 0.7 * uSunInt);
  col = atlasFog(col * col, vW);
  gl_FragColor = vec4(col, a * 0.88);
}
