uniform float uTime;
uniform vec3 uColor;
uniform sampler2D uNoise;
varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float a = atan(c.y, c.x);
  float sp = sin(a * 3.0 + r * 9.0 - uTime * 3.0) * 0.5 + 0.5;
  float n = texture2D(uNoise, vec2(a * 0.3 + uTime * 0.05, r * 0.6 - uTime * 0.1)).g;
  float m = (1.0 - smoothstep(0.7, 1.0, r)) * (0.3 + 0.7 * sp * n) + (1.0 - smoothstep(0.0, 0.3, r)) * 0.8;
  gl_FragColor = vec4(uColor * m * 1.8, m);
}
