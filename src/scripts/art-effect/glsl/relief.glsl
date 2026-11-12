uniform mat3 uWarp;
uniform vec2 uPiece;
uniform vec2 uEye;
uniform float uSway;
uniform float uDistance;
uniform float uExposure;
uniform vec3 uKey;

const float DETAIL_BIAS = -0.75;
const float FILTER_VARIANCE = 0.25;
const float FILTER_LIMIT = 0.18;
const float KEY_LIGHT = 1.3;

vec2 pieceUv() {
  vec3 warped = uWarp * vec3(gl_FragCoord.xy, 1.0);
  return warped.xy / warped.z;
}

float withinPiece(vec2 uv) {
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  return inside.x * inside.y;
}

vec3 reliefNormal(vec3 relief) {
  vec2 slope = relief.xy * 2.0 - 1.0;
  return normalize(vec3(slope, sqrt(max(1.0 - dot(slope, slope), 0.0))));
}

vec3 eyeAt(float aspect) {
  return vec3(aspect * (0.5 + (uEye.x - 0.5) * uSway), 0.5 + (uEye.y - 0.5) * uSway, uDistance);
}

vec3 viewFrom(vec2 uv) {
  float aspect = uPiece.x / uPiece.y;
  return toRoom(normalize(eyeAt(aspect) - vec3(uv.x * aspect, uv.y, 0.0)));
}

vec3 keepHue(vec3 colour) {
  float peak = max(colour.r, max(colour.g, colour.b));
  const float start = 0.62;
  if (peak < start) return colour;
  const float headroom = 1.0 - start;
  return colour * ((1.0 - headroom * headroom / (peak + headroom - start)) / peak);
}

float antialiased(float roughness, vec3 across, vec3 down) {
  float variance = FILTER_VARIANCE * (dot(across, across) + dot(down, down));
  float a = roughness * roughness;
  return sqrt(sqrt(a * a + min(2.0 * variance, FILTER_LIMIT)));
}

float keySpecular(vec3 normal, vec3 view, float roughness) {
  vec3 light = normalize(uKey);
  float nl = max(dot(normal, light), 0.0);
  float nv = max(dot(normal, view), 1e-4);
  float nh = max(dot(normal, normalize(light + view)), 0.0);
  return ggx(nh, roughness) * smithVisibility(nv, nl, roughness) * nl * KEY_LIGHT;
}

vec4 presented(vec3 shaded, vec2 uv, float coverage) {
  vec2 pixel = uv * uPiece;
  float dither = (interleavedGradient(pixel) + interleavedGradient(pixel.yx + 17.0) - 1.0) / 255.0;
  float cover = coverage * withinPiece(uv);
  return vec4(clamp(encodeSrgb(shaded) + dither, 0.0, 1.0) * cover, cover);
}
