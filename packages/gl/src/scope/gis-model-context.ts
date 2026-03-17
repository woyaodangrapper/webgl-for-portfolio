// 用于控制模型或 “IndexedDB” 的上下文缓冲、
import {
  Cartesian3,
  Model,
  Viewer,
  Matrix4,
  HeadingPitchRoll,
  Transforms,
  Ellipsoid,
  Resource,
  Primitive,
  PrimitiveCollection,
  JulianDate,
} from 'cesium'

export { Model, Viewer, Matrix4, Primitive, JulianDate }

// 创建一个全局的 PrimitiveCollection 实例，用于存储模型
// 这可以帮助我们更好地管理模型的生命周期和渲染
const primitiveCollection = new PrimitiveCollection()
primitiveCollection.destroyPrimitives = false
export { primitiveCollection }
/**
 * @description 创建一个以给定经纬高为中心、朝向默认 HPR（heading=0, pitch=0, roll=0）、
 *              且对齐于地理方向（北-西）的模型变换矩阵。
 *
 * @param x 经度（单位：度），默认为 0.0
 * @param y 纬度（单位：度），默认为 0.0
 * @param z 高程（单位：米），默认为 0.5
 *
 * @returns 模型在地球固定参考系（ECEF）中的变换矩阵，用于正确定位与朝向 3D 模型
 */
export function createModelMatrix(x?: number, y?: number, z?: number): Matrix4 {
  const position = Cartesian3.fromDegrees(x || 0.0, y || 0.0, z || 0.5)
  return Transforms.headingPitchRollToFixedFrame(
    position,
    new HeadingPitchRoll(0, 0, 0),
    Ellipsoid.WGS84,
    Transforms.localFrameToFixedFrameGenerator('north', 'west')
  )
}

/**
 * 尝试异步预加载多个 3D 模型（GLTF 格式）
 * @param urls 模型的 URL 列表
 * @param position 可选的模型位置参数，包含经度、纬度和高度
 */
export async function cacheModels(
  urls: string | string[],
  scale: number = 1.0,
  position?: { longitude?: number; latitude?: number; height?: number }
): Promise<Model[]> {
  if (!urls || urls.length === 0) {
    return []
  }
  if (typeof urls === 'string') {
    urls = [urls]
  }
  const lng = position?.longitude ?? 0
  const lat = position?.latitude ?? 0
  const height = position?.height ?? 0.5
  // 经纬度（角度）→ 世界坐标 (Cartesian3) → 通过航向、俯仰、滚转生成固定参考系下的模型矩阵
  const modelMatrix = createModelMatrix(lng, lat, height)
  const modelPromises = urls.map((url) =>
    Model.fromGltfAsync({
      url: createResource(url),
      scale: scale,
      modelMatrix,
    })
  )
  return Promise.all(modelPromises)
}

/**
 * 创建并添加模型到场景中
 * @param viewer 当前场景
 * @param models 要添加的模型数组
 * @description 将一组模型添加到场景中
 */
export function createModels(viewer: Viewer, models: Model[]): Promise<Model[]> {
  return Promise.all(
    models.map((model) => {
      return new Promise<Model>((resolve, reject) => {
        try {
          const primitive = viewer.scene.primitives.add(model)
          model.readyEvent.addEventListener(() => {
            primitiveCollection.add(primitive)
            resolve(model)
          })
          setTimeout(() => {
            reject(new Error('Model loading timed out'))
          }, 10000)
        } catch (error) {
          reject(error)
        }
      })
    })
  )
}
/**
 * 销毁并清除所有添加的模型
 * @param viewer 当前场景
 * @description 销毁并清除场景中的所有模型
 */
export function destroyed(): void {
  const primitives = primitiveCollection

  for (let index = 0; index < primitives.length; index++) {
    const primitive = primitives.get(index)
    // 如果 primitive 存在且未被销毁，则销毁它
    if (primitive && !primitive.isDestroyed()) {
      primitive.destroy() // 销毁模型
    }
  }

  // 移除所有 primitive
  primitives.removeAll()
}
/**
 * 创建 Resource 对象
 * @param url 模型资源的 URL 地址
 * @returns Resource 实例
 */
export function createResource(url: string): Resource {
  return new Resource({ url })
}
