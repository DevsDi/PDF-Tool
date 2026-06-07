#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF转Word转换脚本
使用pdf2docx库将PDF文件转换为Word文档
"""

import sys
import os

def convert_pdf_to_word(pdf_path: str, docx_path: str) -> bool:
    """
    将PDF文件转换为Word文档

    Args:
        pdf_path: PDF文件路径
        docx_path: 输出的Word文件路径

    Returns:
        bool: 是否成功转换
    """
    try:
        from pdf2docx import Converter

        # 创建转换器
        cv = Converter(pdf_path)

        # 转换PDF到Word（转换所有页面）
        cv.convert(docx_path)

        # 关闭转换器
        cv.close()

        return True
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False

def main():
    """主函数"""
    if len(sys.argv) < 3:
        print("Usage: python pdf2word.py <pdf_path> <docx_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]

    # 检查PDF文件是否存在
    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    # 执行转换
    if convert_pdf_to_word(pdf_path, docx_path):
        print(f"Success: {docx_path}")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()