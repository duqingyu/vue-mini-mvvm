import { compileToFunctions } from './compiler/index.js'
import { patch } from './vdom/patch.js'

export function callHook(vm, hook) {
  // vue内部对生命周期还进行了依赖收集和错误处理
  // hook可能还会是组件的回调事件,这里就这能是生命周期了。。
  // 这里就不会这么复杂去整。。
  const handlers = vm.$options[hook]
  if (handlers) {
    handlers.call(vm)
  }
}

export function lifeCycleMixin(Vue) {
  // 渲染优先级,render => template => el
  // 模板 => ast语法树 => 一系列优化 => render函数 => 虚拟dom => patch补丁 => 真实dom
  Vue.prototype.$mount = function (el) {
    const vm = this
    vm.$el = document.querySelector(el)
    const opts = this.$options

    if (!opts.render) {
      let template = opts.template
      if (!template) {
        template = vm.$el.outerHTML
      }
      const { render } = compileToFunctions(template)
      opts.render = render
    }

    mountComponent(vm)
  }

  Vue.prototype._update = function (vnode) {
    const vm = this
    patch(vm.$el, vnode)
  }
}

// 编译完成之后的真正挂载
function mountComponent(vm) {
  vm._update(vm._render())
}
