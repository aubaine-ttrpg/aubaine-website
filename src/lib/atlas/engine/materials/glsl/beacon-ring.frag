uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float r = length(vUv - 0.5) * 2.0;
  float w = fract(uTime * 0.6);
  float ring = (1.0 - smoothstep(0.0, 0.06, abs(r - w))) * (1.0 - w);
  float core = (1.0 - smoothstep(0.0, 0.25, r)) * 0.5;
  float a = ring + core + (1.0 - smoothstep(0.88, 0.95, r)) * smoothstep(0.84, 0.88, r) * 0.6;
  gl_FragColor = vec4(uColor * a * 2.0, a);
}
