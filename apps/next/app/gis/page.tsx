'use client'
import { ViewGIS, viewer, zoomToModel } from '@my/gl/gis'
import { loadDefaultAnnotationAsync, loadDefaultTilesetAsync } from '@my/domain'

// import { HomeScreen } from 'app/features/home/screen'

export default function Page() {
  const handleLoaded = () => {
    loadDefaultTilesetAsync(viewer)
      .catch((err) => {
        console.error('模型加载失败:', err)
      })
      .then((models) => {
        const mode = models?.slice(-1)[0]
        if (!mode) {
          console.error('没有加载到模型')
          return
        }
        console.log('模型加载成功', models)
        zoomToModel(viewer, mode) // 使用底板作为参照物定位过去
        loadDefaultAnnotationAsync(viewer) // 加载注释交互点
      })
  }
  return (
    <ViewGIS
      onLoaded={handleLoaded}
      // homeScreen={<HomeScreen />}
      // loading={<Loading />}
      // error={<Error />}
    />
  )
}
