uniform sampler2D uPicture;
uniform sampler2D uDetail;
uniform sampler2D uPile;
uniform vec2 uPileTile;
uniform vec3 uLight;
uniform vec3 uField;
uniform float uHem;

in vec2 vCloth;
in vec3 vNormal;
in vec3 vAlong;
in vec3 vDown;
in float vDepth;

out vec4 outColor;

const vec3 GOLD = vec3(1.0, 0.74, 0.3);
const float KEY = 0.75;
const float AMBIENT = 0.5;
const float WRAP = 0.5;
const float VELVET_ROUGHNESS = 0.38;
const float GOLD_ROUGHNESS = 0.3;
const float GLINT_KNEE = 2.2;
const float GRAZING_WHITE = 0.2;
const float RELIEF = 1.8;
const float FOLDS = 3.5;
const float FOLD_DEPTH = 0.34;

float wrapped(float facing) {
  return max((facing + WRAP) / (1.0 + WRAP), 0.0);
}

vec3 softAmbient(vec3 normal) {
  vec3 seen = room(uRoomDiffuse, toRoom(normal));
  return mix(vec3(luminance(seen)), seen, 0.4);
}

vec3 velvet(vec3 albedo, vec3 normal, vec3 view) {
  float nl = dot(normal, uLight);
  float nv = max(dot(normal, view), 1e-3);
  vec3 halfway = normalize(uLight + view);
  float nh = max(dot(normal, halfway), 0.0);
  vec3 body = albedo * (KEY * wrapped(nl) + AMBIENT * softAmbient(normal));
  vec3 level = KEY * vec3(wrapped(uLight.z)) + AMBIENT * vec3(luminance(softAmbient(view)));
  float lit = max(nl, 0.0);
  vec3 tint = mix(albedo, vec3(luminance(albedo)), 0.35) * 2.2 + 0.08;
  vec3 sheen = tint * charlie(nh, VELVET_ROUGHNESS) * neubelt(nv, lit) * lit;
  float rim = pow(1.0 - nv, 3.0);
  return body / level * 0.92 + sheen * 0.6 + albedo * rim * 0.45;
}

vec3 gilt(vec3 base, vec3 normal, vec3 view) {
  vec3 f0 = mix(base, GOLD, 0.45);
  vec3 f90 = mix(f0, vec3(1.0), GRAZING_WHITE);
  float nl = max(dot(normal, uLight), 0.0);
  float nv = max(dot(normal, view), 1e-3);
  vec3 halfway = normalize(uLight + view);
  float nh = max(dot(normal, halfway), 0.0);
  vec3 lit = f0 + (f90 - f0) * pow(1.0 - clamp(dot(halfway, view), 0.0, 1.0), 5.0);
  vec3 seen = f0 + (f90 - f0) * pow(1.0 - nv, 5.0);
  vec3 lobe = lit * ggx(nh, GOLD_ROUGHNESS) * smithVisibility(nv, nl, GOLD_ROUGHNESS) * nl;
  vec3 mirrored = reflect(-view, normal);
  vec3 reflected = seen * luminance(roomBlurred(toRoom(mirrored), GOLD_ROUGHNESS));
  vec3 glint = lobe * 0.3 + reflected * 0.7;
  glint /= 1.0 + luminance(glint) / GLINT_KNEE;
  return glint + f0 * 0.3 * (KEY * wrapped(dot(normal, uLight)));
}

void main() {
  vec4 picture = texture(uPicture, vCloth);
  vec2 border = min(vCloth, 1.0 - vCloth) / max(fwidth(vCloth), vec2(1e-5));
  float alpha = picture.a * clamp(min(border.x, border.y) + 0.5, 0.0, 1.0);
  if (alpha < 0.004) discard;

  bool front = gl_FrontFacing;
  vec3 along = normalize(vAlong);
  float swing = 2.0 * PI * (FOLDS * vCloth.x + 0.35 * vCloth.y * vCloth.y);
  vec3 hanging = along * FOLD_DEPTH * sin(swing) * (0.45 + 0.55 * vCloth.y);
  vec3 normal = normalize(normalize(vNormal) + hanging) * (front ? 1.0 : -1.0);
  vec3 down = normalize(vDown);
  vec3 view = vec3(0.0, 0.0, 1.0);

  vec4 detail = texture(uDetail, vCloth);
  vec2 texel = 1.0 / vec2(textureSize(uDetail, 0));
  float riseAcross = texture(uDetail, vCloth + vec2(texel.x, 0.0)).g - texture(uDetail, vCloth - vec2(texel.x, 0.0)).g;
  float riseDown = texture(uDetail, vCloth + vec2(0.0, texel.y)).g - texture(uDetail, vCloth - vec2(0.0, texel.y)).g;
  vec3 raised = normalize(normal - (along * riseAcross + down * riseDown) * RELIEF);

  vec3 pile = texture(uPile, vCloth * uPileTile).xyz * 2.0 - 1.0;
  vec3 napped = normalize(along * pile.x * 0.7 + down * pile.y * 0.7 + normal * pile.z);

  float hollow = 1.0 - 0.32 * (1.0 - smoothstep(-0.9, 0.05, vDepth));
  float sleeve = mix(0.42, 1.0, smoothstep(0.0, uHem * 1.8, vCloth.y));
  vec3 colour;
  if (front) {
    vec3 field = velvet(picture.rgb, napped, view);
    vec3 gold = gilt(picture.rgb, raised, view);
    colour = mix(field, gold, detail.r);
  } else {
    vec3 lining = mix(uField, vec3(luminance(uField)), 0.5) * 0.45;
    colour = velvet(lining, napped, view);
  }
  colour *= hollow * sleeve;

  float dither = (interleavedGradient(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(clamp(encodeSrgb(shoulder(colour)) + dither, 0.0, 1.0) * alpha, alpha);
}
