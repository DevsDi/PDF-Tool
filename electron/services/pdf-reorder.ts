import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'

/**
 * PDF页面排序服务
 * 支持页面重新排序、删除、插入等操作
 */

/**
 * 页面操作类型
 */
interface PageOperation {
  /** 操作类型 */
  type: 'move' | 'delete' | 'insert'
  /** 源页码（0-based） */
  sourcePage?: number
  /** 目标页码（0-based） */
  targetPage?: number
  /** 新顺序（页面索引数组） */
  newOrder?: number[]
}

/**
 * 重新排序PDF页面
 * @param filePath PDF文件路径
 * @param outputPath 输出文件路径
 * @param pageOrder 新的页面顺序（页码数组，从1开始）
 * @returns 处理后的文件路径
 */
export async function reorderPages(
  filePath: string,
  outputPath: string,
  pageOrder: number[]
): Promise<string> {
  // 读取PDF文件
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)

  // 创建新PDF
  const newPdf = await PDFDocument.create()

  // 按新顺序复制页面
  for (const pageNum of pageOrder) {
    // pageNum从1开始，需要转换为0-based索引
    const pageIndex = pageNum - 1
    if (pageIndex >= 0 && pageIndex < pdf.getPageCount()) {
      const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex])
      newPdf.addPage(copiedPage)
    }
  }

  // 保存新PDF
  const newPdfBytes = await newPdf.save()
  fs.writeFileSync(outputPath, newPdfBytes)

  return outputPath
}

/**
 * 删除指定页面
 * @param filePath PDF文件路径
 * @param outputPath 输出文件路径
 * @param pagesToDelete 要删除的页码数组（从1开始）
 * @returns 处理后的文件路径
 */
export async function deletePages(
  filePath: string,
  outputPath: string,
  pagesToDelete: number[]
): Promise<string> {
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)
  const totalPages = pdf.getPageCount()

  // 创建新PDF，只保留未被删除的页面
  const newPdf = await PDFDocument.create()

  for (let i = 0; i < totalPages; i++) {
    // 页码从1开始，索引从0开始
    const pageNum = i + 1
    if (!pagesToDelete.includes(pageNum)) {
      const [copiedPage] = await newPdf.copyPages(pdf, [i])
      newPdf.addPage(copiedPage)
    }
  }

  const newPdfBytes = await newPdf.save()
  fs.writeFileSync(outputPath, newPdfBytes)

  return outputPath
}

/**
 * 插入页面
 * @param sourceFilePath 源PDF文件路径
 * @param targetFilePath 目标PDF文件路径
 * @param outputPath 输出文件路径
 * @param insertPosition 插入位置（页码，从1开始）
 * @param sourcePages 要插入的源页面（页码数组，从1开始）
 * @returns 处理后的文件路径
 */
export async function insertPages(
  sourceFilePath: string,
  targetFilePath: string,
  outputPath: string,
  insertPosition: number,
  sourcePages: number[]
): Promise<string> {
  // 读取两个PDF
  const sourceBytes = fs.readFileSync(sourceFilePath)
  const targetBytes = fs.readFileSync(targetFilePath)

  const sourcePdf = await PDFDocument.load(sourceBytes)
  const targetPdf = await PDFDocument.load(targetBytes)

  // 创建新PDF
  const newPdf = await PDFDocument.create()

  // 复制目标PDF的前半部分
  for (let i = 0; i < insertPosition - 1; i++) {
    if (i < targetPdf.getPageCount()) {
      const [copiedPage] = await newPdf.copyPages(targetPdf, [i])
      newPdf.addPage(copiedPage)
    }
  }

  // 复制源PDF的指定页面
  for (const pageNum of sourcePages) {
    const pageIndex = pageNum - 1
    if (pageIndex >= 0 && pageIndex < sourcePdf.getPageCount()) {
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex])
      newPdf.addPage(copiedPage)
    }
  }

  // 复制目标PDF的后半部分
  for (let i = insertPosition - 1; i < targetPdf.getPageCount(); i++) {
    const [copiedPage] = await newPdf.copyPages(targetPdf, [i])
    newPdf.addPage(copiedPage)
  }

  const newPdfBytes = await newPdf.save()
  fs.writeFileSync(outputPath, newPdfBytes)

  return outputPath
}

/**
 * 获取PDF页面信息
 * @param filePath PDF文件路径
 * @returns 页面信息列表
 */
export async function getPageInfo(filePath: string): Promise<{ page: number; width: number; height: number }[]> {
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)

  const pages = pdf.getPages()
  const pageInfo = []

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    pageInfo.push({
      page: i + 1,
      width,
      height
    })
  }

  return pageInfo
}