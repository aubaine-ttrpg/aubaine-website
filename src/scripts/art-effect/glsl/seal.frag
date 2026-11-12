uniform sampler2D uColour;
uniform sampler2D uRelief;
uniform sampler2D uFinish;
uniform vec3 uWaxDeep;
uniform vec3 uWaxPale;
uniform float uMica;

out vec4 outColor;

const float SPECULAR_OCCLUSION = 0.6;
const float ROOM_DIFFUSE = 0.15;
const float KEY_DIFFUSE = 1.3;
const float WRAP = 0.1;
const float ROOM_ON_SHEEN = 0.35;
const float BROAD_ROUGHNESS = 0.55;
const float BROAD_KEY = 0.3;
const float SHEEN = 1.0;
const float SHEEN_PALES_FROM = 0.0;
const float SHEEN_PALES_TO = 1.2;
const float CREVICE_SHADE = 0.2;

const float FLAKES_ACROSS = 110.0;
const float FLAKE_SHARE = 0.22;
const float FLAKE_TILT = 0.45;
const float FLAKE_ROUGHNESS = 0.14;
const float FLAKE_ROOM = 0.12;

float wrapped(vec3 normal, vec3 light) {
  return max((dot(normal, light) + WRAP) / (1.0 + WRAP), 0.0);
}

float micaSparkle(vec2 uv, vec3 normal, vec3 view, float lit) {
  vec2 cells = uv * FLAKES_ACROSS;
  float footprint = max(fwidth(cells.x), fwidth(cells.y));
  float resolved = 1.0 - smoothstep(0.35, 0.7, footprint);
  vec3 flake = hash3(ivec2(floor(cells)), 7u);
  if (flake.z > FLAKE_SHARE || resolved <= 0.0) return 0.0;
  vec3 tilted = normalize(normal + FLAKE_TILT * vec3(flake.xy * 2.0 - 1.0, 0.0));
  float roomGlint = FLAKE_ROOM * luminance(room(uRoomSharp, reflect(-view, tilted)));
  return (keySpecular(tilted, view, FLAKE_ROUGHNESS) + roomGlint) * lit * resolved;
}

vec3 wax(
  vec3 albedo,
  vec3 normal,
  vec3 view,
  float facing,
  float roughness,
  vec3 finish,
  float convexity,
  vec2 uv
) {
  float occlusion = finish.g;
  float shadow = finish.b;
  vec3 light = normalize(uKey);

  vec3 irradiance = room(uRoomDiffuse, normal) * occlusion;
  float keyed = wrapped(normal, light) * shadow * occlusion * KEY_DIFFUSE;
  vec3 body = albedo * (irradiance * ROOM_DIFFUSE + vec3(keyed));

  float reflected =
    luminance(roomBlurred(reflect(-view, normal), roughness)) *
    mix(1.0, occlusion, SPECULAR_OCCLUSION);
  float diffuseLight = luminance(irradiance);
  vec3 bounced = litByRoom(vec3(1.0), 1.0, roughness, facing, vec3(reflected), vec3(diffuseLight));
  float keySheen =
    (keySpecular(normal, view, roughness) + BROAD_KEY * keySpecular(normal, view, BROAD_ROUGHNESS)) *
    occlusion *
    shadow;
  float sheen = SHEEN * (ROOM_ON_SHEEN * bounced.r + keySheen);
  sheen += uMica * micaSparkle(uv, normal, view, occlusion * shadow);

  vec3 shaded = body * mix(1.0, CREVICE_SHADE, max(-convexity, 0.0) * (1.0 - occlusion));
  float paling = smoothstep(SHEEN_PALES_FROM, SHEEN_PALES_TO, sheen * uExposure);
  return keepHue((shaded + sheen * mix(uWaxDeep, uWaxPale, paling)) * uExposure);
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
  float roughness = antialiased(finish.r, across, down);

  vec3 shaded = wax(colour.rgb, normal, view, facing, roughness, finish, convexity, uv);
  outColor = presented(shaded, uv, colour.a);
}
