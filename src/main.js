import App from './App.vue'
import { createSSRApp } from 'vue'
import { createRouter } from './router'

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
// SSR要求每个请求都有一个新的应用程序实例，因此我们导出一个函数来创建一个新的应用程序实例。
// 如果使用Vuex，我们也会在这里创建一个新的store



export function createApp() {

  // 创建一个服务端渲染应用
  const app = createSSRApp(App)
  const router = createRouter()
  app.use(router)
  return { app, router }
}
