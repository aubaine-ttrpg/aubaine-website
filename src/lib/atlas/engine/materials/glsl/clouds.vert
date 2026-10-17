uniform float uTime;
attribute vec4 aCloud;
varying vec2 vUv;
varying float vSeed;
varying float vA;
varying vec3 vWp;
varying float vS;

void main() {
  vec3 c = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float sx = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
  c.xz += WIND * uTime * aCloud.z;
  c.xz = mod(c.xz + 260.0, 520.0) - 260.0;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 wp = c + (right * position.x + up * position.y * 0.62) * sx;
  vWp = wp;
  vUv = uv;
  vSeed = aCloud.x;
  vA = aCloud.y;
  vS = sx;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
