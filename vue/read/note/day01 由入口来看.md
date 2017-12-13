# day01 由入口来看

### 一 先运行调试命令

```
npm run dev
```
* windows10下可能会遇到`Could not load xxx\xxx/`的情况，可使用`npm i npm update rollup-plugin-alias@1.4.0`升级的方式解决。
* 打包后sourceMap只能对应到压缩前的代码，而不能对应值合并前的各个模块，此时可去`\build\config.js`，在`genConfig` 函数的 `config`变量加一个属性`sourceMap: true`。
```js
  const config = {
    input: opts.entry,
    // xxxxx
    sourceMap: true,
    // xxxxx
  }
```
当前项目已做以上处理。
[参考](http://blog.csdn.net/reusli/article/details/78762510)

### 二 找主文件

根据entry和import
1. build/config.js ->
2. src/platforms/web/entry-runtime-with-compiler.js ->
3. src/platforms/web/runtime/index.js ->
4. src/core/index.js ->
5. src/core/instance/index.js

备注

1. 是构建文件入口。
2. 根据运行平台(和你的构建指令也有关系)不同进行不同配置的入口。
3. 就要找到了，此文件内对`Vue`做了平台相关的配置。
4. 找到了。
5. 我们先看这个。


### 三 src/core/instance/index.js

注意到有一个构造函数和五个函数的调用。

```
// 构造函数
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // new 调用Vue构造函数后进行_init
  this._init(options)
}
// 5个函数的调用
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
```

可以看到的是构造函数中使用了`this instanceof Vue`做了this的判断，为非的情况下，给出警告。后面调用`this._init(options)`根据传入配置进行实例的构造。

5个函数的调用，从函数的命名上我们也能看出来分别是初始化相关、数据状态相关、事件相关、声明周期相关、渲染相关。
我们先一个个的看这5个函数

1. initMixin
```js
 Vue.prototype._init = function (options?: Object) {xxx}
```
内部对Vue的原型上添加了`_init`方法，就是上面构造函数最后调用的方法。

2. stateMixin
```js
Object.defineProperty(Vue.prototype, '$data', dataDef)
Object.defineProperty(Vue.prototype, '$props', propsDef)
Vue.prototype.$set = set
Vue.prototype.$delete = del
Vue.prototype.$watch = function (){xxxx}
```
内部对Vue的原型上添加了四个属性`$data`、`$props`、`$set`、`$delete`、`$watch`，其中`$data`、`$props`因为有只读方面的限制，所以使用`Object.defineProperty`的方式定义，其中各自的xxxDef对`set`和`get`做了处理。

3. eventsMixin
```js
Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {xxx}
Vue.prototype.$once = function (event: string, fn: Function): Component {xxx}
Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {xxx}
Vue.prototype.$emit = function (event: string): Component {xxx}

```
Vue原型上添加了四个事件相关的方法。

4. lifecycleMixin
```js
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {xxx}
Vue.prototype.$forceUpdate = function () {xxx}
Vue.prototype.$destroy = function () {xxx}
```
Vue原型上添加了`_update`，`$forceUpdate`，`$destory`方法，方法内部针对同名周期做了组件的更新和状态的记录。

5. renderMixin
```js
installRenderHelpers(Vue.prototype)
Vue.prototype.$nextTick = function (fn: Function) {xxx}
Vue.prototype._render = function (): VNode {xxx}
```


### 待解决代码

1. Vue.prototype._init （day02）
2. state
  * Vue.prototype.$set = set
  * Vue.prototype.$delete = del
  * Vue.prototype.$watch
3. event
  * Vue.prototype.$on
  * Vue.prototype.$once
  * Vue.prototype.$off
  * Vue.prototype.$emit
4. lifecycle
  * Vue.prototype._update
  * Vue.prototype.$forceUpdate
  * Vue.prototype.$destroy
5. render
  * Vue.prototype.$nextTick
  * Vue.prototype._render
