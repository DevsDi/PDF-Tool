# PDF全能箱 功能说明文档

> 版本：v1.2.0  
> 更新日期：2026-06-08  
> 技术架构：Electron 28 + React 18 + TypeScript + Ant Design 5

---

## 目录

1. [应用概述](#应用概述)
2. [功能模块](#功能模块)
   - [PDF合并](#pdf合并)
   - [PDF拆分](#pdf拆分)
   - [页面排序](#页面排序)
   - [格式转换](#格式转换)
   - [PDF压缩](#pdf压缩)
   - [添加水印](#添加水印)
3. [通用组件](#通用组件)
4. [系统要求](#系统要求)
5. [安装与运行](#安装与运行)

---

## 应用概述

**PDF全能箱** 是一款基于 Electron + React 的桌面端 PDF 处理工具，提供合并、拆分、格式转换、压缩、水印、页面排序等六大核心功能。

### 设计特点

- **纯本地处理**：所有 PDF 操作在本地完成，不上传云端，保护隐私
- **拖拽上传**：支持直接拖拽 PDF 文件到应用窗口
- **自定义文件浏览器**：内置文件浏览器，避免 Windows Shell 响应延迟
- **进度反馈**：实时显示处理进度
- **中文界面**：完整的中文 UI 和中文水印支持

---

## 功能模块

### PDF合并

**路由**：`/merge`

将多个 PDF 文件合并为一个文件。

#### 功能特性

- 支持多文件选择（文件浏览器或拖拽）
- 拖拽排序：可自由调整文件顺序
- 自动生成输出文件名：`merged_YYYYMMDD_HHMMSS.pdf`
- 可自定义保存位置

#### 使用方式

1. 点击「选择文件」或直接拖拽 PDF 文件
2. 拖拽调整文件顺序（可选）
3. 点击「选择保存位置」设置输出路径
4. 点击「开始合并」

#### 技术实现

- 使用 **pdf-lib** (JavaScript) 进行 PDF 合并
- 纯前端处理，无需 Python 依赖

---

### PDF拆分

**路由**：`/split`

将一个 PDF 文件拆分为多个文件。

#### 拆分模式

| 模式 | 说明 | 示例 |
|---|---|---|
| **按页数拆分** | 每 N 页生成一个文件 | 每 5 页拆分，10 页 PDF → 2 个文件 |
| **按范围拆分** | 指定页码范围提取 | 提取 1-3 页、5-7 页 |
| **提取特定页** | 提取指定页码 | 提取第 2、5、8 页 |

#### 功能特性

- 显示 PDF 总页数
- 支持自定义输出目录
- 按页数拆分时可预览拆分结果数量

#### 使用方式

1. 选择单个 PDF 文件
2. 选择拆分模式
3. 设置参数（页数/范围/页码）
4. 选择保存位置
5. 点击「开始拆分」

#### 技术实现

- 使用 **PyMuPDF** (Python) 进行 PDF 拆分
- 通过 IPC 调用 Python 脚本

---

### 页面排序

**路由**：`/reorder`

对 PDF 页面进行重新排序、删除操作。

#### 功能特性

- **可视化页面缩略图**：显示每页预览
- **拖拽排序**：直接拖拽页面调整顺序
- **删除页面**：点击删除按钮移除指定页
- **实时预览**：排序结果即时显示

#### 使用方式

1. 选择 PDF 文件
2. 系统自动加载页面缩略图
3. 拖拽页面调整顺序，或点击删除按钮
4. 点击「保存」生成新 PDF

#### 技术实现

- 使用 **PyMuPDF** (Python) 进行页面重排
- 缩略图通过 PyMuPDF `get_pixmap` 生成

---

### 格式转换

**路由**：`/convert`

将 PDF 转换为其他格式。

#### 支持的转换

| 目标格式 | 说明 | 依赖 |
|---|---|---|
| **Word (.docx)** | PDF 转 Word 文档 | pdf2docx |
| **Excel (.xlsx)** | PDF 表格转 Excel | pdfplumber + pandas |

#### 功能特性

- 转换进度实时显示
- 自动生成输出文件名
- 转换失败时显示具体错误（如缺少依赖库）

#### 使用方式

1. 选择 PDF 文件
2. 选择转换格式（Word/Excel）
3. 选择保存位置
4. 点击「开始转换」

#### 技术实现

- 通过 Python 脚本调用：
  - `pdf2word.py` → pdf2docx 库
  - `pdf2excel.py` → pdfplumber + pandas 库

#### 环境要求

需预先安装 Python 依赖：
```bash
pip install pdf2docx pdfplumber pandas openpyxl
```

---

### PDF压缩

**路由**：`/compress`

减小 PDF 文件体积。

#### 压缩级别

| 级别 | 说明 | 适用场景 |
|---|---|---|
| **低压缩** | 画质最佳，体积略减 | 打印用途 |
| **中压缩** | 画质良好，体积适中 | 日常使用 |
| **高压缩** | 画质降低，体积最小 | 网络传输 |

#### 功能特性

- 三级压缩质量可选
- 显示压缩前后文件大小对比
- 压缩进度实时显示

#### 使用方式

1. 选择 PDF 文件
2. 选择压缩级别
3. 选择保存位置
4. 点击「开始压缩」

#### 技术实现

- 使用 **PyMuPDF** (Python) 重新编码 PDF
- 通过调整图像质量参数控制压缩程度

---

### 添加水印

**路由**：`/watermark-add`

为 PDF 添加自定义文字水印。

#### 水印选项

| 参数 | 说明 | 默认值 |
|---|---|---|
| **水印文字** | 显示的文字内容 | "内部资料" |
| **字体大小** | 文字字号 | 40px |
| **透明度** | 水印透明程度 | 0.15 (很淡) |
| **旋转角度** | 斜向旋转角度 | 45° |
| **水印位置** | 排列方式 | 斜向平铺 |
| **水印颜色** | 文字颜色 | 灰色 #808080 |
| **水印间距** | 文字间距密度 | 1.0x (适中) |

#### 水印位置模式

| 模式 | 说明 |
|---|---|
| **斜向平铺（推荐）** | 45° 旋转，交错排列，覆盖全页 |
| **平铺水印** | 水平排列，覆盖全页 |
| **居中单个** | 页面中心单个水印 |
| **顶部水印** | 页面顶部单个水印 |
| **底部水印** | 页面底部单个水印 |

#### 功能特性

- **真正 PDF 透明度**：使用 ExtGState `/ca` `/CA` 实现，不是颜色混合模拟
- **中文水印支持**：使用 china-s CJK 字体
- **原始内容不受影响**：水印通过 overlay PDF 方式叠加，不修改原始内容流
- **间距可调**：从紧密(0.5x)到很宽(3.0x)
- **交错排列**：奇数行偏移半格，视觉更自然

#### 使用方式

1. 选择 PDF 文件
2. 输入水印文字
3. 选择水印位置模式
4. 调整字体大小、透明度、旋转角度、颜色、间距
5. 选择保存位置
6. 点击「添加水印」

#### 技术实现

采用 **overlay PDF + ExtGState** 方案：

1. 创建水印 overlay PDF 页面
2. 使用 `insert_text()` 绘制水印文字（`fontname='china-s'` 支持中文）
3. 通过 `show_pdf_page()` 将 overlay 合并到原始页面
4. 在外层 XObject (`fzFrm0`) 的 Resources 中注入 ExtGState
5. 使用 `/GS0 gs` 操作符应用透明度

**关键点**：
- `show_pdf_page()` 创建嵌套 XObject 结构，ExtGState 必须注入外层
- `insert_text(fontfile)` 默认用 `/helv` 不支持中文，需同时传 `fontname='china-s'`

---

## 通用组件

### DragUpload 拖拽上传组件

支持两种文件选择方式：

| 方式 | 说明 |
|---|---|---|
| **拖拽上传** | 直接拖拽 PDF 文件到拖拽区域 |
| **文件浏览器** | 点击按钮打开自定义文件浏览器 |

#### 技术实现

- Electron 28 使用 `File.path` 属性获取拖拽文件路径
- Electron 29+ 可使用 `webUtils.getPathForFile()`

### FileBrowser 文件浏览器组件

内置自定义文件浏览器，避免 Windows Shell 响应延迟。

#### 功能特性

- **盘符切换**：顶部显示所有可用盘符按钮（C:/ D:/ E:/ …）
- **目录导航**：点击目录进入，点击「上一级」返回
- **面包屑路径**：显示当前路径，可点击跳转
- **PDF 文件高亮**：PDF 文件显示图标和大小
- **多选支持**：可选启用多文件选择

#### 技术实现

- 通过 `fs:listDir` IPC 读取目录内容
- 通过 `fs:listDrives` IPC 获取可用盘符列表
- 纯 Electron IPC 调用，不依赖系统对话框

---

## 系统要求

### 运行环境

| 项目 | 要求 |
|---|---|
| 操作系统 | Windows 10/11 (64-bit) |
| Python | 3.8+（用于转 Word/转 Excel/加水印） |
| 内存 | 建议 4GB+ |

### Python 依赖

转 Word/转 Excel/加水印功能需要 Python 环境：

```bash
pip install PyMuPDF pdf2docx pdfplumber pandas openpyxl
```

---

## 安装与运行

### 开发模式

```bash
# 安装依赖
npm install

# 安装 Python 依赖
pip install PyMuPDF pdf2docx pdfplumber pandas openpyxl

# 启动开发服务器
npm run dev
```

### 生产打包

```bash
# 构建 + 打包
npm run build

# 输出目录
release/
├── win-unpacked/       # 解压即用版
└── PDF全能箱.exe        # 单文件便携版
```

### 手动打包

详见 `BUILD.md` 或 memory 文件 `electron-portable-packaging.md`。

---

## 文件结构

```
PDF-Tool/
├── electron/
│   ├── main.ts               # 主进程
│   ├── preload.ts            # 预加载脚本
│   └── portable-python/
│       └── scripts/
│           ├── pdf2word.py       # PDF转Word
│           ├── pdf2excel.py      # PDF转Excel
│           └── pdf-watermark-add.py  # 加水印
│
├── src/
│   ├── components/
│   │   ├── Layout.tsx         # 布局框架
│   │   ├── DragUpload.tsx     # 拖拽上传
│   │   └── FileBrowser.tsx    # 文件浏览器
│   │
│   ├── pages/
│   │   ├── Merge.tsx          # PDF合并
│   │   ├── Split.tsx          # PDF拆分
│   │   ├── PageReorder.tsx    # 页面排序
│   │   ├── Convert.tsx        # 格式转换
│   │   ├── Compress.tsx       # PDF压缩
│   │   └── WatermarkAdd.tsx   # 添加水印
│   │
│   └── types/
│       └── electron.d.ts      # Electron API 类型定义
│
├── package.json
├── vite.config.ts
├── CHANGELOG.md
└── BUILD.md
```

---

## 更新日志

详见 [CHANGELOG.md](../CHANGELOG.md)

| 版本 | 日期 | 主要更新 |
|---|---|---|
| 1.2.0 | 2026-06-08 | 修复拖拽/水印，新增盘符切换，水印改用真正透明度 |
| 1.1.0 | 2026-06-07 | 新增转Excel/页面排序/加水印 |
| 1.0.0 | 2024-06-04 | 初始版本：合并/拆分/转Word/压缩 |

---

## 常见问题

### Q: 水印不显示或显示方格？

A: 确保使用 Electron 28+ 和 PyMuPDF 1.27+。中文水印需确保 `fontname='china-s'` 参数。

### Q: 转 Word/转 Excel 失败？

A: 检查 Python 环境是否安装所需依赖：
```bash
pip install pdf2docx pdfplumber pandas openpyxl
```

### Q: 拖拽文件报错？

A: Electron 28 不支持 `webUtils.getPathForFile`，应用使用 `File.path` 属性作为替代。

### Q: 文件浏览器无法切换盘符？

A: v1.2.0 已新增盘符切换功能，顶部会显示 C:/ D:/ E:/ 等按钮。

---

## 许可证

MIT License

---

*文档生成日期：2026-06-08*