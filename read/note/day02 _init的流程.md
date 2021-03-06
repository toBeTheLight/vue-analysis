# new调用
这一章从`new Vue()`开始
构造函数为
```js
function Vue (options) {
  // new 调用Vue构造函数后进行_init
  this._init(options)
}
```
## 源码 _init()
我们现在来看Vue构造函数中的调用的`_init()`。
从上一节的`initMixin(Vue)`，我们知道`_init()`方法是在`src/core/instance/init.js`中的`initMixin(Vue)`被加到`Vue`的原型上的。
```js
Vue.prototype._init = function (options?: Object) {
  // 1. 使用了`vm`接收了`this`(实例)。
  const vm: Component = this
  // 2. 首先在`this`上添加了`uid`属性，这是一个自增的值，每调用一次`Vue`就会`+1`，这个id可用来分辨递归或遍历出的组件的异常。
  vm._uid = uid++
  let startTag, endTag
  // 3. 在`this`上添加了`_isVue`属性，值为`true`
  vm._isVue = true
  // 4. 判断 `options && options._isComponent`，经过调试发现使用`Vue.component`时，会被添加`_isComponent = true`，我们先不管它，使用`new Vue()`并不会走此分支，会进入下方代码分支，此时使用`mergeOptions`合并参数。
  if (options && options._isComponent) {
    initInternalComponent(vm, options)
  } else {
    // 我们等下看看这个函数做了什么工作
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }
  vm._self = vm
  // 声明周期相关配置，包含组件关系。声明周期标志量等
  initLifecycle(vm)
  // 事件初始化
  initEvents(vm)
  // render功能的初始化，并没有调用
  initRender(vm)
  // 触发beforeCreate钩子
  callHook(vm, 'beforeCreate')
  // 这是2.2.0新增的inject属性的初始化
  // 看文档与代码。inject的响应性质与prop、data不同。
  initInjections(vm)
  // 大部分watch是在这里进行的初始化
  initState(vm)
  // 这个是与上面的inject属性配合使用的一个属性
  initProvide(vm)
  // 到此 实例创建完毕
  callHook(vm, 'created')
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
```
除上方代码中注释的部分，我们再来单独看几个函数。

### mergeOptions() 配置合并

  ```js
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
  ```
1. `mergeOptions`的第一个参数为`resolveConstructorOptions(vm.constructor)`，`vm.constructor`理所当然就是`Vue`啦，看此函数是将`Vue.options`处理了一下(根据是否有Vue.super)并返回
2. 第二个参数就是`new Vue()`传入的`options`
3. 第三个参数是刚刚在`_init`函数中添加了`_isVue`和`_uid`的当前实例

```js
function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }

  if (typeof child === 'function') {
    child = child.options
  }

  // 处理并检查props属性是否符合vue规范
  normalizeProps(child, vm)
  // 处理并检查inject属性是否符合vue规范
  normalizeInject(child, vm)
  // 处理指令，会设置默认bind和update钩子
  normalizeDirectives(child)
  const extendsFrom = child.extends
  if (extendsFrom) {
    // 处理当前实例的继承，因为其他实例肯定会与Vue.options合并，所以可使用parent = 直接覆盖现有Vue.options
    parent = mergeOptions(parent, extendsFrom, vm)
  }
    // mixins的合并
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
  const options = {}
  let key
  // 将Vue.options上已有属性与传入options进行合并
  for (key in parent) {
    mergeField(key)
  }
  // options上属性与Vue.options的差集
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    /* 根据不同的key选择不同的合并策略,包括
     * 'component','directive','filter','beforeCreate',
     * 'created','beforeMount','mounted','beforeUpdate',
     * 'updated','beforeDestroy','destroyed','activated',
     * 'deactivated','errorCaptured'
     * 在`src/shared/constants.js`文件中
     */
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```
这一部分还是在进行options的整理，尚未真正的进入实例化阶段。

### initLifecycle()
```js
function initLifecycle (vm: Component) {
  const options = vm.$options
  // 进行组件父子关系的设置
  // 放在生命周期里可能和父子组建的销毁创建关系有关
  // 一个不推荐使用的api parent，用于传递数据
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm
  // 初始化一些值
  vm.$children = []
  vm.$refs = {}
  vm._watcher = null
  vm._inactive = null
  // 初始化一些标志声明周期状态的值
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
```

### initEvents()
```js
export function initEvents (vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  // 应该是<Components @click.once=""> 组件形式的事件 new Vue用不到先不管，会处理事件的绑定和解绑
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}
```

### initRender()
```js
function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data
  defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
  defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
}
```
在这个函数内只是做了一些render相关的初始化工作，并没有真正的进入render的过程。我们看前面的函数调用顺序也能发现`beforeCreated`的钩子函数是在这之后调用的，所以很合理。
函数内向vm实例上添加了一些方法，同时对'$attrs'和'$listeners'使用`Object.defineProperty`进行了动态响应的设置。这两个属性可以去查文档。

###  initState()
```js
/*
* 干了这些事
* initProps
* initMethods
* initData
* initComputed
* initWatch
*/
function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
## vm.$mount()

模板的解析和render是在这一部分

# 结语
本章主要梳理了下`init()`中的函数执行流程，后面将会详细看看`initState()`与`vm.$mount()`函数的调用。