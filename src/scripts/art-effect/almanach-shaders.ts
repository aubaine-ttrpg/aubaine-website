export const CRT_VERTEX = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const CRT_FRAGMENT = `
precision highp float;

uniform sampler2D uImage;
uniform vec4 uFit;
uniform vec3 uZoom;
uniform sampler2D uOsd;
uniform float uOsdAlpha;
uniform float uOsdLeft;
uniform vec2 uResolution;
uniform float uAspect;
uniform float uLines;
uniform float uTime;
uniform float uSeed;
uniform float uSignal;
uniform vec2 uOpen;
uniform float uFlash;
uniform float uBrightness;
uniform float uNoise;
uniform float uWobble;
uniform float uAberration;
uniform float uSnow;
uniform float uBlur;
uniform float uRoll;
uniform float uTear;
uniform float uTrack;
uniform float uTrackAt;
uniform float uMotion;
uniform float uMask;
uniform float uSheen;
uniform sampler2D uBoot;
uniform float uBootMix;
uniform vec2 uBootSize;
uniform float uBootLod;

varying vec2 vUv;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float INSET = 0.034;
const float CORNER = 0.16;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 rgb2yiq(vec3 c) {
  return vec3(
    dot(c, vec3(0.299, 0.587, 0.114)),
    dot(c, vec3(0.596, -0.274, -0.322)),
    dot(c, vec3(0.211, -0.523, 0.312))
  );
}

vec3 yiq2rgb(vec3 c) {
  return vec3(
    dot(c, vec3(1.0, 0.956, 0.621)),
    dot(c, vec3(1.0, -0.272, -0.647)),
    dot(c, vec3(1.0, -1.106, 1.703))
  );
}

float roundBox(vec2 p, vec2 size, float r) {
  vec2 q = abs(p) - size + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 imageUv(vec2 uv, float aspect) {
  vec2 c = uv - 0.5;
  float r = uFit.x / aspect;
  vec2 contain = r > 1.0 ? vec2(1.0, r) : vec2(1.0 / r, 1.0);
  vec2 cover = r > 1.0 ? vec2(1.0 / r, 1.0) : vec2(1.0, r);
  vec2 coverUv = c * cover + 0.5 + (uFit.zw - 0.5) * (1.0 - cover);
  return mix(c * contain + 0.5, coverUv, uFit.y);
}

vec3 backdrop(vec2 uv, float aspect) {
  vec2 c = uv - 0.5;
  float r = uFit.x / aspect;
  vec2 cover = r > 1.0 ? vec2(1.0 / r, 1.0) : vec2(1.0, r);
  vec2 b = c * cover * 0.7 + 0.5;
  vec3 sum = textureLod(uImage, b, 4.5).rgb * 0.36;
  sum += textureLod(uImage, b + vec2(0.06, 0.0), 4.5).rgb * 0.16;
  sum += textureLod(uImage, b - vec2(0.06, 0.0), 4.5).rgb * 0.16;
  sum += textureLod(uImage, b + vec2(0.0, 0.06), 4.5).rgb * 0.16;
  sum += textureLod(uImage, b - vec2(0.0, 0.06), 4.5).rgb * 0.16;
  vec3 tone = mix(vec3(dot(sum, LUMA)), sum, 0.85);
  return tone * (0.2 + 0.06 * (1.0 - abs(c.y) * 2.0));
}

vec3 picture(vec2 uv, float blur, float aspect, vec3 bg) {
  vec2 iuv = imageUv(uv, aspect);
  vec2 edge = min(iuv, 1.0 - iuv);
  float inside = smoothstep(-0.0015, 0.0015, min(edge.x, edge.y));
  vec3 fg = texture(uImage, clamp(iuv, 0.0, 1.0), blur + uBlur).rgb;
  float shade = mix(0.55, 1.0, smoothstep(0.0, 0.035, min(edge.x, edge.y) + 0.035));
  return mix(bg * shade, fg, inside);
}

vec3 srgbDecode(vec3 c) {
  c = max(c, 0.0);
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

vec3 cadranBackdrop(vec2 uv) {
  vec2 pos = uv * uBootSize;
  float spread = length(pos - vec2(0.5, 0.54) * uBootSize) / (length(uBootSize) * 0.62);
  vec3 core = vec3(13.0, 59.0, 94.0) / 255.0;
  vec3 middle = vec3(7.0, 37.0, 64.0) / 255.0;
  vec3 edge = vec3(2.0, 11.0, 23.0) / 255.0;
  vec3 col = spread < 0.45 ? mix(core, middle, spread / 0.45) : mix(middle, edge, clamp((spread - 0.45) / 0.55, 0.0, 1.0));
  float unit = uBootSize.y / 290.0;
  float pitch = 64.0 * unit;
  vec2 grid = abs(fract((pos - 0.5 * uBootSize) / pitch + 0.5) - 0.5) * pitch;
  float stroke = max(1.0, unit) * 0.5;
  float line = 1.0 - smoothstep(stroke - 0.5, stroke + 0.5, min(grid.x, grid.y));
  return mix(col, vec3(95.0, 212.0, 255.0) / 255.0, 0.045 * line);
}

vec3 cadranBloom(vec2 uv, float lod, vec2 texel) {
  vec3 sum = textureLod(uBoot, uv, lod).rgb * 2.0;
  sum += textureLod(uBoot, uv + texel, lod).rgb;
  sum += textureLod(uBoot, uv - texel, lod).rgb;
  sum += textureLod(uBoot, uv + vec2(texel.x, -texel.y), lod).rgb;
  sum += textureLod(uBoot, uv + vec2(-texel.x, texel.y), lod).rgb;
  return sum / 6.0;
}

vec3 cadran(vec2 uv, float split) {
  vec3 back = cadranBackdrop(uv);
  vec4 red = textureLod(uBoot, vec2(uv.x + split, uv.y), uBootLod);
  vec4 green = textureLod(uBoot, uv, uBootLod);
  vec4 blue = textureLod(uBoot, vec2(uv.x - split, uv.y), uBootLod);
  vec3 col = vec3(
    red.r + back.r * (1.0 - red.a),
    green.g + back.g * (1.0 - green.a),
    blue.b + back.b * (1.0 - blue.a)
  );
  vec2 texel = 1.0 / uBootSize;
  col += cadranBloom(uv, 2.0, texel * 4.0) * 0.55 + cadranBloom(uv, 4.0, texel * 16.0) * 0.85;
  return srgbDecode(col);
}

vec3 grade(vec3 c) {
  float y = dot(c, LUMA);
  c = mix(vec3(y), c, 0.88);
  c = c * 0.97 + 0.0022;
  c = pow(max(c, 0.0), vec3(1.03));
  return c * vec3(1.025, 1.0, 0.965);
}

vec3 signal(vec2 p, float aspect, vec2 px) {
  float rolled = p.y + uRoll;
  float wrap = fract(rolled);
  float blank = mix(1.0, smoothstep(0.0, 0.035, wrap) * smoothstep(1.0, 0.985, wrap), smoothstep(0.0, 0.02, abs(uRoll)));
  p.y = wrap;
  float line = floor(p.y * uLines);
  float n1 = hash12(vec2(line, uSeed));
  float shift = (n1 - 0.5) * 0.0011 * uMotion;
  shift += uTear * (sin(p.y * 38.0 + uTime * 27.0) * 0.6 + hash12(vec2(line * 0.37, uSeed)) - 0.5) * 0.035;
  float band = exp(-pow((p.y - uTrackAt) / 0.028, 2.0)) * uTrack;
  shift += band * (hash12(vec2(line, uSeed * 1.7)) - 0.25) * 0.045;
  float head = (1.0 - smoothstep(0.0, 0.028, p.y)) * uMotion;
  shift += head * (0.010 + (n1 - 0.5) * 0.008);
  vec2 sp = vec2(p.x + shift, p.y);
  vec2 zp = uZoom.xy + (sp - uZoom.xy) / uZoom.z;

  vec3 bg = backdrop(zp, aspect);
  vec3 luma = picture(zp, 0.0, aspect, bg);
  vec3 soft = picture(zp, 1.4, aspect, bg);
  vec3 smear = picture(zp + vec2(px.x * 1.2, 0.0), 0.6, aspect, bg)
    + picture(zp + vec2(px.x * 3.0, 0.0), 0.9, aspect, bg)
    + picture(zp + vec2(px.x * 5.2, 0.0), 1.2, aspect, bg)
    + picture(zp + vec2(px.x * 7.6, 0.0), 1.5, aspect, bg);
  float y0 = rgb2yiq(luma).x;
  float y1 = rgb2yiq(soft).x;
  vec3 c = max(yiq2rgb(vec3(y0 + (y0 - y1) * 0.45, rgb2yiq(smear * 0.25).yz)), 0.0);
  float split = uAberration * px.x;
  c.r += picture(zp + vec2(split, 0.0), 0.0, aspect, bg).r - luma.r;
  c.b += picture(zp - vec2(split, 0.0), 0.0, aspect, bg).b - luma.b;
  vec3 glow = picture(zp, 3.2, aspect, bg);
  c += glow * glow * 0.3;

  vec2 osdUv = (sp - vec2(mix(0.69, 0.04, uOsdLeft), 0.79)) / vec2(0.27, 0.15);
  vec2 osdIn = step(vec2(0.0), osdUv) * step(osdUv, vec2(1.0));
  vec4 osd = textureLod(uOsd, clamp(osdUv, 0.0, 1.0), 0.0);
  c = mix(c, osd.rgb, osd.a * uOsdAlpha * osdIn.x * osdIn.y);

  float streak = hash12(vec2(floor(gl_FragCoord.x * 0.5), floor(gl_FragCoord.y) + uSeed * 13.0));
  vec3 snow = vec3(pow(streak, 2.2) * 0.85);
  float noisy = clamp(uSnow + band * 0.5 + head * 0.25 + (1.0 - uSignal), 0.0, 1.0);
  c = mix(c, snow, noisy);
  vec3 shown = grade(max(c, 0.0));
  if (uBootMix > 0.0) {
    float torn = uTear * (sin(p.y * 38.0 + uTime * 27.0) * 0.6 + hash12(vec2(line * 0.37, uSeed)) - 0.5) * 0.035;
    shown = mix(shown, cadran(vec2(p.x + torn, p.y), uAberration * px.x), uBootMix);
  }
  return shown * blank;
}

void main() {
  vec2 px = 1.0 / uResolution;
  vec2 k = vec2(uAspect, 1.0);
  vec2 c = vUv * 2.0 - 1.0;
  float r2 = dot(c * k, c * k) / dot(k, k);
  c *= 1.0 + 0.045 * r2 + 0.02 * r2 * r2;
  vec2 q = c * 0.5 * k;
  vec2 halfSize = 0.5 * k - INSET;
  float aspect = halfSize.x / halfSize.y;
  vec2 n = q / halfSize;
  float d = roundBox(q, halfSize, CORNER);
  float tube = 1.0 - smoothstep(-px.y * 1.5, px.y * 0.5, d);

  float openY = max(uOpen.y, 0.0005);
  float sy = n.y / openY;
  float raster = (1.0 - smoothstep(uOpen.x - 0.003, uOpen.x + 0.003, abs(n.x))) * step(abs(sy), 1.0) * step(0.0001, uOpen.x);
  vec2 p = vec2(n.x * 0.5 + 0.5, sy * 0.5 + 0.5);
  p.x += uWobble * 0.016 * sin(p.y * 24.0 + uTime * 40.0);
  p.x += (hash12(vec2(floor(p.y * uResolution.y), uSeed)) - 0.5) * uNoise * 0.003;

  vec3 col = signal(p, aspect, px * vec2(uAspect, 1.0) * 0.5 / halfSize) * raster;
  col *= 1.0 + uFlash * 1.4;
  col += raster * uFlash * vec3(0.42, 0.7, 1.0) * 0.5;
  float thin = 1.0 - smoothstep(0.015, 0.3, uOpen.y);
  float beamY = n.y / (uOpen.y + 0.006);
  float beamX = 1.0 - smoothstep(max(uOpen.x - 0.02, 0.0), uOpen.x + 0.05, abs(n.x));
  col += exp(-beamY * beamY) * beamX * uFlash * thin * vec3(0.6, 0.86, 1.0) * 1.2;

  float lum = clamp(dot(col, LUMA), 0.0, 1.0);
  float f = fract(p.y * uLines) - 0.5;
  float sigma = mix(0.24, 0.44, sqrt(lum));
  float scan = exp(-f * f / (2.0 * sigma * sigma));
  col *= mix(1.0, scan * 1.42, 0.85 * (1.0 - thin));

  float stripe = mod(floor(gl_FragCoord.x), 3.0);
  vec3 grille = stripe < 1.0 ? vec3(1.0, 0.78, 0.78) : (stripe < 2.0 ? vec3(0.78, 1.0, 0.78) : vec3(0.78, 0.78, 1.0));
  col *= mix(vec3(1.0), grille * 1.14, uMask);

  float grain = hash12(gl_FragCoord.xy + uSeed * 91.7);
  col += (grain - 0.5) * uNoise * 0.4 * raster;
  float speck = step(1.0 - uNoise * 0.01, hash12(gl_FragCoord.yx * 1.31 + uSeed * 13.3));
  col += speck * raster * uNoise * vec3(0.7, 0.85, 1.0);

  float hum = 0.5 + 0.5 * sin((p.y - uTime * 0.085) * 6.2831853);
  col *= 1.0 - 0.04 * hum * uMotion;
  col *= uBrightness;

  float vignette = 1.0 - 0.32 * pow(clamp(length(n * vec2(0.82, 1.0)) / 1.3, 0.0, 1.0), 2.6);
  float rim = smoothstep(-0.07, 0.0, d);
  col *= vignette * (1.0 - 0.45 * rim) * tube;

  vec2 g = q / (0.5 * k);
  float along = dot(g, normalize(vec2(0.55, 1.0))) - uSheen;
  float sheen = exp(-along * along / 0.06) * smoothstep(1.15, 0.2, length(g * vec2(0.8, 1.0)));
  col += vec3(0.05, 0.052, 0.058) * sheen + vec3(0.006, 0.0065, 0.008) * (1.0 - 0.5 * length(g));

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`

