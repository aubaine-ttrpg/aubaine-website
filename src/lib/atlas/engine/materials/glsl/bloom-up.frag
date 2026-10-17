uniform sampler2D tSrc;
uniform vec2 uTex;
uniform float uR;
varying vec2 vUv;
void main() {
  vec3 c = S(texture2D(tSrc, vUv).rgb) * 4.0;
  c += (S(texture2D(tSrc, vUv + vec2(uTex.x, 0.0)).rgb) + S(texture2D(tSrc, vUv - vec2(uTex.x, 0.0)).rgb) + S(texture2D(tSrc, vUv + vec2(0.0, uTex.y)).rgb) + S(texture2D(tSrc, vUv - vec2(0.0, uTex.y)).rgb)) * 2.0;
  c += S(texture2D(tSrc, vUv + uTex).rgb) + S(texture2D(tSrc, vUv - uTex).rgb) + S(texture2D(tSrc, vUv + vec2(uTex.x, -uTex.y)).rgb) + S(texture2D(tSrc, vUv + vec2(-uTex.x, uTex.y)).rgb);
  gl_FragColor = vec4(c / 16.0 * uR, 1.0);
}
