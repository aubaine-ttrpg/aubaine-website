const float PI = 3.14159265;

uniform sampler2D uRoomSharp;
uniform sampler2D uRoomGloss;
uniform sampler2D uRoomMatte;
uniform sampler2D uRoomDiffuse;
uniform float uRoomRange;
uniform float uRoomYaw;

vec3 decodeRoom(vec4 encoded) {
  vec3 root = encoded.rgb * encoded.a;
  return root * root * uRoomRange;
}

vec2 roomUv(vec3 direction) {
  float c = cos(uRoomYaw);
  float s = sin(uRoomYaw);
  vec3 d = vec3(c * direction.x - s * direction.z, direction.y, s * direction.x + c * direction.z);
  float longitude = atan(d.x, -d.z);
  float latitude = asin(clamp(d.y, -1.0, 1.0));
  return vec2(longitude / (2.0 * PI) + 0.5, 0.5 - latitude / PI);
}

vec3 room(sampler2D level, vec3 direction) {
  return decodeRoom(textureLod(level, roomUv(direction), 0.0));
}

vec3 roomBlurred(vec3 direction, float roughness) {
  float glossy = smoothstep(0.2, 0.45, roughness);
  float matte = smoothstep(0.45, 0.65, roughness);
  float rough = smoothstep(0.65, 0.9, roughness);
  vec3 seen = mix(room(uRoomSharp, direction), room(uRoomGloss, direction), glossy);
  seen = mix(seen, room(uRoomMatte, direction), matte);
  return mix(seen, room(uRoomDiffuse, direction), rough);
}

vec3 schlick(vec3 f0, float cosine) {
  return f0 + (1.0 - f0) * pow(1.0 - clamp(cosine, 0.0, 1.0), 5.0);
}

float ggx(float nh, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

float smithVisibility(float nv, float nl, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float viewed = nl * sqrt(nv * nv * (1.0 - a2) + a2);
  float lit = nv * sqrt(nl * nl * (1.0 - a2) + a2);
  return 0.5 / max(viewed + lit, 1e-5);
}

float charlie(float nh, float roughness) {
  float inverse = 1.0 / roughness;
  float sine = max(1.0 - nh * nh, 0.0078125);
  return (2.0 + inverse) * pow(sine, inverse * 0.5) / (2.0 * PI);
}

float neubelt(float nv, float nl) {
  return clamp(1.0 / (4.0 * (nl + nv - nl * nv)), 0.0, 1.0);
}

vec2 environmentBrdf(float roughness, float facing) {
  vec4 low = vec4(-1.0, -0.0275, -0.572, 0.022);
  vec4 high = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = roughness * low + high;
  float bias = min(r.x * r.x, exp2(-9.28 * facing)) * r.x + r.y;
  return vec2(-1.04, 1.04) * bias + r.zw;
}

vec3 litByRoom(
  vec3 albedo,
  float metal,
  float roughness,
  float facing,
  vec3 reflected,
  vec3 irradiance
) {
  vec3 f0 = mix(vec3(0.04), albedo, metal);
  vec2 brdf = environmentBrdf(roughness, facing);
  vec3 single = f0 * brdf.x + brdf.y;
  float lost = 1.0 - (brdf.x + brdf.y);
  vec3 average = f0 + (1.0 - f0) * 0.047619;
  vec3 multiple = single * average / (1.0 - lost * average) * lost;
  vec3 specular = reflected * single + irradiance * multiple;
  float scattered = max(max(single.r + multiple.r, single.g + multiple.g), single.b + multiple.b);
  vec3 diffuse = albedo * (1.0 - metal) * (1.0 - scattered) * irradiance;
  return diffuse + specular;
}

vec3 neutral(vec3 colour) {
  float lowest = min(colour.r, min(colour.g, colour.b));
  float offset = lowest < 0.08 ? lowest - 6.25 * lowest * lowest : 0.04;
  colour -= offset;
  float peak = max(colour.r, max(colour.g, colour.b));
  const float start = 0.76;
  if (peak < start) return colour;
  const float headroom = 1.0 - start;
  float settled = 1.0 - headroom * headroom / (peak + headroom - start);
  colour *= settled / peak;
  float grey = 1.0 - 1.0 / (0.15 * (peak - settled) + 1.0);
  return mix(colour, vec3(settled), grey);
}

vec3 shoulder(vec3 colour) {
  vec3 over = max(colour - 0.82, 0.0);
  return min(colour, 0.82) + over / (1.0 + over / 0.18);
}

vec3 toRoom(vec3 page) {
  return vec3(page.x, -page.y, page.z);
}