export const ALMANACH_SPRITES = [
  'flame_01',
  'flame_02',
  'flame_03',
  'flame_04',
  'fire_01',
  'star_08',
  'circle_05',
  'circle_02',
  'star_04',
  'star_07',
  'star_09',
  'star_06',
  'spark_01',
  'spark_02',
  'spark_03',
  'spark_04',
  'spark_05',
  'spark_06',
  'twirl_01',
  'twirl_02',
  'twirl_03',
  'smoke_01',
  'smoke_05',
  'smoke_06',
  'smoke_07',
  'smoke_08',
  'smoke_09',
  'smoke_10',
  'light_01',
  'light_02',
  'smoke_04',
  'magic_01',
  'magic_02',
  'smoke_03',
  'trace_02',
  'dirt_02',
  'dirt_03',
  'scorch_02',
  'smoke_02',
  'flare_01',
  'magic_04',
  'circle_01',
  'flame_05',
  'flame_06',
  'muzzle_02',
  'muzzle_05',
  'spark_07',
  'trace_04',
] as const

const SPRITE_SLOTS = ALMANACH_SPRITES.map(
  (name, slot) => `#define S_${name.toUpperCase()} ${slot}.0`,
).join('\n')

export const BODY_VERTEX_HEAD = `
uniform mat4 uAlmanachSpace;
varying vec3 vAlmanach;
`

