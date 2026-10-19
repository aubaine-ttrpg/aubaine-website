uniform sampler2D uParchment;
uniform sampler2D uParchmentRoutes;
uniform sampler2DArray uGlyphs;
uniform float uGlyphsOn;
uniform vec4 uLanes[MAX_LANES_];
uniform int uLaneCount;
uniform float uShowRoute[ROUTE_LAYERS_];
uniform sampler2D uSkyData;
uniform vec2 uHoverSky;
varying vec3 vW;

const float SQ3 = 1.7320508;
const float INRADIUS = 0.8660254;
const float WAVE = 7.2551975;

ivec4 parchmentAt(sampler2D source, vec2 qr) {
  float row = qr.y;
  float col = qr.x + floor(row * 0.5);
  if (row < 0.0 || col < 0.0 || row >= H_ || col >= W_) return ivec4(-1);
  return ivec4(texelFetch(source, ivec2(int(col), int(row)), 0) * 255.0 + 0.5);
}

bool hasFlag(int flags, int flag) { return (flags & flag) != 0; }

vec2 edgeDir(int e) {
  if (e == 0) return vec2(1.0, 0.0);
  if (e == 1) return vec2(0.5, INRADIUS);
  if (e == 2) return vec2(-0.5, INRADIUS);
  if (e == 3) return vec2(-1.0, 0.0);
  if (e == 4) return vec2(-0.5, -INRADIUS);
  return vec2(0.5, -INRADIUS);
}

float stroke(float dist, float width, float aa) {
  return 1.0 - smoothstep(width - aa, width + aa, dist);
}

float routeCover(vec2 local, int mask, float width, float dashes, float wave, float ties, float aa) {
  float cover = 0.0;
  for (int e = 0; e < 6; e++) {
    if (((mask >> e) & 1) == 0) continue;
    vec2 dir = edgeDir(e);
    float t = dot(local, dir);
    float side = dir.x * local.y - dir.y * local.x;
    float dist;
    if (t < 0.0) dist = length(local);
    else if (t > INRADIUS) dist = length(local - dir * INRADIUS);
    else dist = abs(side - wave * sin(t * WAVE));
    float on = dashes > 0.0 ? step(fract(t * dashes), 0.5) : 1.0;
    float line = stroke(dist, width, aa) * on;
    if (ties > 0.0 && t >= 0.0 && t <= INRADIUS) {
      line = max(line, stroke(abs(side), width * 3.2, aa) * step(fract(t * ties), 0.2));
    }
    cover = max(cover, line);
  }
  return cover;
}

float glyphAt(vec2 offset, int code, float size, float flip, float pixels, vec2 gx, vec2 gy) {
  vec2 uv = vec2(offset.x * flip, offset.y) / size + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  float alpha = textureGrad(uGlyphs, vec3(uv, float(code - 1)), gx / size, gy / size).r;
  return alpha * smoothstep(3.0, 7.0, pixels * size);
}

float glyphCover(vec2 local, int code, bool marked, bool scattered, vec2 qr, float pixels, vec2 gx, vec2 gy) {
  if (code <= 0 || uGlyphsOn < 0.5) return 0.0;
  if (marked) return glyphAt(local, code, GLYPH_SIZE_ * 1.12, 1.0, pixels, gx, gy);
  vec3 lattice = scattered ? PATTERN_SCATTERED_ : PATTERN_DENSE_;
  float spacing = lattice.x;
  float b = local.x / (INRADIUS * spacing);
  float a = local.y / spacing - 0.5 * b;
  vec3 cube = vec3(a, b, -a - b);
  vec3 spot = floor(cube + 0.5);
  vec3 off = abs(spot - cube);
  if (off.x > off.y && off.x > off.z) spot.x = -spot.y - spot.z;
  else if (off.y > off.z) spot.y = -spot.x - spot.z;
  if (max(max(abs(spot.x), abs(spot.y)), abs(spot.z)) > lattice.y) return 0.0;
  vec2 centre = spacing * vec2(INRADIUS * spot.y, spot.x + 0.5 * spot.y);
  vec2 seed = qr * 1.37 + spot.xy * 0.73;
  float flip = h12(seed + 3.1) > 0.5 ? -1.0 : 1.0;
  vec2 shift = (h22(seed + 7.7) - 0.5) * 0.03;
  float size = spacing * lattice.z * (0.9 + 0.15 * h12(seed + 1.9));
  return glyphAt(local - centre - shift, code, size, flip, pixels, gx, gy);
}

