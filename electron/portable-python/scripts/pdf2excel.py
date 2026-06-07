#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF转Excel脚本
使用pdfplumber提取表格数据并保存为Excel
"""

import sys
import os
import pdfplumber
import pandas as pd

def pdf_to_excel(pdf_path: str, excel_path: str) -> bool:
    """
    将PDF文件转换为Excel

    Args:
        pdf_path: PDF文件路径
        excel_path: 输出的Excel文件路径

    Returns:
        bool: 是否成功转换
    """
    try:
        all_tables = []
        page_count = 0

        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)

            for page_num, page in enumerate(pdf.pages):
                # 提取表格
                tables = page.extract_tables()

                if tables:
                    for table_num, table in enumerate(tables):
                        if table and len(table) > 0:
                            # 转换为DataFrame
                            df = pd.DataFrame(table)

                            # 添加来源信息
                            sheet_name = f"Page{page_num + 1}_Table{table_num + 1}"
                            all_tables.append({
                                'sheet_name': sheet_name,
                                'data': df,
                                'page': page_num + 1,
                                'table': table_num + 1
                            })

                # 如果页面没有表格，提取文本
                if not tables:
                    text = page.extract_text()
                    if text:
                        # 将文本按行分割
                        lines = text.split('\n')
                        df = pd.DataFrame({'Text': lines})
                        sheet_name = f"Page{page_num + 1}_Text"
                        all_tables.append({
                            'sheet_name': sheet_name,
                            'data': df,
                            'page': page_num + 1,
                            'table': 0
                        })

        if not all_tables:
            # 如果没有任何内容，创建一个空Excel
            with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
                pd.DataFrame({'Message': ['PDF中没有找到表格或文本内容']}).to_excel(
                    writer, sheet_name='Info', index=False
                )
            print(f"Warning: No tables or text found in PDF", file=sys.stderr)
            return True

        # 保存到Excel
        with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
            for item in all_tables:
                # Excel sheet名最大31字符
                sheet_name = item['sheet_name'][:31]
                item['data'].to_excel(writer, sheet_name=sheet_name, index=False, header=False)

        print(f"Success: Extracted {len(all_tables)} items from {page_count} pages", file=sys.stderr)
        return True

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False


def main():
    """主函数"""
    if len(sys.argv) < 3:
        print("Usage: python pdf2excel.py <pdf_path> <excel_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    excel_path = sys.argv[2]

    # 检查PDF文件是否存在
    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    # 执行转换
    if pdf_to_excel(pdf_path, excel_path):
        print(f"Success: {excel_path}")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()