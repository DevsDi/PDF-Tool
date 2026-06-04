# 开发者指南

## 目录

1. [环境搭建](#环境搭建)
2. [项目架构](#项目架构)
3. [开发流程](#开发流程)
4. [构建打包](#构建打包)
5. [代码规范](#代码规范)
6. [扩展功能](#扩展功能)
7. [问题排查](#问题排查)

---

## 环境搭建

### 系统要求

- Windows 10/11 (64位)
- Node.js >= 18.0
- npm >= 9.0
- Git

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/example/pdf-tool.git

# 进入项目目录
cd "PDF Tool"

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发模式
npm run dev

# 或使用
node node_modules/vite/bin/vite.js
```

开发模式会同时启动：
- Vite开发服务器（http://localhost:5173）
- Electron应用窗口

---

## 项目架构

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Electron | 28.x |
| 前端 | React | 18.x |
| UI库 | Ant Design | 5.x |
| 语言 | TypeScript | 5.x |
| 构建 | Vite | 5.x |
| PDF处理 | pdf-lib | 1.17.x |
| PDF转Word | pdf2docx | - |

### 目录结构

```
PDF Tool/
├── package.json            # 项目配置
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
├── electron-builder.yml    # 打包配置
│
├── electron/               # Electron主进程
│   ├── main.ts             # 主进程入口
│   ├── preload.ts          # 预加载脚本（IPC桥接）
│   ├── services/           # PDF处理服务
│   │   ├── pdf-merge.ts    # 合并服务
│   │   ├── pdf-split.ts    # 拆分服务
│   │   ├── pdf-compress.ts # 压缩服务
│   │   ├── pdf-watermark.ts# 去水印服务
│   │   ├── pdf-encrypt.ts  # 加密服务
│   │   └── pdf-decrypt.ts  # 解密服务
│   └── portable-python/    # 便携Python环境
│       ├── python.exe      # Python解释器
│       ├── libs/           # 依赖库
│       └── scripts/        # 转换脚本
│
├── src/                    # 前端源码
│   ├── main.tsx            # React入口
│   ├── App.tsx             # 主应用（路由配置）
│   ├── components/         # 公共组件
│   │   ├── Layout.tsx      # 布局组件
│   │   ├── FileUploader.tsx# 文件上传组件
│   │   └── ProgressDisplay.tsx # 进度组件
│   ├── pages/              # 功能页面
│   │   ├── Merge.tsx       # PDF合并
│   │   ├── Split.tsx       # PDF拆分
│   │   ├── Convert.tsx     # PDF转Word
│   │   ├── Compress.tsx    # PDF压缩
│   │   ├── Watermark.tsx   # PDF去水印
│   │   ├── Encrypt.tsx     # PDF加密
│   │   └── Decrypt.tsx     # PDF解密
│   └── types/              # 类型定义
│       └── electron.d.ts   # Electron API类型
│
├── dist/                   # 前端构建输出
├── dist-electron/          # Electron构建输出
├── release/                # 打包输出目录
│   ├── win-unpacked/       # 解压版
│   └── PDF全能箱-portable.zip # 便携版压缩包
│
├── README.md               # 项目说明
├── USER_GUIDE.md           # 用户指南
├── DEVELOPER_GUIDE.md      # 开发者指南
├── CHANGELOG.md            # 更新日志
├── LICENSE.txt             # 许可协议
└── BUILD.md                # 构建说明
```

### 架构图

```
┌─────────────────────────────────────────────────────┐
│                  用户界面 (React)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ Merge   │ │ Split   │ │ Convert │ │ Compress│    │
│  │   ...   │ │   ...   │ │   ...   │ │   ...   │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                     │                                │
│              window.electronAPI                      │
│                     │                                │
├─────────────────────┼───────────────────────────────┤
│              preload.js (IPC桥接)                   │
│                     │                                │
├─────────────────────┼───────────────────────────────┤
│               main.ts (主进程)                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ IPC Handlers:                                │    │
│  │  - dialog:openFile                           │    │
│  │  - dialog:saveFile                           │    │
│  │  - pdf:merge / pdf:split / ...              │    │
│  └─────────────────────────────────────────────┘    │
│                     │                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ PDF Services (pdf-lib):                     │    │
│  │  - pdf-merge.ts                             │    │
│  │  - pdf-split.ts                             │    │
│  │  - pdf-compress.ts                          │    │
│  │  - ...                                      │    │
│  └─────────────────────────────────────────────┘    │
│                     │                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ Portable Python (pdf2docx):                 │    │
│  │  - pdf2word.py                              │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 开发流程

### 添加新功能页面

1. 创建页面组件

```tsx
// src/pages/NewFeature.tsx
import { useState } from 'react'
import { Button, Card, message } from 'antd'

function NewFeature() {
  const [files, setFiles] = useState<string[]>([])
  
  const handleAction = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile()
      // 处理逻辑
    }
  }
  
  return (
    <Card>
      {/* 页面内容 */}
    </Card>
  )
}

export default NewFeature
```

2. 添加路由

```tsx
// src/App.tsx
import NewFeature from './pages/NewFeature'

// 在Routes中添加
<Route path="/new-feature" element={<NewFeature />} />
```

3. 添加菜单项

```tsx
// src/components/Layout.tsx
const menuItems = [
  // 添加新菜单项
  {
    key: '/new-feature',
    icon: <NewIcon />,
    label: '新功能',
  },
]
```

4. 添加IPC处理（如需要）

```ts
// electron/main.ts
ipcMain.handle('new-feature:action', async (event, ...args) => {
  // 处理逻辑
  return { success: true }
})
```

5. 添加预加载API

```ts
// electron/preload.ts
newFeatureAction: (...args) => 
  ipcRenderer.invoke('new-feature:action', ...args)
```

6. 添加类型定义

```ts
// src/types/electron.d.ts
interface ElectronAPI {
  // 添加新方法
  newFeatureAction: (...args: any[]) => Promise<any>
}
```

### 调试技巧

#### 查看Electron日志

```bash
# 开发模式下查看控制台输出
# Electron窗口按 Ctrl+Shift+I 打开DevTools
```

#### 查看构建输出

```bash
# 检查构建文件
ls dist/
ls dist-electron/
```

#### 测试IPC通信

```tsx
// 前端代码中添加日志
console.log('API调用:', await window.electronAPI.openFile())
```

---

## 构建打包

### 构建命令

```bash
# 仅构建前端
npx vite build

# 构建+打包（需要签名，可能失败）
npm run electron:build

# 手动打包（推荐）
node node_modules/vite/bin/vite.js
# 然后复制文件到release/manual/
```

### 手动打包流程

由于electron-builder签名工具需要管理员权限，推荐手动打包：

```bash
# 1. 构建
npx vite build

# 2. 准备打包目录
mkdir -p release/manual
cp -r node_modules/electron/dist/* release/manual/

# 3. 复制应用资源
mkdir -p release/manual/resources/app
cp -r dist release/manual/resources/app/
cp -r dist-electron release/manual/resources/app/
cp package.json release/manual/resources/app/

# 4. 重命名exe
mv release/manual/electron.exe "release/manual/PDF全能箱.exe"

# 5. 压缩
cd release
powershell Compress-Archive -Path "manual/*" -DestinationPath "PDF全能箱-portable.zip"
```

### 打包产物

| 文件 | 说明 | 大小 |
|------|------|------|
| PDF全能箱-portable.zip | 便携版压缩包 | ~103MB |
| win-unpacked/ | 解压版目录 | ~200MB |

---

## 代码规范

### 文件命名

- 组件文件：`ComponentName.tsx`（大驼峰）
- 服务文件：`service-name.ts`（小驼峰）
- 类型文件：`types.d.ts`

### 组件结构

```tsx
/**
 * 组件说明
 * @param props 参数说明
 */
function Component(props: Props) {
  // 1. 状态定义
  const [state, setState] = useState(initial)
  
  // 2. 事件处理
  const handleClick = () => { }
  
  // 3. 渲染
  return (
    <div>
      {/* 内容 */}
    </div>
  )
}

export default Component
```

### IPC处理规范

```ts
// 统一返回格式
ipcMain.handle('action', async (event, ...args) => {
  try {
    // 处理逻辑
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

### 前端调用规范

```tsx
// 检查API存在
if (window.electronAPI) {
  const result = await window.electronAPI.action()
  if (result.success) {
    // 成功处理
  } else {
    message.error(result.error)
  }
}
```

---

## 扩展功能

### 添加新的PDF服务

```ts
// electron/services/pdf-new-feature.ts
import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'

export async function newPDFFeature(
  inputPath: string,
  outputPath: string,
  options: any
): Promise<string> {
  // 读取PDF
  const pdfBytes = fs.readFileSync(inputPath)
  const pdf = await PDFDocument.load(pdfBytes)
  
  // 处理逻辑
  
  // 保存
  const result = await pdf.save()
  fs.writeFileSync(outputPath, result)
  
  return outputPath
}
```

### 配置便携Python

PDF转Word功能需要Python环境：

1. 下载嵌入式Python
   - https://www.python.org/downloads/windows/
   - 选择 "Windows embeddable package (64-bit)"

2. 解压到 `electron/portable-python/`

3. 安装pdf2docx

```bash
# 在有完整Python环境的机器上
pip install pdf2docx

# 复制安装的库到便携Python
cp -r ~/.local/lib/python3.x/site-packages/pdf2docx portable-python/libs/
cp -r ~/.local/lib/python3.x/site-packages/fitz portable-python/libs/
cp -r ~/.local/lib/python3.x/site-packages/docx portable-python/libs/
```

4. 配置路径文件

修改 `portable-python/python3x._pth`:
```
.
libs
```

---

## 问题排查

### 构建失败

**问题：vite build报错**

```bash
# 检查依赖
npm install

# 清理缓存
rm -rf node_modules/.vite
```

### 打包空白

**问题：打包后exe显示空白**

原因：
1. 路由使用BrowserRouter（需要服务器）
2. preload路径错误
3. index.html路径错误

解决：
```tsx
// 使用HashRouter
import { HashRouter } from 'react-router-dom'
<HashRouter>...</HashRouter>
```

```ts
// 正确的路径配置
preload: join(__dirname, 'preload.js')
indexPath: join(__dirname, '../dist/index.html')
```

### IPC通信失败

**问题：window.electronAPI未定义**

检查：
1. preload.js是否正确加载
2. contextIsolation设置
3. preload路径是否正确

```ts
// main.ts
webPreferences: {
  preload: join(__dirname, 'preload.js'),
  contextIsolation: true,
}
```

### 签名工具失败

**问题：winCodeSign解压失败**

原因：需要管理员权限创建符号链接

解决：使用手动打包流程

---

## 相关链接

- [Electron文档](https://www.electronjs.org/docs)
- [React文档](https://react.dev/)
- [Ant Design文档](https://ant.design/docs/react/introduce)
- [pdf-lib文档](https://pdf-lib.js.org/)
- [pdf2docx文档](https://github.com/dothinking/pdf2docx)

---

© 2024 PDF Tool Team