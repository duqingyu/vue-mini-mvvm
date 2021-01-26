import { observe, proxy } from './observer/index.js'
import { Compiler } from './compiler/base.js'
import { isObject } from './utils/index.js'
import { Watcher } from './observer/watcher.js'

export function initState(vm) {
  const opts = vm.$options

  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethod(vm)
  }
  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }
  if (opts.watch) {
    initWatch(vm)
  }
}

export function stateMixin(Vue) {
  Vue.prototype.$watch = function (expOrFn, cb, options) {
    const vm = this
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 第一次马上触发没有oldVal
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
    return function unwatchFn() {
      watcher.teardown()
    }
  }
}
function createWatcher(vm, expOrFn, handler, options) {
  if (isObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}

function initProps() {}
function initMethod(vm) {
  let methods = vm.$options.methods
  for (const key in methods) {
    vm[key] = methods[key].bind(vm)
  }
}
function initData(vm) {
  // console.log('初始化数据', vm)
  // 获取data,data可能是对象或者function
  let data = vm.$options.data
  data = vm._data = typeof data === 'function' ? data.call(vm) : data
  // 实现数据代理,让vm.a => vm._data.a
  proxy(vm, data)
  // 对数据劫持,监听数据改变实现MVVM,vue2.x主要用Obejct.defineProperty
  observe(data)
  // 模板编译
  // new Compiler(vm.$options.el, vm)
}
function initComputed() {}
function initWatch(vm) {
  let watchs = vm.$options.watch
  for (const key in watchs) {
    const handler = watchs[key]
    // watch允许回调依次执行数组的方法
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
