'use client'
import { useState, useCallback, useEffect } from 'react'
import { ViewGIS, viewer, zoomToModel } from '@my/gl/gis'
import { loadDefaultAnnotationAsync, loadDefaultTilesetAsync, TableOfContents } from '@my/domain'
import LoadingPage from '../loading'

export default function Page() {
  const [loaded, setLoaded] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
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
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLoaded = useCallback(() => {
    loadDefaultTilesetAsync(viewer)
      .catch((err) => {
        console.error('模型加载失败:', err)
      })
      .then((models) => {
        const mode = models?.[0]
        if (!mode) {
          console.error('没有加载到模型')
          return
        }
        console.log('模型加载成功', models)
        zoomToModel(viewer, models?.[2])

        // loadDefaultAnnotationAsync(viewer).then(() => {
        //   setLoaded(1)
        //   setTotal(1)
        //   setTimeout(() => setDone(true), 400)
        // })

        setLoaded(1)
        setTotal(1)
        setTimeout(() => setDone(true), 400)
      })
  }, [])

  return (
    <>
      <ViewGIS onLoaded={handleLoaded} />
      {mounted && !done && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            transition: 'opacity 0.4s ease',
            opacity: total > 0 && loaded >= total ? 0 : 1,
            pointerEvents: total > 0 && loaded >= total ? 'none' : 'auto',
          }}
        >
          <LoadingPage loaded={loaded} total={total} />
        </div>
      )}
      {mounted && <TableOfContents headings={tocHeadings} />}
    </>
  )
}
