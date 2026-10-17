varying float vDark;
varying float vShade;
varying vec3 vWp;

void main() {
  vec3 c = mix(vec3(0.92, 0.92, 0.9), vec3(0.08, 0.07, 0.08), vDark) * vShade * (0.3 + 0.7 * uSunInt);
  gl_FragColor = vec4(mix(c * c, veil(normalize(vWp - cameraPosition)), unexplored(vWp.xz)), 1.0);
}
