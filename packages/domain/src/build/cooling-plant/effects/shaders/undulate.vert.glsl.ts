export default `out vec2 v_st;
in vec2 st; // 纹理坐标
void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
v_st = st; // 传递纹理坐标
}`