export const BODY_VERTEX_TAIL = `
vAlmanach = (uAlmanachSpace * vec4(transformed, 1.0)).xyz;
`

export const BODY_MAGIC = `
#ifdef ALMANACH_MAGIC
uniform sampler2D uSprites;
uniform float uMagicTime;
uniform float uMagicPower;
uniform float uMagicGain;
${SPRITE_SLOTS}

float almanachHash(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec2 almanachTurn(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float almanachSprite(float slot, vec2 p, vec2 centre, float size, float angle, float lod) {
  vec2 d = almanachTurn(p - centre, -angle) / size;
  if (max(abs(d.x), abs(d.y)) >= 1.0) return 0.0;
  float tile = floor(slot / 3.0 + 0.01);
  float channel = slot - tile * 3.0;
  vec2 cell = vec2(mod(tile, 4.0), floor(tile / 4.0 + 0.01));
  vec2 uv = (cell * 256.0 + 128.0 + vec2(d.x, -d.y) * 120.0) / 1024.0;
  vec3 texel = textureLod(uSprites, uv, clamp(lod + log2(120.0 / size), 0.0, 3.0)).rgb;
  float value = channel < 0.5 ? texel.r : channel < 1.5 ? texel.g : texel.b;
  return max(value - 0.02, 0.0) * 1.0204;
}

vec2 almanachDeep(vec2 q, vec3 v, vec3 n, float depth) {
  return q - v.xy / max(v.z, 0.35) * depth - n.xy * depth * 0.6;
}

vec3 almanachGlow(float x, vec3 low, vec3 mid, vec3 high) {
  vec3 colour = low * smoothstep(0.0, 0.3, x);
  colour = mix(colour, mid, smoothstep(0.25, 0.7, x));
  return mix(colour, high, smoothstep(0.7, 1.3, x));
}

#ifdef ALMANACH_MAGIC_FIRE
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.32);
  p += 0.018 * vec2(sin(p.y * 9.0 - t * 5.0), cos(p.x * 9.0 - t * 4.0)) * (0.5 + 0.5 * power);
  float spin = t * 0.9;
  float heat = almanachSprite(S_CIRCLE_05, p, vec2(0.0), mix(0.36, 0.5, power), 0.0, lod)
    * mix(0.7, 0.95, power) * (0.85 + 0.15 * sin(t * 3.1) * sin(t * 1.7));
  heat += almanachSprite(S_TWIRL_02, p, vec2(0.0), mix(0.5, 0.74, power), spin * 1.3, lod) * mix(0.24, 0.5, power);
  heat += almanachSprite(S_TWIRL_03, p, vec2(0.0), mix(0.42, 0.62, power), spin * 1.8 + 2.0, lod) * mix(0.15, 0.38, power);
  for (int i = 0; i < 4; i++) {
    float f = float(i);
    float turn = spin * 1.2 + f * 1.5708;
    vec2 centre = 0.08 * vec2(cos(turn), sin(turn));
    heat += almanachSprite(S_FLAME_01 + f, p, centre, mix(0.3, 0.42, power), turn, lod) * mix(0.35, 0.6, power);
  }
  for (int i = 0; i < 7; i++) {
    float f = float(i);
    float turn = spin + f * 0.8976;
    float life = t * mix(0.7, 1.1, almanachHash(f + 3.0)) + almanachHash(f + 17.0);
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 13.0 + cycle * 7.0);
    float radius = mix(0.12, mix(0.24, 0.36, power), age);
    vec2 centre = radius * vec2(cos(turn), sin(turn));
    float size = mix(0.24, 0.38, a) * mix(0.7, 1.0, power) * (0.8 + 0.3 * sin(3.1416 * age));
    float fade = smoothstep(0.0, 0.2, age) * (1.0 - smoothstep(0.6, 1.0, age));
    float count = clamp(mix(3.0, 7.0, power) - f, 0.0, 1.0);
    heat += almanachSprite(S_FLAME_05 + floor(a * 1.99), p, centre, size, turn - 1.5708 - 0.35, lod)
      * fade * count * mix(0.8, 1.25, power);
  }
  heat *= 1.0 - smoothstep(0.45, 0.92, length(p));
  vec3 colour = almanachGlow(heat, vec3(0.3, 0.03, 0.0), vec3(1.0, 0.34, 0.04), vec3(1.15, 0.74, 0.3));
  float sparks = 0.0;
  for (int i = 0; i < 8; i++) {
    float f = float(i);
    float life = t * mix(0.45, 0.7, almanachHash(f + 41.0)) + almanachHash(f + 59.0);
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 31.0 + cycle * 3.0);
    float turn = a * 6.2832 + spin * 1.4 + age * 2.2;
    vec2 centre = vec2(cos(turn), sin(turn)) * mix(0.15, 0.72, age);
    float count = clamp(mix(2.0, 8.0, power) - f, 0.0, 1.0);
    sparks += almanachSprite(S_CIRCLE_05, p, centre, mix(0.025, 0.045, a), 0.0, lod) * (1.0 - age) * count;
  }
  return colour + vec3(1.0, 0.55, 0.15) * sparks * 1.4;
}
#endif

#ifdef ALMANACH_MAGIC_EARTH
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float stone = almanachSprite(S_SMOKE_06, p, vec2(0.0), 1.15, 0.4 + t * 0.02, lod) * 0.6
    + almanachSprite(S_DIRT_03, p, vec2(0.0), 1.2, t * 0.03, lod) * 0.5;
  float pulse = 0.5 + 0.5 * sin(t * 1.6);
  float wave = 0.5 + 0.5 * sin(t * 2.2 - length(p) * 6.0);
  float cracks = almanachSprite(S_SPARK_04, p, vec2(0.0), 0.95, 0.3 + t * 0.025, lod)
    + almanachSprite(S_SPARK_03, p, vec2(0.0), 0.85, 2.2 - t * 0.02, lod) * 0.8;
  cracks = cracks * cracks * 1.6;
  float core = almanachSprite(S_CIRCLE_05, p, vec2(0.0), 0.55, 0.0, lod);
  float shards = 0.0;
  for (int i = 0; i < 6; i++) {
    float f = float(i);
    float turn = t * mix(0.3, 0.42, almanachHash(f + 2.0)) + f * 1.0472;
    vec2 centre = vec2(cos(turn), sin(turn)) * mix(0.56, 0.7, almanachHash(f + 8.0));
    shards = max(shards, almanachSprite(S_SMOKE_03, p, centre, mix(0.18, 0.24, almanachHash(f + 12.0)), turn * 2.0 + f, lod));
  }
  float motes = 0.0;
  for (int i = 0; i < 5; i++) {
    float f = float(i);
    float turn = almanachHash(f + 19.0) * 6.2832 + t * mix(0.35, 0.6, almanachHash(f + 4.0));
    vec2 centre = vec2(cos(turn), sin(turn)) * mix(0.25, 0.5, almanachHash(f + 27.0));
    motes += almanachSprite(S_STAR_04, p, centre, 0.08, turn, lod) * clamp(mix(1.0, 5.0, power) - f, 0.0, 1.0);
  }
  float molten = cracks * mix(0.5, 1.4, power) * mix(0.9, 0.6 + 0.8 * wave, power)
    + core * mix(0.15, 0.45, power) * (0.7 + 0.3 * pulse);
  vec3 colour = vec3(0.07, 0.04, 0.018) * stone * mix(0.8, 1.2, power);
  colour += almanachGlow(molten, vec3(0.25, 0.08, 0.01), vec3(1.0, 0.55, 0.12), vec3(1.15, 0.88, 0.45));
  float solid = smoothstep(0.1, 0.22, shards);
  float rim = smoothstep(0.03, 0.1, shards) * (1.0 - solid);
  colour = mix(colour, vec3(0.05, 0.03, 0.016) * (0.7 + 0.6 * shards), solid)
    + vec3(1.0, 0.6, 0.2) * rim * mix(0.25, 0.7, power);
  return colour + vec3(1.0, 0.8, 0.45) * motes * 0.7;
}
#endif

#ifdef ALMANACH_MAGIC_NATURE
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float beat = fract(t * 0.75);
  float pulse = exp(-pow((beat - 0.1) * 14.0, 2.0)) + 0.6 * exp(-pow((beat - 0.28) * 14.0, 2.0));
  float mist = almanachSprite(S_SMOKE_05, p, vec2(0.0), 0.95, t * 0.1, lod);
  float vines = almanachSprite(S_TWIRL_03, p, vec2(0.0), 0.98, t * 0.45, lod)
    + almanachSprite(S_TWIRL_02, p, vec2(0.0), 0.7, 2.0 + t * 0.6, lod) * 0.7;
  float sigil = almanachSprite(S_MAGIC_02, p, vec2(0.0), 0.86, t * 0.2, lod);
  float inner = almanachSprite(S_MAGIC_01, p, vec2(0.0), 0.5, -t * 0.35, lod);
  float core = almanachSprite(S_CIRCLE_05, p, vec2(0.0), 0.42 + 0.06 * pulse, 0.0, lod);
  float spores = 0.0;
  for (int i = 0; i < 9; i++) {
    float f = float(i);
    float life = t * mix(0.18, 0.3, almanachHash(f + 7.0)) + almanachHash(f + 61.0);
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 19.0 + cycle * 5.0);
    vec2 centre = vec2((a - 0.5) * 1.2 + 0.12 * sin(age * 6.0 + f * 1.3), mix(-0.9, 0.9, age));
    float twinkle = 0.6 + 0.4 * sin(t * 5.0 + f * 2.7);
    float count = clamp(mix(3.0, 9.0, power) - f, 0.0, 1.0);
    spores += almanachSprite(S_CIRCLE_05, p, centre, mix(0.03, 0.05, a), 0.0, lod)
      * sin(3.1416 * age) * twinkle * count;
  }
  vec3 colour = vec3(0.03, 0.16, 0.02) * mist * mix(0.6, 1.0, power);
  colour += vec3(0.2, 0.75, 0.12) * vines * mix(0.18, 0.5, power);
  colour += vec3(0.45, 1.0, 0.3) * sigil * mix(0.4, 1.15, power);
  colour += vec3(0.7, 1.0, 0.4) * inner * 0.9 * power;
  colour += vec3(0.55, 1.0, 0.3) * core * (0.3 + 0.7 * pulse) * mix(0.25, 0.8, power);
  return colour + vec3(1.0, 0.95, 0.45) * spores * mix(0.5, 1.0, power);
}
#endif

#ifdef ALMANACH_MAGIC_WATER
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.35);
  p += 0.025 * vec2(sin(t * 1.3 + p.y * 4.0), cos(t * 1.1 + p.x * 4.0));
  float light = smoothstep(-1.0, 1.0, p.y);
  vec3 colour = mix(vec3(0.0, 0.025, 0.09), vec3(0.01, 0.13, 0.36), light) * mix(0.6, 1.0, power);
  float a = almanachSprite(S_SMOKE_07, p, vec2(0.1 * sin(t * 0.37), 0.0), 1.2, t * 0.11, lod);
  float b = almanachSprite(S_SMOKE_08, p, vec2(0.0, 0.1 * cos(t * 0.29)), 1.1, 1.7 - t * 0.08, lod);
  float caustic = pow(clamp(1.0 - abs(a - b) * 5.0, 0.0, 1.0), 4.0) * smoothstep(0.08, 0.3, a + b);
  colour += vec3(0.3, 0.75, 1.05) * caustic * mix(0.35, 0.9, power) * (0.4 + 0.6 * light);
  float whirl = almanachSprite(S_TWIRL_03, p, vec2(0.0), 0.9, t * 0.5, lod);
  colour += vec3(0.05, 0.35, 0.8) * whirl * mix(0.15, 0.5, power);
  float bubbles = 0.0;
  for (int i = 0; i < 8; i++) {
    float f = float(i);
    float life = t * mix(0.3, 0.5, almanachHash(f + 13.0)) + almanachHash(f + 29.0);
    float cycle = floor(life);
    float age = life - cycle;
    float h = almanachHash(f * 5.0 + cycle * 17.0);
    vec2 centre = vec2((h - 0.5) * 1.1 + 0.05 * sin(age * 14.0 + f), mix(-0.95, 0.9, age));
    float count = clamp(mix(3.0, 8.0, power) - f, 0.0, 1.0);
    bubbles += almanachSprite(S_CIRCLE_02, p, centre, mix(0.06, 0.11, h) * (0.8 + 0.4 * age), 0.0, lod)
      * smoothstep(0.0, 0.1, age) * (1.0 - smoothstep(0.85, 1.0, age)) * count;
  }
  return colour + vec3(0.6, 0.9, 1.1) * bubbles * mix(0.8, 1.3, power);
}
#endif

#ifdef ALMANACH_MAGIC_THUNDER
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float cloud = almanachSprite(S_SMOKE_07, p, vec2(0.0), 1.05, t * 0.17, lod) * 0.6
    + almanachSprite(S_SMOKE_09, p, vec2(0.0), 0.95, 1.3 - t * 0.12, lod) * 0.45;
  vec3 colour = vec3(0.03, 0.035, 0.14) * cloud * mix(0.7, 1.3, power);
  float beat = t * 8.0;
  float frame = floor(beat);
  float decay = 1.0 - 0.7 * (beat - frame);
  float bolts = 0.0;
  float strike = 0.0;
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    float a = almanachHash(frame * 1.37 + f * 11.0);
    float b = almanachHash(frame * 2.91 + f * 5.0);
    float c = almanachHash(frame * 0.71 + f * 23.0);
    float on = step(a, mix(0.2, 0.85, power) - f * 0.25);
    float flicker = 0.65 + 0.35 * almanachHash(floor(t * 40.0) + f * 3.0);
    float glow = on * decay * decay * flicker;
    float pick = floor(b * 4.99);
    float slot = pick < 1.5 ? S_SPARK_01 + pick : pick < 3.5 ? S_SPARK_05 + pick - 2.0 : S_SPARK_07;
    bolts += almanachSprite(slot, p, (vec2(b, c) - 0.5) * 0.3, mix(0.75, 1.0, c), a * 31.4, lod) * glow * mix(0.6, 1.0, power);
    strike = max(strike, glow);
  }
  float loop = 0.0;
  float head = t * 2.4;
  for (int i = 0; i < 8; i++) {
    float f = float(i);
    float turn = f * 0.7854;
    float behind = mod(head - turn, 6.2832);
    float tail = exp(-behind * 0.9);
    float jitter = almanachHash(frame * 3.1 + f * 7.0);
    vec2 centre = 0.56 * vec2(cos(turn), sin(turn));
    loop += almanachSprite(S_SPARK_07, p, centre, 0.26, turn + 1.5708 + (jitter - 0.5) * 0.35, lod)
      * tail * (0.6 + 0.4 * jitter);
  }
  bolts += loop * mix(0.45, 0.9, power);
  float core = almanachSprite(S_STAR_04, p, vec2(0.0), mix(0.45, 0.7, power), t * 0.6, lod) * (0.6 + 0.4 * strike)
    + almanachSprite(S_FLARE_01, p, vec2(0.0), 0.9, 0.0, lod) * 0.25;
  colour += vec3(0.25, 0.32, 1.0) * core * mix(0.35, 0.8, power);
  colour += vec3(0.45, 0.55, 1.5) * bolts * mix(0.8, 1.3, power) + vec3(1.0, 1.05, 1.25) * bolts * bolts * mix(0.6, 1.4, power);
  return colour + vec3(0.06, 0.08, 0.3) * strike * smoothstep(1.1, 0.0, length(p)) * mix(0.4, 1.0, power);
}
#endif

#ifdef ALMANACH_MAGIC_WIND
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float spin = t * 1.5;
  float wind = max(max(
    almanachSprite(S_TWIRL_01, p, vec2(0.0), 0.82, spin, lod),
    almanachSprite(S_TWIRL_02, p, vec2(0.0), 0.66, spin * 1.35 + 1.3, lod) * 0.85),
    almanachSprite(S_TWIRL_01, p, vec2(0.0), 0.5, spin * 1.8 + 3.0, lod) * 0.8);
  float eye = almanachSprite(S_CIRCLE_05, p, vec2(0.0), 0.5, 0.0, lod);
  float mist = almanachSprite(S_SMOKE_01, p, vec2(0.0), 1.0, t * 0.25, lod);
  float streaks = 0.0;
  for (int i = 0; i < 6; i++) {
    float f = float(i);
    float a = almanachHash(f + 3.0);
    float b = almanachHash(f + 37.0);
    float radius = mix(0.3, 0.72, a);
    float angle = b * 6.2832 + t * mix(1.4, 2.4, a);
    vec2 centre = radius * vec2(cos(angle), sin(angle));
    float count = clamp(mix(2.0, 6.0, power) - f, 0.0, 1.0);
    streaks += almanachSprite(S_TRACE_02, p, centre, mix(0.28, 0.4, b), angle, lod) * count;
  }
  float field = wind * wind * mix(1.2, 3.2, power) + mist * mix(0.06, 0.1, power) + streaks * mix(0.7, 1.8, power)
    + eye * mix(0.08, 0.22, power);
  return almanachGlow(field, vec3(0.01, 0.06, 0.08), vec3(0.3, 0.82, 0.88), vec3(0.8, 1.0, 0.98));
}
#endif

#ifdef ALMANACH_MAGIC_SLIME
float almanachGoo(vec2 p, float t, float grow, float lod) {
  float m = 0.0;
  for (int i = 0; i < 6; i++) {
    float f = float(i);
    vec2 centre = 0.45 * vec2(sin(t * (0.5 + 0.13 * f) + f * 1.7), cos(t * (0.41 + 0.11 * f) + f * 2.3));
    m += almanachSprite(S_CIRCLE_05, p, centre, mix(0.38, 0.55, almanachHash(f + 1.0)) * mix(0.2, 1.0, grow), 0.0, lod);
  }
  return m + (almanachSprite(S_SMOKE_09, p, vec2(0.0), 1.05, t * 0.2, lod) - 0.2) * 0.4 * grow;
}

vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.28);
  float k = fract(t * 0.32);
  float charge = smoothstep(0.5, 0.85, k) * power;
  float grow = mix(1.0, smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.85, 0.88, k)), power);
  float m = almanachGoo(p, t, grow, lod);
  float toward = almanachGoo(p + vec2(-0.05, 0.05), t, grow, lod);
  float relief = clamp((m - toward) * 5.0, -1.0, 1.0);
  float slime = smoothstep(0.45, 0.6, m);
  float shine = smoothstep(0.35, 0.8, relief) * slime;
  float bubbles = 0.0;
  for (int i = 0; i < 5; i++) {
    float f = float(i);
    float life = t * mix(0.25, 0.4, almanachHash(f + 31.0)) + almanachHash(f + 47.0);
    float cycle = floor(life);
    float age = life - cycle;
    float h = almanachHash(f * 23.0 + cycle * 7.0);
    vec2 centre = vec2((h - 0.5) * 0.9, mix(-0.7, 0.7, age));
    bubbles += almanachSprite(S_CIRCLE_02, p, centre, mix(0.04, 0.07, h), 0.0, lod) * sin(3.1416 * age);
  }
  vec3 body = mix(vec3(0.005, 0.03, 0.0), vec3(0.16, 0.55, 0.02) * (0.7 + 0.45 * relief), slime);
  body = mix(body, vec3(0.95, 0.8, 0.06) * slime * (0.75 + 0.35 * relief), charge * 0.85);
  vec3 colour = body * mix(0.5, 1.0, power) * (1.0 + 0.5 * charge * (0.5 + 0.5 * sin(t * 30.0)));
  colour += mix(vec3(0.6, 1.0, 0.3), vec3(1.0, 0.95, 0.5), charge) * shine * mix(0.3, 0.8, power);
  colour += vec3(0.6, 1.0, 0.25) * bubbles * slime * mix(0.25, 0.6, power);
  float age = clamp((k - 0.86) / 0.14, 0.0, 1.0);
  float boom = power * step(0.86, k) * (1.0 - age) * (1.0 - age);
  float burst = almanachSprite(S_SCORCH_02, p, vec2(0.0), mix(0.35, 1.2, age), age, lod)
    + almanachSprite(S_FIRE_01, p, vec2(0.0), mix(0.3, 1.0, age), -age, lod) * 0.7;
  return colour + vec3(1.3, 0.62, 0.12) * burst * boom * 1.6
    + vec3(0.4, 0.25, 0.05) * boom * smoothstep(1.2, 0.0, length(p));
}
#endif

#ifdef ALMANACH_MAGIC_VOID
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.45);
  float r = length(p);
  float spin = t * 0.8;
  float swirl = almanachSprite(S_TWIRL_02, p, vec2(0.0), 1.0, spin, lod) * 0.75
    + almanachSprite(S_TWIRL_03, p, vec2(0.0), 0.82, spin * 1.6 + 2.1, lod) * 0.6
    + almanachSprite(S_TWIRL_01, p, vec2(0.0), 0.62, spin * 2.4 + 4.0, lod) * 0.5 * power;
  float ring = almanachSprite(S_SMOKE_10, p, vec2(0.0), 0.92, t * 0.3, lod);
  float motes = 0.0;
  for (int i = 0; i < 9; i++) {
    float f = float(i);
    float life = t * mix(0.25, 0.4, almanachHash(f + 5.0)) + almanachHash(f + 71.0);
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 17.0 + cycle * 13.0);
    float radius = mix(1.0, 0.18, age);
    float angle = a * 6.2832 + age * 4.5;
    float count = clamp(mix(3.0, 9.0, power) - f, 0.0, 1.0);
    motes += almanachSprite(S_CIRCLE_05, p, radius * vec2(cos(angle), sin(angle)), mix(0.04, 0.07, a), 0.0, lod)
      * smoothstep(0.0, 0.2, age) * (1.0 - smoothstep(0.7, 1.0, age)) * count;
  }
  float hole = smoothstep(0.12, 0.42, r);
  float field = swirl * mix(0.5, 0.95, power) + ring * mix(0.3, 0.65, power);
  vec3 colour = almanachGlow(field, vec3(0.1, 0.0, 0.22), vec3(0.42, 0.08, 0.85), vec3(0.85, 0.5, 1.15));
  colour += vec3(0.7, 0.45, 1.0) * motes * mix(0.5, 1.0, power);
  float horizon = exp(-pow((r - 0.3) / 0.06, 2.0));
  return colour * hole + vec3(0.55, 0.15, 1.0) * horizon * power * (0.45 + 0.15 * sin(t * 5.0));
}
#endif

#ifdef ALMANACH_MAGIC_BLOOD
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float beat = fract(t * 0.9);
  float pulse = exp(-pow((beat - 0.08) * 12.0, 2.0)) + 0.7 * exp(-pow((beat - 0.26) * 12.0, 2.0));
  float pool = almanachSprite(S_SMOKE_08, p, vec2(0.0), 1.0, t * 0.08, lod) * 0.6
    + almanachSprite(S_SMOKE_02, p, vec2(0.0), 0.85, 2.0 - t * 0.1, lod) * 0.5;
  float swirl = almanachSprite(S_TWIRL_03, p, vec2(0.08, -0.05), 0.82, t * 0.4, lod) * 0.5
    + almanachSprite(S_SMOKE_09, p, vec2(0.0), 0.7, 1.7 + t * 0.3, lod) * 0.4;
  float heart = almanachSprite(S_CIRCLE_05, p, vec2(0.0), 0.42 + 0.07 * pulse, 0.0, lod);
  float drops = 0.0;
  for (int i = 0; i < 7; i++) {
    float f = float(i);
    float turn = almanachHash(f + 13.0) * 6.2832 + t * mix(0.5, 0.9, almanachHash(f + 5.0));
    vec2 centre = vec2(cos(turn), sin(turn)) * mix(0.35, 0.72, almanachHash(f + 21.0));
    float count = clamp(mix(3.0, 7.0, power) - f, 0.0, 1.0);
    drops += almanachSprite(S_CIRCLE_05, p, centre, mix(0.05, 0.08, almanachHash(f + 33.0)), 0.0, lod) * count;
  }
  float field = pool * mix(0.22, 0.32, power) + swirl * mix(0.2, 0.45, power)
    + heart * (0.3 + 0.7 * pulse) * mix(0.45, 1.1, power) + drops * mix(0.5, 1.0, power);
  return almanachGlow(field, vec3(0.14, 0.0, 0.01), vec3(0.72, 0.03, 0.05), vec3(1.15, 0.32, 0.26));
}
#endif

#ifdef ALMANACH_MAGIC_NECROTIC
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float fumes = 0.0;
  for (int i = 0; i < 8; i++) {
    float f = float(i);
    float life = t * mix(0.16, 0.26, almanachHash(f + 7.0)) + f / 8.0;
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 17.0 + cycle * 9.0);
    vec2 centre = vec2((a - 0.5) * 0.3 + (mod(f, 2.0) - 0.5) * 0.36 + 0.08 * sin(age * 4.0 + f), mix(-0.7, 0.55, age));
    float size = mix(0.32, 0.5, a) * mix(0.7, 1.2, age);
    float slot = mod(f, 2.0) < 0.5 ? S_SMOKE_04 : S_SMOKE_01;
    fumes += almanachSprite(slot, p, centre, size, age * 1.5 + f, lod) * sin(3.1416 * age);
  }
  float wisps = 0.0;
  for (int i = 0; i < 4; i++) {
    float f = float(i);
    float life = t * mix(0.3, 0.45, almanachHash(f + 51.0)) + almanachHash(f + 67.0);
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 23.0 + cycle * 13.0);
    vec2 centre = vec2((a - 0.5) * 0.9, mix(-0.6, 0.6, age));
    float count = clamp(mix(1.0, 4.0, power) - f, 0.0, 1.0);
    wisps += almanachSprite(S_TRACE_04, p, centre, 0.32, (a - 0.5) * 0.4, lod) * sin(3.1416 * age) * count;
  }
  float core = almanachSprite(S_CIRCLE_05, p, vec2(0.0, -0.35), 0.6, 0.0, lod);
  float flicker = 0.8 + 0.2 * sin(t * 7.0) * sin(t * 3.1);
  float field = fumes * mix(0.26, 0.6, power) + wisps * mix(0.4, 1.0, power) + core * mix(0.18, 0.45, power) * flicker;
  return almanachGlow(field, vec3(0.0, 0.06, 0.025), vec3(0.22, 0.72, 0.28), vec3(0.72, 1.0, 0.5));
}
#endif

#ifdef ALMANACH_MAGIC_ETHER
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.42);
  float nebula = almanachSprite(S_SMOKE_07, p, vec2(0.0), 1.05, t * 0.05, lod) * 0.55
    + almanachSprite(S_SMOKE_05, p, vec2(0.0), 0.8, 2.6 - t * 0.04, lod) * 0.4;
  vec3 colour = vec3(0.02, 0.04, 0.2) * nebula * mix(0.8, 1.3, power);
  float stars = 0.0;
  for (int i = 0; i < 9; i++) {
    float f = float(i);
    float turn = almanachHash(f + 3.0) * 6.2832 + t * 0.12;
    vec2 centre = vec2(cos(turn), sin(turn)) * mix(0.18, 0.74, almanachHash(f + 11.0));
    float twinkle = 0.5 + 0.5 * sin(t * mix(1.5, 3.5, almanachHash(f + 19.0)) + f * 1.7);
    float slot = mod(f, 2.0) < 0.5 ? S_STAR_06 : S_STAR_08;
    float count = clamp(mix(4.0, 9.0, power) - f, 0.0, 1.0);
    stars += almanachSprite(slot, p, centre, mix(0.12, 0.22, almanachHash(f + 29.0)), t * 0.2 + f, lod)
      * mix(0.3, 1.0, twinkle) * count;
  }
  float heart = almanachSprite(S_STAR_08, p, vec2(0.0), mix(0.38, 0.55, power), t * 0.1, lod);
  float field = stars * mix(0.5, 1.0, power) + heart * mix(0.35, 0.9, power);
  return colour + almanachGlow(field, vec3(0.03, 0.06, 0.3), vec3(0.3, 0.45, 1.2), vec3(0.85, 0.92, 1.25));
}
#endif

#ifdef ALMANACH_MAGIC_PSYCHIC
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.3);
  float waves = 0.0;
  for (int i = 0; i < 4; i++) {
    float age = fract(t * 0.45 + float(i) / 4.0);
    waves += almanachSprite(S_CIRCLE_02, p, vec2(0.0), mix(0.15, 1.0, age), 0.0, lod)
      * pow(1.0 - age, 1.5) * smoothstep(0.0, 0.1, age);
  }
  float spiral = almanachSprite(S_TWIRL_02, p, vec2(0.0), 0.78, t * 1.1, lod)
    + almanachSprite(S_TWIRL_03, p, vec2(0.0), 0.58, 2.0 + t * 1.6, lod) * 0.8;
  float sigil = almanachSprite(S_MAGIC_01, p, vec2(0.0), 0.42, -t * 0.3, lod);
  float eye = almanachSprite(S_CIRCLE_05, p, vec2(0.0), 0.32, 0.0, lod) * (0.75 + 0.25 * sin(t * 3.0));
  float field = waves * mix(0.18, 0.5, power) + spiral * mix(0.35, 0.85, power) + sigil * mix(0.2, 0.6, power)
    + eye * mix(0.3, 0.8, power);
  return almanachGlow(field, vec3(0.12, 0.0, 0.09), vec3(0.85, 0.18, 0.62), vec3(1.12, 0.68, 1.05));
}
#endif

#ifdef ALMANACH_MAGIC_LIGHT
vec3 almanachElement(vec2 q, vec3 v, vec3 n, float t, float power, float lod) {
  vec2 p = almanachDeep(q, v, n, 0.25);
  float glow = almanachSprite(S_CIRCLE_05, p, vec2(0.0), 0.95, 0.0, lod);
  float halo = almanachSprite(S_LIGHT_01, p, vec2(0.0), 0.92, t * 0.15, lod);
  float rays = almanachSprite(S_STAR_07, p, vec2(0.0), 1.0, t * 0.12, lod)
    + almanachSprite(S_STAR_07, p, vec2(0.0), 0.8, 0.785 - t * 0.09, lod) * 0.7;
  float core = almanachSprite(S_STAR_09, p, vec2(0.0), 0.55, t * 0.25, lod);
  float waves = 0.0;
  for (int i = 0; i < 3; i++) {
    float age = fract(t * 0.4 + float(i) / 3.0);
    waves += almanachSprite(S_CIRCLE_01, p, vec2(0.0), mix(0.25, 1.15, age), 0.0, lod)
      * (1.0 - age) * (1.0 - age) * smoothstep(0.0, 0.15, age);
  }
  float glints = 0.0;
  for (int i = 0; i < 4; i++) {
    float f = float(i);
    float life = t * 0.7 + almanachHash(f + 9.0);
    float cycle = floor(life);
    float age = life - cycle;
    float a = almanachHash(f * 7.0 + cycle * 19.0);
    float b = almanachHash(f * 11.0 + cycle * 23.0);
    glints += almanachSprite(S_STAR_04, p, (vec2(a, b) - 0.5) * 1.3, mix(0.12, 0.2, b), 0.0, lod)
      * sin(3.1416 * age) * clamp(mix(1.5, 4.0, power) - f, 0.0, 1.0);
  }
  float field = glow * mix(0.12, 0.2, power) + halo * mix(0.1, 0.25, power) + rays * mix(0.45, 1.0, power)
    + core * mix(0.5, 1.0, power) + waves * 0.5 * power;
  vec3 colour = almanachGlow(field, vec3(0.32, 0.14, 0.02), vec3(1.0, 0.66, 0.2), vec3(1.15, 0.92, 0.58));
  return colour + vec3(1.0, 0.85, 0.5) * glints * 0.8;
}
#endif
#endif
`

