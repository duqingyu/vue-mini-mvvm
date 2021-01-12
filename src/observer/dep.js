export class Dep {
  constructor() {
    this.subs = []
  }
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach((sub) => sub.update())
  }
}

// target其实就是一个watcher的实例
// 在模板编译的时候会 new Watcher(vm, 'c.d', (newVal) => {})
Dep.target = null
const targetStack = []
export function pushTarget(target) {
  targetStack.push(target)
  Dep.target = target
}
export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
