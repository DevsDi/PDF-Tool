import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

/**
 * PDF拆分服务
 * 将一个PDF文件拆分为多个文件
 */

/**
 * 拆分选项
 */
interface SplitOptions {
  /** 拆分方式 */
  mode: 'pageCount' | 'range' | 'extract'
  /** 每个文件的页数 */
  pageCount?: number
  /** 页面范围（如 "1-5, 6-10"） */
  ranges?: string
  /** 提取的页码 */
  pages?: number[]
}

/**
 * 拆分PDF文件
 * @param filePath 要拆分的PDF文件路径
 * @param outputDir 输出目录
 * @param options 拆分选项
 * @returns 拆分后的文件路径数组
 */
export async function splitPDF(
  filePath: string,
  outputDir: string,
  options: SplitOptions
): Promise<string[]> {
  // 读取PDF文件
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)
  const totalPages = pdf.getPageCount()
  const baseName = path.basename(filePath, '.pdf')

  const outputFiles: string[] = []

  // 按页数拆分
  if (options.mode === 'pageCount' && options.pageCount) {
    const pagesPerFile = options.pageCount
    let fileIndex = 1
    let startPage = 0

    while (startPage < totalPages) {
      const endPage = Math.min(startPage + pagesPerFile, totalPages)
      const newPdf = await PDFDocument.create()

      // 复制指定范围的页面
      const pageIndices = Array.from(
        { length: endPage - startPage },
        (_, i) => startPage + i
      )
      const copiedPages = await newPdf.copyPages(pdf, pageIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      // 保存文件
      const outputPath = path.join(outputDir, `${baseName}_${fileIndex}.pdf`)
      const newPdfBytes = await newPdf.save()
      fs.writeFileSync(outputPath, newPdfBytes)
      outputFiles.push(outputPath)

      fileIndex++
      startPage = endPage
    }
  }

  // 按范围拆分
  if (options.mode === 'range' && options.ranges) {
    const ranges = parseRanges(options.ranges)

    for (const range of ranges) {
      // 检查范围有效性
      if (range.start > totalPages || range.end > totalPages) {
        continue
      }

      const newPdf = await PDFDocument.create()
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, i) => range.start - 1 + i
      ).filter(i => i < totalPages)

      if (pageIndices.length > 0) {
        const copiedPages = await newPdf.copyPages(pdf, pageIndices)
        copiedPages.forEach((page) => newPdf.addPage(page))

        const outputPath = path.join(outputDir, `${baseName}_${range.start}-${range.end}.pdf`)
        const newPdfBytes = await newPdf.save()
        fs.writeFileSync(outputPath, newPdfBytes)
        outputFiles.push(outputPath)
      }
    }
  }

  // 提取指定页面
  if (options.mode === 'extract' && options.pages && options.pages.length > 0) {
    const newPdf = await PDFDocument.create()

    // 过滤有效的页码（转换为索引）
    const pageIndices = options.pages
      .map((p) => p - 1)
      .filter((i) => i >= 0 && i < totalPages)

    if (pageIndices.length > 0) {
      const copiedPages = await newPdf.copyPages(pdf, pageIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const outputPath = path.join(outputDir, `${baseName}_extracted.pdf`)
      const newPdfBytes = await newPdf.save()
      fs.writeFileSync(outputPath, newPdfBytes)
      outputFiles.push(outputPath)
    }
  }

  return outputFiles
}

/**
 * 解析页面范围字符串
 * @param rangesStr 范围字符串（如 "1-5, 6-10, 15"）
 * @returns 范围数组
 */
function parseRanges(rangesStr: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  const parts = rangesStr.split(',').map((s) => s.trim())

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      if (start > 0 && end >= start) {
        ranges.push({ start, end })
      }
    } else {
      const page = Number(part)
      if (page > 0) {
        ranges.push({ start: page, end: page })
      }
    }
  }

  return ranges
}