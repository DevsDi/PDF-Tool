# 开发者指南

## 目录

1. [环境搭建](#环境搭建)
2. [项目架构](#项目架构)
3. [开发流程](#开发流程)
4. [构建打包](#构建打包)
5. [问题排查](#问题排查)

---

## 环境搭建

### 系统要求

- Windows 10/11 (64位)
- Node.js >= 18.0
- Python >= 3.10
- Git

### 安装

```bash
git clone https://github.com/DevsDi/PDF-Tool.git
cd "PDF Tool"
npm install --legacy-peer-deps
```

### Python 依赖

```bash
pip install PyMuPDF pdf2docx pdfplumber pandas openpyxl
```

### 开发模式

```bash
npm run dev
```

启动 Vite 开发服务器 + Electron 窗口，支持热更新。

---

## 项目架构

### 架构图

```
┌──────────────────────────────────────────────────┐
│               用户界面 (React + Ant Design)       │
│  Merge  Split  Reorder  Convert  Compress  WMAdd │
│                      │                           │
│              window.electronAPI                   │
├──────────────────────┼───────────────────────────┤
│              preload.js (IPC桥接)                 │
├──────────────────────┼───────────────────────────┤
│               main.ts (主进程)                    │
│                                                   │
│  ┌─ Node.js 服务 (pdf-lib) ─────────────────┐   │
│  │  pdf-merge   pdf-split   pdf-compress     │   │
│  │  pdf-reorder                              │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  ┌─ Python 脚本 (child_process) ────────────┐   │
│  │  pdf2word.py   pdf2excel.py               │   │
│  │  pdf-watermark-add.py                     │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 目录结构

```
electron/
├── main.ts                # 主进程：窗口创建、IPC处理、Python调用
├── preload.ts             # 预加载：暴露API到渲染进程
├── services/              # Node.js PDF服务
│   ├── pdf-merge.ts       # 合并（pdf-lib）
│   ├── pdf-split.ts       # 拆分（pdf-lib）
│   ├── pdf-compress.ts    # 压缩（pdf-lib）
│   └── pdf-reorder.ts     # 排序/删除（pdf-lib）
└── portable-python/scripts/  # Python脚本
    ├── pdf2word.py        # 转Word（pdf2docx）
    ├── pdf2excel.py       # 转Excel（pdfplumber+pandas）
    └── pdf-watermark-add.py  # 加水印（PyMuPDF Shape API）

src/
├── App.tsx                # 路由配置（HashRouter）
├── components/
│   ├── Layout.tsx         # 侧边栏布局
│   └── DragUpload.tsx     # 拖拽上传（webUtils.getPathForFile）
├── pages/
│   ├── Merge.tsx          # 合并
│   ├── Split.tsx          # 拆分
│   ├── PageReorder.tsx    # 页面排序
│   ├── Convert.tsx        # 格式转换（Word/Excel）
│   ├── Compress.tsx       # 压缩
│   └── WatermarkAdd.tsx   # 加水印
└── types/
    └── electron.d.ts      # Electron API 类型定义
```

### IPC 通信模式

```
前端                    preload                    main.ts
  │                        │                          │
  │─ electronAPI.mergePDF()─→ ipcRenderer.invoke() ──→│
  │                        │                    ipcMain.handle()
  │                        │                          │── pdf-lib 服务
  │← result ────────────────←────────────────────────│
  │                        │                          │
  │─ electronAPI.addWatermark()──→ ipcRenderer.invoke()──→│
  │                        │                    ipcMain.handle()
  │                        │                          │── spawn('python', [script, ...])
  │← result ────────────────←────────────────────────│
```

---

## 开发流程

### 添加新功能

1. **创建页面组件** `src/pages/NewFeature.tsx`
2. **添加路由** `src/App.tsx`
3. **添加菜单项** `src/components/Layout.tsx`
4. **添加 IPC 处理** `electron/main.ts`
5. **添加预加载 API** `electron/preload.ts`
6. **添加类型定义** `src/types/electron.d.ts`

### 添加 Node.js PDF 服务

```ts
// electron/services/pdf-new-feature.ts
import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'

export async function newFeature(inputPath: string, outputPath: string): Promise<string> {
  const pdfBytes = fs.readFileSync(inputPath)
  const pdf = await PDFDocument.load(pdfBytes)
  // 处理逻辑
  const result = await pdf.save()
  fs.writeFileSync(outputPath, result)
  return outputPath
}
```

### 添加 Python 脚本

```python
# electron/portable-python/scripts/pdf-new.py
import sys, json, fitz

def main():
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    options = json.loads(sys.argv[3])
    # 处理逻辑
    print(f"Success: {output_path}")

if __name__ == "__main__":
    main()
```

main.ts 中调用：

```ts
const scriptPath = join(__dirname, 'portable-python/scripts/pdf-new.py')
await runPythonScriptWithArgs(pythonExe, scriptPath, [filePath, outputPath, optionsJson])
```

---

## 构建打包

详见 [BUILD.md](BUILD.md)

核心步骤：
1. `npx vite build` 构建
2. `npx electron-builder --win --x64 --dir` 生成运行时（仅首次）
3. 组装 `resources/app/` 目录
4. 7za 打包

---

## 问题排查

### 打包后白屏

**根因**：`file://` 协议下 ES Module 被 CORS 阻止

**修复**：`webSecurity: isDev`（开发模式开启，打包后关闭）

### Python 脚本找不到

**根因**：vite-static-copy 的 dest 是相对于 `dist/` 的

**修复**：`dest: '../dist-electron/portable-python/scripts'`

### 加水印报错 bad fontname chars

**根因**：PyMuPDF fontname 不允许空格

**修复**：用 `fontname="china-s"` + `fontfile=字体路径`

### 加水印文字没写入（静默失败）

**根因**：`insert_textbox` 返回负值表示矩形太小，但不抛异常

**修复**：增大矩形尺寸，检查返回值

### 加水印不支持45°旋转

**根因**：`insert_textbox` 的 rotate 参数只支持 0/90/180/270

**修复**：使用 Shape API + morph 变换矩阵

### winCodeSign 解压失败

**根因**：macOS 符号链接在 Windows 无法创建

**修复**：忽略，`--dir` 模式不需要签名

### zip 打包被文件锁阻止

**修复**：关闭 Electron 进程后重试，或用 7za 替代 PowerShell
