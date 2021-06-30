// @ts-check
const fs = require('fs')
const path = require('path')
const express = require('express')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production'
) {
  const resolve = (p) => path.resolve(__dirname, p)

  const indexProd = isProd
    ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    : ''

  const manifest = isProd
    ? // @ts-ignore
      require('./dist/client/ssr-manifest.json')
    : {}

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await require('vite').createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: 'ssr',
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          // 在测试过程中，我们编辑文件太快，有时会出错
          // 错过更改事件，因此强制轮询以保持一致性
          usePolling: true,
          interval: 100
        }
      }
    })
    // use vite's connect instance as middleware
    // 使用vite的connect实例作为中间件
    app.use(vite.middlewares)
  } else {
    app.use(require('compression')())
    app.use(
      require('serve-static')(resolve('dist/client'), {
        index: false
      })
    )
  }

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template, render
      if (!isProd) {
        // always read fresh template in dev
        // 总是在dev中读取新鲜的模板
        template = fs.readFileSync(resolve('index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)

       // SSR 外部化 
       // 许多依赖都同时提供 ESM 和 CommonJS 文件。
       // 当运行 SSR 时，提供 CommonJS 构建的依赖关系可以从 Vite 的 SSR 转换/模块系统进行 “外部化”，
       // 从而加速开发和构建。例如，并非去拉取 React 的预构建的 ESM 版本然后将其转换回 Node.js 兼容版本
       // 用 require('react') 代替会更有效
        render = (await vite.ssrLoadModule('/src/entry-server.js')).render
        // Vite 基于以下策略执行自动化的 SSR 外部化:

        // 如果一个依赖的解析 ESM 入口点和它的默认 Node 入口点不同，
        // 它的默认 Node 入口可能是一个可以外部化的 CommonJS 构建。
        // 例如，vue 将被自动外部化，因为它同时提供 ESM 和 CommonJS 构建。
        
        // 否则，Vite 将检查包的入口点是否包含有效的 ESM 语法 - 如果不包含，
        // 这个包可能是 CommonJS，将被外部化。例如，react-dom 将被自动外部化，
        // 因为它只指定了唯一的一个 CommonJS 格式的入口。
        
        // 如果这个策略导致了错误，你可以通过 ssr.external 和 ssr.noExternal 配置项手动调整。

        // 🚀 总结：只要依赖模块提供了 CommonJS 文件 就优先使用  CommonJS 就叫做 SSR 外部化 （个人理解若理解有误后期更正😁）
      } else {
        template = indexProd
        render = require('./dist/server/entry-server.js').render
      }

      const [appHtml, preloadLinks] = await render(url, manifest)

      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(3000, () => {
      console.log('http://localhost:3000')
    })
  )
}

// for test use
exports.createServer = createServer
