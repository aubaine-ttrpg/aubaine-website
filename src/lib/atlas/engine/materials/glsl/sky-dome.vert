varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + mat3(modelMatrix) * position, 1.0);
  gl_Position = p.xyww;
}
