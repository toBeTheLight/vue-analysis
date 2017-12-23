# initState
`src/core/instance/state.js`

## 代码

针对各配置属性进行了动态响应的设置
```js
function initState (vm: Component) {
  // 应该是watchers监听队列，做数据绑定的东西
  vm._watchers = []
  const opts = vm.$options
  // 有props 初始化prop
  if (opts.props) initProps(vm, opts.props)
  // 有methods 初始化methods
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    // 有data 初始化data
    initData(vm)
  } else {
    // 无则对_date进行watch
    observe(vm._data = {}, true /* asRootData */)
  }
  // 有computed 则初始化computed
  if (opts.computed) initComputed(vm, opts.computed)
  // firefox 对象原型有watch属性，做排除
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
其实就是对各个配置属性的初始化
1. initProps
2. initMethods
3. initData
4. initComputed
5. initWatch

## 1.initProps

```js
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // 使用数组缓存prop键避免使用动态的对象来遍历props
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // 根组件好像不能传入props，但是可以内部定义props的值，
  // 所以还是要进行处理的，就是这么用不太好吧。
  // root instance props should be converted
  observerState.shouldConvert = isRoot
  // 遍历对props中的值进行处理
  for (const key in propsOptions) {
    keys.push(key)
    // 对值进行处理，包括类型检查和默认缺省值处理
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    /* 此处删掉了
     * 1. 开发环境中对保留属性的判断
     * 2. 子组件内直接修改prop的警告
     */
    // 对props进行动态响应设置
    defineReactive(props, key, value)
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  observerState.shouldConvert = true
}
```
2. initMethods
```js
function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  // 遍历处理methods
  for (const key in methods) {
    /* 此处删除了对methods的一些检查
     * 1. method值为null 警告
     * 2. method键与props键重复 警告
     * 3. method键与vue内置方法键重复 警告
     */
    /*
     * 虽然你是个null 我还是要给你个默认值啊
     * 有值则将vm作为this绑定给methods[key]赋值与vm[key]
     * 内部使用的是闭包加call/apply
     * 原因见此: https://stackoverflow.com/questions/17638305/why-is-bind-slower-than-a-closure
     */ 
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm)
  }
}
```

# 补充
1. initProps中`isRoot = !vm.$parent`判断原因不清楚
2. 对于Boolean类型的props，不传入具体值，或传入与key同名字符串同样合法，且值会为true，如`<component have />`，`<component :have="'have'"/>`
3. 使用闭包 + call/apply 比bind更快的[原因](https://stackoverflow.com/questions/17638305/why-is-bind-slower-than-a-closure)