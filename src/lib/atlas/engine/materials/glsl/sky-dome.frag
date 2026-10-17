uniform vec3 uSkyTop;
uniform vec3 uSkyHor;
uniform vec3 uGround;
uniform vec3 uAmbient;
uniform vec3 uStarDir[3];
uniform vec4 uStarDisc[3];
uniform vec3 uStarGlow[3];
uniform float uTime;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uSkyHor, uSkyTop, pow(clamp(y, 0.0, 1.0), 0.45));
  for (int k = 0; k < 3; k++) {
    float c = max(dot(d, uStarDir[k]), 0.0);
    col += uStarGlow[k] * (pow(c, 64.0) * 0.5 + pow(c, 6.0) * 0.14);
#ifndef SKY_ENVIRONMENT
    float edge = uStarDisc[k].w;
    col += uStarDisc[k].rgb * smoothstep(edge - (1.0 - edge) * 0.6, edge, c);
#endif
  }
#ifdef SKY_ENVIRONMENT
  vec3 above = mix(col, uAmbient, 0.35);
  gl_FragColor = vec4(mix(uGround, above, smoothstep(-0.08, 0.04, y)), 1.0);
#else
  if (uNight > 0.01 && y > 0.0) {
    vec3 sp = d * 260.0;
    vec3 cell = floor(sp);
    float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    vec3 f = fract(sp) - 0.5;
    float st = step(0.9965, h) * smoothstep(0.3, 0.0, length(f));
    col += vec3(0.9, 0.92, 1.0) * st * uNight * 3.0 * (0.6 + 0.4 * sin(uTime * 2.0 + h * 50.0));
    float band = exp(-pow(dot(d, normalize(vec3(0.3, 0.5, -0.8))) * 4.0, 2.0));
    col += vec3(0.25, 0.2, 0.4) * band * uNight * 0.08;
  }
  gl_FragColor = vec4(mix(col, veil(d), smoothstep(0.14, 0.0, y)), 1.0);
#endif
}
