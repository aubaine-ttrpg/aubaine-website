uniform float uTime;
uniform float uLength;

const vec4 WAVES[3] = vec4[3](
  vec4(0.1, 5.03, 3.14, 0.5),
  vec4(0.032, 11.0, 5.5, 1.8),
  vec4(0.012, 26.0, 11.0, -1.2)
);
const float RISE = 2.5;
const float SPREAD = 0.3;
const float PHASES[3] = float[3](0.0, 1.7, 4.1);

float rising(float share) {
  return (1.0 - exp(-RISE * share)) / (1.0 - exp(-RISE));
}

float reach(float along) {
  float share = clamp(along / uLength, 0.0, 1.0);
  return rising(share) * (1.0 - SPREAD + SPREAD * share);
}

float reachSlope(float along) {
  float share = clamp(along / uLength, 0.0, 1.0);
  float growing = RISE * exp(-RISE * share) / (1.0 - exp(-RISE));
  return (growing * (1.0 - SPREAD + SPREAD * share) + rising(share) * SPREAD) / uLength;
}

float gust(float seconds) {
  return 0.78 + 0.13 * sin(0.37 * seconds + 0.4) + 0.09 * sin(0.61 * seconds + 2.1);
}

float phaseOf(int index, float along, float across, float seconds) {
  vec4 wave = WAVES[index];
  return wave.y * along - wave.z * seconds + wave.w * across + PHASES[index];
}

vec3 swell(float along, float across, float seconds) {
  float grown = reach(along);
  float growing = reachSlope(along);
  float depth = 0.0;
  float alongSlope = 0.0;
  float acrossSlope = 0.0;
  for (int index = 0; index < 3; index++) {
    vec4 wave = WAVES[index];
    float phase = phaseOf(index, along, across, seconds);
    bool flutter = index == 2;
    float amplitude = wave.x * (flutter ? grown : 1.0);
    depth += amplitude * sin(phase);
    alongSlope += amplitude * wave.y * cos(phase) + (flutter ? wave.x * growing * sin(phase) : 0.0);
    acrossSlope += amplitude * wave.w * cos(phase);
  }
  float strength = gust(seconds);
  return vec3(depth * grown, alongSlope * grown + depth * growing, acrossSlope * grown) * strength;
}

vec3 flown(float along, float across, float seconds) {
  float grown = reach(along);
  float strength = gust(seconds);
  float drawIn = pow(grown, 1.5) * (0.02 + 0.02 * strength);
  float surge = grown * strength * 0.006 * cos(phaseOf(0, along, across, seconds));
  float edge = 0.4 + 0.6 * abs(2.0 * across - 1.0);
  float lift = grown * strength * 0.01 * sin(phaseOf(1, along, across, seconds) + 0.9) * edge;
  return vec3(along - drawIn + surge, across + lift, swell(along, across, seconds).x);
}
