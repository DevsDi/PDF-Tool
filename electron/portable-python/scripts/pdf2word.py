#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF转Word转换脚本
使用pdf2docx库将PDF文件转换为Word文档
"""

import sys
import os
from pdf2docx import Converter

def convert_pdf_to_word(pdf_path: str, docx_path: str) -> bool:
    """
    将PDF文件转换为Word文档

    参数:
        pdf_path: PDF文件路径
        docx_path: 输出的Word文件路径

    返回:
        bool: 是否成功转换
    """
    try:
        # 创建转换器
        cv = Converter(pdf_path)

        # 转换PDF到Word
        cv.convert(docx_path, start=0, end=None)  # 转换所有页面

        # 关闭转换器
        cv.close()

        return True
    except Exception as e:
        print(f"转换失败: {str(e)}", file=sys.stderr)
        return False

def main():
    """
    主函数
    从命令行参数获取PDF路径和输出路径
    """
    if len(sys.argv) != 3:
        print("用法: python pdf2word.py <pdf_path> <docx_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]

    # 检查PDF文件是否存在
    if not os.path.exists(pdf_path):
        print(f"PDF文件不存在: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    # 执行转换
    success = convert_pdf_to_word(pdf_path, docx_path)

    if success:
        print(f"转换成功: {docx_path}")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()