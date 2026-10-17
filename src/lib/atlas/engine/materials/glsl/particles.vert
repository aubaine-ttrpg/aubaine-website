attribute vec3 aOrigin;
attribute vec4 aSeed;
uniform float uTime;
uniform float uLife;
uniform vec3 uVel;
uniform vec3 uSpread;
uniform float uGrav;
uniform vec2 uSize;
uniform float uTurb;
uniform float uPScale;
varying float vAge;
varying float vSeed;

void main() {
  float t = uTime / uLife + aSeed.x;
  float age = fract(t);
  float cyc = floor(t);
  vec3 rs = vec3(fract(aSeed.y + cyc * 0.618), fract(aSeed.z + cyc * 0.319), fract(aSeed.w + cyc * 0.773)) - 0.5;
  float T = age * uLife;
  vec3 p = aOrigin + rs * uSpread;
  p += uVel * T * (0.6 + 0.8 * fract(aSeed.y * 7.0)) + vec3(0.0, -0.5 * uGrav * T * T, 0.0);
  p.x += sin(T * 1.3 + aSeed.y * 20.0) * uTurb * (0.3 + age);
  p.z += cos(T * 1.1 + aSeed.z * 20.0) * uTurb * (0.3 + age);
  vAge = age;
  vSeed = aSeed.w;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(mix(uSize.x, uSize.y, age) * uPScale / max(-mv.z, 0.1), 220.0);
}
