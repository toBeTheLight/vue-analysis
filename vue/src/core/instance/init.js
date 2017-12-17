/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  // 将_init方法添加到原型对象上
  Vue.prototype._init = function (options?: Object) {
    // 1. 使用了`vm`接收了`this`(实例)。
    const vm: Component = this
    // 2. 首先在`this`上添加了`uid`属性，这是一个自增的值，每调用一次`Vue`就会`+1`，这个id可用来分辨递归或遍历出的组件的异常。
    vm._uid = uid++
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 3. 在`this`上添加了`_isVue`属性，值为`true`
    vm._isVue = true
    // merge options
    // 判断 `options && options._isComponent`，
    // 经过调试发现使用`Vue.component`时，会被添加`_isComponent = true`，
    // 我们先不管它，使用`new Vue()`并不会走此分支，会进入下方代码分支，此时使用`mergeOptions`合并参数。
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // 这一部分做了将当前new Vue()的options与Vue.options的合并的处理
      vm.$options = mergeOptions(
        // resolveConstructorOptions(vm.constructor) 处理的是构造函数继承相关的东西
        // 然后返回Vue.options
        resolveConstructorOptions(vm.constructor),
        // options 即为new Vue()传入的options
        options || {},
        // 当前要创建的实例
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // 挂载自己
    vm._self = vm
    // 声明周期相关配置，包含组件关系。声明周期标志量等
    initLifecycle(vm)
    // 事件相关配置
    initEvents(vm)
    /* render功能的初始化
     * 在这个函数内只是做了一些render相关的初始化工作，并没有真正的进入render的过程。
     * 我们看前面的函数调用顺序也能发现`beforeCreated`的钩子函数是在这之后调用的，所以很合理。
     * 函数内向vm实例上添加了一些方法，
     * 同时对'$attrs'和'$listeners'使用`Object.defineProperty`进行了动态响应的设置。
     * 这两个属性可以去查文档。
     */
    initRender(vm)
    // 触发beforeCreate钩子
    callHook(vm, 'beforeCreate')
    // 这是2.2.0新增的inject属性的define
    initInjections(vm) // resolve injections before data/props
    /*
     * 干了这些事
     * initProps
     * initMethods
     * initData
     * initComputed
     * initWatch
     */
    initState(vm)
    // 这个是与上面的inject属性配合使用的一个属性
    initProvide(vm) // resolve provide after data/props
    // 到此 实例创建完毕
    callHook(vm, 'created')

    /* istanbul ignore if */
    // 哦~~~performance
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 有el的话进行挂载，否则需要手动$mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode
  opts._parentElm = options._parentElm
  opts._refElm = options._refElm

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const extended = Ctor.extendOptions
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = dedupe(latest[key], extended[key], sealed[key])
    }
  }
  return modified
}

function dedupe (latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    const res = []
    sealed = Array.isArray(sealed) ? sealed : [sealed]
    extended = Array.isArray(extended) ? extended : [extended]
    for (let i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i])
      }
    }
    return res
  } else {
    return latest
  }
}
