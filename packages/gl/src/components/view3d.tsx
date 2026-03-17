import {
  cloneElement,
  createContext,
  FC,
  Fragment,
  JSX,
  ReactNode,
  Ref,
  RefObject,
  Suspense,
  use,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Context, ModelElements, Props, OutlineStyle } from '../types'
import { CameraHelper, DirectionalLight, Mesh, Object3D, Vector2, Vector3 } from 'three'

import '../styles/zoom.css'
import '../styles/maps.css'
import { CameraControls, CameraControlsImpl, PerspectiveCamera } from '@react-three/drei'
import { cartesianToWindowCoordinates, pickPoint } from '../scope/view-units-physic'
import {
  Bloom,
  EffectComposer,
  N8AO,
  Outline,
  SMAA,
  Select,
  Selection,
} from '@react-three/postprocessing'
import { BlendFunction, Effect, OutlineEffect } from 'postprocessing'
import { Observable } from 'rxjs'
import { getSelectedMeshes, ModelProvider } from '../3ds'

export { BehaviorSubject } from 'rxjs'
export { Effect } from 'postprocessing'

function useViewer(
  onLoaded?: (viewer: Context) => void,
  loadModel?: (viewer: Context) => Promise<ModelElements> | ModelElements
) {
  const [viewer, setViewer] = useState<Context | null>(null)
  const [modelElements, setModelElements] = useState<Promise<ModelElements> | ModelElements | null>(
    null
  )
  const [cameraControls, setCameraControls] = useState<CameraControlsImpl | null>(null)
  const [disposePoint, setDisposePoint] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (viewer && loadModel) {
      setModelElements(loadModel(viewer))
    }
    if (viewer && onLoaded) {
      onLoaded(viewer)
    }
  }, [viewer, cameraControls, loadModel, onLoaded])

  useEffect(() => {
    if (viewer && cameraControls) {
      disposePoint?.()
      const newDispose = useMousePoint(viewer, cameraControls)
      setDisposePoint(() => newDispose)
    }
    // 组件卸载时清理
    return () => {
      disposePoint?.()
    }
  }, [viewer, cameraControls])
  return {
    viewer,
    setViewer,
    modelElements,
    cameraControls,
    setCameraControls,
    disposePoint,
    setDisposePoint,
  }
}

export const View3D: FC<Props> = ({
  theme = 'light',
  onLoaded,
  onModels,
  loadModel,
  children,
  effects,
}) => {
  const divRef = useRef<HTMLDivElement | null>(null)
  const outlineRef = useRef<OutlineEffect>(new OutlineEffect())

  const { setViewer, modelElements, setCameraControls } = useViewer(onLoaded, loadModel)
  const [selected, setSelected] = useState<Mesh[]>([])

  useEffect(() => {
    onEffects([outlineRef], setSelected, { effects })
  }, [effects])

  useEffect(() => {
    console.log('selected updated:', selected)
  }, [selected])

  return (
    <div ref={divRef} className="scene fade-in">
      <Canvas
        style={{ background: 'rgba(35, 26, 26, 0)' }}
        shadows="variance"
        onCreated={({ scene, camera, gl }) => {
          setViewer({ scene, camera, renderer: gl })
        }}
        dpr={[1, 2]}
        gl={{
          antialias: false,
          stencil: true,
          powerPreference: 'high-performance',
          toneMappingExposure: 1.0,
        }}
      >
        {/* args={[theme === 'dark' ? '#353535' : '#dfdfdf']}  */}
        {/* <color attach="background" args={['353535']} /> */}
        <PerspectiveCamera makeDefault position={[100, 200, 300]} />
        <ShadowLight />
        <CameraControls
          ref={(instance) => setCameraControls(instance)}
          minDistance={0.1}
          maxDistance={1000}
          mouseButtons={{
            left: CameraControlsImpl.ACTION.SCREEN_PAN, // 左键平移
            middle: CameraControlsImpl.ACTION.ROTATE, // 中键缩放
            right: CameraControlsImpl.ACTION.ROTATE, // 右键旋转
            wheel: CameraControlsImpl.ACTION.DOLLY, // 滚轮缩放
          }}
        />
        {modelElements && (
          <Suspense fallback={onModels?.()}>
            {modelElements instanceof Promise ? use(modelElements) : modelElements}
          </Suspense>
        )}
        <ModelProvider>
          {children && (
            <Suspense fallback={onModels?.()}>
              {children instanceof Promise ? use(children) : children}
            </Suspense>
          )}
          <EffectComposer enableNormalPass={true} multisampling={0} autoClear={false}>
            <>
              <SMAA />
              <N8AOHacked />
              <Bloom mipmapBlur levels={4} intensity={0.5} />
            </>

            <Outline
              // enabled={selected ? selected.values.length > 0 : false} // 是否启用描边效果
              selection={selected} // selection of objects that will be outlined
              blendFunction={BlendFunction.ALPHA} //SCREEN set this to BlendFunction.ALPHA for dark outlines
              patternTexture={outlineRef.current?.patternTexture ?? null} // a pattern texture
              edgeStrength={outlineRef.current?.edgeStrength ?? 2.5} // the edge strength
              pulseSpeed={outlineRef.current?.pulseSpeed ?? 0.0} // a pulse speed. A value of zero disables the pulse effect
              visibleEdgeColor={outlineRef.current?.visibleEdgeColor.getHex() ?? 0xffffff} // the color of visible edges
              hiddenEdgeColor={outlineRef.current?.hiddenEdgeColor.getHex() ?? 0x22090a} // the color of hidden edges
              height={outlineRef.current?.height ?? 1080} // render height
              kernelSize={outlineRef.current?.kernelSize ?? 3} // blur kernel size
              blur={outlineRef.current?.blur ?? true} // whether the outline should be blurred
              xRay={outlineRef.current?.xRay ?? true} // indicates whether X-Ray outlines are enabled
            />
          </EffectComposer>
        </ModelProvider>
      </Canvas>
    </div>
  )
}

