import path from 'path'
import fsExtra from 'fs-extra'

export interface CopyAssetsOptions {
  exportDir?: string
  modulesRoot?: string
  targetDir?: string
  silent?: boolean
}

interface CopyTarget {
  src: string
  dest: string
}

export async function copyAssets(options: CopyAssetsOptions = {}): Promise<void> {
  const cwd = process.cwd()

  const exportRoot = options.exportDir
    ? path.isAbsolute(options.exportDir)
      ? options.exportDir
      : path.join(cwd, options.exportDir)
    : cwd

  const modulesRoot = options.modulesRoot
    ? path.isAbsolute(options.modulesRoot)
      ? options.modulesRoot
      : path.join(cwd, options.modulesRoot)
    : cwd

  const baseDest = options.targetDir
    ? path.isAbsolute(options.targetDir)
      ? options.targetDir
      : path.join(exportRoot, options.targetDir)
    : path.join(exportRoot, 'public/cesiumjs')

  const silent = options.silent ?? false

  const copyTargets: CopyTarget[] = [
    {
      src: path.join(modulesRoot, 'node_modules/cesium/Build/Cesium/Workers'),
      dest: path.join(baseDest, 'Workers'),
    },
    {
      src: path.join(modulesRoot, 'node_modules/cesium/Build/Cesium/ThirdParty'),
      dest: path.join(baseDest, 'ThirdParty'),
    },
    {
      src: path.join(modulesRoot, 'node_modules/cesium/Build/Cesium/Widgets'),
      dest: path.join(baseDest, 'Widgets'),
    },
    {
      src: path.join(modulesRoot, 'node_modules/cesium/Build/Cesium/Assets'),
      dest: path.join(baseDest, 'Assets'),
    },
  ]

  try {
    for (const target of copyTargets) {
      await fsExtra.copy(target.src, target.dest)
      if (!silent) {
        console.log(`✅ Copied ${target.src} → ${target.dest}`)
      }
    }

    if (!silent) {
      console.log('🎉 Cesium assets copied successfully.')
    }
  } catch (err) {
    console.error('❌ Error copying Cesium assets:', err)
    throw err
  }
}
