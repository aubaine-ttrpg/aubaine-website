attribute vec3 aColour;
attribute float aSize;
uniform float uPScale;
varying vec3 vColour;
void main() {
  vColour = aColour;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(aSize * uPScale / max(-mv.z, 0.1), 256.0);
}
