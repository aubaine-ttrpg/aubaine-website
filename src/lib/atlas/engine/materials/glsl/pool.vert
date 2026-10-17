attribute vec4 aPool;
attribute float aStrength;
varying vec2 vDisc;
varying vec3 vW;
varying float vStrength;
void main() {
  vDisc = position.xz;
  vec3 world = vec3(aPool.x + position.x * aPool.w, aPool.y, aPool.z + position.z * aPool.w);
  vW = world;
  vStrength = aStrength;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
