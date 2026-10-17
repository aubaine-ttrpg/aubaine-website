uniform float uInMist;

void main() {
  if (gl_FrontFacing == (uInMist > 0.5)) discard;
  gl_FragColor = vec4(0.0);
}
