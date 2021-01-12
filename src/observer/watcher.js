import { pushTarget, popTarget } from './dep.js'

// compiler => watcher => getVal执行getter将watcher的实例收集到dep =>
// 每次setter的时候执行dep.notify()执行收集的所有watchers
export class Watcher {
  constructor(vm, excepssion, cb) {
    this.vm = vm
    this.excepssion = excepssion // eg: person.name, person.age
    this.cb = cb
    this.newDeps = []
    this.value = this.getVal()
    // 执行以下更新，第一次dom取数据渲染的时候
    this.cb(this.value)
  }
  getVal() {
    pushTarget(this)
    let val = this.vm
    // 循环取值
    this.excepssion.split('.').forEach((key) => {
      // 这里每次执行val[key]的时候，就回去执行proxy里面的getter方法
      val = val[key]
    })
    popTarget()
    return val
  }
  addDep(dep) {
    this.newDeps.push(dep)
  }
  update() {
    let arr = this.excepssion.split('.')
    let val = this.vm
    arr.forEach((k) => {
      val = val[k]
    })
    this.cb(val)
  }
}
