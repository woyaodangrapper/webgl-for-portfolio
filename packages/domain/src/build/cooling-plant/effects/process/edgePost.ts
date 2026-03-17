import { Color } from '@my/gl/gis'
import {
  createEdgeStage,
  EdgePostProcessStage,
  PostProcessStageCollection,
  PostProcessStageComposite,
  PostProcessStageLibrary,
} from '@my/gl/gis'

export class PostProcessStageManager {
  private stages: Map<string, EdgePostProcessStage | PostProcessStageComposite> = new Map()
  // 构造函数，支持通过传入阶段数组进行初始化
  constructor(initialStages?: [string, EdgePostProcessStage | PostProcessStageComposite][]) {
    initialStages?.forEach(([name, stage]) => {
      if (stage instanceof PostProcessStageComposite) {
        this.stages.set(name, stage)
      }
    })
  }
  // 添加一个新的后处理阶段
  add(name: string, stage: EdgePostProcessStage | PostProcessStageComposite): void {
    this.stages.set(name, stage)
  }

  // 获取某个阶段
  get(name: string): EdgePostProcessStage | PostProcessStageComposite | undefined {
    return this.stages.get(name)
  }

  // 删除某个阶段
  delete(name: string): void {
    this.stages.delete(name)
  }
}

export function createEdgeProcess(
  collection: PostProcessStageCollection,
  id: string
): EdgePostProcessStage {
  const edgeSPostProcesstage = createEdgeStage(id)

  edgeSPostProcesstage.visibleEdgeColor = Color.fromCssColorString('#a8a8e0')
  edgeSPostProcesstage.hiddenEdgeColor = Color.fromCssColorString('#4d4d4d')
  edgeSPostProcesstage.selected = []
  edgeSPostProcesstage.enabled = false
  collection.add(edgeSPostProcesstage)
  return edgeSPostProcesstage
}

export function createStageLibrary(
  collection: PostProcessStageCollection
): PostProcessStageComposite {
  const library = PostProcessStageLibrary.createSilhouetteStage()
  library.enabled = false
  collection.add(library)
  return library
}
