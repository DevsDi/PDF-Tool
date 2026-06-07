# PDF全能箱

一款桌面端PDF处理工具，支持合并、拆分、转Word/Excel、压缩、加水印、页面排序。

## 功能特性

| 功能 | 描述 | 依赖 |
|------|------|------|
| 📄 PDF合并 | 多个PDF合并为一个，支持拖拽排序 | 内置 |
| ✂️ PDF拆分 | 按页数/范围/提取页面拆分 | 内置 |
| 📋 页面排序 | 调整页面顺序、删除页面 | 内置 |
| 📝 格式转换 | PDF转Word、PDF转Excel | Python |
| 🗜️ PDF压缩 | 多级压缩，可调图片质量 | 内置 |
| 💧 添加水印 | 自定义文字水印，支持旋转/透明度/平铺 | Python |

> **内置** = 无需额外依赖；**Python** = 需要安装 Python 3 + 对应库

## 系统要求

- Windows 10/11 (64位)
- Python 3.10+（格式转换、加水印功能需要）
- Python 依赖：`pip install PyMuPDF pdf2docx pdfplumber pandas openpyxl`

## 安装使用

### 便携版

1. 解压 `PDF-Tool-Portable.7z` 到任意目录
2. 双击 `PDF全能箱.exe` 运行

### 开发模式

```bash
git clone https://github.com/DevsDi/PDF-Tool.git
cd "PDF Tool"
npm install --legacy-peer-deps
npm run dev
```

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Electron 28 | 桌面应用 |
| 前端 | React 18 + TypeScript | 用户界面 |
| UI库 | Ant Design 5 | 组件库 |
| 构建 | Vite 5 | 开发/打包 |
| PDF处理 | pdf-lib | 合并/拆分/压缩/排序 |
| PDF处理 | PyMuPDF | 加水印 |
| 格式转换 | pdf2docx | PDF转Word |
| 格式转换 | pdfplumber + pandas | PDF转Excel |

## 项目结构

```
PDF Tool/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # 预加载脚本（IPC桥接）
│   ├── services/                # Node.js PDF服务
│   │   ├── pdf-merge.ts         # 合并
│   │   ├── pdf-split.ts         # 拆分
│   │   ├── pdf-compress.ts      # 压缩
│   │   └── pdf-reorder.ts       # 页面排序/删除
│   └── portable-python/scripts/ # Python PDF脚本
│       ├── pdf2word.py          # PDF转Word
│       ├── pdf2excel.py         # PDF转Excel
│       └── pdf-watermark-add.py # 加水印
├── src/                         # 前端源码
│   ├── App.tsx                  # 路由配置
│   ├── components/
│   │   ├── Layout.tsx           # 侧边栏布局
│   │   └── DragUpload.tsx       # 拖拽上传组件
│   ├── pages/                   # 功能页面
│   │   ├── Merge.tsx            # PDF合并
│   │   ├── Split.tsx            # PDF拆分
│   │   ├── PageReorder.tsx      # 页面排序
│   │   ├── Convert.tsx          # 格式转换
│   │   ├── Compress.tsx         # PDF压缩
│   │   └── WatermarkAdd.tsx     # 添加水印
│   └── types/electron.d.ts      # 类型定义
├── BUILD.md                     # 打包指南
└── package.json
```

## 打包发布

详见 [BUILD.md](BUILD.md)

## 许可协议

MIT

## 致谢

- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF处理库
- [PyMuPDF](https://github.com/pymupdf/PyMuPDF) - PDF水印处理
- [pdf2docx](https://github.com/dothinking/pdf2docx) - PDF转Word
- [pdfplumber](https://github.com/jsvine/pdfplumber) - PDF转Excel
- [Ant Design](https://ant.design/) - UI组件库
- [Electron](https://www.electronjs.org/) - 桌面应用框架
