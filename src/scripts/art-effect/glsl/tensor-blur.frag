uniform sampler2D uTensor;
uniform ivec2 uDirection;

out vec4 outColor;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 limit = textureSize(uTensor, 0) - 1;
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int k = -5; k <= 5; k++) {
    float weight = exp(-float(k * k) / 8.0);
    sum += weight * texelFetch(uTensor, clamp(p + k * uDirection, ivec2(0), limit), 0).xyz;
    total += weight;
  }
  vec3 tensor = sum / total;

#ifdef ORIENT
  float spread = tensor.y - tensor.x;
  float root = sqrt(spread * spread + 4.0 * tensor.z * tensor.z);
  float major = 0.5 * (tensor.y + tensor.x + root);
  float minor = 0.5 * (tensor.y + tensor.x - root);
  vec2 along = vec2(major - tensor.x, -tensor.z);
  vec2 direction = length(along) > 0.0 ? normalize(along) : vec2(0.0, 1.0);
  float anisotropy = major + minor > 1e-8 ? clamp((major - minor) / (major + minor), 0.0, 1.0) : 0.0;
  outColor = vec4(direction.x, -direction.y, anisotropy, 1.0);
#else
  outColor = vec4(tensor, 1.0);
#endif
}
