uniform sampler2D uSource;
uniform int uLevel;
uniform sampler2D uOrientation;
uniform float uRadius;
uniform float uSharpnessExponent;
uniform float uHardness;
uniform float uAlpha;
uniform float uZeta;
uniform float uEta;

out vec4 outColor;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 limit = textureSize(uSource, uLevel) - 1;
  vec3 orientation = texelFetch(uOrientation, p, 0).xyz;
  float cosPhi = orientation.x;
  float sinPhi = orientation.y;
  float anisotropy = orientation.z;
  float a = uRadius * clamp((uAlpha + anisotropy) / uAlpha, 0.1, 2.0);
  float b = uRadius * clamp(uAlpha / (uAlpha + anisotropy), 0.1, 2.0);
  mat2 rotation = mat2(cosPhi, sinPhi, -sinPhi, cosPhi);
  mat2 squeeze = mat2(0.5 / a, 0.0, 0.0, 0.5 / b);
  mat2 shape = squeeze * rotation;
  int reachX = int(sqrt(a * a * cosPhi * cosPhi + b * b * sinPhi * sinPhi));
  int reachY = int(sqrt(a * a * sinPhi * sinPhi + b * b * cosPhi * cosPhi));

  vec4 mean[8];
  vec3 square[8];
  for (int k = 0; k < 8; k++) {
    mean[k] = vec4(0.0);
    square[k] = vec3(0.0);
  }

  for (int y = -reachY; y <= reachY; y++) {
    for (int x = -reachX; x <= reachX; x++) {
      vec2 v = shape * vec2(float(x), float(y));
      if (dot(v, v) > 0.25) continue;
      vec3 c = encodeSrgb(texelFetch(uSource, clamp(p + ivec2(x, y), ivec2(0), limit), uLevel).rgb);
      float w[8];
      float z;
      float vxx = uZeta - uEta * v.x * v.x;
      float vyy = uZeta - uEta * v.y * v.y;
      z = max(0.0, v.y + vxx); w[0] = z * z;
      z = max(0.0, -v.x + vyy); w[2] = z * z;
      z = max(0.0, -v.y + vxx); w[4] = z * z;
      z = max(0.0, v.x + vyy); w[6] = z * z;
      v = 0.70710678 * vec2(v.x - v.y, v.x + v.y);
      vxx = uZeta - uEta * v.x * v.x;
      vyy = uZeta - uEta * v.y * v.y;
      z = max(0.0, v.y + vxx); w[1] = z * z;
      z = max(0.0, -v.x + vyy); w[3] = z * z;
      z = max(0.0, -v.y + vxx); w[5] = z * z;
      z = max(0.0, v.x + vyy); w[7] = z * z;
      float sum = w[0] + w[1] + w[2] + w[3] + w[4] + w[5] + w[6] + w[7];
      float g = exp(-3.125 * dot(v, v)) / max(sum, 1e-6);
      for (int k = 0; k < 8; k++) {
        float wk = w[k] * g;
        mean[k] += vec4(c * wk, wk);
        square[k] += c * c * wk;
      }
    }
  }

  vec4 result = vec4(0.0);
  for (int k = 0; k < 8; k++) {
    if (mean[k].w <= 0.0) continue;
    vec3 m = mean[k].rgb / mean[k].w;
    vec3 variance = abs(square[k] / mean[k].w - m * m);
    float sigma2 = variance.r + variance.g + variance.b;
    float wk = 1.0 / (1.0 + pow(uHardness * 1000.0 * sigma2, 0.5 * uSharpnessExponent));
    result += vec4(m * wk, wk);
  }
  vec3 painted = result.w > 0.0 ? result.rgb / result.w : encodeSrgb(texelFetch(uSource, p, uLevel).rgb);
  outColor = vec4(decodeSrgb(clamp(painted, 0.0, 1.0)), 1.0);
}
