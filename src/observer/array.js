// 对会改变数组本身的方法进行重写
// 总共7个 push shift unshift pop reverse sort splice

let oldArrayMethods = Array.prototype
// value.__proto__ = arrayMethods 原型链向上查找,首先会找到重写的,找不到再向上找到原生的

export const arrayMethods = Object.create(oldArrayMethods)

const methods = ['push', 'shift', 'unshift', 'pop', 'sort', 'splice', 'reverse']

methods.forEach((method) => {
  arrayMethods[method] = function (...args) {
    console.log('用户调用了push方法')
    const result = oldArrayMethods[method].apply(this, args)
    // push unshift添加的元素可能还是对象需要再次监测
    let inserted
    let ob = this.__ob__
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
      default:
        break
    }
    if (inserted) ob.observerArray(inserted)

    return result
  }
})
