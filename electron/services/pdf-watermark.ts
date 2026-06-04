import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fs from 'fs'

/**
 * PDF去水印服务
 * 通过覆盖或删除水印区域去除PDF水印
 */

/**
 * 水印区域定义
 */
interface WatermarkRegion {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 去水印选项
 */
interface WatermarkOptions {
  /** 去水印方式 */
  mode: 'auto' | 'manual'
  /** 水印区域（手动模式） */
  regions?: WatermarkRegion[]
  /** 水印文本（用于自动检测） */
  watermarkText?: string
}

/**
 * 去除PDF水印
 * @param filePath PDF文件路径
 * @param outputPath 输出文件路径
 * @param options 去水印选项
 * @returns 处理后的文件路径
 */
export async function removeWatermark(
  filePath: string,
  outputPath: string,
  options: WatermarkOptions
): Promise<string> {
  // 读取PDF文件
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)

  // 获取所有页面
  const pages = pdf.getPages()

  // 手动模式：覆盖指定区域
  if (options.mode === 'manual' && options.regions && options.regions.length > 0) {
    for (const page of pages) {
      const { width, height } = page.getSize()

      for (const region of options.regions) {
        // 使用白色矩形覆盖水印区域
        page.drawRectangle({
          x: region.x,
          y: height - region.y - region.height, // PDF坐标系从底部开始
          width: region.width,
          height: region.height,
          color: rgb(1, 1, 1), // 白色
        })
      }
    }
  }

  // 自动模式：尝试检测水印（简化版本）
  if (options.mode === 'auto') {
    // 自动检测水印比较复杂，需要：
    // 1. 分析PDF内容找出重复出现的内容
    // 2. 判断是否为水印特征（位置固定、颜色特殊等）
    // 3. 覆盖检测到的水印区域

    // 当前实现：如果提供了水印文本，尝试在页面边缘区域覆盖
    // 这只是一个简化实现，实际效果取决于水印的位置和特征

    if (options.watermarkText) {
      // 尝试覆盖常见的水印位置（页面底部居中）
      for (const page of pages) {
        const { width, height } = page.getSize()

        // 覆盖底部区域（常见水印位置）
        page.drawRectangle({
          x: width * 0.3,
          y: height * 0.05,
          width: width * 0.4,
          height: height * 0.1,
          color: rgb(1, 1, 1),
        })

        // 覆盖顶部区域
        page.drawRectangle({
          x: width * 0.3,
          y: height * 0.85,
          width: width * 0.4,
          height: height * 0.1,
          color: rgb(1, 1, 1),
        })
      }
    }
  }

  // 保存处理后的PDF
  const newPdfBytes = await pdf.save()
  fs.writeFileSync(outputPath, newPdfBytes)

  return outputPath
}

/**
 * 自动检测水印位置（简化版）
 * @param filePath PDF文件路径
 * @returns 可能的水印区域
 */
export async function detectWatermark(filePath: string): Promise<WatermarkRegion[]> {
  // 实际实现需要使用 OCR 或图像分析
  // 这里返回常见水印位置的默认区域
  const pdfBytes = fs.readFileSync(filePath)
  const pdf = await PDFDocument.load(pdfBytes)
  const page = pdf.getPages()[0]
  const { width, height } = page.getSize()

  return [
    // 底部水印区域
    { x: width * 0.3, y: height * 0.05, width: width * 0.4, height: height * 0.1 },
    // 顶部水印区域
    { x: width * 0.3, y: height * 0.85, width: width * 0.4, height: height * 0.1 },
  ]
}