export const BODY_FRAGMENT_HEAD = `
uniform sampler2D uParts;
uniform vec3 uMetal[4];
uniform vec3 uTrim[4];
uniform vec3 uGrip[4];
uniform vec3 uGem[4];
uniform vec4 uCustom;
uniform vec3 uGemLight;
uniform vec3 uCrystal;
uniform float uCrystalRadius;
uniform float uGemLit;
uniform float uGemGlow;
uniform vec3 uRimLight;
uniform vec3 uGloss;
uniform float uGemScale;
uniform vec3 uGemFrame;
varying vec3 vAlmanach;

float almanachWindow(float l, float low, float span) {
  return clamp((log2(max(l, 1e-6)) - low) / span, 0.0, 1.0);
}

vec3 almanachRamp(vec3 stops[4], float l, float low, float span) {
  float t = almanachWindow(l, low, span);
  vec3 a = mix(stops[0], stops[1], smoothstep(0.0, 0.5, t));
  vec3 b = mix(a, stops[2], smoothstep(0.5, 0.82, t));
  return mix(b, stops[3], smoothstep(0.82, 1.0, t));
}

#ifdef ALMANACH_TEXTURED
uniform vec4 uMetalMapping;
uniform vec4 uTrimMapping;
uniform vec4 uGripMapping;
#ifdef ALMANACH_TEXTURED_METAL
uniform sampler2D uMetalColor;
uniform sampler2D uMetalSurface;
#endif
#ifdef ALMANACH_TEXTURED_TRIM
uniform sampler2D uTrimColor;
uniform sampler2D uTrimSurface;
#endif
#ifdef ALMANACH_TEXTURED_GRIP
uniform sampler2D uGripColor;
uniform sampler2D uGripSurface;
#endif

struct AlmanachSample {
  vec3 colour;
  vec3 normal;
  float roughness;
};

float almanachCavity(float t) {
  float s = mix(0.02, 0.14, smoothstep(0.0, 0.5, t));
  s = mix(s, 0.53, smoothstep(0.5, 0.82, t));
  s = mix(s, 1.0, smoothstep(0.82, 1.0, t));
  return clamp(s / 0.33, 0.3, 1.0);
}

void almanachProject(
  sampler2D colourMap,
  sampler2D surfaceMap,
  float weight,
  vec3 tu,
  vec3 tv,
  vec3 tw,
  vec2 offset,
  float size,
  vec3 p,
  vec3 dpdx,
  vec3 dpdy,
  vec3 base,
  inout AlmanachSample total
) {
  if (weight < 0.002) return;
  vec2 uv = vec2(dot(p, tu), dot(p, tv)) / size + offset;
  vec2 gx = vec2(dot(dpdx, tu), dot(dpdx, tv)) / size;
  vec2 gy = vec2(dot(dpdy, tu), dot(dpdy, tv)) / size;
  vec3 colour = textureGrad(colourMap, uv, gx, gy).rgb;
  vec3 surface = textureGrad(surfaceMap, uv, gx, gy).rgb;
  vec2 tn = surface.xy * 2.0 - 1.0;
  float tz = sqrt(max(1.0 - dot(tn, tn), 0.0));
  vec3 bent = (tn.x + dot(base, tu)) * tu + (tn.y + dot(base, tv)) * tv + tz * dot(base, tw) * tw;
  total.colour += colour * weight;
  total.normal += normalize(bent) * weight;
  total.roughness += surface.z * weight;
}

AlmanachSample almanachTexture(
  sampler2D colourMap,
  sampler2D surfaceMap,
  vec4 mapping,
  vec3 p,
  vec3 dpdx,
  vec3 dpdy,
  vec3 base
) {
  vec3 along = vec3(1.0, 0.0, 0.0);
  vec3 across = vec3(0.0, 1.0, 0.0);
  vec3 depth = vec3(0.0, 0.0, 1.0);
  vec2 offset = vec2(0.0);
  if (mapping.y > 0.5) {
    vec2 reach = abs(p.xy - vec2(0.0978, -0.0038)) - vec2(0.3488, 0.1513);
    bool lying = reach.y > reach.x;
    if (p.x < -0.3) lying = p.y < -0.14 || (p.y > 0.1 && p.x > -0.4);
    if (!lying) {
      along = vec3(0.0, 1.0, 0.0);
      across = vec3(-1.0, 0.0, 0.0);
    }
    float member = lying ? (p.y > 0.0 ? 1.0 : 2.0) : (p.x > 0.1 ? 3.0 : p.x > -0.3 ? 4.0 : 5.0);
    offset = fract(vec2(member * 0.618, member * 0.382));
  }
  vec3 tu0 = along;
  vec3 tv0 = across;
  vec3 tu1 = along;
  vec3 tv1 = depth;
  vec3 tu2 = across;
  vec3 tv2 = depth;
  if (mapping.y > 1.5) {
    tu0 = across;
    tv0 = -along;
    tu1 = depth;
    tv1 = -along;
  }
  vec3 blend = pow(abs(vec3(dot(base, depth), dot(base, across), dot(base, along))), vec3(4.0));
  blend /= max(blend.x + blend.y + blend.z, 1e-5);
  AlmanachSample total = AlmanachSample(vec3(0.0), vec3(0.0), 0.0);
  almanachProject(colourMap, surfaceMap, blend.x, tu0, tv0, depth, offset, mapping.x, p, dpdx, dpdy, base, total);
  almanachProject(colourMap, surfaceMap, blend.y, tu1, tv1, across, offset, mapping.x, p, dpdx, dpdy, base, total);
  almanachProject(colourMap, surfaceMap, blend.z, tu2, tv2, along, offset, mapping.x, p, dpdx, dpdy, base, total);
  total.normal = normalize(total.normal);
  return total;
}
#endif
${BODY_MAGIC}
`

