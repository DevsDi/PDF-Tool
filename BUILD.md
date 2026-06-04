# 构建说明

## 快速构建

```bash
# 开发模式
npm run dev

# 构建
npx vite build

# 手动打包（推荐）
# 见下方详细流程
```

---

## 构建流程详解

### 1. 开发模式

```bash
cd "D:/workspace/PDF Tool"
node node_modules/vite/bin/vite.js
```

启动内容：
- Vite开发服务器 (http://localhost:5173)
- Electron应用窗口
- 热更新支持

### 2. 生产构建

```bash
npx vite build
```

输出目录：
- `dist/` - 前端构建文件
- `dist-electron/` - Electron主进程文件

### 3. 手动打包

由于electron-builder签名工具需要管理员权限，推荐手动打包：

```bash
# 步骤1: 构建
npx vite build

# 步骤2: 创建打包目录
mkdir -p release/manual

# 步骤3: 复制Electron基础文件
cp -r node_modules/electron/dist/* release/manual/

# 步骤4: 创建app目录
mkdir -p release/manual/resources/app

# 步骤5: 复制应用资源
cp -r dist release/manual/resources/app/
cp -r dist-electron release/manual/resources/app/
cp package.json release/manual/resources/app/

# 步骤6: 重命名exe
mv release/manual/electron.exe "release/manual/PDF全能箱.exe"

# 步骤7: 压缩打包
cd release
powershell Compress-Archive -Path "manual/*" -DestinationPath "PDF全能箱-portable.zip"
```

---

## 构建产物

### 文件结构

```
release/
├── manual/                     # 解压版目录
│   ├── PDF全能箱.exe           # 主程序 (176MB)
│   ├── resources/              # 资源目录
│   │   └── app/               # 应用文件
│   │       ├── dist/          # 前端文件
│   │       ├── dist-electron/ # Electron文件
│   │       └── package.json
│   ├── *.dll                   # 依赖库
│   ├── *.pak                   # 资源包
│   └── locales/               # 语言包
│
└── PDF全能箱-portable.zip      # 便携版 (~103MB)
```

### 文件大小

| 组件 | 大小 |
|------|------|
| Electron基础 | ~85MB |
| 应用资源 | ~3MB |
| 依赖库 | ~15MB |
| 总计（解压） | ~200MB |
| 压缩后 | ~103MB |

---

## 环境配置

### Node.js版本

推荐使用 Node.js 18.x 或更高版本：

```bash
# 检查版本
node -v
npm -v
```

### 依赖安装

```bash
npm install
```

主要依赖：
- react: ^18.2.0
- antd: ^5.12.0
- electron: ^28.0.0
- pdf-lib: ^1.17.1
- vite: ^5.0.0
- typescript: ^5.3.0

### 镜像配置（可选）

国内用户可配置镜像加速：

```bash
# npm镜像
npm config set registry https://registry.npmmirror.com

# Electron镜像
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
```

---

## 常见问题

### Q: vite build很慢？

**原因**：首次构建需要编译大量模块

**解决**：
- 后续构建会利用缓存，速度提升
- 使用 `npx vite build` 直接构建

### Q: electron-builder打包失败？

**原因**：winCodeSign签名工具需要管理员权限

**解决**：使用手动打包流程

### Q: 打包后exe空白？

**原因**：
1. 路由配置错误（需要HashRouter）
2. preload路径错误
3. index.html路径错误

**解决**：参考DEVELOPER_GUIDE.md排查

### Q: 如何减少打包体积？

**方法**：
- 移除locales中不需要的语言包
- 压缩资源文件
- 使用asar压缩（需额外配置）

---

## 打包检查清单

构建前检查：

- [ ] 代码无错误
- [ ] 功能测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG已更新
- [ ] README已更新

打包后检查：

- [ ] exe可以正常启动
- [ ] 路由导航正常
- [ ] 功能可以使用
- [ ] 无控制台错误
- [ ] 文件大小合理

---

## 一键打包脚本

创建 `scripts/build.bat`：

```batch
@echo off
echo === PDF全能箱构建脚本 ===

echo [1/5] 清理旧文件
rm -rf release/manual
rm -rf release/PDF全能箱-portable.zip

echo [2/5] 构建
call npx vite build

echo [3/5] 复制Electron
mkdir -p release/manual
xcopy /E /I node_modules\electron\dist release\manual

echo [4/5] 复制应用资源
mkdir -p release\manual\resources\app
xcopy /E /I dist release\manual\resources\app\dist
xcopy /E /I dist-electron release\manual\resources\app\dist-electron
copy package.json release\manual\resources\app\

echo [5/5] 重命名和压缩
ren release\manual\electron.exe PDF全能箱.exe
powershell Compress-Archive -Path "release\manual\*" -DestinationPath "release\PDF全能箱-portable.zip"

echo === 构建完成 ===
echo 输出: release\PDF全能箱-portable.zip
```

---

## 发布流程

1. **构建测试**
   ```bash
   npm run dev
   # 测试所有功能
   ```

2. **生产构建**
   ```bash
   npx vite build
   ```

3. **手动打包**
   ```bash
   # 执行打包步骤
   ```

4. **测试打包**
   - 解压zip
   - 运行exe
   - 测试功能

5. **发布**
   - 上传到发布平台
   - 更新文档
   - 发布通知

---

© 2024 PDF Tool Team