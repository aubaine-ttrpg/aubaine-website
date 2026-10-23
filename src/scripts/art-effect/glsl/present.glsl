uniform vec3 uGrain;
uniform vec2 uGrainTone;
uniform uint uSeed;

vec3 grainAt(vec2 pixel) {
  vec3 soft = valueNoise3(pixel / uGrain.y, uSeed);
  vec3 sharp = hash3(ivec2(pixel), uSeed + 7919u);
  vec3 noise = (0.65 * soft + 0.35 * sharp - 0.5) * 2.0;
  return mix(vec3(noise.g), noise, uGrain.z);
}

float grainWeight(float tone) {
  return mix(uGrainTone.x, 1.0, smoothstep(0.0, 0.3, tone)) *
    mix(1.0, uGrainTone.y, smoothstep(0.55, 1.0, tone));
}

vec3 present(vec3 linear, vec2 pixel) {
  vec3 encoded = encodeSrgb(linear);
  encoded += uGrain.x * grainWeight(luminance(encoded)) * grainAt(pixel);
  float shift = float(uSeed & 255u);
  float dither = interleavedGradient(pixel + shift * 5.588238) +
    interleavedGradient(pixel.yx + 17.0 + shift * 3.117) - 1.0;
  return clamp(encoded + dither / 255.0, 0.0, 1.0);
}
