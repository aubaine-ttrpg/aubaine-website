layout(location = 0) in vec2 aCloth;

uniform highp sampler2D uNodes;
uniform ivec2 uGrid;
uniform float uAspect;
uniform float uEye;
uniform float uDepth;

out vec2 vCloth;
out vec3 vNormal;
out vec3 vAlong;
out vec3 vDown;
out float vDepth;

vec3 node(int column, int row) {
  return texelFetch(uNodes, ivec2(column, row), 0).xyz;
}

vec3 columnExtended(int column, int row) {
  int clamped = clamp(column, 0, uGrid.x - 1);
  vec3 here = node(clamped, row);
  int beyond = column - clamped;
  return beyond == 0 ? here : here + (here - node(clamped - beyond, row));
}

vec3 nodeAt(int column, int row) {
  int clamped = clamp(row, 0, uGrid.y - 1);
  vec3 here = columnExtended(column, clamped);
  int beyond = row - clamped;
  return beyond == 0 ? here : here + (here - columnExtended(column, clamped - beyond));
}

vec4 spline(float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  return vec4(-0.5 * t3 + t2 - 0.5 * t, 1.5 * t3 - 2.5 * t2 + 1.0, -1.5 * t3 + 2.0 * t2 + 0.5 * t, 0.5 * t3 - 0.5 * t2);
}

vec4 splineSlope(float t) {
  float t2 = t * t;
  return vec4(-1.5 * t2 + 2.0 * t - 0.5, 4.5 * t2 - 5.0 * t, -4.5 * t2 + 4.0 * t + 0.5, 1.5 * t2 - t);
}

void main() {
  vec2 cells = vec2(uGrid - 1);
  vec2 at = aCloth * cells;
  ivec2 base = clamp(ivec2(floor(at)), ivec2(0), uGrid - 2);
  vec2 t = at - vec2(base);
  vec4 across = spline(t.x);
  vec4 down = spline(t.y);
  vec4 acrossSlope = splineSlope(t.x);
  vec4 downSlope = splineSlope(t.y);
  vec3 place = vec3(0.0);
  vec3 along = vec3(0.0);
  vec3 fall = vec3(0.0);
  for (int row = 0; row < 4; row++) {
    for (int column = 0; column < 4; column++) {
      vec3 p = nodeAt(base.x + column - 1, base.y + row - 1);
      place += down[row] * across[column] * p;
      along += down[row] * acrossSlope[column] * p;
      fall += downSlope[row] * across[column] * p;
    }
  }
  vec2 centre = vec2(uAspect * 0.5, 0.5);
  vec2 seen = centre + (place.xy - centre) * (uEye / (uEye - place.z));
  vNormal = normalize(cross(along, fall));
  vAlong = normalize(along);
  vDown = normalize(fall);
  vCloth = aCloth;
  vDepth = place.z / uDepth;
  gl_Position = vec4(seen.x / uAspect * 2.0 - 1.0, 1.0 - seen.y * 2.0, -0.5 * vDepth, 1.0);
}
