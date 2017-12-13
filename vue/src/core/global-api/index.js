/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick
  /*
   * options配置
   * {
   *   components,
   *   directives,
   *   filters
   * }
   */
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue
  /*
   * builtInComponents 为 KeepAlive
   * 即为Vue配置全局keepAlive内置组件，应该还会在某个地方配Transtion
   * 其他内置的指令、过滤器以后应该也会配进options里
   */
  extend(Vue.options.components, builtInComponents)
  // Vue.use = function () {} 使用插件的方法
  initUse(Vue)
  // Vue.mixin = function () {}
  initMixin(Vue)
  /*
   * Vue.cid = 0
   * Vue.extend = function () {} 应该是继承相关的
   */
  initExtend(Vue)
  /*
   * Vue.component = function () {}
   * Vue.directive = function () {}
   * Vue.filter = function () {}
   */
  initAssetRegisters(Vue)
}
