uniform vec3 uFogColor;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uSunInt;
uniform float uNight;
uniform float uUnder;
uniform sampler2D uReveal;
uniform vec4 uRevealRect;

vec3 veil(vec3 dir) {
  float toSun = pow(max(dot(dir, uSunDir), 0.0), 8.0) * (1.0 - uNight) * uSunInt * (1.0 - uUnder);
  return mix(uFogColor, uSunCol, toSun * 0.5);
}

float unexplored(vec2 xz) {
  return smoothstep(0.0, 1.0, texture2D(uReveal, (xz - uRevealRect.xy) / uRevealRect.zw).r);
}

float haze(vec2 xz) {
  return texture2D(uReveal, (xz - uRevealRect.xy) / uRevealRect.zw).g;
}
