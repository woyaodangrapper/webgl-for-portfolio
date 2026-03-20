import vertexTranslucentShader from './shaders/translucent.vert.glsl'
import fragmentTranslucentShader from './shaders/translucent.frag.glsl'
import vertexUndulateShader from './shaders/undulate.vert.glsl'
import fragmentUndulateShader from './shaders/undulate.frag.glsl'

import vertexUndulateViewShader from './shaders/undulate.view.vert.glsl'
import fragmentUndulateViewShader from './shaders/undulate.view.frag.glsl'

import vertexFrictionShader from './shaders/friction.vert.glsl'
import fragmentFrictionShader from './shaders/friction.frag.glsl'

import { createEdgeProcess, createStageLibrary, PostProcessStageManager } from './process/edgePost'
import {
  Viewer,
  Model,
  Cartesian3,
  UniformType,
  createSimpleShader,
  modelLighting,
} from '@my/gl/gis'
import { createMaterialShader, createModelOutline, Object3D, shaderListener } from '@my/gl/3ds'
import { Context } from '@my/gl/types'

// 创建一个边缘检测后处理阶段
const edgePostProcessStage: PostProcessStageManager = new PostProcessStageManager()

const uniforms = {
  u_color: {
    type: UniformType.VEC3,
    value: new Cartesian3(1.0, 1.0, 1.0),
    // value: new Cartesian3(0.0, 0.0, 0.0), // 黑
  },
  u_opacity: {
    type: UniformType.FLOAT,
    value: 0.7,
  },
}
const frictionUniforms = {
  uTime: { value: 0.0 },
}
const undulateUniforms = {
  u_time: {
    type: UniformType.FLOAT,
    value: 0,
  },
  u_waveSpeed: {
    type: UniformType.FLOAT,
    value: 0.5, // 波动速度
  },
  // 将 u_waveScale 的值调大，波纹更明显
  u_waveScale: {
    type: UniformType.FLOAT,
    value: 0.5,
  },
}
/**
 * 创建一个半透明着色器，用于模型的自定义渲染
 * @returns 自定义着色器实例
 */
export const translucentShader = createSimpleShader(
  uniforms,
  vertexTranslucentShader,
  fragmentTranslucentShader
)

/**
 * 创建一个半透明着色器，用于模型的自定义渲染
 * @returns 自定义着色器实例
 */
export const undulateShader = createSimpleShader(
  undulateUniforms,
  vertexUndulateShader,
  fragmentUndulateShader
)

/**
 * 创建一个边缘检测后处理阶段
 * @returns EdgePostProcessStage 实例
 */
export const createEdgeStageShader = (
  viewer: Viewer,
  models: Model | Model[],
  enabled: boolean = true
) => {
  let edgeStage = edgePostProcessStage.get('edgeStage')
  let compositeStage = edgePostProcessStage.get('compositeStage')
  if (edgeStage === undefined || compositeStage === undefined) {
    edgePostProcessStage.add(
      'edgeStage',
      (edgeStage = createEdgeProcess(viewer.postProcessStages, 'default'))
    )
    edgePostProcessStage.add(
      'compositeStage',
      (compositeStage = createStageLibrary(viewer.postProcessStages))
    )
  }
  const pickIds = getIds(models)
  if (enabled && pickIds.length > 0) {
    edgeStage.selected = pickIds
    compositeStage.selected = pickIds
    edgeStage.enabled = !compositeStage.enabled
  } else {
    edgeStage.selected = []
    edgeStage.enabled = false
  }

  function getIds(model: Model | Model[]): {
    pickId: string
  }[] {
    if (Array.isArray(model)) {
      return model
        .map((m) => (m as any)._pickIds)
        .flat()
        .map((pick: any) => {
          return {
            pickId: pick,
          }
        })
    }

    return ((model as any)._pickIds || []).map((pick: any) => {
      return {
        pickId: pick,
      }
    })
  }
}
/*
 * 基于图像的光照默认为IBL贴图光照
 * @param {Cartesian3} color - 颜色值
 */
export function createModelLighting(models: Model[], url?: string): Model[] {
  models.forEach((model) => {
    modelLighting(model, url)
  })
  return models
}

/**
 * 创建一个半透明波动效果，用于模型的自定义渲染
 * @returns 自定义着色器实例
 */
export const undulateMaterialShader = (uniforms: Record<string, { value: any }>) => {
  return createMaterialShader(
    { ...undulateUniforms, ...uniforms },
    vertexUndulateViewShader,
    fragmentUndulateViewShader
  )
}

/**
 * 创建一个半透明波动效果，用于模型的自定义渲染
 * @returns 自定义着色器实例
 */
export const frictionMaterialShader = (uniforms: Record<string, { value: any }>, options?: {}) => {
  return createMaterialShader(
    { ...frictionUniforms, ...uniforms },
    vertexFrictionShader,
    fragmentFrictionShader,
    options
  )
}
