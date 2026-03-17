const { copyAssets } = require('@my/config/dist/copyAssets.cjs')
copyAssets({ modulesRoot: '../../' })
  .then(() => console.log('Copy assets done!'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
