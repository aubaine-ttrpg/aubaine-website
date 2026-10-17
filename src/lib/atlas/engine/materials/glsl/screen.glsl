uniform float uTime;
uniform float uScreen;
uniform float uScan;
uniform float uVig;
uniform vec2 uRes;

float grain(vec2 pixel) { return fract(sin(dot(pixel + fract(uTime) * 91.0, vec2(12.9898, 78.233))) * 43758.5453); }

vec2 aberration(vec2 uv) {
  vec2 c = uv - 0.5;
  return c * dot(c, c) * uScreen * 0.006;
}

vec3 screenEffect(vec3 c, vec2 uv) {
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float pitch = max(2.0, floor(uRes.y / 360.0 + 0.5));
  float line = 0.5 + 0.5 * cos(6.2831853 * fract(gl_FragCoord.y / pitch));
  c *= 1.0 - uScreen * uScan * (1.0 - line) * (1.0 - 0.55 * clamp(luma, 0.0, 1.0));
  vec2 cc = uv - 0.5;
  float v = smoothstep(0.95, 0.25, length(cc * vec2(uRes.x / uRes.y, 1.0) * 0.82));
  c *= mix(1.0 - uVig * (1.0 + 0.4 * uScreen), 1.0, v);
  c += (grain(gl_FragCoord.xy) - 0.5) * (0.004 + 0.01 * uScreen);
  return c;
}
