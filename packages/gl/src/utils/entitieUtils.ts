import * as Cesium from 'cesium'
import '../styles/bubble.css'

/**
 * 获取当前相机视角
 * @param {Cesium.Viewer} viewer - Cesium Viewer 对象
 * @returns {Object} 返回包含相机视角信息的对象
 */
export const createOverlay = (
  viewer: Cesium.Viewer,
  position: { x: number; y: number; z?: number },
  overlayDiv: HTMLElement
): object => {
  const { x, y, z } = position

  viewer.container.appendChild(overlayDiv)

  // 经纬度转换为屏幕坐标
  function updateOverlayPosition(lon: number, lat: number, height: number = 0) {
    // 根据经纬度和高度计算三维坐标
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, height)

    const canvasPosition = viewer.scene.cartesianToCanvasCoordinates(position)

    if (canvasPosition) {
      overlayDiv.style.left = `${canvasPosition.x}px`
      overlayDiv.style.top = `${canvasPosition.y}px`
    }
  }

  // 设置初始位置
  updateOverlayPosition(x, y, z)

  // 相机移动时更新位置
  const updateHandler = () => updateOverlayPosition(x, y, z)
  viewer.scene.postRender.addEventListener(updateHandler)

  return {
    destroy: () => {
      // 移除HTML元素
      if (overlayDiv.parentElement) {
        overlayDiv.parentElement.removeChild(overlayDiv)
      }
      // 解绑事件监听
      viewer.scene.postRender.removeEventListener(updateHandler)
    },
    element: overlayDiv,
  }
}

export function createBubble(id: string, content: string) {
  // 创建容器
  const bubble = document.createElement('div')
  bubble.id = `bubble-${id}`
  bubble.style = 'position: absolute;z-index: 888'
  // 设置样式
  bubble.innerHTML = `
    <div class="circle">
      <div class="pie_left">
        <div class="left"></div>
      </div>
      <div class="pie_right">
        <div class="right" style="transform: rotate(7.2deg)"></div>
      </div>
      <div class="mask">
        <span>${content}</span>
      </div>
    </div>
  `
  return bubble
}
