//专注大场景表现层，包含光照、阴影、材质、大气层、天气模拟，如云层、雾霾、雨雪等

import { ScreenSpaceEventHandler, ScreenSpaceEventType, ShadowMode, Viewer } from 'cesium'

/**
 *  应用默认的阴影设置
 * @param viewer Cesium Viewer 对象
 * @description 应用默认的阴影设置
 * @param options
 */
export function applyDefaultShadowSettings(
  viewer: Viewer,
  options?: {
    size?: number
    maximumDistance?: number
    softShadows?: boolean
  }
): void {
  // 启用视图阴影和地形阴影
  viewer.shadows = true
  viewer.terrainShadows = ShadowMode.ENABLED

  const shadowMap = viewer.shadowMap

  // 使用用户传入或默认值
  shadowMap.size = options?.size ?? 2048 // 默认2048，更稳妥（兼顾性能）
  shadowMap.maximumDistance = options?.maximumDistance ?? 5000.0 // 默认是5000
  shadowMap.softShadows = options?.softShadows ?? true // 默认启用软阴影

  // const heightRatio = options?.ratio ?? 2.0
  // const scene = viewer.scene
  // const handler = new ScreenSpaceEventHandler(scene.canvas)
  // handler.setInputAction(updateCameraHeight, ScreenSpaceEventType.WHEEL)
  // function updateCameraHeight() {
  //   shadowMap.maximumDistance = Math.min(viewer.camera.positionCartographic.height * heightRatio, 20000)
  // }
}
