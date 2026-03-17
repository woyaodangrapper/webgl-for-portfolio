export * from './scope/view-model-context'
export * from './scope/view-effects-shaders'

export * from './utils/matViewUtils'
export * from './utils/cameraViewUtils'

export * from './components/view3d'

export * from './utils/clocksUtils'

export { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing'
export { BlendFunction, OutlineEffect } from 'postprocessing'
export { useFrame } from '@react-three/fiber'
// export function isContext(obj: any): obj is Context {
//   return (
//     obj &&
//     typeof obj === 'object' &&
//     obj.renderer instanceof WebGLRenderer &&
//     obj.camera instanceof PerspectiveCamera &&
//     obj.scene instanceof Scene
//   )
// }

import { createContext, ReactNode, useContext, useState } from 'react'
import { Object3D } from 'three'

interface ModelContextValue {
  models: Object3D[]
  setModels: (models: Object3D[]) => void
}

// 创建 Context
const ModelContext = createContext<ModelContextValue | null>(null)

// Provider 组件
export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<Object3D[]>([])

  return <ModelContext.Provider value={{ models, setModels }}>{children}</ModelContext.Provider>
}

// Hook：在任意子组件中访问模型
export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) {
    throw new Error('useModel must be used within a <ModelProvider>')
  }
  return ctx
}
