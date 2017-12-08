# 

### 先运行调试命令

```
npm run dev
```
### 找主文件

根据entry和import
1. build/config.js -> 
2. src/platforms/web/entry-runtime-with-compiler.js -> 
3. src/platforms/web/runtime/index.js

### 备注

1. 是构建文件入口。
2. 根据运行平台(和你的构建指令也有关系)不同进行不同配置的入口。
3. 就要找到了