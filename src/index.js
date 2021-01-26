import { initMixin } from './init.js'
import { stateMixin } from './state.js'
import { lifeCycleMixin } from './lifecycle.js'
import { renderMixin } from './vdom/index.js'

function Vue(options) {
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
lifeCycleMixin(Vue)
renderMixin(Vue)

export default Vue
