// 后处理、粒子系统、着色器特效。可以用于创建复杂的视觉效果，如水面反射、光晕、模糊等
// 可以当成 visuals-effects 的子集（“基类”）
import {
  CustomShader,
  UniformType,
  Cartesian2,
  Cartesian3,
  Cartesian4,
  LightingModel,
  CustomShaderMode,
  CustomShaderTranslucencyMode,
} from 'cesium'

// 导出相关类型
export { UniformType, Cartesian2, Cartesian3, Cartesian4 }

/**
 * 创建一个简单的 Cesium CustomShader
 * @param uniforms 传入的片元着色器 uniform 定义，格式为 { name: { type: UniformType, value:  number | boolean | Cartesian3 | Cartesian2 | Cartesian4 } }
 * @param vertexShader 自定义顶点着色器主体代码（接收 st 纹理坐标并传递）
 * @param fragmentShader 自定义片元着色器主体代码（必须有 fragmentMain 函数）
 * @returns Cesium.CustomShader 实例
 */
export function createSimpleShader(
  uniforms: Record<
    string,
    {
      type: UniformType
      value: number | boolean | Cartesian3 | Cartesian2 | Cartesian4
    }
  >,
  vertexShader: string,
  fragmentShader: string
): CustomShader {
  return new CustomShader({
    uniforms,
    lightingModel: LightingModel.PBR,
    mode: CustomShaderMode.MODIFY_MATERIAL,
    translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT,
    vertexShaderText: vertexShader,
    fragmentShaderText: fragmentShader,
  })
}
