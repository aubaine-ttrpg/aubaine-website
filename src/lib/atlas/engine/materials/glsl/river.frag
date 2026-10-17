uniform vec3 uSkyHor;
uniform vec3 uSkyTop;
varying vec2 vUv;
varying vec3 vW;

void main() {
  float e = abs(vUv.y - 0.5) * 2.0;
  float f = N2(vec2(vUv.x * 1.6 - uTime * 0.5, vUv.y * 0.8)) * 0.6 + N3(vec2(vUv.x * 4.0 - uTime * 0.9, vUv.y * 2.0)) * 0.4;
  vec3 c = mix(vec3(0.12, 0.42, 0.5), vec3(0.2, 0.6, 0.62), f);
  float foam = smoothstep(0.62, 0.95, e + (f - 0.5) * 0.4);
  c = mix(c, vec3(0.85, 0.93, 0.95), foam * 0.6);
  float sp = pow(smoothstep(0.6, 0.95, f), 6.0) * 0.6;
  c = c * (0.35 + 0.65 * uSunInt) + uSunCol * sp * uSunInt;
  c = lin(c);
  c = atlasFog(c, vW);
  gl_FragColor = vec4(c, (1.0 - smoothstep(0.82, 1.0, e)) * 0.9);
}
