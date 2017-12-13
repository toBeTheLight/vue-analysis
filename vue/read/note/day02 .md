# day02 new调用
从`new Vue()`开始

### 源码

我们现在来看Vue构造函数中的调用的`_init()`。
从上一节的`initMixin(Vue)`，我们知道`_init()`方法是在`src/core/instance/init.js`中被加到`Vue`的原型上的。
```js
Vue.prototype._init = function (options?: Object) {
  const vm: Component = this
  vm._uid = uid++
  let startTag, endTag
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`
    endTag = `vue-perf-end:${vm._uid}`
    mark(startTag)
  }
  // a flag to avoid this being observed
  vm._isVue = true
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }
  // expose real self
  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')
  /* istanbul ignore if */
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

### 分析
1. 使用了`vm`接收了`this`(实例)。
2. 首先在`this`上添加了`uid`属性，这是一个自增的值，每调用一次`Vue`就会`+1`，这个id可用来分辨递归或遍历出的组件的异常。
3. 在`this`上添加了`_isVue`属性，值为`true`，
4. 判断 `options && options._isComponent`，经过调试发现使用使用`Vue.component`时，会被添加`_isComponent=true`，我们先不管它，使用`new Vue()`并不会走此分支，会进入下方代码分支，此时使用`mergeOptions`合并参数。

  ```js
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
  ```
5. `mergeOptions`的第一个参数为`resolveConstructorOptions(vm.constructor)`，`vm.constructor`理所当然就是`Vue`啦，看此函数是将`Vue.options`处理了一下(根据是否有Vue.super)并返回；第二个参数就是`new Vue()`传入的`options`；第三个参数是刚刚在`_init`函数中添加了`_isVue`和`_uid`的当前实例，

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
