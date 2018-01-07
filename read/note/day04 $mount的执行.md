# vm.$mount

`vm.$mount(vm.$options.el)`的调用位于`src/core/instance/init.js`文件的`Vue.prototype._init`方法中，见day02。

我们能看到是在
`src/platforms/web/runtime/index.js`文件中Vue原型被添加了$mount方法。
```
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  return mountComponent(this, el, hydrating)
}
```
但是这并不是`init`阶段真正调用的`$mount`方法。
根据day01我们看的对`Vue`构造函数的处理顺序（从5->1，打包命令引入顺序的反顺序）的分析中
```
1. build/config.js ->
2. src/platforms/web/entry-runtime-with-compiler.js ->
3. src/platforms/web/runtime/index.js ->
4. src/core/index.js ->
5. src/core/instance/index.js
```
在`src/platforms/web/entry-runtime-with-compiler.js`文件中又对`Vue`做了处理。
```
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function () {}
```
可以看到先对之前的`$mount`方法做了缓存，我们真正要看的正是这里新添加的`$mount`。
