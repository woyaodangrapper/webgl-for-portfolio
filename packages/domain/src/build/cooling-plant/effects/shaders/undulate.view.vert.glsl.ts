export default `uniform vec3 u_cameraPos; // 相机位置，用于计算相机距离

out vec3 pos_eye;
out vec3 n_eye;
out vec2 v_st;

out vec3 v_normal;
out vec3 v_viewDir; // 视线方向

void main() {
  v_st = uv; // 内置 attribute uv
  pos_eye = vec3(modelViewMatrix * vec4(position, 1.0));
  n_eye = vec3(modelViewMatrix * vec4(normal, 0.0));

  // 法线经过法线矩阵变换，转换到视图空间
  v_normal = normalize(normalMatrix * normal);

  // 视线方向：顶点视图空间位置的负方向（相机在视图空间原点）
  vec3 viewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
  v_viewDir = normalize(-viewPos);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
