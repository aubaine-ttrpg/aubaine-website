varying vec3 vW;

void main() {
  vec2 p = vW.xz;
  float n = N2(p * 0.6 + uTime * vec2(0.01, 0.006)) * 0.6 + N3(p * 1.7 - uTime * vec2(0.012, 0.004)) * 0.4;
  vec3 c = mix(vec3(0.002, 0.008, 0.012), vec3(0.006, 0.024, 0.032), n);
  float gl = smoothstep(0.82, 0.96, N3(p * 2.4 + uTime * 0.02));
  c += vec3(0.2, 0.8, 1.0) * gl * 0.18;
  float fl = smoothstep(0.9, 0.98, N1(p * 0.9 - uTime * 0.01));
  c += vec3(1.0, 0.7, 0.35) * fl * 0.3;
  gl_FragColor = vec4(c, 0.92);
}
