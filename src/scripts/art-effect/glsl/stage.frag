uniform sampler2D uArt;
uniform vec2 uBacking;
uniform vec4 uCover;
uniform float uBlur;
uniform vec2 uFilter;
uniform float uSeconds;
uniform vec2 uFocus;

out vec4 outColor;

const int MOTE_LAYERS = 3;

float fbm(vec2 p, uint seed) {
  float sum = 0.0;
  float weight = 0.5;
  for (int octave = 0; octave < 3; octave++) {
    sum += weight * valueNoise3(p, seed + uint(octave) * 101u).r;
    p = p * 2.03 + vec2(17.3, 9.1);
    weight *= 0.5;
  }
  return sum / 0.875;
}

vec3 cssFilter(vec3 encoded) {
  vec3 grey = vec3(dot(encoded, vec3(0.213, 0.715, 0.072)));
  return clamp(mix(grey, encoded, uFilter.x) * uFilter.y, 0.0, 1.0);
}

vec3 smoke(vec2 uv, float aspect) {
  vec2 p = uv * vec2(aspect, 1.0) * 1.7;
  vec2 drift = vec2(
    fbm(p + vec2(0.0, uSeconds * 0.032), 3u),
    fbm(p + vec2(5.2, 1.3) - vec2(uSeconds * 0.026, 0.0), 7u)
  ) - 0.5;
  vec2 swirl = vec2(
    fbm(p * 1.9 + drift * 2.2 + vec2(uSeconds * 0.018, 0.0), 11u),
    fbm(p * 1.9 + drift * 2.2 + vec2(0.0, -uSeconds * 0.021), 13u)
  ) - 0.5;
  vec2 art = uCover.zw + (uv + drift * 0.07 + swirl * 0.05) * uCover.xy;
  vec3 colour = textureLod(uArt, art, uBlur).rgb;
  return cssFilter(encodeSrgb(colour));
}

vec3 motes(vec2 uv, float aspect, vec3 tint) {
  vec3 light = vec3(0.0);
  for (int layer = 0; layer < MOTE_LAYERS; layer++) {
    float depth = float(layer);
    float cells = 6.0 + depth * 5.0;
    vec2 p = uv * vec2(aspect, 1.0) * cells;
    p.y += uSeconds * (0.05 + depth * 0.035) * cells / 6.0;
    vec2 cell = floor(p);
    vec2 inside = fract(p);
    vec3 dice = hash3(ivec2(cell) + ivec2(layer * 211, layer * 97), 29u);
    if (dice.y < 0.52) continue;
    vec2 centre = 0.2 + 0.6 * dice.xz;
    centre.x += 0.16 * sin(uSeconds * (0.35 + dice.z) + dice.x * 6.2832);
    float radius = mix(0.04, 0.15, dice.z * dice.z) * (1.0 - depth * 0.2);
    float disc = smoothstep(radius, radius * 0.15, length(inside - centre));
    float twinkle = 0.55 + 0.45 * sin(uSeconds * (0.8 + 1.6 * dice.y) + dice.x * 40.0);
    light += tint * disc * twinkle / (1.0 + depth * 0.9);
  }
  return light;
}

float shafts(vec2 uv, float aspect) {
  vec2 from = uFocus + vec2(0.06, -0.85);
  vec2 toward = (uv - from) * vec2(aspect, 1.0);
  float angle = atan(toward.x, toward.y);
  float beams = valueNoise3(vec2(angle * 11.0, uSeconds * 0.12), 41u).r;
  float fall = smoothstep(1.6, 0.2, length(toward));
  return pow(beams, 4.0) * fall;
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 uv = vec2(pixel.x / uBacking.x, 1.0 - pixel.y / uBacking.y);
  float aspect = uBacking.x / uBacking.y;
  vec3 base = smoke(uv, aspect);
  vec3 tint = clamp(base * 2.4 + vec3(0.32, 0.22, 0.1), 0.0, 1.0);
  vec3 colour = base + motes(uv, aspect, tint) * 0.85 + tint * shafts(uv, aspect) * 0.3;
  float dither = interleavedGradient(pixel) + interleavedGradient(pixel.yx + 17.0) - 1.0;
  outColor = vec4(clamp(colour + dither / 255.0, 0.0, 1.0), 1.0);
}