export const BODY_FRAGMENT_SURFACE = `
vec3 almanachPart = texture2D(uParts, vMetalnessMapUv).rgb;
float almanachMetal = texture2D(metalnessMap, vMetalnessMapUv).r;
vec3 almanachPainted = diffuseColor.rgb;
float almanachNear = 1.0 - smoothstep(uCrystalRadius * 1.02, uCrystalRadius * 1.3, distance(vAlmanach.xy, uCrystal.xy + uGemFrame.xy * uCrystalRadius));
float almanachGem = almanachPart.r * almanachNear;
float almanachGlass = almanachPart.r * (1.0 - almanachNear);
float almanachRim = almanachGlass * smoothstep(-0.31, -0.27, vAlmanach.x);
float almanachL = dot(almanachPainted, vec3(0.2126, 0.7152, 0.0722));
float almanachGloss = mix(mix(uGloss.x, uGloss.y, almanachPart.g * (1.0 - almanachPart.b)), uGloss.z, almanachPart.b);
vec3 almanachBase = almanachPainted;
almanachBase = mix(almanachBase, almanachRamp(uMetal, almanachL, -7.38, 6.97), almanachMetal * uCustom.x);
almanachBase = mix(almanachBase, almanachRamp(uTrim, almanachL, -5.2, 5.14), almanachPart.g * uCustom.y);
almanachBase = mix(almanachBase, almanachRamp(uGrip, almanachL, -9.43, 5.25), almanachPart.b * uCustom.z);
almanachBase = mix(almanachBase, almanachRamp(uGem, almanachL, -6.6, 6.3), almanachGem * uCustom.w);
almanachBase = mix(almanachBase, almanachBase * 0.16, almanachGem * (1.0 - uGemLit));
#ifdef ALMANACH_MAGIC
almanachBase = mix(almanachBase, almanachBase * mix(0.6, 0.12, uGemLit), almanachGem);
#else
almanachBase = mix(almanachBase, almanachBase * mix(1.0, 0.15, uGemLit), almanachGem * uCustom.w);
#endif
vec3 almanachDormant = vec3(almanachL) * vec3(0.15, 0.17, 0.2) + vec3(0.003, 0.0035, 0.0045);
diffuseColor.rgb = mix(almanachBase, almanachDormant, almanachGlass);
`

