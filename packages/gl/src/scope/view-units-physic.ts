// 物理引擎、碰撞检测、刚体动力学

import { Raycaster, Vector2, Vector3 } from 'three'
import { Context } from '../types'

/**
 * 根据归一化设备坐标（NDC）和 viewer，计算射线与场景的交点。
 * @param mouse NDC 坐标，x 和 y 范围均为 [-1, 1]
 * @param viewer 包含 scene, camera, renderer 的上下文对象
 * @returns 第一个交点的世界坐标，找不到则返回 undefined
 */
export function pickPoint(mouse: Vector2, viewer: Partial<Context> | Context): Vector3 | undefined {
  if (!viewer || !viewer.scene || !viewer.camera || !viewer.renderer) {
    console.error(
      'Viewer or its properties (scene, camera, renderer) are not properly initialized.'
    )
    return undefined
  }

  const rect = viewer.renderer.domElement.getBoundingClientRect()
  mouse.x = ((mouse.x - rect.left) / rect.width) * 2 - 1
  mouse.y = -((mouse.y - rect.top) / rect.height) * 2 + 1

  const raycaster = new Raycaster()
  raycaster.setFromCamera(mouse, viewer.camera)
  const intersects = raycaster.intersectObjects(viewer.scene.children, true)

  if (intersects.length > 0) {
    return intersects[0].point.clone()
  }

  return undefined
}

export function cartesianToWindowCoordinates(
  point: Vector3 | undefined,
  viewer: Partial<Context> | Context
): { x: number; y: number } {
  if (!viewer || !viewer.renderer || !viewer.camera) {
    console.error('Viewer or its properties (renderer, camera) are not properly initialized.')
    return { x: 0, y: 0 }
  }
  if (!point) {
    console.warn('Point is undefined, cannot convert to window coordinates.')
    return { x: 0, y: 0 }
  }
  const width = viewer.renderer.domElement.clientWidth
  const height = viewer.renderer.domElement.clientHeight

  const projected = point.clone().project(viewer.camera) //

  // 转换 NDC 到屏幕像素坐标
  const x = ((projected.x + 1) / 2) * width
  const y = ((-projected.y + 1) / 2) * height

  return { x, y }
}
