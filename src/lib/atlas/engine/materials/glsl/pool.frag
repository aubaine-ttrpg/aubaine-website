uniform float uTime;
uniform float uNight;
uniform float uFogDensity;
uniform vec3 uColor;
varying vec2 vDisc;
varying vec3 vW;
varying float vStrength;
void main() {
  float reach = max(0.0, 1.0 - length(vDisc));
  float flicker = 0.92 + 0.08 * sin(uTime * 2.7 + vW.x * 6.1 + vW.z * 4.3);
  float distance = length(cameraPosition - vW);
  float clear = exp(-uFogDensity * uFogDensity * distance * distance);
  float a = reach * reach * vStrength * smoothstep(0.25, 0.85, uNight) * flicker * clear;
  gl_FragColor = vec4(uColor, a);
}
