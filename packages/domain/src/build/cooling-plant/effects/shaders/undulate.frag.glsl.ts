export default `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      // 获取原始贴图颜色（默认已经计算好的材质颜色）
  vec3 originalColor = material.diffuse;

      // 获取模型自带的 UV 坐标
  vec2 uv = fsInput.attributes.texCoord_0;

      // 添加时间偏移，使纹理动态滚动
  uv += u_waveSpeed * u_time * vec2(0.0, 1.0);

      // 计算波纹：使用 sin 和 cos 组合，产生波动效果
  float wave = sin(uv.x * 10.0 + u_time) * cos(uv.y * 10.0 + u_time);
      // 增大波纹幅度，使效果更明显
  wave *= u_waveScale * 2.0;

      // 使用较淡的蓝色作为基础颜色
  vec3 waterBase = vec3(0.2, 0.5, 0.9);
      // 将波纹效果叠加到基础颜色上
  vec3 waterColor = waterBase + wave;

      // 混合原始贴图颜色和波纹效果
  float blendFactor = 0.5; // blendFactor 为 0 时纯原始贴图，1 时纯水面波纹效果
  vec3 finalColor = mix(originalColor, waterColor, blendFactor);

  material.diffuse = finalColor;

      // 根据波动效果调节透明度：
      // 让波动值的绝对值越大，区域越透明，这里用 1 - clamp(|wave|, 0, 1) 作为透明度因子
  float alphaFactor = clamp(abs(wave), 0.0, 1.0);
  material.alpha = alphaFactor;
}`
