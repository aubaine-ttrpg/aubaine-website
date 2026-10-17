#ifndef DETAIL_REDUCED
{
  vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
  float bx = dFdx(tBump), by = dFdy(tBump);
  vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
  float det = dot(dpx, r1) * faceDirection;
  vec3 grad = sign(det) * (bx * r1 + by * r2);
  vec3 nb = abs(det) * normal - grad;
  if (dot(nb, nb) > 1e-14 && !any(isnan(nb))) normal = normalize(nb);
}
#endif
