export default `// fragmentShader.glsl
uniform float uTime;
uniform vec3 uColorHot;   // 最热的部分（通常是白色/亮黄色）
uniform vec3 uColorWarm;  // 中间部分（橙色）
uniform vec3 uColorCold;  // 尾部散逸部分（暗红色）

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

// 经典 3D 噪声函数 (Simplex 替代方案，性能好)
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    // 1. 菲涅尔效应 (模拟边缘气体更厚、更亮的体积感)
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 1.5); // 控制边缘厚度

    // 2. 流体噪声 (模拟大气摩擦的湍流)
    // 噪声沿着Y轴向下流动 (time * speed)
    float speed = uTime * 3.0;
    vec3 noisePos = vec3(vPosition.x * 5.0, vPosition.y * 3.0 - speed, vPosition.z * 5.0);
    float noise = snoise(noisePos) * 0.5 + 0.5; // 映射到 0~1
    
    // 3. 混合计算强度
    // 假设圆柱体顶部 (vUv.y = 1.0) 是火箭头部，摩擦最强烈
    float heightMask = smoothstep(0.1, 0.9, vUv.y); 
    
    // 核心发光强度 = (菲涅尔 + 噪声起伏) * 高度遮罩，降低系数让其显得淡淡的
    float intensity = (fresnel * 0.4 + noise * 0.2) * heightMask;
    
    // 4. 颜色映射 (根据强度映射从红到白)
    vec3 finalColor = mix(uColorCold, uColorWarm, smoothstep(0.1, 0.4, intensity));
    finalColor = mix(finalColor, uColorHot, smoothstep(0.4, 0.8, intensity));

    // 5. 透明度计算 (让尾部和暗部变为透明，保留原有材质的透视)
    // 使用更柔和的过渡，并降低最大不透明度，移除动画般的硬边缘
    float alpha = smoothstep(0.05, 0.5, intensity) * 0.5;

    gl_FragColor = vec4(finalColor, alpha);
}`
