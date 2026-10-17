vec3 S(vec3 c) { return (any(isnan(c)) || any(isinf(c))) ? vec3(0.0) : min(c, vec3(64.0)); }
vec3 T4(sampler2D source, vec2 uv, vec2 o) {
  return S(texture2D(source, uv + o * vec2(-1.0, -1.0)).rgb) + S(texture2D(source, uv + o * vec2(1.0, -1.0)).rgb) + S(texture2D(source, uv + o * vec2(-1.0, 1.0)).rgb) + S(texture2D(source, uv + o * vec2(1.0, 1.0)).rgb);
}