export const BODY_FRAGMENT_ROUGHNESS = `
roughnessFactor = mix(mix(0.84, roughnessFactor, almanachGloss), roughnessFactor, almanachPart.r);
`

export const BODY_FRAGMENT_TEXTURED = `
#ifdef ALMANACH_TEXTURED
vec3 almanachWeight = vec3(0.0);
#ifdef ALMANACH_TEXTURED_METAL
almanachWeight.x = almanachMetal * (1.0 - almanachPart.g) * (1.0 - almanachPart.b);
#endif
#ifdef ALMANACH_TEXTURED_TRIM
almanachWeight.y = almanachPart.g * (1.0 - almanachPart.b);
#endif
#ifdef ALMANACH_TEXTURED_GRIP
almanachWeight.z = almanachPart.b;
#endif
almanachWeight *= 1.0 - almanachPart.r;
float almanachCovered = almanachWeight.x + almanachWeight.y + almanachWeight.z;
float almanachCoat = 0.0;
vec3 almanachDpdx = dFdx(vAlmanach);
vec3 almanachDpdy = dFdy(vAlmanach);
if (almanachCovered > 0.001) {
  vec3 almanachObject = normalize(texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0);
  AlmanachSample almanachFinish = AlmanachSample(almanachPainted, almanachObject, 0.5);
  float almanachT = 0.7;
  vec4 almanachMapping = vec4(1.0, 0.0, 0.0, 0.0);
  float almanachPartGloss = uGloss.x;
#ifdef ALMANACH_TEXTURED_METAL
  if (almanachWeight.x >= almanachWeight.y && almanachWeight.x >= almanachWeight.z) {
    almanachFinish = almanachTexture(uMetalColor, uMetalSurface, uMetalMapping, vAlmanach, almanachDpdx, almanachDpdy, almanachObject);
    almanachT = almanachWindow(almanachL, -7.38, 6.97);
    almanachMapping = uMetalMapping;
    almanachPartGloss = uGloss.x;
  }
#endif
#ifdef ALMANACH_TEXTURED_TRIM
  if (almanachWeight.y > almanachWeight.x && almanachWeight.y >= almanachWeight.z) {
    almanachFinish = almanachTexture(uTrimColor, uTrimSurface, uTrimMapping, vAlmanach, almanachDpdx, almanachDpdy, almanachObject);
    almanachT = almanachWindow(almanachL, -5.2, 5.14);
    almanachMapping = uTrimMapping;
    almanachPartGloss = uGloss.y;
  }
#endif
#ifdef ALMANACH_TEXTURED_GRIP
  if (almanachWeight.z > almanachWeight.x && almanachWeight.z > almanachWeight.y) {
    almanachFinish = almanachTexture(uGripColor, uGripSurface, uGripMapping, vAlmanach, almanachDpdx, almanachDpdy, almanachObject);
    almanachT = almanachWindow(almanachL, -9.43, 5.25);
    almanachMapping = uGripMapping;
    almanachPartGloss = uGloss.z;
  }
#endif
  diffuseColor.rgb = mix(diffuseColor.rgb, almanachFinish.colour * almanachCavity(almanachT), almanachCovered);
  roughnessFactor = mix(roughnessFactor, mix(0.84, almanachFinish.roughness, almanachPartGloss), almanachCovered);
  metalnessFactor = mix(metalnessFactor, 0.0, almanachCovered);
  almanachCoat = almanachMapping.z * smoothstep(0.55, 1.0, almanachPartGloss) * almanachCovered;
#ifdef USE_CLEARCOAT
  clearcoatNormal = normalize(normalMatrix * almanachObject);
#endif
  normal = normalize(mix(normal, normalize(normalMatrix * almanachFinish.normal), almanachCovered));
}
#endif
`

