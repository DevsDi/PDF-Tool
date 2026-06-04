import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'

/**
 * PDF压缩服务
 * 通过调整图片质量减小PDF文件大小
 */

/**
 * 压缩PDF文件
 * @param filePath PDF文件路径
 * @param outputPath 输出文件路径
 * @param quality 图片质量（10-100）
 * @returns 压缩后的文件路径和压缩率
 */
export async function compressPDF(
  filePath: string,
  outputPath: string,
  quality: number = 70
): Promise<{ path: string; originalSize: number; compressedSize: number; ratio: number }> {
  // 获取原始文件大小
  const originalBytes = fs.readFileSync(filePath)
  const originalSize = originalBytes.length

  // 加载PDF文档
  const pdf = await PDFDocument.load(originalBytes)

  // 注意：pdf-lib 本身不支持图片压缩
  // 这里只是重新保存PDF，实际压缩效果有限
  // 实际应用中需要使用其他方法如：
  // 1. 使用外部工具（qpdf、ghostscript）
  // 2. 使用canvas重新压缩图片
  // 3. 调用Python脚本处理

  // 保存PDF（使用对象压缩）
  const compressedBytes = await pdf.save({
    useObjectStreams: true,  // 使用对象流压缩
  })
  fs.writeFileSync(outputPath, compressedBytes)

  const compressedSize = compressedBytes.length
  const ratio = compressedSize / originalSize

  return {
    path: outputPath,
    originalSize,
    compressedSize,
    ratio,
  }
}

/**
 * 获取PDF文件大小
 * @param filePath PDF文件路径
 * @returns 文件大小（字节）
 */
export function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath)
  return stats.size
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
}