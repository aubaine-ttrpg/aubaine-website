uniform sampler2D tSrc;
uniform vec2 uTex;
varying vec2 vUv;
void main() {
  vec3 c = S(texture2D(tSrc, vUv).rgb) * 0.5 + T4(tSrc, vUv, uTex) * 0.125;
  gl_FragColor = vec4(c, 1.0);
}
