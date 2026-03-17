import * as Cesium from 'cesium'

/**
 * 模型图像的光照
 * @param {Cesium.Model} model - Cesium Viewer 对象
 */
export function modelLighting(model: Cesium.Model, url?: string) {
  const environmentMapURL =
    url ?? 'https://cesium.com/public/SandcastleSampleData/kiara_6_afternoon_2k_ibl.ktx2'

  const L00 = new Cesium.Cartesian3(1.234897375106812, 1.221635103225708, 1.273374080657959)
  const L1_1 = new Cesium.Cartesian3(1.136140108108521, 1.171419978141785, 1.287894368171692)
  const L10 = new Cesium.Cartesian3(1.245410919189453, 1.245791077613831, 1.283067107200623)
  const L11 = new Cesium.Cartesian3(1.107124328613281, 1.112697005271912, 1.153419137001038)
  const L2_2 = new Cesium.Cartesian3(1.08641505241394, 1.079904079437256, 1.10212504863739)
  const L2_1 = new Cesium.Cartesian3(1.190043210983276, 1.186099290847778, 1.214627981185913)
  const L20 = new Cesium.Cartesian3(0.017783647403121, 0.020140396431088, 0.025317270308733)
  const L21 = new Cesium.Cartesian3(1.087014317512512, 1.084779262542725, 1.111417651176453)
  const L22 = new Cesium.Cartesian3(-0.052426788955927, -0.048315055668354, -0.041973855346441)
  const coefficients = [L00, L1_1, L10, L11, L2_2, L2_1, L20, L21, L22]
  const ibl = model.imageBasedLighting
  ibl.sphericalHarmonicCoefficients = coefficients
  ibl.specularEnvironmentMaps = environmentMapURL
  ibl.imageBasedLightingFactor = Cesium.Cartesian2.ONE

  return {
    destroy: function () {
      const ibl = model?.imageBasedLighting as any
      ibl && (ibl.sphericalHarmonicCoefficients = undefined)
      ibl && (ibl.specularEnvironmentMaps = undefined)
    },
  }
}
