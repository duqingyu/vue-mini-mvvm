import { initState } from './state.js'
import { callHook } from './lifecycle.js'
import Compiler from './compiler/base.js'

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options
    callHook(vm, 'beforeCreate')
    // 初始化状态
    initState(vm)
    callHook(vm, 'created')
    // 最简单的双向绑定编译
    new Compiler(vm.$options.el, vm)
    // 模板编译挂载
    // vm.$mount(vm.$options.el)
    callHook(vm, 'mounted')
  }
}
