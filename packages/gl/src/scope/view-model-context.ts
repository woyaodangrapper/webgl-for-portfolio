import { Object3DEventMap, Object3D, Matrix4, Vector3, Euler, Quaternion, Box3, Group } from 'three'
import { GLTF, GLTFLoader, FBXLoader } from 'three-stdlib'
import { Context } from '../types'
import { Bvh, Box } from '@react-three/drei'
export type { Matrix4, Object3D }
export { Bvh, Box }
const modelCollection: Object3D[] = []
type LoaderType = 'gltf' | 'fbx'
/**
 * 创建模型的右手坐标系变换矩阵，并支持可选的 Y-up / Z-up 坐标映射。
 *
 * @param models 要处理的模型数组（GLTF）
 * @param x 世界 X 轴偏移（单位：米）
 * @param y 世界 Y 轴偏移（单位：米）
 * @param z 世界 Z 轴偏移（单位：米）
 * @param scale 可选缩放比例，默认 (1,1,1)
 * @param euler 可选欧拉旋转，默认 (0,0,0)
 * @param yUp 默认为 true；true=保持Y向上；false=切换为Z向上
 * @returns 包含“居中 + 平移 + 旋转 + 缩放”的复合 Matrix4
 */
export function createModelMatrix(
  models: Array<GLTF | Object3D>,
  x = 0,
  y = 0,
  z = 0.5,
  scale: number | null = null,
  euler: Euler | null = null,
  yUp: boolean | null = true
): Matrix4 {
  // 临时容器，组合多个模型计算整体包围盒
  const wrapper = new Group()
  models.forEach((m) => {
    // GLTF 有 scene 属性，FBX 直接是 Object3D
    wrapper.add('scene' in m ? m.scene : m)
  })

  // 计算整体几何包围盒中心
  const box = new Box3().setFromObject(wrapper)
  const center = box.getCenter(new Vector3())

  // 坐标轴映射
  const position = yUp ? new Vector3(x, y, z) : new Vector3(x, z, y)

  // 旋转
  const quaternion = new Quaternion().setFromEuler(euler ?? new Euler(0, 0, 0))

  // 缩放
  const scaleVec = scale === null ? new Vector3(1, 1, 1) : new Vector3(scale, scale, scale)

  // 复合矩阵：平移+旋转+缩放
  const matrix4 = new Matrix4().compose(position, quaternion, scaleVec)

  // 将几何中心平移到局部原点
  return new Matrix4().multiplyMatrices(
    matrix4,
    new Matrix4().makeTranslation(-center.x, -center.y, -center.z)
  )
}

/**
 * 异步预加载多个 3D 模型（GLTF 格式），并应用缩放与位置变换
 * @param urls 模型的 URL 或 URL 数组
 * @param scale 缩放比例，默认 1.0
 * @param position 可选位置参数（经度、纬度、高度）
 * @returns 返回 Promise，解析为 Object3D 模型数组
 */
export async function cacheModels(
  urls: string | string[],
  scale: number = 1.0,
  position?: { x?: number; y?: number; z?: number },
  type?: LoaderType
): Promise<Object3D[]> {
  if (!urls || (Array.isArray(urls) && urls.length === 0)) return []

  const loader = type === 'fbx' ? new FBXLoader() : new GLTFLoader()

  const x = position?.x ?? 0
  const y = position?.y ?? 0
  const z = position?.z ?? 0.5

  const urlList = typeof urls === 'string' ? [urls] : urls

  const models = await Promise.all(urlList.map(async (url) => await loader.loadAsync(url)))
  const matrix = createModelMatrix(
    models.map((m) => ('scene' in m ? m.scene : m)),
    x,
    y,
    z,
    scale,
    new Euler(0, 0, 0),
    false
  )
  const modelObjects = models.map((gltf) => {
    const scene = 'scene' in gltf ? gltf.scene : gltf
    scene.applyMatrix4(matrix)
    return scene
  })
  return modelObjects
}

/**
 * 添加模型到 Three.js 场景中
 * @param viewer Three.js 场景
 * @param models 模型列表
 */
export function createModels(
  viewer: Context | Partial<Context>,
  models: Object3D[]
): Promise<Object3D[]> {
  if (!viewer || !viewer.renderer || !viewer.camera || !viewer.scene) {
    throw new Error(
      'Viewer or its properties (renderer, camera, scene) are not properly initialized.'
    )
  }
  const scene = viewer.scene
  return Promise.all(
    models.map((model) => {
      return new Promise<Object3D>((resolve) => {
        scene.add(model)
        modelCollection.push(model)
        resolve(model)
      })
    })
  )
}

/**
 * 销毁并清除所有模型（从 scene 移除）
 * @param viewer Three.js 场景
 */
export function destroyed(viewer: Context): void {
  for (const model of modelCollection) {
    viewer.scene.remove(model)
    model.traverse((child) => {
      if ((child as any).geometry) {
        ;(child as any).geometry.dispose?.()
      }
      if ((child as any).material) {
        const mat = (child as any).material
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose?.())
        } else {
          mat.dispose?.()
        }
      }
    })
  }
  modelCollection.length = 0
}
