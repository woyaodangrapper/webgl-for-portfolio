export default `float iTime = 0.004; //czm_frameNumber * 0.004
vec2 iResolution = vec2(1, 1);
in vec2 v_st;
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  material.diffuse = u_color;
  material.alpha = .5;
}`
