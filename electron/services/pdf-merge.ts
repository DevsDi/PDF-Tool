import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

/**
 * PDF合并服务
 * 将多个PDF文件合并为一个文件
 */

/**
 * 合并多个PDF文件
 * @param filePaths 要合并的PDF文件路径数组
 * @param outputPath 输出文件路径
 * @returns 合合后的文件路径
 */
export async function mergePDF(filePaths: string[], outputPath: string): Promise<string> {
  // 创建新的PDF文档
  const mergedPdf = await PDFDocument.create()

  // 遍历所有文件并合并
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i]

    // 读取PDF文件
    const pdfBytes = fs.readFileSync(filePath)

    // 加载PDF文档
    const pdf = await PDFDocument.load(pdfBytes)

    // 复制所有页面到合并文档
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

    // 添加每个页面到合并文档
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page)
    })
  }

  // 保存合并后的PDF
  const mergedPdfBytes = await mergedPdf.save()
  fs.writeFileSync(outputPath, mergedPdfBytes)

  return outputPath
}

/**
 * 获取PDF文件的总页数
 * @param filePath PDF文件路径
 * @returns 页数
 */
export async function getPageCount(filePath: string): Promise<number> {
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)
  return pdf.getPageCount()
}

/**
 * 获取PDF文件信息
 * @param filePath PDF文件路径
 * @returns 文件信息
 */
export async function getPDFInfo(filePath: string): Promise<{
  pageCount: number
  title?: string
  author?: string
  subject?: string
}> {
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)

  return {
    pageCount: pdf.getPageCount(),
    title: pdf.getTitle(),
    author: pdf.getAuthor(),
    subject: pdf.getSubject(),
  }
}