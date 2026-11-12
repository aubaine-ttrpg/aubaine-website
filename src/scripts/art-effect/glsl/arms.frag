uniform sampler2D uColour;
uniform sampler2D uRelief;
uniform sampler2D uFinish;
uniform vec3 uGoldDeep;
uniform vec3 uGoldPale;

out vec4 outColor;

const float SPECULAR_OCCLUSION = 0.6;
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
  vec2 uv = pieceUv();
  vec4 colour = texture(uColour, uv, DETAIL_BIAS);
  vec3 relief = texture(uRelief, uv, DETAIL_BIAS).rgb;
  vec3 finish = texture(uFinish, uv, DETAIL_BIAS).rgb;
  vec3 normal = reliefNormal(relief);
  float convexity = relief.z * 2.0 - 1.0;
  vec3 across = dFdx(normal);
  vec3 down = dFdy(normal);

  vec3 view = viewFrom(uv);
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

  outColor = presented(mix(glass, gold, finish.r), uv, colour.a);
}
