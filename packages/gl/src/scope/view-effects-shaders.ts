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
  BoxGeometry,
  Plane,
  AdditiveBlending,
  Box3,
  Group,
} from 'three'
import { EXRLoader, RGBELoader } from 'three-stdlib'
import { Context } from '../types'
import gsap from 'gsap'

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
  return extractMeshes(objects as Object3D[])
}

/**
 * 对一个或多个模型应用「线框扫描 → 实体填充」特效。
 * 若传入多个模型，包围盒与裁切参数合并计算，扫描线为共用单次，不各自为战。
 *
 * @param viewer  Three.js 场景上下文（需含 scene 与 renderer）
 * @param models  单个或多个 Object3D 模型
 * @param options 可选配置项
 * @returns 包含 GSAP timeline 与 dispose 清理函数的对象
 */
export function useScanEffect(
  viewer: Context | Partial<Context>,
  models: Object3D | Object3D[],
  options: {
    /** 扫描线与线框颜色，默认 0x44ff44 */
    color?: number
    /** 是否循环播放，默认 true */
    loop?: boolean
    /** 首次播放延迟（秒），默认 1 */
    delay?: number
  } = {}
): { timeline: gsap.core.Timeline; dispose: () => void } {
  const { color = 0x44ff44, loop = true, delay = 1 } = options

  if (!viewer.scene || !viewer.renderer) {
    throw new Error('viewer.scene and viewer.renderer are required for useScanEffect')
  }

  const scene = viewer.scene
  const renderer = viewer.renderer
  renderer.localClippingEnabled = true

  const modelArray = Array.isArray(models) ? models : [models]

  // 合并所有模型的包围盒
  const bbox = new Box3()
  modelArray.forEach((m) => bbox.expandByObject(m))
  const size = bbox.getSize(new Vector3())
  const center = bbox.getCenter(new Vector3())
  const minY = bbox.min.y
  const maxY = bbox.max.y
  const vMargin = size.y * 0.02
  // 扫描终点：底部多延伸 15% 高度，让扫描线明显穿出底面
  const bottomEnd = minY - size.y * 0.05

  // 扫描平面（发光薄盒）
  const scanGeo = new BoxGeometry(size.x * 1.1, Math.max(size.y * 0.006, 0.04), size.z * 1.1)
  const scanMat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const scanMesh = new Mesh(scanGeo, scanMat)
  scanMesh.position.set(center.x, maxY + vMargin, center.z)
  scanMesh.scale.set(0, 0, 1)
  scene.add(scanMesh)

  // 裁切面：实体填充（法线向上，constant 从 -(maxY+margin) 增大到 -(minY-margin)，顶层到底层逐步显现）
  const fillPlane = new Plane(new Vector3(0, 1, 0), -(maxY + vMargin))
  // 裁切面：线框可见窗口（下界 + 上界），围绕扫描位置形成一个可见带
  const wireClipIn = new Plane(new Vector3(0, 1, 0), -(maxY + vMargin)) // 下界
  const wireClipOut = new Plane(new Vector3(0, -1, 0), maxY + vMargin) // 上界

  // 为所有模型的材质应用实体裁切面，并保存恢复函数
  const matRestoreFns: Array<() => void> = []
  modelArray.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = child.material as any
        const prevPlanes = mat.clippingPlanes ?? null
        const prevIntersection = mat.clipIntersection ?? false
        mat.clippingPlanes = [fillPlane]
        mat.clipIntersection = false
        mat.needsUpdate = true
        matRestoreFns.push(() => {
          mat.clippingPlanes = prevPlanes
          mat.clipIntersection = prevIntersection
          mat.needsUpdate = true
        })
      }
    })
  })

  // 为每个模型创建线框克隆，共用同一组裁切面
  const wireGroup = new Group()
  const wireMats: MeshBasicMaterial[] = []
  modelArray.forEach((model) => {
    const clone = model.clone()
    clone.traverse((obj) => {
      if (obj instanceof Mesh) {
        const wm = new MeshBasicMaterial({
          wireframe: true,
          color,
          transparent: true,
          opacity: 0.2,
          clippingPlanes: [wireClipIn, wireClipOut],
          clipIntersection: false,
          depthWrite: false,
        })
        wireMats.push(wm)
        obj.material = wm
      }
    })
    wireGroup.add(clone)
  })
  scene.add(wireGroup)

  // 线框可见带半高（扫描线附近可见区域）
  const bandR = size.y * 0.06

  // —— GSAP 时间轴 ——
  const tl = gsap.timeline({
    repeat: loop ? -1 : 0,
    delay: 1,
    repeatDelay: delay,
  })

  // 每次循环开始时将实体填充面重置为完全隐藏（fromTo 无法覆盖跨阶段复用）
  tl.set(fillPlane, { constant: -(maxY + vMargin) })

  // —— 阶段一：线框扫描（扫描线从顶部向底部运动，线框带随扫描线移动） ——
  const s1 = { pos: maxY + vMargin }

  tl.fromTo(scanMesh.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.5, ease: 'power3.inOut' })

  tl.fromTo(
    s1,
    { pos: maxY + vMargin },
    {
      pos: bottomEnd,
      duration: 2,
      ease: 'power4.inOut',
      onUpdate() {
        scanMesh.position.y = s1.pos
        wireClipIn.constant = -(s1.pos - bandR)
        wireClipOut.constant = s1.pos + bandR
      },
    },
    0 // 与扫描线出现同步开始
  )

  tl.to(scanMesh.scale, { x: 0, y: 0, duration: 0.5, ease: 'power3.inOut' }, '-=0.5')

  // —— 阶段二：实体填充扫描（扫描线再次从顶部向底部，模型在扫描线上方逐步实体化） ——
  tl.addLabel('fillIn', '+=1')

  const s2 = { pos: maxY + vMargin }

  tl.to(scanMesh.scale, { x: 1, y: 1, duration: 0.5, ease: 'power3.inOut' }, 'fillIn')

  tl.fromTo(
    s2,
    { pos: maxY + vMargin },
    {
      pos: bottomEnd,
      duration: 2,
      ease: 'power3.inOut',
      onUpdate() {
        scanMesh.position.y = s2.pos
        fillPlane.constant = -s2.pos
        wireClipIn.constant = -(s2.pos - bandR)
        wireClipOut.constant = s2.pos + bandR
      },
    },
    'fillIn'
  )

  tl.to(scanMesh.scale, { x: 0, y: 0, duration: 0.5, ease: 'power3.inOut' }, '-=0.5')

  // 确保动画结束时模型完整可见
  tl.set(fillPlane, { constant: -bottomEnd })

  // —— 销毁函数 ——
  const dispose = () => {
    tl.kill()
    matRestoreFns.forEach((fn) => fn())
    scene.remove(scanMesh)
    scanGeo.dispose()
    scanMat.dispose()
    wireMats.forEach((m) => m.dispose())
    scene.remove(wireGroup)
  }

  return { timeline: tl, dispose }
}
