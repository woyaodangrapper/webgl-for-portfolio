export default `// vertexShader.glsl
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    // 获取本地坐标，用于生成3D噪声
    vPosition = position; 
    
    // 计算世界空间中的法线
    vNormal = normalize(normalMatrix * normal);
    
    // 计算视图空间位置，用于菲涅尔计算
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
}`
