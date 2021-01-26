import { Watcher } from '../observer/watcher.js'

/**
 * 最简单的模板编译操作
 * 直接解析template进行数据监听实现mvvm
 */
export default class Compiler {
  constructor(el, vm) {
    this.init(el, vm)
  }
  init(el, vm) {
    vm.$el = document.querySelector(el)
    // 创建一个文档碎片，这样处理更高效
    let fragment = document.createDocumentFragment()
    let child
    while ((child = vm.$el.firstChild)) {
      fragment.appendChild(child)
    }
    this.replace(fragment, vm)
    vm.$el.appendChild(fragment)
  }
  replace(frag, vm) {
    function compilerText(node) {
      let txt = node.textContent
      let reg = /\{\{(.*?)\}\}/g
      if (reg.test(txt)) {
        let update = (val) => (node.textContent = txt.replace(reg, val).trim())
        let watcher = new Watcher(vm, RegExp.$1, update)
        update(watcher.value)
      }
    }
    function compilerEle(node) {
      let nodeAttr = node.attributes
      Array.from(nodeAttr).forEach((attr) => {
        let name = attr.name,
          exp = attr.value
        if (name.includes('v-') || name.includes(':')) {
          // 首次渲染要为数据创建watcher，后面就直接用update更新
          // 暂时只对v-model写死做编译
          let update = (val) => (node.value = val)
          let watcher = new Watcher(vm, exp, update)
          node.addEventListener('input', (e) => {
            let newval = e.target.value
            vm[exp] = newval
          })
          update(watcher.value)
        }
      })
    }
    Array.from(frag.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        // 文本节点
        compilerText(node)
      } else if (node.nodeType === 1) {
        // 元素节点，这儿只做了v-model双向绑定的情况
        compilerEle(node)
      }
      if (node.childNodes && node.childNodes.length) {
        this.replace(node, vm)
      }
    })
  }
}
