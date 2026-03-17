import { cacheModels, createModels, Object3D } from '@my/gl/3ds'
import { Context } from '@my/gl/types'

/**
 * 加载默认的冷站模型
 * @param {Context} viewer - Cesium Viewer 对象
 * @returns {Promise<Object3D[]>} 返回加载的模型数组
 */
export async function loadDefaultViewAsync(
  viewer: Context | Partial<Context>
): Promise<Object3D[]> {
  if (!viewer || !viewer.renderer || !viewer.camera || !viewer.scene) {
    throw new Error(
      'Viewer or its properties (renderer, camera, scene) are not properly initialized.'
    )
  }
  const modelUrls = ['aaa', 'bbb', 'ccc', 'ddd'] //
  let models = await cacheModels(
    modelUrls.map((name) => `https://webgl.crcr.top/.models/SpaceX/${name}.glb`),
    10.0,
    { x: 0, y: 0, z: 1 }
  )

  return createModels(viewer, models)
}
