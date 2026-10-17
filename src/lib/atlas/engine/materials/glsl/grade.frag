uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uBloom;
uniform float uExpo;
uniform float uSat;
uniform float uContrast;
uniform vec3 uTint;
uniform vec3 uLift;
uniform vec3 uGamma;
uniform vec3 uGain;
uniform vec2 uSrc;
uniform float uSharp;
varying vec2 vUv;

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

vec3 grade(vec3 c) {
  c *= uExpo * uTint;
  c = aces(c);
  c = pow(max(uGain * (c + uLift * (1.0 - c)), 0.0), 1.0 / uGamma);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat);
  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  return mix(c, c * c * (3.0 - 2.0 * c), uContrast);
}

void main() {
  vec2 uv = vUv;
#ifdef GRADE_PRESENT
  vec2 shift = aberration(uv);
  vec3 c = vec3(S(texture2D(tScene, uv + shift).rgb).r, S(texture2D(tScene, uv).rgb).g, S(texture2D(tScene, uv - shift).rgb).b);
  vec3 nb = S(texture2D(tScene, uv + vec2(uSrc.x, 0.0)).rgb) + S(texture2D(tScene, uv - vec2(uSrc.x, 0.0)).rgb) + S(texture2D(tScene, uv + vec2(0.0, uSrc.y)).rgb) + S(texture2D(tScene, uv - vec2(0.0, uSrc.y)).rgb);
  c = max(c + (c * 4.0 - nb) * uSharp, vec3(0.0));
  c += S(texture2D(tBloom, uv).rgb) * uBloom;
  gl_FragColor = vec4(screenEffect(grade(c), uv), 1.0);
#else
  vec3 c = S(texture2D(tScene, uv).rgb) + S(texture2D(tBloom, uv).rgb) * uBloom;
  c = grade(c);
  gl_FragColor = vec4(c, dot(c, vec3(0.299, 0.587, 0.114)));
#endif
}
