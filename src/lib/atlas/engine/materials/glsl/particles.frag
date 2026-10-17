uniform sampler2D uNoise;
uniform vec3 uC0;
uniform vec3 uC1;
uniform float uAlpha;
uniform float uNight;
varying float vAge;
varying float vSeed;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
#if defined(PARTICLE_SMOKE)
  a *= 0.55 + 0.6 * texture2D(uNoise, gl_PointCoord * 0.45 + vSeed * 5.0).r;
  a = pow(a, 1.6);
#elif defined(PARTICLE_SPARK)
  a = pow(a, 2.6);
#endif
  float fade = smoothstep(0.0, 0.12, vAge) * (1.0 - smoothstep(0.6, 1.0, vAge));
#ifdef PARTICLE_NIGHT
  float nm = smoothstep(0.15, 0.7, uNight);
#else
  float nm = 1.0;
#endif
  gl_FragColor = vec4(mix(uC0, uC1, vAge), a * fade * uAlpha * nm);
}
