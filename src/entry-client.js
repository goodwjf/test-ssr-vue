import { createApp } from './main' // main.js -> const app = createSSRApp(App)

const { app, router } = createApp()

// wait until router is ready before mounting to ensure hydration match
// 等到路由器准备好后再挂载，以确保“注水”
router.isReady().then(() => {
  // 名词解释：
  // hydrate 就是“注水”，一个完整的网页 = “干货(纯数据)” + “掺水” 的结果， 
  // 数据不是给人看的，但是“注水”之后，变成可以展示的HTML，
  // 就变成浏览器可以解释，用户能看的东西了，这过程就是hydrate。

  // 官宣：
  // Hydration 是在 Vue 在获取静态 HTML，从服务端发出，
  // 然后转化为可反应客户端数据变化的动态 DOM 的过程中被引入到客户端的。
  // 因为服务端已经渲染出了标记，我们显然不希望将其扔掉并重新创建所有的 DOM 元素。
  // 取而代之的是我们想要“hydrate”这些静态标记并使其变得可交互。


  // Vue 提供了一个 createSSRApp 方法用来在客户端代码中 (entry-client.js) 
  // 告诉 Vue hydrate(注水到) 现有的静态 HTML 而不是重新创建所有的 DOM 元素

  // 🚀 总结： ssrApp 有识别服务端的返回内容 进行注水的能力
  app.mount('#app')
})
