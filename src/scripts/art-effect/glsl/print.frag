uniform sampler2D uDeveloped;

out vec4 outColor;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  outColor = vec4(present(texelFetch(uDeveloped, p, 0).rgb, vec2(p)), 1.0);
}
