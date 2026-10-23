const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float luminance(vec3 color) {
  return dot(color, LUMA);
}

vec3 encodeSrgb(vec3 linear) {
  vec3 c = clamp(linear, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

vec3 decodeSrgb(vec3 encoded) {
  vec3 c = clamp(encoded, 0.0, 1.0);
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

vec3 toOklab(vec3 color) {
  vec3 lms = vec3(
    dot(color, vec3(0.4122214708, 0.5363325363, 0.0514459929)),
    dot(color, vec3(0.2119034982, 0.6806995451, 0.1073969566)),
    dot(color, vec3(0.0883024619, 0.2817188376, 0.6299787005))
  );
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return vec3(
    dot(lms, vec3(0.2104542553, 0.7936177850, -0.0040720468)),
    dot(lms, vec3(1.9779984951, -2.4285922050, 0.4505937099)),
    dot(lms, vec3(0.0259040371, 0.7827717662, -0.8086757660))
  );
}

vec3 fromOklab(vec3 lab) {
  vec3 lms = vec3(
    dot(lab, vec3(1.0, 0.3963377774, 0.2158037573)),
    dot(lab, vec3(1.0, -0.1055613458, -0.0638541728)),
    dot(lab, vec3(1.0, -0.0894841775, -1.2914855480))
  );
  lms = lms * lms * lms;
  return vec3(
    dot(lms, vec3(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(lms, vec3(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(lms, vec3(-0.0041960863, -0.7034186147, 1.7076147010))
  );
}

uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  return v;
}

vec3 hash3(ivec2 cell, uint seed) {
  return vec3(pcg3d(uvec3(uvec2(cell + 65536), seed)) >> 8u) * (1.0 / 16777216.0);
}

vec3 valueNoise3(vec2 p, uint seed) {
  vec2 cell = floor(p);
  vec2 f = p - cell;
  vec2 u = f * f * (3.0 - 2.0 * f);
  ivec2 c = ivec2(cell);
  vec3 bottom = mix(hash3(c, seed), hash3(c + ivec2(1, 0), seed), u.x);
  vec3 top = mix(hash3(c + ivec2(0, 1), seed), hash3(c + ivec2(1, 1), seed), u.x);
  return mix(bottom, top, u.y);
}

float interleavedGradient(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float emboss(vec2 slope, vec2 light) {
  return -dot(slope, light);
}
