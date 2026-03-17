import { CubeTexture, DataTexture, EquirectangularReflectionMapping, PMREMGenerator, RGBAFormat, Texture, WebGLCubeRenderTarget, WebGLRenderer } from 'three'

// 全局只生成一次默认白色纹理
const _whiteTex: DataTexture = (() => {
  const data = new Uint8Array([255, 255, 255, 255]) // RGBA 白色
  const tex = new DataTexture(data, 1, 1, RGBAFormat)
  tex.needsUpdate = true
  return tex
})()



/**
 * 确保传入的贴图合法，如果为 null/undefined 则返回白色默认纹理
 */
export function ensureTexture(tex: Texture | null | undefined): Texture {
  return tex ?? _whiteTex
}

/**
 * 确保生成一个合法的 CubeTexture
 * @param renderer 渲染器
 * @param tex 原始纹理（可能为 null/undefined）
 * @returns CubeTexture
 */
export function ensureCubeTexture(
  renderer: WebGLRenderer,
  tex: Texture | null | undefined
): CubeTexture {
  const cubeTarget = new WebGLCubeRenderTarget(256)
  cubeTarget.fromEquirectangularTexture(renderer, tex)
  return cubeTarget.texture.clone()
}