(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function isObject(data) {
    return _typeof(data) === 'object' && data !== null;
  }

  // 对会改变数组本身的方法进行重写
  // 总共7个 push shift unshift pop reverse sort splice
  var oldArrayMethods = Array.prototype; // value.__proto__ = arrayMethods 原型链向上查找,首先会找到重写的,找不到再向上找到原生的

  var arrayMethods = Object.create(oldArrayMethods);
  var methods = ['push', 'shift', 'unshift', 'pop', 'sort', 'splice', 'reverse'];
  methods.forEach(function (method) {
    arrayMethods[method] = function () {
      console.log('用户调用了push方法');

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var result = oldArrayMethods[method].apply(this, args); // push unshift添加的元素可能还是对象需要再次监测

      var inserted;
      var ob = this.__ob__;

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;

        case 'splice':
          inserted = args.slice(2);
      }

      if (inserted) ob.observerArray(inserted);
      return result;
    };
  });

  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);

      this.subs = [];
    }

    _createClass(Dep, [{
      key: "depend",
      value: function depend() {
        if (Dep.target) {
          Dep.target.addDep(this);
        }
      }
    }, {
      key: "addSub",
      value: function addSub(watcher) {
        this.subs.push(watcher);
      }
    }, {
      key: "notify",
      value: function notify() {
        this.subs.forEach(function (sub) {
          return sub.update();
        });
      }
    }]);

    return Dep;
  }(); // target其实就是一个watcher的实例
  // 在模板编译的时候会 new Watcher(vm, 'c.d', (newVal) => {})

  Dep.target = null;
  var targetStack = [];
  function pushTarget(target) {
    targetStack.push(target);
    Dep.target = target;
  }
  function popTarget() {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }

  var Observer = /*#__PURE__*/function () {
    function Observer(value) {
      _classCallCheck(this, Observer);

      // 递归解析对象,对每个对象进行监测
      // 这样性能用有问题,vue3使用proxy直接怼整个进行检测,性能优化了不少
      // value.__ob__ = this // 直接写导致内存溢出,应该是枚举相关问题
      Object.defineProperty(value, '__ob__', this);

      if (Array.isArray(value)) {
        value.__proto__ = arrayMethods; // 尤大认为数组每一项的索引都检测会非常损耗性能
        // 直接对数组的7个方法重写监听数组改变

        this.observeArray(value);
      } else {
        this.walk(value);
      }
    }

    _createClass(Observer, [{
      key: "observeArray",
      value: function observeArray(value) {
        for (var i = 0; i < value.length; i++) {
          observe(value[i]);
        }
      }
    }, {
      key: "walk",
      value: function walk(data) {
        Object.keys(data).forEach(function (key) {
          defineReactive(data, key, data[key]);
        });
      }
    }]);

    return Observer;
  }();

  function proxy(vm, data) {
    Object.keys(data).forEach(function (key) {
      Object.defineProperty(vm, key, {
        configurable: true,
        enumerable: true,
        get: function get() {
          return vm._data[key];
        },
        set: function set(newVal) {
          vm._data[key] = newVal;
        }
      });
    });
  }

  function defineReactive(data, key, value) {
    observe(value);
    var dep = new Dep();
    Object.defineProperty(data, key, {
      get: function get() {
        // 在编译模板会将target设置为watcher的实例,收集依赖
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set: function set(newVal) {
        if (newVal === value) {
          return;
        }

        observe(value);
        console.log('data里的值发生变化了');
        value = newVal; // 发布更新

        dep.notify();
      }
    });
  }

  function observe(data) {
    if (!isObject(data)) {
      return;
    }

    return new Observer(data);
  }

  // 每次setter的时候执行dep.notify()执行收集的所有watchers

  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, excepssion, cb) {
      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.excepssion = excepssion; // eg: person.name, person.age

      this.cb = cb;
      this.newDeps = [];
      this.value = this.getVal(); // 执行以下更新，第一次dom取数据渲染的时候

      this.cb(this.value);
    }

    _createClass(Watcher, [{
      key: "getVal",
      value: function getVal() {
        pushTarget(this);
        var val = this.vm; // 循环取值

        this.excepssion.split('.').forEach(function (key) {
          // 这里每次执行val[key]的时候，就回去执行proxy里面的getter方法
          val = val[key];
        });
        popTarget();
        return val;
      }
    }, {
      key: "addDep",
      value: function addDep(dep) {
        this.newDeps.push(dep);
      }
    }, {
      key: "update",
      value: function update() {
        var arr = this.excepssion.split('.');
        var val = this.vm;
        arr.forEach(function (k) {
          val = val[k];
        });
        this.cb(val);
      }
    }]);

    return Watcher;
  }();

  var Compiler = /*#__PURE__*/function () {
    function Compiler(el, vm) {
      _classCallCheck(this, Compiler);

      this.init(el, vm);
    }

    _createClass(Compiler, [{
      key: "init",
      value: function init(el, vm) {
        vm.$el = document.querySelector(el); // 创建一个文档碎片，这样处理更高效

        var fragment = document.createDocumentFragment();
        var child;

        while (child = vm.$el.firstChild) {
          fragment.appendChild(child);
        }

        this.replace(fragment, vm);
        vm.$el.appendChild(fragment);
      }
    }, {
      key: "replace",
      value: function replace(frag, vm) {
        var _this = this;

        Array.from(frag.childNodes).forEach(function (node) {
          var txt = node.textContent;
          var reg = /\{\{(.*?)\}\}/g; // 识别{{xx.xx}}的正则

          if (node.nodeType === 3 && reg.test(txt)) {
            // 文本节点
            // 首次渲染要为数据创建watcher，后面就直接用update更新
            new Watcher(vm, RegExp.$1, function (newVal) {
              // 替换
              node.textContent = txt.replace(reg, newVal).trim();
            });
          } else if (node.nodeType === 1) {
            // 元素节点，这儿只做了v-model双向绑定的情况
            var nodeAttr = node.attributes;
            Array.from(nodeAttr).forEach(function (attr) {
              var name = attr.name,
                  exp = attr.value;

              if (name.includes('v-') || name.includes(':')) {
                // 首次渲染要为数据创建watcher，后面就直接用update更新
                new Watcher(vm, exp, function (newVal) {
                  node.value = newVal;
                });
                node.addEventListener('input', function (e) {
                  var newval = e.target.value;
                  vm[exp] = newval;
                });
              }
            });
          }

          if (node.childNodes && node.childNodes.length) {
            _this.replace(node, vm);
          }
        });
      }
    }]);

    return Compiler;
  }();

  function initState(vm) {
    var opts = vm.$options;

    if (opts.props) ;

    if (opts.methods) {
      initMethod(vm);
    }

    if (opts.data) {
      initData(vm);
    }

    if (opts.computed) ;

    if (opts.watch) ;
  }

  function initMethod(vm) {
    var methods = vm.$options.methods;

    for (var key in methods) {
      vm[key] = methods[key].bind(vm);
    }
  }

  function initData(vm) {
    // console.log('初始化数据', vm)
    // 获取data,data可能是对象或者function
    var data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm) : data; // 实现数据代理,让vm.a => vm._data.a

    proxy(vm, data); // 对数据劫持,监听数据改变实现MVVM,vue2.x主要用Obejct.defineProperty

    observe(data); // 模板编译

    new Compiler(vm.$options.el, vm);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      vm.$options = options; // 初始化状态

      initState(vm);
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
