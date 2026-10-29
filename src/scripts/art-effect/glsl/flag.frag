uniform sampler2D uPicture;
uniform sampler2D uWeave;
uniform float uWeaveTile;
uniform float uHeading;
uniform vec3 uLight;

in vec2 vCloth;

out vec4 outColor;

const vec3 CANVAS = vec3(0.78, 0.74, 0.64);
const vec3 STITCH = vec3(0.58, 0.54, 0.45);
const vec3 BRASS = vec3(0.86, 0.66, 0.32);
const float KEY = 0.82;
const float AMBIENT = 0.4;
const float WRAP = 0.25;
const float GROMMET_INSET = 0.075;
const float GROMMET_OUTER = 0.017;
const float GROMMET_INNER = 0.0085;

float wrapped(float facing) {
  return max((facing + WRAP) / (1.0 + WRAP), 0.0);
}

vec3 softAmbient(vec3 normal) {
  vec3 seen = room(uRoomDiffuse, toRoom(normal));
  return mix(vec3(luminance(seen)), seen, 0.35);
}

vec3 brass(vec3 normal, vec3 view) {
  vec3 halfway = normalize(uLight + view);
  float nl = max(dot(normal, uLight), 0.0);
  float nv = max(dot(normal, view), 1e-3);
  float nh = max(dot(normal, halfway), 0.0);
  float roughness = 0.32;
  vec3 fresnel = schlick(BRASS, dot(halfway, view));
  vec3 lobe = fresnel * ggx(nh, roughness) * smithVisibility(nv, nl, roughness) * nl;
  vec3 mirrored = reflect(-view, normal);
  vec3 reflected = schlick(BRASS, nv) * roomBlurred(toRoom(mirrored), roughness);
  return lobe * 1.6 + reflected * 0.55;
}

void main() {
  float along = vCloth.x;
  float across = vCloth.y;
  vec3 swollen = swell(along, across, uTime);
  vec3 normal = normalize(vec3(-swollen.y, -swollen.z, 1.0));
  vec3 tangent = normalize(vec3(1.0, 0.0, swollen.y));
  vec3 bitangent = normalize(vec3(0.0, 1.0, swollen.z));
  bool heading = along < uHeading;

  vec3 thread = texture(uWeave, vec2(along, across) / (uWeaveTile * (heading ? 0.8 : 1.0))).xyz * 2.0 - 1.0;
  thread.xy *= heading ? 0.55 : 0.28;
  vec3 surface = normalize(tangent * thread.x + bitangent * thread.y + normal * thread.z);

  vec3 albedo = heading ? CANVAS : texture(uPicture, vec2(along / uLength, across)).rgb;
  float alpha = 1.0;
  vec3 view = vec3(0.0, 0.0, 1.0);

  if (heading) {
    float seam = uHeading - 0.0065;
    float stitchWidth = 0.0013;
    float onSeam = 1.0 - smoothstep(stitchWidth, stitchWidth + fwidth(along), abs(along - seam));
    float dash = smoothstep(0.35, 0.45, fract(across / 0.021)) * (1.0 - smoothstep(0.85, 0.95, fract(across / 0.021)));
    albedo = mix(albedo, STITCH, onSeam * dash);
  }
  float crease = 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.006, abs(along - uHeading)));

  float nl = dot(surface, uLight);
  vec3 lit = KEY * wrapped(nl) + AMBIENT * softAmbient(surface);
  vec3 level = KEY * vec3(wrapped(uLight.z)) + AMBIENT * vec3(luminance(softAmbient(view)));
  float hollow = 1.0 - 0.28 * (1.0 - smoothstep(-0.1, 0.0, swollen.x));
  vec3 halfway = normalize(uLight + view);
  float sheen = charlie(max(dot(surface, halfway), 0.0), 0.5) * neubelt(max(surface.z, 1e-3), max(nl, 0.0)) * max(nl, 0.0);
  vec3 colour = albedo * (lit / level) * hollow * crease + albedo * sheen * 0.18 + vec3(sheen * 0.025);

  for (int index = 0; index < 2; index++) {
    vec2 centre = vec2(uHeading * 0.5, index == 0 ? GROMMET_INSET : 1.0 - GROMMET_INSET);
    vec2 offset = vec2(along, across) - centre;
    float gap = length(offset);
    float edge = fwidth(gap);
    float ring = smoothstep(GROMMET_INNER - edge, GROMMET_INNER + edge, gap) * (1.0 - smoothstep(GROMMET_OUTER - edge, GROMMET_OUTER + edge, gap));
    if (ring > 0.0) {
      float rise = clamp((gap - GROMMET_INNER) / (GROMMET_OUTER - GROMMET_INNER), 0.0, 1.0);
      vec2 outward = offset / max(gap, 1e-5);
      vec3 local = normalize(vec3(-outward * cos(PI * rise) * 1.4, sin(PI * rise) + 0.25));
      vec3 bent = normalize(tangent * local.x + bitangent * local.y + normal * local.z);
      colour = mix(colour, brass(bent, view), ring);
    }
    float shadow = 1.0 - 0.35 * (1.0 - smoothstep(GROMMET_OUTER, GROMMET_OUTER + 0.006, gap)) * (1.0 - ring);
    colour *= shadow;
    alpha *= smoothstep(GROMMET_INNER - edge * 2.0, GROMMET_INNER, gap);
  }

  float dither = (interleavedGradient(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(clamp(encodeSrgb(shoulder(colour)) + dither, 0.0, 1.0) * alpha, alpha);
}
