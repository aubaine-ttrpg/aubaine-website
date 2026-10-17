uniform sampler2D tSrc;
uniform vec2 uTex;
uniform float uTh;
varying vec2 vUv;
void main() {
  vec3 c = T4(tSrc, vUv, uTex) * 0.25;
  float l = max(max(c.r, c.g), c.b);
  float k = smoothstep(uTh, uTh + 0.8, l);
  gl_FragColor = vec4(c * k, 1.0);
}
