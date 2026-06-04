import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'

/**
 * PDF解密服务
 * 移除PDF文件的密码保护
 */

/**
 * 解密PDF文件
 * @param filePath 加密的PDF文件路径
 * @param outputPath 输出文件路径
 * @param password 解密密码
 * @returns 解密后的文件路径
 */
export async function decryptPDF(
  filePath: string,
  outputPath: string,
  password: string
): Promise<string> {
  try {
    // 读取加密的PDF文件
    const pdfBytes = fs.readFileSync(filePath)

    // 使用密码加载PDF
    const pdf = await PDFDocument.load(pdfBytes, {
      password: password,
      ignoreEncryption: false,
    })

    // 保存解密后的PDF（无密码）
    const decryptedBytes = await pdf.save()
    fs.writeFileSync(outputPath, decryptedBytes)

    return outputPath
  } catch (error) {
    // 处理不同类型的错误
    const errorMsg = (error as Error).message

    if (errorMsg.includes('password') || errorMsg.includes('Password')) {
      throw new Error('密码错误，请检查后重试')
    }

    if (errorMsg.includes('encrypted')) {
      throw new Error('PDF文件已加密，需要正确的密码')
    }

    throw new Error(`解密失败：${errorMsg}`)
  }
}

/**
 * 尝试解密PDF（用于验证密码）
 * @param filePath PDF文件路径
 * @param password 密码
 * @returns 是否成功解密
 */
export async function tryDecrypt(filePath: string, password: string): Promise<boolean> {
  try {
    const pdfBytes = fs.readFileSync(filePath)
    await PDFDocument.load(pdfBytes, { password })
    return true
  } catch {
    return false
  }
}

/**
 * 获取PDF加密信息
 * @param filePath PDF文件路径
 * @returns 加密信息
 */
export async function getEncryptionInfo(filePath: string): Promise<{
  isEncrypted: boolean
  requiresPassword: boolean
}> {
  try {
    const pdfBytes = fs.readFileSync(filePath)

    // 尝试无密码加载
    await PDFDocument.load(pdfBytes)
    return { isEncrypted: false, requiresPassword: false }
  } catch (error) {
    const errorMsg = (error as Error).message

    if (errorMsg.includes('encrypted') || errorMsg.includes('password')) {
      // 尝试使用空密码加载
      try {
        const pdfBytes = fs.readFileSync(filePath)
        await PDFDocument.load(pdfBytes, { password: '' })
        return { isEncrypted: true, requiresPassword: false }
      } catch {
        return { isEncrypted: true, requiresPassword: true }
      }
    }

    return { isEncrypted: false, requiresPassword: false }
  }
}