function ShadowLight() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={[110, 200, 200]}
        intensity={1}
        shadow-mapSize-width={2048} // 阴影贴图宽度，越大越清晰，性能消耗越高
        shadow-mapSize-height={2048} // 阴影贴图高度，越大越清晰，性能消耗越高
        shadow-camera-near={0.5} // 阴影相机近裁剪面，太大可能裁掉近处阴影
        shadow-camera-far={500} // 阴影相机远裁剪面，太小会截断远处阴影
        shadow-camera-left={-200} // 阴影相机左边界，范围越大阴影覆盖越广，但会更模糊
        shadow-camera-right={200} // 阴影相机右边界
        shadow-camera-top={400} // 阴影相机上边界
        shadow-camera-bottom={-200} // 阴影相机下边界
      />
    </>
  )
}
/**
 *
 * @param viewer Viewer context
 * @param cameraControls Camera controls instance
 * @returns { dispose: () => void } - 用于清理事件监听器和样式
 */
function useMousePoint(viewer: Context, cameraControls: CameraControls | null): () => void {
  if (!viewer || !viewer.renderer || !viewer.camera || !viewer.scene) {
    console.error('Viewer context is not properly initialized.')
    return () => {}
  }

  if (!cameraControls) {
    console.error('CameraControls is not provided.')
    return () => {}
  }
  const disposeStyle = setMouseStyle(viewer) || {}
  function onMouseDown(event: MouseEvent) {
    const point = pickPoint(new Vector2(event.clientX, event.clientY), viewer)
    setOrbitPoint(viewer, cameraControls, point || new Vector3(0, 0, 0))
  }
  viewer.renderer.domElement?.parentElement?.addEventListener('mousedown', onMouseDown)
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    disposeStyle?.()

    viewer.renderer.domElement?.parentElement?.removeEventListener('mousedown', onMouseDown)
    console.log('Mouse point listener disposed.')
  }
}

/**
 * 设置鼠标样式
 * @param viewer Viewer context
 * @returns { dispose: () => void } - 用于清理事件监听器和样式
 */
