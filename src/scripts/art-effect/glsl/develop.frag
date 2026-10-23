uniform sampler2D uSource;
uniform vec2 uSourceSize;
uniform vec2 uBacking;
uniform vec4 uCover;
uniform float uTexelsPerPixel;
uniform vec2 uClarity;

#ifdef ABERRATION
uniform float uAberration;
#endif

#ifdef HALATION
uniform vec4 uHalation;
uniform vec3 uHalationTint;
#endif

uniform vec4 uTone;
uniform vec3 uChroma;
uniform vec4 uSplit;

out vec4 outColor;

vec3 texel(ivec2 at) {
  return texelFetch(uSource, clamp(at, ivec2(0), ivec2(uSourceSize) - 1), 0).rgb;
}

vec3 catmullRom(vec2 uv) {
  vec2 position = uv * uSourceSize;
  vec2 first = floor(position - 0.5) + 0.5;
  vec2 f = position - first;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 at0 = (first - 1.0) / uSourceSize;
  vec2 at12 = (first + w2 / w12) / uSourceSize;
  vec2 at3 = (first + 2.0) / uSourceSize;
  vec3 color =
    textureLod(uSource, vec2(at0.x, at0.y), 0.0).rgb * w0.x * w0.y +
    textureLod(uSource, vec2(at12.x, at0.y), 0.0).rgb * w12.x * w0.y +
    textureLod(uSource, vec2(at3.x, at0.y), 0.0).rgb * w3.x * w0.y +
    textureLod(uSource, vec2(at0.x, at12.y), 0.0).rgb * w0.x * w12.y +
    textureLod(uSource, vec2(at12.x, at12.y), 0.0).rgb * w12.x * w12.y +
    textureLod(uSource, vec2(at3.x, at12.y), 0.0).rgb * w3.x * w12.y +
    textureLod(uSource, vec2(at0.x, at3.y), 0.0).rgb * w0.x * w3.y +
    textureLod(uSource, vec2(at12.x, at3.y), 0.0).rgb * w12.x * w3.y +
    textureLod(uSource, vec2(at3.x, at3.y), 0.0).rgb * w3.x * w3.y;
  ivec2 corner = ivec2(floor(position - 0.5));
  vec3 a = texel(corner);
  vec3 b = texel(corner + ivec2(1, 0));
  vec3 c = texel(corner + ivec2(0, 1));
  vec3 d = texel(corner + ivec2(1, 1));
  return clamp(color, min(min(a, b), min(c, d)), max(max(a, b), max(c, d)));
}

vec3 resample(vec2 uv) {
  if (uTexelsPerPixel > 1.0) return textureLod(uSource, uv, log2(uTexelsPerPixel)).rgb;
  return catmullRom(uv);
}

vec3 blurred(vec2 uv, float level) {
  vec2 reach = 0.5 * exp2(level) / uSourceSize;
  return 0.25 * (
    textureLod(uSource, uv + vec2(-reach.x, -reach.y), level).rgb +
    textureLod(uSource, uv + vec2(reach.x, -reach.y), level).rgb +
    textureLod(uSource, uv + vec2(-reach.x, reach.y), level).rgb +
    textureLod(uSource, uv + vec2(reach.x, reach.y), level).rgb
  );
}

float tone(float lightness) {
  float x = clamp(lightness, 0.0, 1.0);
  float pivot = uTone.y;
  float slope = 1.0 + uTone.x;
  float curved = x < pivot
    ? pivot * pow(x / pivot, slope)
    : 1.0 - (1.0 - pivot) * pow((1.0 - x) / (1.0 - pivot), slope);
  return uTone.z + (uTone.w - uTone.z) * curved;
}

vec3 grade(vec3 lab) {
  lab.x = tone(lab.x);
  float shadow = (1.0 - lab.x) * (1.0 - lab.x);
  float light = lab.x * lab.x;
  lab.yz += uSplit.xy * shadow + uSplit.zw * light;
  float original = length(lab.yz);
  float chroma = original * uChroma.x;
  float excess = max(chroma - uChroma.y, 0.0);
  float tamed = chroma - excess + excess / (1.0 + excess / uChroma.z);
  lab.yz *= original > 0.0 ? tamed / original : 0.0;
  return lab;
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uBacking.y - gl_FragCoord.y);
  vec2 box = pixel / uBacking;
  vec2 uv = box * uCover.xy + uCover.zw;
  vec3 color = resample(uv);

#ifdef ABERRATION
  vec2 fromCentre = box - 0.5;
  vec2 shift = fromCentre * uAberration * dot(fromCentre, fromCentre) * 2.0 * uCover.xy;
  float level = max(0.0, log2(uTexelsPerPixel));
  vec3 centre = textureLod(uSource, uv, level).rgb;
  color.r += textureLod(uSource, uv + shift, level).r - centre.r;
  color.b += textureLod(uSource, uv - shift, level).b - centre.b;
#endif

  vec3 lab = toOklab(max(color, 0.0));
  float detail = lab.x - toOklab(blurred(uv, uClarity.y)).x;
  detail /= 1.0 + abs(detail) / 0.12;
  lab.x += uClarity.x * detail * pow(clamp(4.0 * lab.x * (1.0 - lab.x), 0.0, 1.0), 0.7);
  color = max(fromOklab(lab), 0.0);

#ifdef HALATION
  vec3 glow = 0.6 * blurred(uv, uHalation.w) + 0.4 * blurred(uv, uHalation.w + 2.0);
  float bright = smoothstep(uHalation.x - uHalation.y, uHalation.x + uHalation.y, luminance(glow));
  color += glow * bright * uHalation.z * uHalationTint;
#endif

  color = max(fromOklab(grade(toOklab(color))), 0.0);

  outColor = vec4(color, 1.0);
}
