layout(location = 0) in vec2 aCloth;

uniform float uEye;
uniform float uHeadroom;

out vec2 vCloth;

void main() {
  float along = aCloth.x * uLength;
  float across = aCloth.y;
  vec3 place = flown(along, across, uTime);
  vec2 centre = vec2(uLength * 0.5, 0.5);
  vec2 seen = centre + (place.xy - centre) * (uEye / (uEye - place.z));
  vec2 box = vec2(seen.x / uLength, (seen.y + uHeadroom) / (1.0 + 2.0 * uHeadroom));
  vCloth = vec2(along, across);
  gl_Position = vec4(box.x * 2.0 - 1.0, 1.0 - box.y * 2.0, 0.0, 1.0);
}
