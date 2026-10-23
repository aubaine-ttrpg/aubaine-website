uniform sampler2D uSource;
uniform int uLevel;

out vec4 outColor;

vec3 at(ivec2 p) {
  ivec2 limit = textureSize(uSource, uLevel) - 1;
  return encodeSrgb(texelFetch(uSource, clamp(p, ivec2(0), limit), uLevel).rgb);
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec3 sx = (at(p + ivec2(-1, -1)) + 2.0 * at(p + ivec2(-1, 0)) + at(p + ivec2(-1, 1)) -
    at(p + ivec2(1, -1)) - 2.0 * at(p + ivec2(1, 0)) - at(p + ivec2(1, 1))) / 4.0;
  vec3 sy = (at(p + ivec2(-1, -1)) + 2.0 * at(p + ivec2(0, -1)) + at(p + ivec2(1, -1)) -
    at(p + ivec2(-1, 1)) - 2.0 * at(p + ivec2(0, 1)) - at(p + ivec2(1, 1))) / 4.0;
  outColor = vec4(dot(sx, sx), dot(sy, sy), dot(sx, sy), 1.0);
}
