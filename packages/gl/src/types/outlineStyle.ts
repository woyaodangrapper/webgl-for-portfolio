import { Texture } from 'three'
import { BlendFunction, KernelSize } from 'postprocessing'

export interface OutlineStyle {
  blendFunction?: BlendFunction
  patternTexture?: Texture
  patternScale?: number
  edgeStrength?: number
  pulseSpeed?: number
  visibleEdgeColor?: number
  hiddenEdgeColor?: number
  multisampling?: number
  resolutionScale?: number
  resolutionX?: number
  resolutionY?: number
  width?: number
  height?: number
  kernelSize?: KernelSize
  blur?: boolean
  xRay?: boolean
  enabled?: boolean // 是否启用描边效果
}
