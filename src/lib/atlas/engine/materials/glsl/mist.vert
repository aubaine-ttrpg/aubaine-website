invariant gl_Position;
varying vec3 vW;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
