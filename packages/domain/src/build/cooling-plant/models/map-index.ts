import {
  cacheModels,
  createModels,
  Model,
  Viewer,
  applyDefaultShadowSettings,
  JulianDate,
  smoothFlyTo,
} from '@my/gl/gis'

import {
  createEdgeStageShader,
  createModelLighting,
  translucentShader,
  undulateShader,
} from '../effects'
import { createBestViewingPoint } from '../controls'

/**
 * 加载默认的冷站模型
 * @param {Viewer} viewer - Cesium Viewer 对象
 * @returns {Promise<Model[]>} 返回加载的模型数组
 */
export async function loadDefaultTilesetAsync(viewer: Viewer): Promise<Model[]> {
  const modelUrls = ['aaa', 'bbb', 'ccc', 'ddd'] //
  let models = await cacheModels(
    modelUrls.map((name) => `https://webgl.crcr.top/.models/SpaceX/${name}.glb`)
  )

  {
    // 为最后一个模型添加自定义着色器
    const lastModel = models.slice(-1)[0]
    lastModel.customShader = translucentShader
    lastModel.show = false
  }
  {
    const lastModel = models.slice(-2)[0]
    lastModel.customShader = translucentShader
  }
  {
    // 设置模型的PBR光照
    viewer.scene.light.intensity = 2.0
    createModelLighting(
      models.slice(0, 5),
      'https://webgl.crcr.top/.models/light/kiara_6_afternoon_2k_ibl.ktx2' // 使用默认的IBL贴图(亮一点适合管道模型)
    )
  }

  {
    // 应用默认的阴影设置
    applyDefaultShadowSettings(viewer, {
      size: 2048, // 设置阴影贴图大小
      maximumDistance: 5000.0, // 设置阴影最大距离
      softShadows: true, // 启用软阴影
    })
  }

  {
    // 为前四个模型添加波纹效果着色器
    models.slice(0, 4).forEach((model: any) => {
      model.customShader = undulateShader
    })
    eventListener(viewer)
  }

  {
    // viewer.scene.sun.show = true
    viewer.scene.highDynamicRange = true
    viewer.scene.postProcessStages.exposure = 0.7
  }

  {
    // 最佳日照
    // 创建北京时间 2025年3月14日下午14:52
    const beijingTime = new Date('2025-03-14T14:52:00+08:00')
    const julianDate = JulianDate.fromDate(beijingTime)
    viewer.clock.currentTime = julianDate
    viewer.clock.shouldAnimate = false
  }
  return await createModels(viewer, models).then((models) => {
    setTimeout(() => {
      createEdgeStageShader(viewer, models.slice(0, 4), true)
      console.log('Edge stage shader created')
    }, 2000)
    return models
  })
}

/**
 * 创建一些注释交互点
 */
export async function loadDefaultAnnotationAsync(viewer: Viewer) {
  const { HTMLElement1, HTMLElement2, HTMLElement3 } = createBestViewingPoint(viewer)

  HTMLElement1.addEventListener('click', () => {
    smoothFlyTo(viewer, {
      y: 0.000091,
      x: 0.000247,
      z: 6.46,
      h: 2.3,
      p: -0.48,
      r: 6.28,
      d: 3,
    })
  })
  HTMLElement2.addEventListener('click', () => {
    smoothFlyTo(viewer, {
      y: 0.000342,
      x: 0.000402,
      z: 20.29,
      h: 3.16,
      p: -0.41,
      r: 0,
      d: 3,
    })
  })
  HTMLElement3.addEventListener('click', () => {
    smoothFlyTo(viewer, {
      y: -0.000122,
      x: 0.000642,
      z: 12.35,
      h: 5.17,
      p: -0.32,
      r: 0,
      d: 3,
    })
  })
}

function eventListener(viewer: Viewer) {
  const startTime = performance.now()

  viewer.scene.postUpdate.addEventListener(function () {
    // myCustomShader.setUniform("u_color", !mediaQuery.matches ? new Cesium.Cartesian3(1.0, 1.0, 1.0) : new Cesium.Cartesian3(0.0, 0.0, 0.0));
    const elapsedTimeSeconds = (performance.now() - startTime) / 1000
    undulateShader.setUniform('u_time', elapsedTimeSeconds)
  })
}
