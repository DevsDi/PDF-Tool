# 更新日志

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

---

## [1.2.0] - 2026-06-08

### 新增
- ✨ 文件浏览器盘符切换（fs:listDrives IPC，支持 C:/ D:/ E:/ 等盘符一键切换）
- ✨ 水印间距调节滑块（0.5x~3.0x，支持紧密/适中/宽松/很宽）
- ✨ 水印交错排列（奇数行偏移半格，更自然）

### 修复
- 🐛 拖拽文件报错：Electron 28 无 webUtils.getPathForFile，改用 File.path
- 🐛 水印中文显示方格：insert_text 需同时传 fontname='china-s' 才能使用 CJK 字体
- 🐛 水印不渲染：show_pdf_page 创建嵌套 XObject，ExtGState 须注入外层 fzFrm0 的 Resources
- 🐛 水印破坏 PDF 原始内容：改用 overlay PDF 方式，原始内容流零修改

### 变更
- ⚠️ 水印功能完全重写：overlay PDF + ExtGState 真正 PDF 透明度（替代颜色混合模拟）
- ⚠️ 默认透明度从 0.3 降为 0.15，范围调整为 0.05~0.5
- ⚠️ 移除 webUtils 导入（Electron 28 不支持）

---

## [1.1.0] - 2026-06-07

### 新增
- ✨ PDF转Excel功能（pdfplumber + pandas）
- ✨ 页面排序功能（上移/下移/删除页面）
- ✨ 拖拽上传组件（DragUpload）
- ✨ 添加水印功能（支持文字/旋转/透明度/平铺/颜色）
- ✨ 单实例运行限制

### 移除
- ❌ 去水印功能（效果不佳，无法保证不损坏正文）
- ❌ 加密/解密功能（未完整实现）
- ❌ 非必要依赖：@electron-toolkit/utils、concurrently、wait-on

### 修复
- 🐛 打包白屏：file://协议下ES Module需关闭webSecurity
- 🐛 加水印字体报错：PyMuPDF fontname不允许空格，改用fontfile参数
- 🐛 加水印文字未写入：insert_textbox矩形过小，增大尺寸并检查返回值
- 🐛 加水印不支持旋转：改用Shape API + morph变换矩阵
- 🐛 Python脚本未复制到dist-electron：修复vite-static-copy的dest路径
- 🐛 index.html路径错误：join(__dirname, 'dist/index.html')而非../dist/

### 变更
- ⚠️ "添加水印"从"水印管理"子菜单提升为顶层菜单
- ⚠️ 透明度通过颜色混合模拟（PyMuPDF不支持alpha通道，v1.2.0已改用ExtGState真正透明度）

---

## [1.0.0] - 2024-06-04

### 新增
- ✨ PDF合并功能 - 支持多文件合并，拖拽排序
- ✨ PDF拆分功能 - 按页数/范围/提取页面
- ✨ PDF转Word功能 - pdf2docx
- ✨ PDF压缩功能 - 三级压缩
- ✨ 拖拽文件上传
- ✨ 进度条显示
- ✨ 中文界面

---

| 版本 | 日期 | 主要内容 |
|------|------|----------|
| 1.2.0 | 2026-06-08 | 修复拖拽/水印功能，新增盘符切换，水印改用真正PDF透明度 |
| 1.1.0 | 2026-06-07 | 新增转Excel/页面排序/加水印，移除去水印/加密/解密 |
| 1.0.0 | 2024-06-04 | 初始版本 |
