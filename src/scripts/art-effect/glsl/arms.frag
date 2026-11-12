uniform sampler2D uColour;
uniform sampler2D uRelief;
uniform sampler2D uFinish;
uniform mat3 uWarp;
uniform vec2 uShield;
uniform vec2 uEye;
uniform float uSway;
uniform float uDistance;
uniform float uExposure;
uniform vec3 uGoldDeep;
uniform vec3 uGoldPale;
uniform vec3 uKey;

out vec4 outColor;

const float DETAIL_BIAS = -0.75;
const float FILTER_VARIANCE = 0.25;
const float FILTER_LIMIT = 0.18;
const float SPECULAR_OCCLUSION = 0.6;
const float KEY_LIGHT = 1.3;
const float KEY_DIFFUSE = 0.6;
const float AMBIENT = 0.7;

const float GILT_ROUGHNESS = 0.4;
const float BURNISHED_ROUGHNESS = 0.2;
const float PATINA_ROUGHNESS = 0.6;
const float PATINA_SHADE = 0.45;
const float BURNISH_LIFT = 0.25;
const float GOLD_PALES_FROM = 0.05;
const float GOLD_PALES_TO = 4.0;
const float ROOM_ON_GILT = 0.68;
const float BROAD_ROUGHNESS = 0.45;
const float BROAD_KEY = 1.6;

const float COAT_FACING = 0.04;
const float COAT_GRAZING = 0.08;
const float COAT_TINT = 0.45;
const float COAT_ROUGHNESS = 0.55;
const float GLINT_ROUGHNESS = 0.3;
const float SHEEN_KNEE = 0.7;
const float GLINT_KNEE = 0.5;

vec3 eyeAt(float aspect) {
  return vec3(aspect * (0.5 + (uEye.x - 0.5) * uSway), 0.5 + (uEye.y - 0.5) * uSway, uDistance);
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

float coatFresnel(vec3 normal, vec3 view) {
  vec3 halfway = normalize(normalize(uKey) + view);
  return schlick(vec3(COAT_FACING), dot(halfway, view)).r;
}

vec3 tinted(vec3 radiance, float tint) {
  return mix(vec3(luminance(radiance)), radiance, tint);
}

vec3 gilt(vec3 normal, vec3 view, float facing, float roughness, vec3 finish, float convexity) {
  float occlusion = finish.g;
  float shadow = finish.b;
  float reflected =
    luminance(roomBlurred(reflect(-view, normal), roughness)) *
    mix(1.0, occlusion, SPECULAR_OCCLUSION);
  float irradiance = luminance(room(uRoomDiffuse, normal)) * occlusion;
  float keyed =
    keySpecular(normal, view, roughness) +
    BROAD_KEY * keySpecular(normal, view, BROAD_ROUGHNESS);
  vec3 bounced = litByRoom(vec3(1.0), 1.0, roughness, facing, vec3(reflected), vec3(irradiance));
  float energy = ROOM_ON_GILT * bounced.r + keyed * occlusion * shadow;
  energy *= 1.0 + BURNISH_LIFT * max(convexity, 0.0);
  energy *= mix(1.0, PATINA_SHADE, max(-convexity, 0.0));
  float exposed = energy * uExposure;
  float paling = smoothstep(GOLD_PALES_FROM, GOLD_PALES_TO, exposed);
  return keepHue(exposed * mix(uGoldDeep, uGoldPale, paling));
}

vec3 enamel(
  vec3 tincture,
  vec3 normal,
  vec3 view,
  float facing,
  float coatRoughness,
  float glintRoughness,
  vec3 finish
) {
  float occlusion = finish.g;
  float shadow = finish.b;
  vec3 irradiance = room(uRoomDiffuse, normal) * occlusion;
  float keyed = max(dot(normal, normalize(uKey)), 0.0) * shadow * KEY_DIFFUSE;
  vec3 body = tincture * (irradiance * AMBIENT + vec3(keyed * occlusion));

  float coat = mix(COAT_FACING, COAT_GRAZING, pow(1.0 - facing, 5.0));
  vec3 sheen = tinted(
    roomBlurred(reflect(-view, normal), coatRoughness) * mix(1.0, occlusion, SPECULAR_OCCLUSION),
    COAT_TINT
  );
  sheen /= 1.0 + sheen / SHEEN_KNEE;
  float glint =
    keySpecular(normal, view, glintRoughness) * coatFresnel(normal, view) * occlusion * shadow;
  glint /= 1.0 + glint / GLINT_KNEE;
  return neutral((body * (1.0 - coat) + sheen * coat + vec3(glint)) * uExposure);
}

void main() {
  vec3 warped = uWarp * vec3(gl_FragCoord.xy, 1.0);
  vec2 uv = warped.xy / warped.z;
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  vec4 colour = texture(uColour, uv, DETAIL_BIAS);
  vec3 relief = texture(uRelief, uv, DETAIL_BIAS).rgb;
  vec3 finish = texture(uFinish, uv, DETAIL_BIAS).rgb;
  vec2 slope = relief.xy * 2.0 - 1.0;
  vec3 normal = normalize(vec3(slope, sqrt(max(1.0 - dot(slope, slope), 0.0))));
  float convexity = relief.z * 2.0 - 1.0;
  vec3 across = dFdx(normal);
  vec3 down = dFdy(normal);

  float aspect = uShield.x / uShield.y;
  vec3 view = toRoom(normalize(eyeAt(aspect) - vec3(uv.x * aspect, uv.y, 0.0)));
  float facing = max(dot(normal, view), 1e-4);

  float giltRoughness = mix(GILT_ROUGHNESS, BURNISHED_ROUGHNESS, max(convexity, 0.0));
  giltRoughness = mix(giltRoughness, PATINA_ROUGHNESS, max(-convexity, 0.0));
  vec3 gold = gilt(normal, view, facing, antialiased(giltRoughness, across, down), finish, convexity);
  vec3 glass = enamel(
    colour.rgb,
    normal,
    view,
    facing,
    antialiased(COAT_ROUGHNESS, across, down),
    antialiased(GLINT_ROUGHNESS, across, down),
    finish
  );

  vec3 shaded = mix(glass, gold, finish.r);
  vec2 pixel = uv * uShield;
  float dither = (interleavedGradient(pixel) + interleavedGradient(pixel.yx + 17.0) - 1.0) / 255.0;
  float cover = colour.a * inside.x * inside.y;
  outColor = vec4(clamp(encodeSrgb(shaded) + dither, 0.0, 1.0) * cover, cover);
}
