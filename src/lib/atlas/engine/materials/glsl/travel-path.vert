attribute float aS;
varying float vS;
varying vec2 vUv;
void main() {
  vS = aS;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
