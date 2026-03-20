import {
  BlendFunction,
  EffectComposer,
  OutlineEffect,
  RenderPass,
  EffectPass,
} from 'postprocessing'
import {
  EquirectangularReflectionMapping,
  MeshStandardMaterial,
  Mesh,
  Object3D,
  ShaderMaterial,
  UniformsUtils,
  Material,
  MeshBasicMaterial,
  IUniform,
  WebGLCubeRenderTarget,
  WebGLRenderer,
  DodecahedronGeometry,
  CubeTexture,
  Vector3,
  Scene,
  DirectionalLight,
  Camera,
  PointLight,
  SpotLight,
  Color,
} from 'three'
import { EXRLoader, RGBELoader } from 'three-stdlib'
type MaterialFunction = (material: MeshStandardMaterial) => ShaderMaterial | undefined

type LoaderType = typeof RGBELoader | typeof EXRLoader

type LightType = typeof DirectionalLight | typeof PointLight | typeof SpotLight

export type { RGBELoader, EXRLoader, MaterialFunction }
export { Mesh, ShaderMaterial, DirectionalLight }
/*
 * 基于图像的光照默认为IBL贴图光照
 */
export async function useModelLighting(
  models: Object3D[],
  type: LoaderType = RGBELoader,
  url?: string
): Promise<{ models: Object3D[]; dispose: () => void }> {
  const loader = new type()
  let materials: Map<number, Material | MeshBasicMaterial> = new Map()

  const environmentMapURL =
    url ??
    (type === RGBELoader
      ? 'https://webgl.crcr.top/.models/light/qwantani_mid_morning_puresky_2k.hdr'
      : 'https://webgl.crcr.top/.models/light/qwantani_mid_morning_puresky_2k.exr')

  const texture = await loader.loadAsync(environmentMapURL)
  texture.mapping = EquirectangularReflectionMapping

  const params = {
    roughness: 0.58,
    metalness: 0.0,
  }

  let material = new MeshStandardMaterial({
    color: 0xffffff,
    metalness: params.metalness,
    roughness: params.roughness,
    lightMap: texture,
  })

  models.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        materials.set(child.id, child.material.clone())

        // child.material = material
        child.material = child.material
        child.material.envMap = texture
        child.material.envMapIntensity = 0.8 // 影响强度，默认 1
        child.material.needsUpdate = true
      }
    })
  })
  console.log('环境贴图加载成功', environmentMapURL)
  let disposed = false
  return {
    models,
    dispose: () => {
      if (disposed) return
      disposed = true
      models.forEach((model) => {
        model.traverse((child) => {
          if (child instanceof Mesh && materials.has(child.id)) {
            child.material = materials.get(child.id)!
          }
        })
      })
      materials.clear()
    },
  }
}

export async function createModelLighting(
  renderer: WebGLRenderer,
  type: LoaderType = RGBELoader,
  url?: string
): Promise<CubeTexture> {
  const environmentMapURL =
    url ??
    (type === RGBELoader
      ? 'https://webgl.crcr.top/.models/light/qwantani_mid_morning_puresky_2k.hdr'
      : 'https://webgl.crcr.top/.models/light/qwantani_mid_morning_puresky_2k.exr')
  const loader = new type()

  const envMap = await loader.loadAsync(environmentMapURL)
  envMap.mapping = EquirectangularReflectionMapping
  const cubeTarget = new WebGLCubeRenderTarget(256)
  cubeTarget.fromEquirectangularTexture(renderer, envMap)
  return cubeTarget.texture
}
/**
 * 设置模型的阴影属性
 * @param models 模型数组
 * @returns {Object3D[]} 返回设置了阴影属性的模型数组
 */
export function useModelShadow(models: Object3D[]): { models: Object3D[]; dispose: () => void } {
  models.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  })
  let disposed = false

  return {
    models,
    dispose: () => {
      if (disposed) return
      disposed = true
      models.forEach((model) => {
        model.traverse((child) => {
          if (child instanceof Mesh) {
            child.castShadow = false
            child.receiveShadow = false
          }
        })
      })
    },
  }
}

/**
 * 设置模型的材质
 * @param models 模型数组
 * @param material 材质
 * @returns {Object3D[]} 返回设置了材质的模型数组
 */
export function useModelMaterial(
  models: Object3D[],
  set?: MaterialFunction
): { models: Object3D[]; dispose: () => void } {
  const materials = new Map<number, Material>()

  models.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        // child.material.toneMapped = false
        const clonedMaterial = child.material.clone()
        materials.set(child.id, clonedMaterial)

        if (set) {
          child.material = set(clonedMaterial) || clonedMaterial
        } else {
          child.material = clonedMaterial
        }
        child.material.needsUpdate = true
      }
    })
  })

  let disposed = false
  return {
    models,
    dispose: () => {
      if (disposed) return
      disposed = true
      models.forEach((model) => {
        model.traverse((child) => {
          if (child instanceof Mesh && materials.has(child.id)) {
            child.material.toneMapped = true
            child.material = materials.get(child.id)!
          }
        })
      })

      materials.clear()
    },
  }
}

/**
 * 更新模型的 ShaderMaterial uniforms
 * @param models - Object3D 数组
 * @param uniforms - 要更新的 uniforms
 * @returns 一个 Map，包含所有被更新的材质
 */
