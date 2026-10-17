attribute vec4 aColour;
attribute vec4 aNormalFlutter;
#ifdef USE_INSTANCING
attribute vec4 aTint;
#endif
uniform float uTime;
varying float vKind;
varying vec3 vLocal;
varying vec3 vW;
varying vec3 vWN;
varying vec3 vIP;
varying vec3 vColour;

vec3 propLinear(vec3 c) {
  return mix(pow(c * 0.9478672986 + 0.0521327014, vec3(2.4)), c * 0.0773993808, vec3(lessThanEqual(c, vec3(0.04045))));
}
vec3 propOrigin() {
#ifdef USE_INSTANCING
  return vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
#else
  return vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]);
#endif
}
bool propRotates() { return aColour.w > 18.5 && aColour.w < 19.5; }
mat2 propRotor(vec3 origin) {
  float ra = uTime * 1.1 + origin.x * 3.0;
  return mat2(cos(ra), sin(ra), -sin(ra), cos(ra));
}
bool propLeafy() {
  float k = aColour.w;
  return (k > 1.5 && k < 2.5) || (k > 20.5 && k < 21.5);
}
bool propCloth() {
  float k = aColour.w;
  return (k > 8.5 && k < 9.5) || (k > 21.5 && k < 22.5);
}
vec3 propDownwind() {
#ifdef USE_INSTANCING
  mat3 frame = mat3(modelMatrix) * mat3(instanceMatrix);
#else
  mat3 frame = mat3(modelMatrix);
#endif
  vec3 wind = vec3(WIND.x, 0.0, WIND.y);
  return normalize(vec3(dot(frame[0], wind), dot(frame[1], wind), dot(frame[2], wind)));
}
vec3 propWindShift(vec3 origin, vec3 local, vec3 localNormal) {
  vec3 downwind = propDownwind();
  float gust = 0.65 + 0.35 * sin(dot(origin.xz, WIND) * 1.6 - uTime * 1.3);
  if (propLeafy()) {
    float sway = sin(uTime * 1.7 + origin.x * 0.9 + origin.z * 0.7 + local.y * 3.0);
    return downwind * (0.008 + 0.017 * sway) * gust * max(local.y, 0.0);
  }
  float reach = aNormalFlutter.w;
  vec3 across = localNormal * (dot(localNormal, vec3(0.31, 0.53, 0.79)) < 0.0 ? -1.0 : 1.0);
  float wave = sin(uTime * 6.5 - reach * 30.0 + origin.x * 1.3 + origin.z * 0.7);
  return (downwind * 0.4 * gust + across * wave) * 0.17 * reach;
}
