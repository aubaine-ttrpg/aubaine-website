uniform sampler2D uNoise;
uniform float uTime;
uniform vec3 uColor;
uniform float uInt;
uniform float uNightMul;
uniform float uNight;
uniform float uScroll;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;

void main() {
  vec3 V = normalize(cameraPosition - vW);
  float f = pow(abs(dot(normalize(vN), V)), 1.6);
  float n = texture2D(uNoise, vec2(vUv.x * 2.0, vUv.y * 2.0 - uTime * uScroll)).g;
  float g = smoothstep(0.0, 0.08, vUv.y) * pow(1.0 - vUv.y, 1.6);
  float a = f * g * (0.55 + 0.6 * n) * uInt * mix(1.0, 0.25 + uNight * 1.4, uNightMul);
  gl_FragColor = vec4(uColor * a, a);
}
