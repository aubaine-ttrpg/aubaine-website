uniform float uTime;
uniform float uNight;
uniform vec3 uColor;
uniform sampler2D uHeight;
uniform vec4 uMapRect;
varying vec2 vUv;
varying vec3 vW;

float waterInFront(vec3 w) {
  vec3 ray = w - cameraPosition;
  vec3 sea = ray.y < -1e-4 ? cameraPosition - ray * (cameraPosition.y / ray.y) : w;
  float floorY = texture2D(uHeight, (sea.xz - uMapRect.xy) / uMapRect.zw).r * 5.0 - 1.6;
  if (floorY >= 0.0) return 0.0;
  float a = 1.0 - exp(floorY * 2.3);
  float fres = 0.02 + 0.98 * pow(1.0 - max(normalize(cameraPosition - sea).y, 0.0), 5.0);
  return clamp(mix(0.36, 0.97, a) + fres * 0.25, 0.0, 1.0);
}

void main() {
  float e = 1.0 - abs(vUv.y - 0.5) * 2.0;
  float seen = 1.0 - waterInFront(vW);
#ifdef LANE_DOTS
  float u = vUv.x * 3.2 - uTime * 0.9;
  float d = 1.0 - smoothstep(0.18, 0.32, abs(fract(u) - 0.5));
  float a = d * smoothstep(0.0, 0.45, e) * (0.7 + uNight * 0.6);
  gl_FragColor = vec4(uColor * 2.2, a * seen);
#else
  float u = vUv.x * 2.4 - uTime * 0.35;
  float d = step(0.45, fract(u));
  float a = d * smoothstep(0.0, 0.45, e) * 0.75;
  gl_FragColor = vec4(uColor, a * seen);
#endif
}