function setMouseStyle(viewer: Partial<Context> | Context): () => void {
  if (!viewer.renderer || !viewer.scene || !viewer.camera) {
    console.error('Viewer context is not properly initialized.')
    return () => {}
  }
  const container = viewer.renderer.domElement

  if (!container) {
    console.error('Container element not found.')
    return () => {}
  }

  const mouseZoom = document.createElement('div')
  const zoomImg = document.createElement('div')

  mouseZoom.classList.add('cesium-mousezoom')
  zoomImg.classList.add('zoomimg')

  mouseZoom.appendChild(zoomImg)
  if (!container.parentElement) {
    console.error('Container parent element not found.')
    return () => {}
  }
  container.parentElement.appendChild(mouseZoom)

  let wheelTimer: number | undefined
  let isMiddleDown = false
  let isRightDown = false
  let disposed = false

  // 事件处理函数，保持引用以便解绑
  function onMouseDown(event: MouseEvent) {
    const point = pickPoint(new Vector2(event.clientX, event.clientY), viewer)
    const position = cartesianToWindowCoordinates(point, viewer)
    if (event.button === 1) {
      isMiddleDown = true
      showMouseZoom(position)
    } else if (event.button === 2) {
      isRightDown = true
      showMouseZoom(position)
    }
  }

  function onMouseUp(event: MouseEvent) {
    if (event.button === 1) {
      isMiddleDown = false
      hideMouseZoom()
    } else if (event.button === 2) {
      isRightDown = false
      hideMouseZoom()
    }
  }
  function onMouseMove(position: { x: number; y: number }) {
    if (isMiddleDown || isRightDown) {
      updateMouseZoomPosition(position)
    }
  }
  function onWheel(position: { x: number; y: number }) {
    showMouseZoom(position)
    if (wheelTimer) clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(() => {
      hideMouseZoom()
    }, 200)
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault()
  }

  container.addEventListener('mousedown', onMouseDown)
  container.addEventListener('mouseup', onMouseUp)
  container.addEventListener('wheel', onWheel)
  container.addEventListener('contextmenu', onContextMenu)
  container.removeEventListener('mousemove', onMouseMove)
  function showMouseZoom(position: { x: number; y: number }) {
    mouseZoom.className = 'cesium-mousezoom cesium-mousezoom-visible'
    updateMouseZoomPosition(position)
  }

  function hideMouseZoom() {
    mouseZoom.className = 'cesium-mousezoom'
  }

  function updateMouseZoomPosition(position: { x: number; y: number }) {
    if (position.x === 0 || position.y === 0) return
    const x = position.x
    const y = position.y
    mouseZoom.style.left = `${x}px`
    mouseZoom.style.top = `${y}px`
  }

  return () => {
    if (disposed) return
    disposed = true

    if (wheelTimer) clearTimeout(wheelTimer)
    if (container.contains(mouseZoom)) {
      container.removeChild(mouseZoom)
    }
    container.removeEventListener('contextmenu', onContextMenu)
    container.removeEventListener('mousedown', onMouseDown)
    container.removeEventListener('mouseup', onMouseUp)
    container.removeEventListener('wheel', onWheel)
  }
}

/**
 * 设置相机的轨道点
 * @param viewer Viewer context
 * @param cameraControls Camera controls instance
 * @param point Target point in 3D space
 * @returns
 */
function setOrbitPoint(
  viewer: Partial<Context> | Context,
  cameraControls: CameraControlsImpl | null,
  point: Vector3
) {
  if (!viewer.renderer || !viewer.scene || !viewer.camera) {
    console.error('Viewer context is not properly initialized.')
    return
  }
  viewer.camera.updateMatrixWorld()
  cameraControls?.setOrbitPoint(point.x, point.y, point.z)
}
/**
 * N8AOHacked component that applies N8AO effect with dynamic enabling based on viewport
 * @returns N8AOHacked component with N8AO effect
 */
const N8AOHacked = () => {
  const [enabled, setEnabled] = useState(true)
  const viewport = useThree((three) => three.viewport)

  useEffect(() => {
    setEnabled(viewport.dpr === viewport.initialDpr)
  }, [viewport])

  if (!enabled) return null

  return <N8AO color="#000000" aoRadius={5} intensity={5} aoSamples={16} denoiseSamples={8} />
}

function onEffects(
  refs: Ref<Effect | null>[],
  setSelected: (objects: Mesh[]) => void,
  {
    effects,
  }: {
    effects?:
      | null
      | (Effect | Effect[] | null)
      | (() => Effect[] | Effect | null)
      | Observable<Effect | Effect[] | null>
  }
): void {
  console.log('Initializing effects:', effects)
  if (!effects) return

  if (typeof effects === 'function') {
    const postprocessing = effects()
    if (Array.isArray(postprocessing)) {
      for (const eff of postprocessing) {
        setEffects(refs, eff)
      }
      return
    } else if (postprocessing instanceof Effect) {
      setEffects(refs, postprocessing)
      return
    }
    return
  }
  if (effects instanceof Observable) {
    effects.subscribe((effs) => {
      if (Array.isArray(effs)) {
        for (const eff of effs) {
          setEffects(refs, eff)
        }
      }
      if (effs instanceof Effect) {
        setEffects(refs, effs)
      }
    })
    return
  }

  if (Array.isArray(effects)) {
    for (const eff of effects) {
      setEffects(refs, eff)
    }
    return
  } else if (effects instanceof Effect) {
    setEffects(refs, effects)
    return
  }

  function getRefsByType<T extends Effect>(
    refs: Ref<Effect | null>[],
    ctor: new (...args: any[]) => T
  ): RefObject<T>[] {
    return refs
      .filter((ref): ref is RefObject<Effect | null> => !!(ref as RefObject<Effect>).current)
      .filter((ref): ref is RefObject<T> => (ref as RefObject<Effect>).current instanceof ctor)
  }

  function setEffects(refs: Ref<Effect | null>[], effects: Effect | null): void {
    const outlineEffect = getRefsByType(refs, OutlineEffect)
    for (const eff of outlineEffect) {
      if (effects instanceof OutlineEffect) {
        eff.current = effects

        setSelected(getSelectedMeshes(effects))
      } else {
        console.warn('Expected OutlineEffect but got:', effects)
      }
    }
  }
}
