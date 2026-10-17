uniform float uTime;
varying vec2 vUv;
varying vec2 vDecal;
varying vec3 vW;
void main() {
  vec2 c = vUv * 2.0 - 1.0;
  if (vDecal.x < 0.5) {
    float a = (1.0 - smoothstep(0.3, 1.0, length(c))) * vDecal.y;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  float behind = 1.0 - vUv.x;
  float arms = 1.0 - smoothstep(0.0, 0.14, abs(abs(c.y) - behind * 0.9));
  float trail = (1.0 - smoothstep(0.0, 0.22 + behind * 0.35, abs(c.y))) * 0.55;
  float churn = 0.65 + 0.35 * sin(vW.x * 23.0 + vW.z * 19.0 - uTime * 5.0);
  float a = max(arms, trail) * vUv.x * vUv.x * churn * vDecal.y;
  gl_FragColor = vec4(0.92, 0.96, 1.0, a);
}
