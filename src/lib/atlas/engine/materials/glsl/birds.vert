uniform float uTime;
attribute vec4 aFly;
attribute vec4 aFly2;
attribute float aDark;
varying float vDark;
varying float vShade;
varying vec3 vWp;

void main() {
  float a = uTime * aFly.w + aFly2.y;
  vec3 c = vec3(aFly.x + cos(a) * aFly.z, aFly2.x + sin(a * 2.3 + aFly2.y) * 0.15, aFly.y + sin(a) * aFly.z);
  vec3 dir = normalize(vec3(-sin(a), 0.0, cos(a)) * sign(aFly.w));
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), dir));
  vec3 p = position * aFly2.z;
  float flap = sin(uTime * aFly2.w + aFly2.y * 7.0);
  p.y += abs(position.x) * flap * 0.9;
  vec3 wp = c + side * p.x + vec3(0.0, 1.0, 0.0) * p.y + dir * p.z;
  vDark = aDark;
  vShade = 0.75 + flap * 0.25;
  vWp = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