float laneCover(vec2 p, float aa) {
  float cover = 0.0;
  for (int i = 0; i < MAX_LANES_; i++) {
    if (i >= uLaneCount) break;
    vec4 lane = uLanes[i];
    vec2 span = lane.zw - lane.xy;
    float len = max(length(span), 1e-4);
    vec2 dir = span / len;
    float t = clamp(dot(p - lane.xy, dir), 0.0, len);
    float dist = length(p - lane.xy - dir * t);
    cover = max(cover, stroke(dist, 0.045, aa) * step(fract(t * 1.6), 0.55));
  }
  return cover;
}

void parchmentShade(out vec3 albedo, out float bump) {
  vec2 p = vW.xz;
  vec2 gx = dFdx(p);
  vec2 gy = dFdy(p);
  float footprint = max(length(fwidth(p)), 1e-5);
  float aa = footprint * 0.75;
  float pixels = 1.0 / footprint;
  float fibre = fbm(p * 2.3);
  float stain = N2(p * 0.013 + 0.31);
  vec3 paper = PAPER * (0.93 + 0.07 * fibre) * (1.0 - 0.07 * smoothstep(0.55, 0.9, stain));
  vec3 col = paper;
  bump = fibre * 0.006;

  vec4 hx = hexAt(p);
  vec2 qr = hx.xy;
  float ed = hx.z;
  vec2 local = p + uGridO - vec2(SQ3 * (qr.x + qr.y * 0.5), 1.5 * qr.y);
  ivec4 tile = parchmentAt(uParchment, qr);
  ivec4 across = parchmentAt(uParchment, qr + hexDir(hx.w));
  float hairline = smoothstep(3.0, 9.0, pixels);

  if (tile.x >= 0) {
    int wash = tile[CH_WASH_];
    int flags = tile[CH_FLAGS_];
    bool water = hasFlag(flags, FLAG_WATER_);
    vec3 tint = WASH[wash] * (0.94 + 0.06 * N3(p * 0.7));
    col = mix(paper, tint * (0.88 + 0.12 * fibre), 0.82);
    if (across.x >= 0 && across[CH_WASH_] != wash) col *= 1.0 - 0.07 * (1.0 - smoothstep(0.0, 0.2, ed));

    bool coast = across.x >= 0 && water != hasFlag(across[CH_FLAGS_], FLAG_WATER_);
    if (coast) {
      col = mix(col, INK, stroke(ed, 0.024, aa) * 0.9);
      if (water) {
        float ripples = max(stroke(abs(ed - 0.11), 0.009, aa), stroke(abs(ed - 0.2), 0.007, aa) * 0.7);
        col = mix(col, WATER_INK, ripples * 0.5 * hairline);
      }
    }

    float gridWidth = uGrid > 0.5 ? 0.016 : 0.009;
    float gridInk = uGrid > 0.5 ? 0.6 : 0.24;
    col = mix(col, INK, stroke(ed, gridWidth, aa) * gridInk * hairline);

    if (uUnder > 0.5 && wash >= ROCK_WASH_START_) {
      float hatch = abs(fract((p.x - p.y) * 2.4) - 0.5) / 2.4;
      col = mix(col, INK, stroke(hatch, 0.022, aa) * 0.2 * hairline);
    }

    vec4 dataHere = tileTex(qr);
    vec4 dataAcross = tileTex(qr + hexDir(hx.w));
    vec2 along = vec2(-edgeDir(int(hx.w + 0.5)).y, edgeDir(int(hx.w + 0.5)).x);
    float alongEdge = dot(p, along);
    if (uBorders > 0.5 && dataHere.g > 0.0 && dataAcross.g > 0.0 && abs(dataHere.g - dataAcross.g) > 0.001) {
      col = mix(col, MARK_INK, (1.0 - smoothstep(0.0, 0.16, ed)) * 0.16);
      col = mix(col, MARK_INK, stroke(ed, 0.03, aa) * step(0.4, fract(alongEdge * 2.2)) * 0.85);
    } else if (uBorders > 0.5 && dataHere.b > 0.0 && dataAcross.b > 0.0 && abs(dataHere.b - dataAcross.b) > 0.001) {
      col = mix(col, INK, stroke(ed, 0.016, aa) * step(0.5, fract(alongEdge * 5.0)) * 0.55);
    }

    if (uUnder < 0.5) {
      col = mix(col, WATER_INK, routeCover(local, tile[CH_RIVER_], 0.05, 0.0, 0.055, 0.0, aa) * uShowRoute[SHOW_RIVER_] * 0.85);
      ivec4 routes = parchmentAt(uParchmentRoutes, qr);
      col = mix(col, WATER_INK, routeCover(local, routes[CH_SEA_], 0.022, 4.0, 0.0, 0.0, aa) * uShowRoute[SHOW_SEA_] * 0.7);
      col = mix(col, INK, routeCover(local, routes[CH_ROAD_], 0.05, 0.0, 0.0, 0.0, aa) * uShowRoute[SHOW_ROAD_] * 0.9);
      col = mix(col, INK, routeCover(local, routes[CH_TRAIL_], 0.028, 6.0, 0.0, 0.0, aa) * uShowRoute[SHOW_TRAIL_] * 0.8);
      col = mix(col, INK, routeCover(local, routes[CH_RAIL_], 0.02, 0.0, 0.0, 9.0, aa) * uShowRoute[SHOW_RAIL_]);
    }

    if (hasFlag(flags, FLAG_ALOFT_)) {
      float dots = step(0.5, fract((local.x + local.y) * 6.0));
      col = mix(col, SKY_INK, stroke(abs(ed - 0.07), 0.014, aa) * dots * 0.75);
      float row = qr.y;
      float column = qr.x + floor(row * 0.5);
      bool chosen = texelFetch(uSkyData, ivec2(int(column), int(row)), 0).r > 0.5;
      bool pointed = abs(qr.x - uHoverSky.x) < 0.5 && abs(qr.y - uHoverSky.y) < 0.5;
      if (chosen || pointed) col = mix(col, SKY_INK, stroke(ed, chosen ? 0.05 : 0.035, aa) * 0.85);
    }

    bool marked = hasFlag(flags, FLAG_MARKED_);
    float glyph = glyphCover(local, tile[CH_GLYPH_], marked, hasFlag(flags, FLAG_SCATTERED_), qr, pixels, gx, gy);
    vec3 glyphInk = marked ? MARK_INK : mix(tint * 0.42, INK, 0.3);
    col = mix(col, glyphInk, glyph * (marked ? 0.92 : PATTERN_INK_));
    bump += glyph * (marked ? 0.01 : 0.004);

    if (dataHere.r > 0.5) {
      col = mix(col, MARK_INK, 0.08);
      if (dataAcross.r < 0.5) col = mix(col, MARK_INK, stroke(ed, 0.05, aa));
    }
    if (abs(qr.x - uHover.x) < 0.5 && abs(qr.y - uHover.y) < 0.5) {
      col = mix(col, INK, stroke(ed, 0.035, aa) * 0.8);
    }
  }

  if (uUnder < 0.5) col = mix(col, SKY_INK, laneCover(p, aa) * uShowRoute[SHOW_SKY_] * 0.8);

  float unknown = unexplored(p);
  col = mix(col, paper, smoothstep(0.12, 0.62, unknown));
  float drift = N1(p * 0.045 + uTime * WIND * 0.0015) * 0.65 + N2(p * 0.11 - uTime * WIND * 0.002) * 0.35;
  col = mix(col, MIST, unknown * smoothstep(0.25, 0.85, drift) * 0.55);

  vec2 outside = abs(p) - uGridO - vec2(INRADIUS, 1.0);
  float frame = max(outside.x, outside.y);
  col = mix(col, INK, max(stroke(abs(frame - 0.9), 0.06, aa) * 0.85, stroke(abs(frame - 1.5), 0.025, aa) * 0.7));
  col *= 1.0 - 0.18 * smoothstep(4.0, 60.0, frame);

  albedo = col;
}

vec3 parchmentLamp(vec3 lit, vec3 albedo) {
  float low = (1.0 - smoothstep(0.12, 0.45, uSunDir.y)) * (1.0 - uUnder);
  float dim = max(uNight * (1.0 - uUnder), low);
  float level = uUnder > 0.5 ? LAMP_UNDER_ : mix(LAMP_DAY_, LAMP_NIGHT_, dim);
  return max(lit, albedo * LAMP_TINT * level);
}
