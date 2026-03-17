import {
  Box,
  cacheModels,
  EffectComposer,
  Object3D,
  Outline,
  Selection,
  useModelShadow,
  useModelLighting,
  useModelMaterial,
  ShaderMaterial,
  shaderClock,
  setUniforms,
  Mesh,
  ensureTexture,
  ensureCubeTexture,
  createModelLighting,
  getUniforms,
  getLightUniforms,
  DirectionalLight,
  shaderListener,
  useModel,
  createModelOutline,
  OutlineEffect,
  BehaviorSubject,
  Effect,
} from '@my/gl/3ds'
import { Color, Context, Vector3 } from '@my/gl/types'

import { ReactElement, use, useEffect, useMemo, useRef, useState } from 'react'
import { undulateMaterialShader } from '../build'
const urls = ['aaa', 'bbb', 'ccc', 'ddd'].map(
  (name) => `https://webgl.crcr.top/.models/SpaceX/${name}.glb`
)

const effectsSubject = new BehaviorSubject<Effect[]>([])

export const effects$ = effectsSubject.asObservable()
/**
 * HVAC 模型组件
 * @returns
 */
export const HvacModels: React.FC<{ viewer: Context | Partial<Context> | null }> = ({
  viewer,
}): ReactElement => {
  if (!viewer || !viewer.scene || !viewer.camera || !viewer.renderer) {
    throw new Error('Viewer context is not properly initialized.')
  }
  const position = useMemo(() => ({ x: 0, y: 0, z: 5 }), [])

  // 使用 useCacheModels Hook 获取模型缓存
  const { setModels: setHvacModels } = useModel()

  // 这里把 useCacheModels 放在顶层调用，确保 Hook 规则
  const { caches, loading } = useCacheModels(urls, 20.0, position)

  // 用 state 来保存最终模型数组
  const [models, setModels] = useState<Object3D[] | null>(null)

  // 监听 caches 变化，更新 models
  useEffect(() => {
    if (caches) {
      setModels(caches)
      setHvacModels(caches)
      setModelOutline(viewer, [])
    }
  }, [caches])

  useEffect(() => {
    let dispose: (() => void) | undefined
    if (models && models.length > 0) {
      useEffects(viewer, models).then((d) => {
        dispose = d
      })
    }
    return () => {
      dispose?.()
    }
  }, [caches, loading, models, viewer])
  return <Models objects={models} />
}
export function Models({ objects, ...props }: { objects?: Object3D[] | null }): ReactElement {
  const [object3D, setObject3D] = useState<Object3D | null>(null)

  return (
    <>
      <group {...props}>
        {objects?.map((obj) => (
          <primitive
            key={obj.uuid}
            object={obj}
            onClick={(e) => {
              e.stopPropagation()
              const same = obj.uuid === object3D?.uuid
              setObject3D(same ? null : obj) // 同一个对象时取消选中
              setModelOutline({}, same ? [] : [obj])
              console.log('clicked', obj.uuid)
            }}
          ></primitive>
        ))}
      </group>
    </>
  )
}
/**
 * 在组件挂载时应用效果到模型
 * @param objects 需要应用效果的对象数组
 */
export async function useEffects(
  viewer: Context | Partial<Context>,
  objects?: Object3D[] | null
): Promise<() => void> {
  if (!viewer || !viewer.scene || !viewer.camera || !viewer.renderer) {
    console.error(
      'Viewer or its properties (scene, camera, renderer) are not properly initialized.'
    )
    return () => {}
  }
  if (!objects || objects.length === 0) {
    console.warn('No objects provided for effects.')
    return () => {}
  }

  const { dispose: disposeLight } = await useModelLighting(objects)
  const { dispose: disposeShadow } = useModelShadow(objects)

  const cubeTexture = await createModelLighting(viewer.renderer)
  const lightInfo = getLightUniforms(viewer.scene, viewer.camera, DirectionalLight)[0] ?? {
    eye: new Vector3(0, 2, 10), // 视角稍微偏高，突出立体感
    color: new Color(0.9, 0.2, 0.05), // 深红橙色，类似火箭火焰色
  }
  const { dispose: disposeMaterial } = useModelMaterial(
    [objects[0], objects[1], objects[2], objects[3]],
    (material) => {
      // console.log('Applying undulateMaterialShader to material:', {
      //   u_light_eye: { value: lightInfo.eye },
      //   u_light_color: { value: lightInfo.color },
      // })
      return undulateMaterialShader({
        u_color: { value: material.color },
        u_diffuse: { value: material.color },
        u_opacity: { value: 0.9 }, //material.opacity

        cube_texture: { value: cubeTexture },

        u_light_eye: { value: lightInfo.eye },
        u_light_color: { value: lightInfo.color },
      })
    }
  )

  const stop = shaderListener((elapsed) => {
    // console.log('Shader clock tick:', camera.position.clone())
    setUniforms([objects[0], objects[1], objects[2], objects[3]], {
      u_time: { value: elapsed },
    })
  })

  return () => {
    disposeLight()
    disposeShadow()
    disposeMaterial()
    stop()
  }
}

/**
 * 创建一个模型轮廓效果
 * @param viewer Viewer context
 * @param models  需要应用轮廓效果的模型或对象数组
 * @returns
 */
export const setModelOutline = (
  viewer: Context | Partial<Context>,
  models?: Object3D | Object3D[]
): OutlineEffect | null => {
  const { scene, camera } = viewer
  const { effect } = createModelOutline(scene, camera, models || [])
  console.log('Model outline effect created:', effect)
  effectsSubject.next([effect])
  return effect
}

/**
 * 在组件挂载时订阅 ShaderClock
 * @param onTick 回调函数
 */
export function useShaderListener(onTick: (elapsed: number) => void) {
  useEffect(() => {
    const unsub = shaderClock.subscribe(onTick)
    return () => unsub()
  }, [onTick])
}
/**
 * 异步加载模型缓存的 Hook
 * @param modelUrls 模型路径数组
 * @param size 缓存尺寸参数
 * @param position 位置信息
 * @returns { caches: Object3D[] | null, loading: boolean, error: any }
 */
export function useCacheModels(
  modelUrls: string[],
  size: number,
  position: { x: number; y: number; z: number }
): {
  caches: Object3D[] | null
  loading: boolean
} {
  const [caches, setCaches] = useState<Object3D[] | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!modelUrls || modelUrls.length === 0) {
      setCaches(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const result = await cacheModels(modelUrls, size, position)
        if (!cancelled) {
          setCaches(result)
        }
      } catch (e) {
        if (!cancelled) {
          throw e
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    // 组件卸载或依赖变更时取消后续状态更新
    return () => {
      cancelled = true
    }
  }, [
    modelUrls.join(','), // 用字符串稳定依赖数组
    size,
    position.x,
    position.y,
    position.z,
  ])

  return { caches, loading }
}
