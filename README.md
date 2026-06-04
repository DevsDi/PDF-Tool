# PDF全能箱

一款功能强大的桌面端PDF处理工具，支持合并、拆分、转Word、压缩、去水印、加密、解密等功能。

![PDF全能箱](assets/icon.png)

## 功能特性

| 功能 | 描述 |
|------|------|
| 📄 PDF合并 | 将多个PDF文件合并为一个文件，支持拖拽排序 |
| ✂️ PDF拆分 | 按页数、范围或提取指定页面拆分PDF |
| 📝 PDF转Word | 将PDF转换为可编辑的Word文档（需配置Python环境） |
| 🗜️ PDF压缩 | 减小PDF文件大小，支持多级压缩 |
| 🚫 去水印 | 自动或手动去除PDF中的水印 |
| 🔒 PDF加密 | 为PDF添加密码保护和权限限制 |
| 🔓 PDF解密 | 移除PDF的密码保护 |

## 系统要求

- Windows 10/11 (64位)
- 约150MB磁盘空间

## 安装使用

### 方式一：便携版（推荐）

1. 解压 `PDF全能箱-portable.zip` 到任意目录
2. 双击 `PDF全能箱.exe` 运行
3. 无需安装，可复制到U盘使用

### 方式二：安装版

1. 运行 `PDF全能箱-Setup.exe`
2. 选择安装目录
3. 完成安装后从桌面快捷方式启动

## 使用指南

### PDF合并

1. 点击左侧菜单「PDF合并」
2. 点击「选择PDF文件」添加多个文件
3. 拖拽调整文件顺序
4. 点击「选择保存位置」设置输出路径
5. 点击「开始合并」

### PDF拆分

1. 点击左侧菜单「PDF拆分」
2. 选择一个PDF文件
3. 选择拆分方式：
   - **按页数拆分**：每N页生成一个文件
   - **按范围拆分**：指定页面范围（如1-5, 6-10）
   - **提取页面**：提取指定页码（如1, 3, 5-7）
4. 点击「开始拆分」

### PDF转Word

> ⚠️ 需要先配置便携Python环境

1. 点击左侧菜单「转Word」
2. 选择PDF文件
3. 设置输出路径
4. 点击「开始转换」

### PDF压缩

1. 点击左侧菜单「PDF压缩」
2. 选择PDF文件
3. 选择压缩级别（低/中/高）
4. 调整图片质量
5. 点击「开始压缩」

### PDF去水印

1. 点击左侧菜单「去水印」
2. 选择PDF文件
3. 选择去水印方式：
   - **自动检测**：系统自动识别水印
   - **手动选择**：手动指定水印区域
4. 点击「开始去水印」

### PDF加密

1. 点击左侧菜单「PDF加密」
2. 选择PDF文件
3. 设置打开密码（必填）
4. 设置权限密码（可选）
5. 配置权限限制（打印/复制/修改）
6. 点击「开始加密」

### PDF解密

1. 点击左侧菜单「PDF解密」
2. 选择加密的PDF文件
3. 输入密码
4. 点击「开始解密」

## 技术栈

- **前端**: React 18 + Ant Design 5 + TypeScript
- **后端**: Electron 28
- **PDF处理**: pdf-lib
- **PDF转Word**: pdf2docx (Python)
- **构建工具**: Vite 5 + electron-builder

## 项目结构

```
PDF Tool/
├── electron/              # Electron主进程
│   ├── main.ts            # 主进程入口
│   ├── preload.ts         # 预加载脚本
│   └── services/          # PDF处理服务
├── src/                   # 前端源码
│   ├── components/        # 公共组件
│   ├── pages/             # 功能页面
│   └── types/             # 类型定义
├── dist/                  # 前端构建输出
├── dist-electron/         # Electron构建输出
└── release/               # 打包输出
```

## 开发指南

详见 [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

## 许可协议

本项目采用 MIT 许可协议，详见 [LICENSE.txt](LICENSE.txt)

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 问题反馈

如有问题或建议，请通过以下方式反馈：
- 提交 Issue
- 发送邮件

## 致谢

- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF处理库
- [pdf2docx](https://github.com/dothinking/pdf2docx) - PDF转Word库
- [Ant Design](https://ant.design/) - UI组件库
- [Electron](https://www.electronjs.org/) - 桌面应用框架

---

© 2024 PDF Tool Team