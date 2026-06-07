# PDF全能箱 - 打包发布指南

## 环境要求

- Node.js 18+
- Python 3.10+（目标机器也需安装）
- Python 依赖：`pip install PyMuPDF pdf2docx pdfplumber pandas openpyxl`

## 快速构建

```bash
npm run dev      # 开发调试
npx vite build   # 构建前端 + Electron 主进程
```

## 打包步骤

### 1. 构建

```bash
npx vite build
```

构建产物：
- `dist/` — 前端页面（index.html + assets）
- `dist-electron/main.js` — Electron 主进程
- `dist-electron/preload.js` — 预加载脚本
- `dist-electron/portable-python/scripts/` — Python 脚本

### 2. 生成 Electron 运行时（仅首次）

```bash
npx electron-builder --win --x64 --dir
```

生成 `release/win-unpacked/` 目录，包含 Electron 二进制文件和 Chromium 运行时。

> 如果遇到 winCodeSign 符号链接错误，可忽略。只要 `release/win-unpacked/` 目录生成即可。

### 3. 组装应用目录

**目录结构（关键！路径必须严格一致）：**

```
release/win-unpacked/
├── PDF全能箱.exe                    # Electron 主程序
├── chrome_*.pak, *.dll, ...         # Chromium 运行时（自动生成，勿动）
├── locales/                         # 语言包
└── resources/
    └── app/                         # 应用代码（手动组装）
        ├── package.json             # 入口声明 {"main": "./main.js"}
        ├── main.js                  # Electron 主进程
        ├── preload.js               # 预加载脚本
        ├── dist/                    # 前端页面
        │   ├── index.html
        │   └── assets/
        │       ├── index-*.js
        │       └── index-*.css
        └── portable-python/scripts/ # Python 脚本
            ├── pdf2word.py
            ├── pdf2excel.py
            └── pdf-watermark-add.py
```

**组装命令：**

```bash
APP="release/win-unpacked/resources/app"

mkdir -p $APP/dist $APP/portable-python/scripts

# 复制 Electron 主进程
cp dist-electron/main.js $APP/
cp dist-electron/preload.js $APP/

# 复制前端
cp -r dist/* $APP/dist/

# 复制 Python 脚本
cp dist-electron/portable-python/scripts/*.py $APP/portable-python/scripts/

# 创建 package.json（Electron 入口声明）
echo '{"name":"pdf-tool","version":"1.0.0","main":"./main.js"}' > $APP/package.json
```

### 4. 打包压缩

```bash
# 推荐：使用 7z（PowerShell 可能被文件锁阻止）
node_modules/7zip-bin/win/x64/7za.exe a -mx5 PDF-Tool-Portable.7z ./release/win-unpacked/*

# 备选：PowerShell（需确保无进程占用文件）
Compress-Archive -Path release/win-unpacked/* -DestinationPath PDF-Tool-Portable.zip
```

## 关键配置说明

### main.ts — webSecurity（白屏问题的根源）

```typescript
webPreferences: {
  webSecurity: isDev,  // 开发模式开启，打包后关闭
  // file:// 协议下 ES Module 需要 webSecurity: false 才能加载
}
```

### main.ts — 路径引用

```typescript
// __dirname 在 resources/app/ 下
const indexPath = join(__dirname, 'dist/index.html')  // ✅ 正确
// const indexPath = join(__dirname, '../dist/index.html')  // ❌ 错误
```

### vite.config.ts — 静态文件复制

```typescript
viteStaticCopy({
  targets: [{
    src: 'electron/portable-python/scripts/*.py',
    dest: '../dist-electron/portable-python/scripts'  // 相对于 dist/，需 ../ 跳出
  }]
})
```

### electron-builder.yml

```yaml
files:
  - dist/**/*
  - dist-electron/main.js
  - dist-electron/preload.js
  - dist-electron/portable-python/**/*
```

## 已知问题与解决方案

| 问题 | 原因 | 解决 |
|------|------|------|
| 白屏 | `file://` 下 ES Module 被 CORS 阻止 | `webSecurity: false`（仅打包后） |
| 白屏 | `dist/index.html` 路径错误 | `join(__dirname, 'dist/index.html')` 而非 `../dist/` |
| Python 脚本找不到 | vite-static-copy dest 配置错误 | dest 相对于 `dist/`，用 `../dist-electron/` |
| winCodeSign 解压失败 | macOS 符号链接在 Windows 无法创建 | 忽略，`--dir` 模式不需要签名 |
| zip 打包失败 | 文件被 Electron 进程占用 | 先关闭 Electron，或用 7za 代替 PowerShell |
| 水印添加失败 bad fontname | PyMuPDF fontname 不允许空格 | 用 `fontname="china-s"` + `fontfile=字体路径` |
| 水印文字没写入 | insert_textbox 返回负值（矩形太小） | 增大矩形尺寸，检查返回值 |

## 分发说明

用户需知：
1. 解压到任意目录
2. 双击 `PDF全能箱.exe` 运行
3. 需预装 Python 3 + 依赖库（PyMuPDF、pdf2docx、pdfplumber）
4. Python 脚本功能（加水印、转Word、转Excel）依赖 Python 环境
5. Node.js 原生功能（合并、拆分、压缩、排序）无需额外依赖

## 一键打包脚本

```batch
@echo off
echo === PDF全能箱打包脚本 ===

echo [1/4] 构建
call npx vite build

echo [2/4] 组装应用
set APP=release\win-unpacked\resources\app
mkdir -p %APP%\dist %APP%\portable-python\scripts
copy dist-electron\main.js %APP%\
copy dist-electron\preload.js %APP%\
xcopy /E /Y dist %APP%\dist\
copy dist-electron\portable-python\scripts\*.py %APP%\portable-python\scripts\
echo {"name":"pdf-tool","version":"1.0.0","main":"./main.js"} > %APP%\package.json

echo [3/4] 测试运行
start release\win-unpacked\PDF全能箱.exe
echo 请确认界面正常后关闭窗口，然后继续...

echo [4/4] 打包压缩
node_modules\7zip-bin\win\x64\7za.exe a -mx5 PDF-Tool-Portable.7z .\release\win-unpacked\*

echo === 打包完成 ===
```
