import { parseDefines } from './parseDefines'
import * as Cesium from 'cesium'

const _shadersSeparableBlur =
  '\n\
in vec2 v_textureCoordinates;\n\
uniform sampler2D colorTexture;\n\
uniform vec2 colorTextureDimensions;\n\
uniform vec2 direction;\n\
uniform float kernelRadius;\n\
\n\
float gaussianPdf(in float x, in float sigma) {\n\
    return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\n\
}\n\
// 检查OpenGL版本是否低于1.30\n\
#if __VERSION__ < 130\n\
    // 如果版本低于1.30，定义TEXTURE2D为TEXTURE2D\n\
    #define TEXTURE2D TEXTURE2D\n\
#else\n\
    // 如果版本高于或等于1.30，定义TEXTURE2D为texture\n\
    #define TEXTURE2D texture\n\
#endif\n\
void main() {\
    vec2 vUv=v_textureCoordinates;\n\
    vec2 invSize = 1.0 / colorTextureDimensions;\
    float weightSum = gaussianPdf(0.0, kernelRadius);\
    vec4 diffuseSum = TEXTURE2D( colorTexture, vUv) * weightSum;\
    vec2 delta = direction * invSize * kernelRadius/float(MAX_RADIUS);\
    vec2 uvOffset = delta;\
    for( int i = 1; i <= MAX_RADIUS; i ++ ) {\
        float w = gaussianPdf(uvOffset.x, kernelRadius);\
        vec4 sample1 = TEXTURE2D( colorTexture, vUv + uvOffset);\
        vec4 sample2 = TEXTURE2D( colorTexture, vUv - uvOffset);\
        diffuseSum += ((sample1 + sample2) * w);\
        weightSum += (2.0 * w);\
        uvOffset += delta;\
    }\
    out_FragColor = diffuseSum/weightSum;\
}'

/**
 *
 * @param {string} name
 * @param {number} maxRadius
 * @param {number} kernelRadius
 * @param {number} textureScale
 * @returns {Cesium.PostProcessStageComposite}
 */
export default function createBlurStage(name, maxRadius, kernelRadius, textureScale) {
  const { Cartesian2, PostProcessStage, PostProcessStageComposite, PostProcessStageSampleMode } =
    Cesium

  let blurDirectionX = new Cartesian2(1.0, 0.0)
  let blurDirectionY = new Cartesian2(0.0, 1.0)

  let separableBlurShader = {
    defines: {
      MAX_RADIUS: maxRadius,
    },
    fragmentShader: _shadersSeparableBlur,
  }
  parseDefines(separableBlurShader)

  let blurX = new PostProcessStage({
    name: name + '_x_direction',
    fragmentShader: separableBlurShader.fragmentShader,
    textureScale: textureScale,
    forcePowerOfTwo: true,
    uniforms: {
      kernelRadius: kernelRadius,
      direction: blurDirectionX,
    },
    sampleMode: PostProcessStageSampleMode.LINEAR,
  })

  let blurY = new PostProcessStage({
    name: name + '_y_direction',
    fragmentShader: separableBlurShader.fragmentShader,
    textureScale: textureScale,
    forcePowerOfTwo: true,
    uniforms: {
      kernelRadius: kernelRadius,
      direction: blurDirectionY,
    },
    sampleMode: PostProcessStageSampleMode.LINEAR,
  })

  let separableBlur = new PostProcessStageComposite({
    name: name,
    stages: [blurX, blurY],
    inputPreviousStageTexture: true,
  })
  return separableBlur
}