export const BODY_FRAGMENT_COAT = `
#ifdef ALMANACH_COAT
material.clearcoat *= almanachCoat;
#endif
#ifdef ALMANACH_MAGIC
material.specularColor *= mix(1.0, 0.6, almanachGem);
material.specularColorBlended *= mix(1.0, 0.6, almanachGem);
#endif
`

export const BODY_FRAGMENT_EMISSIVE = `
vec3 almanachGemN = normalize(normal * normalMatrix);
vec3 almanachGemV = normalize(vViewPosition * normalMatrix);
float almanachFacing = clamp(dot(almanachGemN, almanachGemV), 0.0, 1.0);
float almanachDetail = mix(0.55, 1.8, smoothstep(0.4, 0.8, almanachL)) * mix(0.35, 1.0, almanachFacing * almanachFacing * almanachFacing);
vec3 almanachGemHue = mix(almanachPainted / max(max(almanachPainted.r, almanachPainted.g), max(almanachPainted.b, 0.001)), uGemLight * uGemScale * almanachDetail * 0.28, uCustom.w);
vec3 almanachGemLight = almanachGem * almanachGemHue * uGemGlow;
#ifdef ALMANACH_MAGIC
metalnessFactor = mix(metalnessFactor, 0.0, almanachGem);
float almanachFoot = log2(max(length(fwidth(vAlmanach.xy)) / (uCrystalRadius * uGemFrame.z), 1e-5));
if (almanachGem > 0.001) {
  vec2 almanachQ = ((vAlmanach.xy - uCrystal.xy) / uCrystalRadius - uGemFrame.xy) / uGemFrame.z;
  vec3 almanachSpell = almanachElement(almanachQ, almanachGemV, almanachGemN, uMagicTime, uMagicPower, almanachFoot);
  float almanachInside = 1.0 - smoothstep(0.8, 1.12, length(almanachQ));
  float almanachLines = smoothstep(0.55, 0.85, almanachL);
  vec3 almanachTint = mix(almanachPainted / max(max(almanachPainted.r, almanachPainted.g), max(almanachPainted.b, 0.001)), uGemLight, uCustom.w);
  almanachGemLight = almanachGemLight * mix(0.12, 0.32, uCustom.w) + almanachGem * (
    almanachSpell * almanachInside * mix(0.72, 1.0, almanachFacing) * uMagicGain
    + almanachTint * almanachLines * mix(0.05, 0.16, uMagicPower)
  );
}
#endif
totalEmissiveRadiance = almanachGemLight + almanachRim * uRimLight;
`
