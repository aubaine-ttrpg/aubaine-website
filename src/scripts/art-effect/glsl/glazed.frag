uniform sampler2D uArt;
uniform sampler2D uSurface;
uniform sampler2D uRelief;
uniform vec2 uBacking;
uniform float uMoulding;
uniform vec2 uSlice;
uniform vec2 uEye;
uniform float uMetalness;
uniform float uExposure;

out vec4 outColor;

const float DISTANCE = 1.5;
const float SWAY = 0.9;
const float RECESS = 0.012;
const float TRANSMITTED = 0.965;
const float GLASS = 0.38;
const float DEFOCUS = 0.06;
const float KNEE = 5.0;
const float TINT = 0.3;
const vec3 RABBET = vec3(0.11, 0.08, 0.045);

float sliced(float at, float span, float border, float slice) {
  if (at < border) return at / border * slice;
  if (at > span - border) return 1.0 - (span - at) / border * slice;
  return slice + (at - border) / (span - 2.0 * border) * (1.0 - 2.0 * slice);
}

vec3 eyeAt(float aspect) {
  return vec3(aspect * (0.5 + (uEye.x - 0.5) * SWAY), 0.5 + (uEye.y - 0.5) * SWAY, DISTANCE);
}

vec3 moulding(vec2 pixel, float aspect) {
  vec2 uv = vec2(
    sliced(pixel.x, uBacking.x, uMoulding, uSlice.x),
    sliced(pixel.y, uBacking.y, uMoulding, uSlice.y)
  );
  vec4 finish = texture(uSurface, uv);
  vec3 normal = normalize(texture(uRelief, uv).xyz * 2.0 - 1.0);
  vec3 seen = normalize(eyeAt(aspect) - vec3(pixel / uBacking.y, 0.0));
  vec3 view = toRoom(seen);
  float roughness = clamp(finish.a, 0.05, 1.0);
  float metal = uMetalness * finish.a;
  float facing = max(dot(normal, view), 1e-4);
  vec3 mirrored = reflect(-view, normal);
  vec3 lit = litByRoom(
    finish.rgb,
    metal,
    roughness,
    facing,
    roomBlurred(mirrored, roughness),
    room(uRoomDiffuse, normal)
  );
  return neutral(lit * uExposure);
}

vec3 painting(vec2 pixel, float aspect) {
  vec2 inner = uBacking - 2.0 * uMoulding;
  vec3 eye = eyeAt(aspect) * uBacking.y;
  vec2 deep = pixel + (pixel - eye.xy) * (RECESS * uBacking.y / eye.z);
  vec2 local = (deep - uMoulding) / inner;
  vec2 edge = min(local, 1.0 - local) * inner;
  float wall = 1.0 - smoothstep(-1.0, 0.5, min(edge.x, edge.y));
  vec3 art = texture(uArt, clamp(local, 0.0, 1.0)).rgb;
  float lip = min(pixel.y - uMoulding, pixel.x - uMoulding);
  float shade = 1.0 - 0.55 * exp(-max(lip, 0.0) / (0.012 * uBacking.y));
  float far = min(uBacking.y - uMoulding - pixel.y, uBacking.x - uMoulding - pixel.x);
  shade *= 1.0 - 0.25 * exp(-max(far, 0.0) / (0.005 * uBacking.y));
  vec3 surface = mix(art * shade, RABBET, wall);

  vec3 seen = normalize(vec3(pixel / uBacking.y, 0.0) - eyeAt(aspect));
  vec3 mirrored = reflect(seen, vec3(0.0, 0.0, 1.0));
  float facing = max(-seen.z, 0.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);
  vec3 scene = roomBlurred(toRoom(mirrored), DEFOCUS);
  vec3 reflected = mix(vec3(luminance(scene)), scene, TINT);
  reflected /= 1.0 + reflected / KNEE;
  vec2 uv = pixel / uBacking;
  float smudge = valueNoise3(uv * vec2(3.5 * aspect, 3.5), 23u).r;
  float wipe = valueNoise3(uv * vec2(1.2 * aspect, 1.2) + 7.0, 41u).g;
  float bloom = mix(0.7, 1.25, smoothstep(0.25, 0.85, smudge * 0.6 + wipe * 0.4));
  return surface * TRANSMITTED + reflected * fresnel * GLASS * bloom;
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uBacking.y - gl_FragCoord.y);
  float aspect = uBacking.x / uBacking.y;
  bool opening = all(greaterThan(pixel, vec2(uMoulding))) && all(lessThan(pixel, uBacking - uMoulding));
  vec3 colour = opening ? painting(pixel, aspect) : moulding(pixel, aspect);
  float dither = interleavedGradient(pixel) + interleavedGradient(pixel.yx + 17.0) - 1.0;
  outColor = vec4(clamp(encodeSrgb(colour) + dither / 255.0, 0.0, 1.0), 1.0);
}
