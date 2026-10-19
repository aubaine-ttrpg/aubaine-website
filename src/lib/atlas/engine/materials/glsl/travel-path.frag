uniform float uTime;
uniform vec3 uColor;
varying float vS;
varying vec2 vUv;

void main() {
  float dash = smoothstep(0.35, 0.5, fract(vS * 2.2 - uTime * 1.4)) * smoothstep(1.0, 0.85, fract(vS * 2.2 - uTime * 1.4));
  float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
  float a = (0.25 + 0.75 * dash) * smoothstep(0.0, 0.5, edge);
#ifdef TRAVEL_INK
  gl_FragColor = vec4(uColor, a);
#else
  gl_FragColor = vec4(uColor * a * 2.4, a);
#endif
}
