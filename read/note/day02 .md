# day02 new调用
这一章从`new Vue()`开始

```js
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
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
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`
    endTag = `vue-perf-end:${vm._uid}`
    mark(startTag)
  }
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
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm)
  initState(vm)
  initProvide(vm)
  callHook(vm, 'created')
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    vm._name = formatComponentName(vm, false)
    mark(endTag)
    measure(`vue ${vm._name} init`, startTag, endTag)
  }

  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```

### mergeOptions()

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
  // 处理指令，会给设置默认bind和update钩子
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
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```
### 此时的Vue
```
{
  set () {},
  delete () {},
  nextTick () {},
  version: '__VERSION__',
  options: {
    components: {
      KeepAlive
    },
    directives: {},
    filters: {},
    _base: function () {}
  }
}
```

### 待解决问题

1. Vue.super