export function setUniforms(
  models: Object3D[],
  uniforms: { [uniform: string]: IUniform<any> }
): Map<number, ShaderMaterial> {
  const materials = new Map<number, ShaderMaterial>()

  models.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof Mesh && child.material instanceof ShaderMaterial) {
        if (!materials.has(child.id)) {
          child.material = child.material
          materials.set(child.id, child.material)
        }

        const material = materials.get(child.id)!
        for (const key in uniforms) {
          if (material.uniforms[key]) {
            material.uniforms[key].value = uniforms[key].value
          } else {
            material.uniforms[key] = uniforms[key]
          }
        }

        material.needsUpdate = true
      }
    })
  })

  return materials
}

/**
 * 从模型中获取 ShaderMaterial 的 uniforms
 * @param models - Object3D 数组
 * @param keys - 可选，指定需要获取的 uniform 名称数组；若为空则获取全部
 * @returns 一个 Map，键为 child.id，值为对应的 uniforms 对象
 */
export function getUniforms(
  models: Object3D[],
  keys?: string[]
): Map<number, { [uniform: string]: IUniform<any> }> {
  const uniformsMap = new Map<number, { [uniform: string]: IUniform<any> }>()

  models.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof Mesh && child.material instanceof ShaderMaterial) {
        const uniforms: { [uniform: string]: IUniform<any> } = {}

        const materialUniforms = child.material.uniforms
        if (keys && keys.length > 0) {
          for (const key of keys) {
            if (materialUniforms[key]) {
              uniforms[key] = materialUniforms[key]
            }
          }
        } else {
          for (const key in materialUniforms) {
            uniforms[key] = materialUniforms[key]
          }
        }

        if (Object.keys(uniforms).length > 0) {
          uniformsMap.set(child.id, uniforms)
        }
      }
    })
  })

  return uniformsMap
}

/**
 * 从场景中提取指定类型的光源，并转换为 shader 可用的 uniform
 * @param {Scene} scene - js 场景
 * @param {Camera} camera - 当前相机
 * @param {Function} LightType - 光源类型 (如 DirectionalLight)
 * @returns {Array<{ lightDir_eye: Vector3, lightColor: Color }>}
 */
export function getLightUniforms(
  scene: Scene,
  camera: Camera,
  LightType: LightType
): Array<{
  eye: Vector3
  color: Color
}> {
  const results: Array<{
    eye: Vector3
    color: Color
  }> = []
  if (!scene || !camera) {
    console.warn('Scene or camera is not defined.')
    return results
  }
  scene.traverse((obj) => {
    if (!(obj instanceof LightType)) return
    if (obj instanceof DirectionalLight || obj instanceof SpotLight) {
      const light = obj

      const lightPos = new Vector3().setFromMatrixPosition(light.matrixWorld)
      const targetPos = new Vector3().setFromMatrixPosition(light.target.matrixWorld)

      const lightDirWorld = targetPos.clone().sub(lightPos).normalize()

      const lightDirEye = lightDirWorld.clone().transformDirection(camera.matrixWorldInverse)

      results.push({
        eye: lightDirEye,
        color: light.color.clone().multiplyScalar(light.intensity),
      })
    } else if (obj instanceof PointLight) {
      results.push({
        eye: new Vector3(0, 0, 0),
        color: obj.color.clone().multiplyScalar(obj.intensity),
      })
    }
  })

  return results
}
/**
 * 创建一个简单的 js ShaderMaterial
 * @param uniformsObj 自定义 uniform 对象，格式为 { name: { value: any } }
 * @param vertexShader 顶点着色器代码（GLSL字符串）
 * @param fragmentShader 片元着色器代码（GLSL字符串，必须包含 main 函数）
 * @returns ShaderMaterial 实例
 */
export function createMaterialShader(
  uniforms: Record<string, { value: any }>,
  vertexShader: string,
  fragmentShader: string,
  options?: {}
): ShaderMaterial {
  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true, // 支持透明，根据需要调整
    // side: DoubleSide,
    // depthTest: true,
    // blending: NormalBlending,
    ...options,
  })
}

/**
 *  创建一个模型轮廓效果
 * @param renderer
 * @param scene
 * @param camera
 * @param models
 * @returns
 */
export function createModelOutline(
  scene?: Scene,
  camera?: Camera,
  models?: Object3D | Object3D[]
): {
  effect: OutlineEffect
  dispose: () => void
} {
  // 创建 OutlineEffect，传入 renderer 和场景，选择要描边的模型
  const outlineEffect = new OutlineEffect(scene, camera, {
    // 组件写死不传递
    // blendFunction: BlendFunction.SCREEN,
    // patternTexture: yourPatternTexture, // 可选
    patternScale: 1,
    edgeStrength: 2.5,
    pulseSpeed: 0,
    visibleEdgeColor: 0xffffff,
    hiddenEdgeColor: 0x22090a,
    multisampling: 4,
    resolutionScale: 1,
    resolutionX: window.innerWidth,
    resolutionY: window.innerHeight,
    width: 2,
    height: 480,
    kernelSize: 3,
    blur: false,
    xRay: true,
  })

  if (models) {
    if (!Array.isArray(models)) {
      models = [models]
    }
    outlineEffect.selection.set(models)
  }

  return {
    effect: outlineEffect,
    dispose: () => {
      outlineEffect.dispose()
    },
  }
}

/**
 * 提取 Object3D 数组中的所有 Mesh
 * @param objects Object3D[]
 * @returns Mesh[]
 */
export function extractMeshes(objects: Object3D[]): Mesh[] {
  const meshes: Mesh[] = []

  objects.forEach((obj) => {
    obj.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child)
      }
    })
  })

  return meshes
}
/// 获取 EffectComposer 中选中的 Mesh
export function getSelectedMeshes(effects: OutlineEffect): Mesh[] {
  const objects = Array.from(effects.selection.values())
  return extractMeshes(objects)
}
