varying vec3 vColour;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r >= 1.0) discard;
  float a = r < 0.25 ? 1.0 - 0.55 * (r / 0.25) : 0.45 * (1.0 - (r - 0.25) / 0.75);
  gl_FragColor = vec4(vColour, a);
}
