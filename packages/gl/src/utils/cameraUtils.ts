import * as Cesium from 'cesium'

// 定义视角参数类型
interface ViewParams {
  x: number // 经度
  y: number // 纬度
  z?: number // 高度，默认 1000
  h?: number // 航向角，默认 0
  p?: number // 俯仰角，默认 -45
  r?: number // 距离，默认 3000
  d?: number // 动画持续时间，默认 2 秒
}
/**
 * 获取当前相机视角
 * @param {Cesium.Viewer} viewer - Cesium Viewer 对象
 * @returns {Object} 返回包含相机视角信息的对象
 */
export const getCameraView = (viewer: Cesium.Viewer): object => {
  const camera = viewer.camera

  const formatNum = (num: number, digits: number) => Number(num.toFixed(digits || 0))

  const position = camera.positionCartographic
  return {
    y: formatNum(Cesium.Math.toDegrees(position.latitude), 6),
    x: formatNum(Cesium.Math.toDegrees(position.longitude), 6),
    z: formatNum(position.height, 2),
    h: formatNum(camera.heading, 2),
    p: formatNum(camera.pitch, 2),
    r: formatNum(camera.roll, 2),
  }
}

/**
 * 设置当前相机视角
 * @param {Cesium.Viewer} viewer - Cesium Viewer 对象
 * @param {Object} mapPosition - 包含地图位置信息的对象
 */
export const setCameraView = (
  mapPosition: {
    x: number
    y: number
    z: number
    h: number
    p: number
    r: number
    duration: number | undefined
  },
  viewer: Cesium.Viewer
) => {
  const duration = mapPosition.duration || 0

  if (viewer.clock.multiplier !== 1) return

  try {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(mapPosition.x, mapPosition.y, mapPosition.z),
      orientation: {
        heading: mapPosition.h ?? 0,
        pitch: mapPosition.p ?? 0,
        roll: mapPosition.r ?? 0,
      },
      duration,
    })
  } catch (error) {
    console.error({ e: error, message: '定位异常' })
  }
}

// 优化后的视角跳转函数
export function smoothFlyTo(viewer: Cesium.Viewer, params: ViewParams) {
  const { x, y, z = 1000, h = 0, p = -45, r = 3000, d = 2 } = params

  const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(x, y, z), -z)

  viewer.camera.flyToBoundingSphere(boundingSphere, {
    duration: d,
    offset: new Cesium.HeadingPitchRange(h, p, r),
  })
}

export function zoomToModel(viewer: Cesium.Viewer, model: Cesium.Model) {
  const controller = viewer.scene.screenSpaceCameraController
  controller.minimumZoomDistance = viewer.camera.frustum.near
  ;(controller as any)._minimumRotateRate = 1.0

  let { radius } = model.boundingSphere
  if (radius < 10.0) {
    // ScreenSpaceCameraController doesn't handle small models well
    const scale = 10.0 / radius
    Cesium.Matrix4.multiplyByUniformScale(model.modelMatrix, scale, model.modelMatrix)
    radius *= scale
  }

  const heading = 3.14
  const pitch = -0.76
  viewer.camera.lookAt(
    model.boundingSphere.center,
    new Cesium.HeadingPitchRange(heading, pitch, radius * 3.0)
  )
}
