uniform sampler2D uWaterN;
uniform sampler2D uHeight;
uniform vec4 uMapRect;
uniform vec3 uSkyTop;
uniform vec3 uSkyHor;
uniform vec3 uFillDir[2];
uniform vec3 uFillCol[2];
uniform vec3 uSeabed;
uniform vec2 uGridEdge;
varying vec3 vW;

void main() {
  if (unexplored(vW.xz) > 0.999) {
    gl_FragColor = vec4(veil(normalize(vW - cameraPosition)), 1.0);
    return;
  }
  vec2 uv = (vW.xz - uMapRect.xy) / uMapRect.zw;
  vec4 hm = texture2D(uHeight, uv);
  float floorY = hm.r * 5.0 - 1.6, depth = max(vW.y - floorY, 0.0), shore = hm.g * 3.0;
  vec2 p = vW.xz;
  vec2 n1 = texture2D(uWaterN, p * 0.045 + uTime * vec2(0.006, 0.004)).xy * 2.0 - 1.0;
  vec2 n2 = texture2D(uWaterN, p * 0.11 - uTime * vec2(0.005, 0.009)).xy * 2.0 - 1.0;
#ifdef DETAIL_REDUCED
  vec3 Nw = normalize(vec3(n1.x * 0.5 + n2.x * 0.35, 1.0, n1.y * 0.5 + n2.y * 0.35));
#else
  vec2 n3 = texture2D(uWaterN, p * 0.37 + uTime * vec2(-0.012, 0.008)).xy * 2.0 - 1.0;
  vec3 Nw = normalize(vec3(n1.x * 0.5 + n2.x * 0.35 + n3.x * 0.22, 1.0, n1.y * 0.5 + n2.y * 0.35 + n3.y * 0.22));
#endif
  vec3 V = normalize(cameraPosition - vW);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(Nw, V), 0.0), 5.0);
  vec3 R = reflect(-V, Nw);
  vec3 sky = mix(uSkyHor, uSkyTop, clamp(R.y * 2.6, 0.0, 1.0));
  float sd = max(dot(R, uSunDir), 0.0);
  float spec = pow(sd, 380.0) * 7.0 + pow(sd, 36.0) * 0.22;
  vec3 fills = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float fd = max(dot(R, uFillDir[k]), 0.0);
    fills += uFillCol[k] * (pow(fd, 380.0) * 7.0 + pow(fd, 36.0) * 0.22);
  }
  float a = 1.0 - exp(-depth * 2.3);
  vec3 wc = mix(vec3(0.26, 0.8, 0.78), vec3(0.06, 0.46, 0.62), smoothstep(0.0, 0.45, depth));
  wc = mix(wc, vec3(0.03, 0.22, 0.4), smoothstep(0.35, 1.35, depth));
  float diff = max(uSunDir.y, 0.06);
  vec3 col = lin(wc) * (0.3 + 0.7 * diff) * uSunInt;
  float fn = N2(p * 0.35 + uTime * 0.01) * 0.6 + N3(p * 0.9 - uTime * 0.02) * 0.4;
  float band = sin(shore * 13.0 - uTime * 1.5 + fn * 5.0) * 0.5 + 0.5;
  float foam = smoothstep(0.5, 0.0, shore) * (0.55 + 0.45 * fn);
  foam = max(foam, smoothstep(0.78, 1.0, band) * smoothstep(1.1, 0.2, shore) * fn);
  foam = clamp(foam * 1.15, 0.0, 1.0);
  col = mix(col, sky, fres * 0.55) + (uSunCol * spec * uSunInt + fills) * (1.0 - foam);
  col = mix(col, vec3(0.86, 0.92, 0.96) * (0.45 + 0.55 * diff) * uSunInt, foam * 0.92);
  col += vec3(0.1, 0.85, 0.95) * foam * uNight * 0.7;
  float alpha = clamp(mix(0.36, 0.97, a) + foam * 0.5 + fres * 0.25, 0.0, 1.0);
  vec3 emis = vec3(0.0);
  hexOverlay(vW, col, emis, 1.0);
  col += emis;
  col *= 1.0 - cloudShadow(p) * 0.3;
#ifdef WATER_ABYSS
  float openSea = 1.0;
#else
  vec2 inside = uGridEdge - abs(vW.xz);
  float openSea = 1.0 - smoothstep(1.0, 7.0, min(inside.x, inside.y) + (N2(p * 0.08) - 0.5) * 3.0);
#endif
  col = mix(col, mix(lin(uSeabed) * uSunInt * (0.3 + 0.7 * diff), col, alpha), openSea);
  alpha = mix(alpha, 1.0, openSea);
  col = atlasFog(col, vW);
  gl_FragColor = vec4(col, alpha);
}
