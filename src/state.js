import { observe, proxy } from './observer/index.js'
import { Compiler } from './compiler/index.js'

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
  new Compiler(vm.$options.el, vm)
}
function initComputed() {}
function initWatch() {}
