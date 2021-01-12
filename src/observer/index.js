import { isObject } from '../utils/index.js'
import { arrayMethods } from './array.js'
import { Dep } from './dep.js'

class Observer {
  constructor(value) {
    // 递归解析对象,对每个对象进行监测
    // 这样性能用有问题,vue3使用proxy直接怼整个进行检测,性能优化了不少
    // value.__ob__ = this // 直接写导致内存溢出,应该是枚举相关问题
    Object.defineProperty(value, '__ob__', this)

    if (Array.isArray(value)) {
      value.__proto__ = arrayMethods
      // 尤大认为数组每一项的索引都检测会非常损耗性能
      // 直接对数组的7个方法重写监听数组改变
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
  observeArray(value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i])
    }
  }
  walk(data) {
    Object.keys(data).forEach((key) => {
      defineReactive(data, key, data[key])
    })
  }
}

export function proxy(vm, data) {
  Object.keys(data).forEach((key) => {
    Object.defineProperty(vm, key, {
      configurable: true,
      enumerable: true,
      get: function () {
        return vm._data[key]
      },
      set: function (newVal) {
        vm._data[key] = newVal
      }
    })
  })
}

function defineReactive(data, key, value) {
  observe(value)
  const dep = new Dep()
  Object.defineProperty(data, key, {
    get() {
      // 在编译模板会将target设置为watcher的实例,收集依赖
      Dep.target && dep.addSub(Dep.target)
      return value
    },
    set(newVal) {
      if (newVal === value) {
        return
      }
      observe(value)
      console.log('data里的值发生变化了')
      value = newVal
      // 发布更新
      dep.notify()
    }
  })
}

export function observe(data) {
  if (!isObject(data)) {
    return
  }
  return new Observer(data)
}
