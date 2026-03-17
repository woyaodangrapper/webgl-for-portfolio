import { Box3, Object3D, Vector3 } from 'three'
import { Context } from '../types/viewContext'
/**
 * 将相机移动并聚焦到指定模型位置，模拟 Cesium zoomToModel 行为
 * @param viewer - 包含 camera 的上下文（如 THREE.Scene 或自定义 Context）
 * @param model - THREE.Object3D 或其子类模型
 */
// export function viewToModel(viewer: Context | Partial<Context>, model: Object3D) {
//   if (!viewer || !viewer.camera || !viewer.renderer) {
//     console.error('Viewer context is not properly initialized.')
//     return
//   }
//   // 计算模型包围盒与中心、尺寸
//   const box = new Box3().setFromObject(model)
//   const center = new Vector3()
//   const size = new Vector3()
//   box.getCenter(center)
//   box.getSize(size)

//   // 计算包围球半径
//   const radius = size.length() / 2

//   // 设置最小有效半径，防止模型过小导致视角过近
//   const MIN_RADIUS = 10.0
//   const adjustedRadius = Math.max(radius, MIN_RADIUS)

//   // 摄像机视角角度配置（参考 Cesium 默认视角）
//   const heading = 0 // 0° Math.PI // 绕Y轴旋转180度
//   const pitch = 0.76 // 绕X轴向上约43.5度

//   // 计算摄像机方向向量
//   const direction = new Vector3(
//     Math.cos(pitch) * Math.sin(heading),
//     Math.sin(pitch),
//     Math.cos(pitch) * Math.cos(heading)
//   )

//   // 摄像机距离模型中心的距离，基于半径放大一定倍数
//   const distance = adjustedRadius * 3

//   // 计算摄像机目标位置
//   const cameraPosition = new Vector3()
//   cameraPosition.copy(center).addScaledVector(direction, distance)

//   // 计算模型中心、位置等
//   viewer.camera.target.copy(center)
//   viewer.camera.update()

//   // 设置摄像机位置和朝向
//   viewer.camera.position.copy(cameraPosition)
//   viewer.camera.lookAt(center)
// }
