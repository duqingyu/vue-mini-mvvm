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

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.excepssion = excepssion; // eg: person.name, person.age

      this.cb = cb;
      this.newDeps = [];
      this.value = this.getVal(); // options.user => watch的watcher
      // options.lazy => computed的watcher
      // !options.user => data的watcher
      // 执行以下更新，第一次dom取数据渲染的时候

      if (!options.user && !options.lazy) {
        this.cb(this.value);
      }
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
        var oldVal = this.value;
        this.value = val;
        this.cb.call(this.vm, val, oldVal);
      }
    }]);

    return Watcher;
  }();

  /**
   * 最简单的模板编译操作
   * 直接解析template进行数据监听实现mvvm
   */

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

        function compilerText(node) {
          var txt = node.textContent;
          var reg = /\{\{(.*?)\}\}/g;

          if (reg.test(txt)) {
            var update = function update(val) {
              return node.textContent = txt.replace(reg, val).trim();
            };

            var watcher = new Watcher(vm, RegExp.$1, update);
            update(watcher.value);
          }
        }

        function compilerEle(node) {
          var nodeAttr = node.attributes;
          Array.from(nodeAttr).forEach(function (attr) {
            var name = attr.name,
                exp = attr.value;

            if (name.includes('v-') || name.includes(':')) {
              // 首次渲染要为数据创建watcher，后面就直接用update更新
              // 暂时只对v-model写死做编译
              var update = function update(val) {
                return node.value = val;
              };

              var watcher = new Watcher(vm, exp, update);
              node.addEventListener('input', function (e) {
                var newval = e.target.value;
                vm[exp] = newval;
              });
              update(watcher.value);
            }
          });
        }

        Array.from(frag.childNodes).forEach(function (node) {
          if (node.nodeType === 3) {
            // 文本节点
            compilerText(node);
          } else if (node.nodeType === 1) {
            // 元素节点，这儿只做了v-model双向绑定的情况
            compilerEle(node);
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

    if (opts.watch) {
      initWatch(vm);
    }
  }
  function stateMixin(Vue) {
    Vue.prototype.$watch = function (expOrFn, cb, options) {
      var vm = this;
      options = options || {};
      options.user = true;
      var watcher = new Watcher(vm, expOrFn, cb, options); // 第一次马上触发没有oldVal

      if (options.immediate) {
        cb.call(vm, watcher.value);
      }

      return function unwatchFn() {
        watcher.teardown();
      };
    };
  }

  function createWatcher(vm, expOrFn, handler, options) {
    if (isObject(handler)) {
      options = handler;
      handler = handler.handler;
    }

    if (typeof handler === 'string') {
      handler = vm[handler];
    }

    return vm.$watch(expOrFn, handler, options);
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
    // new Compiler(vm.$options.el, vm)
  }

  function initWatch(vm) {
    var watchs = vm.$options.watch;

    for (var key in watchs) {
      var handler = watchs[key]; // watch允许回调依次执行数组的方法

      if (Array.isArray(handler)) {
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  // Regular Expressions for parsing tags and attributes
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z".concat(unicodeRegExp.source, "]*");
  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
  var startTagOpen = new RegExp("^<".concat(qnameCapture));
  var startTagClose = /^\s*(\/?)>/;
  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>"));
  /* <div id="app">
    <p>模板语法：{{a}}</p>
    <p>
      <span>双向绑定：{{b}}</span>
      <input type="text" v-model="b" />
    </p>
  </div> */

  function template2Ast(html) {
    var text,
        root,
        currentParent,
        stack = [];

    while (html) {
      var textEnd = html.indexOf('<');

      if (textEnd === 0) {
        var startTagMatch = parseStartTag();

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }

        var endTagMatch = parseEndTag();

        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]);
          continue;
        }
      }

      if (textEnd > 0) {
        text = html.substring(0, textEnd);
      }

      if (text) {
        advance(text.length);
        chars(text);
      }
    }

    function advance(n) {
      html = html.substring(n);
    }

    function parseStartTag() {
      var start = html.match(startTagOpen);
      var end, attrs;

      if (start) {
        var match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);

        while (!(end = html.match(startTagClose)) && (attrs = html.match(attribute))) {
          match.attrs.push({
            name: attrs[1],
            value: attrs[3] || attrs[4] || attrs[5] // 'id=app', "id=app", `id="app"都不太一样..`

          });
          advance(attrs[0].length);
        }

        if (end) {
          advance(end[0].length);
          return match;
        }
      }
    }

    function parseEndTag() {
      return html.match(endTag);
    }

    function start(tagName, attrs) {
      var element = createAstElement(tagName, attrs);

      if (!root) {
        root = element;
      }

      currentParent = element;
      stack.push(element);
    }

    function end(tagName) {
      var element = stack.pop();
      currentParent = stack[stack.length - 1];

      if (currentParent) {
        element.parent = currentParent;
        currentParent.children.push(element);
      }
    }

    function chars(text) {
      text = text.trim();

      if (text.length > 0) {
        currentParent.children.push({
          type: 3,
          text: text
        });
      }
    }

    function createAstElement(tag, attrs) {
      return {
        tag: tag,
        attrs: attrs,
        type: 1,
        children: [],
        parent: undefined
      };
    }

    return root;
  }

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  // _v => createTextNode
  // _s => {{vale}} => _s(name)
  // with(this){return _c('div', {'id':"app"},_c('p', undefined,_v("模板语法："+_s(a))),_c('p', {'style':{"color":" red"," font-size":" 20px"}},_c('span', undefined,_v("双向绑定："+_s(b))),_c('input', {'type':"text",'v-model':"b"},)))}

  function formatProps(attrs) {
    var attrStr = '';
    attrs.map(function (attr) {
      if (attr.name === 'style') {
        var styleAttrs = attr.value.split(';').reduce(function (res, cur) {
          var _cur$split = cur.split(':'),
              _cur$split2 = _slicedToArray(_cur$split, 2),
              name = _cur$split2[0],
              val = _cur$split2[1]; // console.log(name, val)


          res[name] = val;
          return res;
        }, {});
        attr.value = styleAttrs;
      }

      attrStr += "'".concat(attr.name, "':").concat(JSON.stringify(attr.value), ",");
    });
    return "{".concat(attrStr.slice(0, -1), "}");
  }

  function generateChild(node) {
    if (node.type === 1) {
      return generate(node);
    } else if (node.type === 3) {
      var text = node.text;

      if (!defaultTagRE.test(text)) {
        return "_v(".concat(JSON.stringify(text), ")");
      }

      var match,
          index,
          lastIndex = defaultTagRE.lastIndex = 0,
          textArr = [];

      while (match = defaultTagRE.exec(text)) {
        index = match.index;

        if (index > lastIndex) {
          textArr.push(JSON.stringify(text.slice(lastIndex, index)));
        }

        textArr.push("_s(".concat(match[1].trim(), ")"));
        lastIndex = index + match[0].length;
      }

      if (lastIndex < text.length) {
        textArr.push(JSON.stringify(text.slice(lastIndex)));
      }

      return "_v(".concat(textArr.join('+'), ")");
    }
  }

  function getChildren(el) {
    var children = el.children;

    if (children) {
      return children.map(function (c) {
        return generateChild(c);
      }).join(',');
    }
  }

  function generate(el) {
    var children = getChildren(el);
    var code = "_c('".concat(el.tag, "', ").concat(el.attrs.length ? "".concat(formatProps(el.attrs)) : 'undefined', ",").concat(children ? "".concat(children) : '', ")");
    return code;
  }

  function compileToFunctions(template) {
    var ast = template2Ast(template);
    console.log('======ast========', ast);
    var code = generate(ast);
    console.log('=======code=======', code);
    var render = new Function("\n    with(this){return ".concat(code, "}\n  "));
    console.log('=======render=======', render);
    return {
      ast: ast,
      code: code,
      render: render
    };
  }

  function patch(oldNode, vNode) {
    return;
  }

  function callHook(vm, hook) {
    // vue内部对生命周期还进行了依赖收集和错误处理
    // hook可能还会是组件的回调事件,这里就这能是生命周期了。。
    // 这里就不会这么复杂去整。。
    var handlers = vm.$options[hook];

    if (handlers) {
      handlers.call(vm);
    }
  }
  function lifeCycleMixin(Vue) {
    // 渲染优先级,render => template => el
    // 模板 => ast语法树 => 一系列优化 => render函数 => 虚拟dom => patch补丁 => 真实dom
    Vue.prototype.$mount = function (el) {
      var vm = this;
      vm.$el = document.querySelector(el);
      var opts = this.$options;

      if (!opts.render) {
        var template = opts.template;

        if (!template) {
          template = vm.$el.outerHTML;
        }

        var _compileToFunctions = compileToFunctions(template),
            render = _compileToFunctions.render;

        opts.render = render;
      }

      mountComponent(vm);
    };

    Vue.prototype._update = function (vnode) {
      var vm = this;
      patch(vm.$el);
    };
  } // 编译完成之后的真正挂载

  function mountComponent(vm) {
    vm._update(vm._render());
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      vm.$options = options;
      callHook(vm, 'beforeCreate'); // 初始化状态

      initState(vm);
      callHook(vm, 'created'); // 最简单的双向绑定编译

      new Compiler(vm.$options.el, vm); // 模板编译挂载
      // vm.$mount(vm.$options.el)

      callHook(vm, 'mounted');
    };
  }

  function createElement(tag) {
    var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      children[_key - 2] = arguments[_key];
    }

    return vnode(tag, attrs, children);
  }
  function cteateTextVnode(text) {
    return vnode(undefined, undefined, undefined, text);
  }

  function vnode(tag, props, children, text) {
    return {
      tag: tag,
      props: props,
      children: children,
      text: text
    };
  }

  function renderMixin(Vue) {
    Vue.prototype._c = function () {
      return createElement.apply(void 0, arguments);
    };

    Vue.prototype._s = function (value) {
      if (value === null) return;
      return _typeof(value) === 'object' ? JSON.stringify(value) : value;
    };

    Vue.prototype._v = function (text) {
      return cteateTextVnode(text);
    }; // render函数转为虚拟dom


    Vue.prototype._render = function () {
      var vm = this,
          render = vm.$options.render,
          vnode = render.call(vm);
      console.log('=======vnode==========', vnode);
      return vnode;
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);
  stateMixin(Vue);
  lifeCycleMixin(Vue);
  renderMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
