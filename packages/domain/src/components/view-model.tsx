import { BlendFunction, Object3D, Outline } from '@my/gl/3ds'
import { useEffect } from 'react'
import React, { createContext, useContext, useState, ReactNode } from 'react'

export function ModelOutline({ models = [] }: { models?: Object3D | Object3D[] }) {
  useEffect(() => {
    // 监听模型变化做些操作，比如日志打印
    console.log('Models changed:', models)
  }, [models])

  if (!models || (Array.isArray(models) && models.length === 0)) {
    return <Outline edgeStrength={3} visibleEdgeColor={0xffffff} hiddenEdgeColor={0x22090a} xRay />
  }

  if (!Array.isArray(models)) {
    models = [models]
  }
  const option = {
    blendFunction: BlendFunction.SCREEN,
    // patternTexture: yourPatternTexture, // 可选
    patternScale: 1,
    edgeStrength: 2.5,
    pulseSpeed: 0,
    visibleEdgeColor: 0xffffff,
    hiddenEdgeColor: 0x22090a,
    multisampling: 4,
    resolutionScale: 1,
    resolutionX: window.innerWidth,
    resolutionY: window.innerHeight,
    width: 2,
    height: 480,
    kernelSize: 3,
    blur: false,
    xRay: true,
  }
  return <Outline selection={models} edgeStrength={3} visibleEdgeColor={0xffffff} hiddenEdgeColor={0x22090a} xRay />
}
