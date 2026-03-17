export default `#ifdef GL_ES
precision highp float;
#endif

// ==== 常量配置（写死在着色器里） ====
// const float BASE_FREQ = 6.0;     // 第一层大波纹频率
const float MID_FREQ = 12.0;    // 第二层中波纹频率
const float HIGH_FREQ = 24.0;    // 第三层细波纹频率

const float BASE_AMP = 1.0;     // 第一层振幅权重
const float MID_AMP = 0.5;     // 第二层振幅权重
const float HIGH_AMP = 0.25;    // 第三层振幅权重

const float NORMAL_BLEND = 0.5;    // 原始法线与凹凸法线混合权重

const float EDGE_MIN = 0.05;    // 描边灵敏度下限
const float EDGE_MAX = 0.15;    // 描边灵敏度上限

const vec2 CENTER_UV_RANGE = vec2(0.0, 0.5); // 径向衰减范围：从中心到0.5

// const float WAVE_DEPTH = .66;   // 越大波纹越“深”，推荐范围 0.5 ~ 2.0

in vec3 pos_eye;
in vec3 n_eye;
in vec2 v_st;

uniform samplerCube cube_texture;
uniform float u_opacity;
uniform vec3 u_color;
uniform vec3 u_light_eye;
uniform vec3 u_light_color;

uniform float u_time;
uniform float u_waveSpeed;
uniform float u_waveScale;
vec3 toneMapSoft(vec3 color) {
  float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722)); // 感知亮度
  float excess = max(brightness - 2000.0, 0.0);                    // 超过 1 的部分
  float scale = 1.0 / (1.0 + excess * 0.6);                     // 衰减强度可调
  return color * scale;
}

float lerpWaveParam(float camDist, float minDist, float maxDist, float minVal, float maxVal) {
  float t = clamp((camDist - minDist) / (maxDist - minDist), 0.0, 1.0);
  t = 1.0 - t; //  反转映射关系
  return mix(minVal, maxVal, t);
}

void main() {

  // 根据相机距离调整波纹参数和振幅(不要这个效果了，容易头晕)
  float WAVE_DEPTH = lerpWaveParam(length(pos_eye), 120.0, 200.0, 0.66, 0.66);
  float BASE_FREQ = lerpWaveParam(length(pos_eye), 120.0, 200.0, 6.0, 6.0);

  // 1. 基础法线
  vec3 normal = normalize(n_eye);

  // 2. 多频叠加波纹 + 径向衰减
  vec2 uv = v_st + vec2(0.0, u_waveSpeed * u_time);
  float w1 = sin(uv.x * BASE_FREQ + u_time) * cos(uv.y * BASE_FREQ + u_time) * BASE_AMP;
  float w2 = sin(uv.x * MID_FREQ + u_time * 1.5) * cos(uv.y * MID_FREQ + u_time * 1.3) * MID_AMP;
  float w3 = sin(uv.x * HIGH_FREQ + u_time * 2.0) * cos(uv.y * HIGH_FREQ + u_time * 1.8) * HIGH_AMP;
  float wave = (w1 + w2 + w3) * WAVE_DEPTH * u_waveScale;

  // 径向衰减（从 CENTER_UV_RANGE.x 到 CENTER_UV_RANGE.y）
  float dist = distance(v_st, vec2(0.5));
  float atten = mix(0.5, 1.0, smoothstep(CENTER_UV_RANGE.x, CENTER_UV_RANGE.y, dist));
  wave *= atten;

  // 3. 凹凸扰动（Bump Mapping）
  float eps = 0.001;
  float waveL = sin((uv.x - eps) * BASE_FREQ + u_time) * cos(uv.y * BASE_FREQ + u_time);
  float waveR = sin((uv.x + eps) * BASE_FREQ + u_time) * cos(uv.y * BASE_FREQ + u_time);
  float dhdx = (waveR - waveL) / (2.0 * eps);

  float waveD = sin(uv.x * BASE_FREQ + u_time) * cos((uv.y - eps) * BASE_FREQ + u_time);
  float waveU = sin(uv.x * BASE_FREQ + u_time) * cos((uv.y + eps) * BASE_FREQ + u_time);
  float dhdy = (waveU - waveD) / (2.0 * eps);

  vec3 bumpNormal = normalize(vec3(-dhdx, -dhdy, 1.0));
  normal = normalize(mix(normal, bumpNormal, NORMAL_BLEND));

  // 4. 漫反射光照
  vec3 lightDir = normalize(-u_light_eye);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = u_light_color * diff;

  // 5. 环境映射
  vec3 incident_eye = normalize(-pos_eye);
  vec3 reflected = reflect(incident_eye, normal);
  vec3 envColor = texture(cube_texture, reflected).rgb;

  // 6. 基础色合成
  vec3 baseColor = mix(envColor * 0.5 + diffuse * 0.5, vec3(0.2, 0.5, 0.9) + 0.5 * envColor, 0.6);

  // 7. 波纹边缘检测 & 白描边
  float grad = length(vec2(dFdx(wave), dFdy(wave)));
  float edge = smoothstep(EDGE_MIN, EDGE_MAX, grad);
  vec3 outlineColor = vec3(1.0);
  vec3 finalColor = mix(baseColor, outlineColor, -edge);

  // 8. 动态透明度
  float alphaFactor = u_opacity * (0.7 + 0.3 * (1.0 - abs(wave)));

  finalColor = toneMapSoft(finalColor);

  gl_FragColor = vec4(finalColor * u_color, alphaFactor);
}`
