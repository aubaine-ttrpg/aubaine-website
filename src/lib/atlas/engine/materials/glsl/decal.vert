attribute vec2 aDecal;
varying vec2 vUv;
varying vec2 vDecal;
varying vec3 vW;
void main() {
  vUv = position.xz + 0.5;
  vDecal = aDecal;
#ifdef USE_INSTANCING
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
#else
  vec4 world = modelMatrix * vec4(position, 1.0);
#endif
  vW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
