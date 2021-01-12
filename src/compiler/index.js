import { Watcher } from '../observer/watcher.js'

export class Compiler {
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
    Array.from(frag.childNodes).forEach((node) => {
      let txt = node.textContent
      let reg = /\{\{(.*?)\}\}/g // 识别{{xx.xx}}的正则
      if (node.nodeType === 3 && reg.test(txt)) {
        // 文本节点
        // 首次渲染要为数据创建watcher，后面就直接用update更新
        new Watcher(vm, RegExp.$1, (newVal) => {
          // 替换
          node.textContent = txt.replace(reg, newVal).trim()
        })
      } else if (node.nodeType === 1) {
        // 元素节点，这儿只做了v-model双向绑定的情况
        let nodeAttr = node.attributes
        Array.from(nodeAttr).forEach((attr) => {
          let name = attr.name,
            exp = attr.value
          if (name.includes('v-') || name.includes(':')) {
            // 首次渲染要为数据创建watcher，后面就直接用update更新
            new Watcher(vm, exp, (newVal) => {
              node.value = newVal
            })
            node.addEventListener('input', (e) => {
              let newval = e.target.value
              vm[exp] = newval
            })
          }
        })
      }
      if (node.childNodes && node.childNodes.length) {
        this.replace(node, vm)
      }
    })
  }
}
