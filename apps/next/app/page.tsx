'use client'

// import { useRouter } from 'next/navigation'

// export default function Page() {
//   const router = useRouter()
//   return <div onClick={() => router.push('/user/nate')}>Go to Nate's profile</div>
// }
import { Effect, View3D } from '@my/gl/3ds'
import { effects$, HvacModels, ModelOutline, TableOfContents } from '@my/domain'
import { Context } from '@my/gl/types'
import { useEffect, useState } from 'react'

export default function Page() {
  const [viewer, setViewer] = useState<Partial<Context> | Context | null>(null)
  const [effects, setEffects] = useState<Effect[]>([])

  const handleLoaded = (viewer: Partial<Context> | Context) => {
    if (!viewer || !viewer.scene || !viewer.camera || !viewer.renderer) {
      console.error(
        'Viewer or its properties (scene, camera, renderer) are not properly initialized.'
      )
      return
    }

    setViewer(viewer)
    console.log('Viewer loaded successfully')
  }

  useEffect(() => {
    const sub = effects$.subscribe(setEffects)
    return () => sub.unsubscribe()
  }, [])

  const tocHeadings = [
    { id: 'overview', title: '猎鹰9号概述', level: 2 },
    { id: 'first-stage', title: '第一级火箭', level: 2 },
    { id: 'merlin-engines', title: 'Merlin 1D 发动机组', level: 3 },
    { id: 'fuel-tanks', title: '燃料储箱（RP-1/LOX）', level: 3 },
    { id: 'landing-legs', title: '着陆支架', level: 3 },
    { id: 'grid-fins', title: '栅格翼', level: 3 },
    { id: 'interstage', title: '级间段', level: 2 },
    { id: 'second-stage', title: '第二级火箭', level: 2 },
    { id: 'mvac-engine', title: 'Merlin 真空发动机', level: 3 },
    { id: 'upper-fuel-tanks', title: '上级燃料储箱', level: 3 },
    { id: 'payload-fairing', title: '整流罩', level: 2 },
    { id: 'payload-adapter', title: '载荷适配器', level: 3 },
  ]

  return (
    <>
      <View3D onLoaded={handleLoaded} effects={effects}>
        <>{viewer && <HvacModels viewer={viewer} />}</>
      </View3D>
      <TableOfContents headings={tocHeadings} />
    </>
  )
}
