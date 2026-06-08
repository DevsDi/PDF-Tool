# 便携Python环境配置说明

## 概述
本目录存放便携Python环境，用于PDF转Word功能。

## 安装步骤

### 1. 下载嵌入式Python
从Python官网下载嵌入式Python包（embed package）：
https://www.python.org/downloads/windows/

选择 "Windows embeddable package (64-bit)" 版本。

### 2. 解压并放置
将下载的zip文件解压到本目录，确保 `python.exe` 位于：
```
electron/portable-python/python.exe
```

### 3. 安装pdf2docx库
由于嵌入式Python没有pip，需要手动安装依赖：

方法一：使用完整Python环境预先安装
```bash
pip install pdf2docx
pip show pdf2docx  # 查看安装位置
```
然后将安装的包复制到便携Python的libs目录。

方法二：使用离线包安装
1. 从PyPI下载pdf2docx及其依赖的whl文件
2. 解压whl文件到libs目录

### 4. 配置Python路径
修改 `python38._pth` 文件（根据版本不同名称可能不同）：
```
.
libs
```

## 打包注意事项

打包时需要将整个portable-python目录包含在内：
```json
{
  "build": {
    "files": [
      "electron/portable-python/**/*"
    ]
  }
}
```

## 依赖库列表
- pdf2docx
- PyMuPDF (pdf2docx依赖)
- python-docx (pdf2docx依赖)
- fonttools
- pillow

## 目录结构
```
portable-python/
├── python.exe          # Python解释器
├── python38.dll        # Python动态库
├── python38._pth       # 路径配置
├── libs/               # 依赖库目录
│   ├── pdf2docx/
│   ├── fitz/           # PyMuPDF
│   ├── docx/           # python-docx
│   └── ...
└── scripts/
    ├── pdf2word.py           # PDF转Word脚本
    ├── pdf2excel.py          # PDF转Excel脚本
    └── pdf-watermark-add.py  # PDF加水印脚本
```

## 变更记录
- 2026-06-08: 新增 pdf2excel.py、pdf-watermark-add.py 脚本说明
- 2024-06-04: 初始创建