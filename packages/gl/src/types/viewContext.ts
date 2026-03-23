import { ThreeElements } from '@react-three/fiber'
import { EffectComposerProps } from '@react-three/postprocessing'
import { Effect, EffectComposer } from 'postprocessing'
import { JSX, NamedExoticComponent, ReactElement, ReactNode, RefAttributes } from 'react'
import { Camera, Object3D, Object3DEventMap, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { Observable } from 'rxjs'

export type Props = {
  theme?: 'light' | 'dark' | 'system' | null | undefined
  onLoaded?: (viewer: Partial<Context> | Context) => void
  onModels?: () => ReactNode
  loadModel?: (viewer: Partial<Context> | Context) => Promise<ModelElements> | ModelElements
  children?: ModelElements

  effects?: Effect | Effect[] | null | (() => Effect | Effect[] | null) | Observable<Effect | Effect[] | null>
}

export type ModelElements =
  | React.ReactElement<ThreeElements[keyof ThreeElements]>
  | React.ReactElement<ThreeElements[keyof ThreeElements]>[]

export type Context = {
  renderer: WebGLRenderer
  camera: Camera | OrthographicCamera | PerspectiveCamera
  scene: Scene
}
