import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

/**
 * PDF加密服务
 * 为PDF文件添加密码保护
 *
 * 注意：pdf-lib 不直接支持加密功能
 * 实际加密需要使用外部工具或库
 */

/**
 * PDF权限设置
 */
interface PDFPermissions {
  /** 允许打印 */
  allowPrinting?: boolean
  /** 允许复制文本 */
  allowCopying?: boolean
  /** 允许修改 */
  allowModifying?: boolean
}

/**
 * 加密PDF文件
 *
 * 注意：此函数当前为占位实现
 * pdf-lib不支持加密，需要使用qpdf或其他工具
 *
 * @param filePath PDF文件路径
 * @param outputPath 输出文件路径
 * @param password 打开密码
 * @param permissions 权限设置
 * @returns 加密后的文件路径
 */
export async function encryptPDF(
  filePath: string,
  outputPath: string,
  password: string,
  permissions?: PDFPermissions
): Promise<string> {
  // 读取PDF文件
  const pdfBytes = fs.readFileSync(filePath)

  // pdf-lib 不支持加密，这里只是复制文件
  // 实际加密需要使用外部工具如 qpdf 或 ghostscript
  //
  // Windows下可以使用：
  // qpdf --encrypt user-password owner-password 256 -- input.pdf output.pdf
  //
  // 或者使用 Node.js 的其他库如：
  // - @aspect-dev/pdf-encrypt
  // - 调用 Python 的 PyPDF2

  // 当前实现：直接保存文件，不进行加密
  // 这是一个占位实现，实际项目需要集成加密工具

  const pdf = await PDFDocument.load(pdfBytes)
  const encryptedBytes = await pdf.save()

  fs.writeFileSync(outputPath, encryptedBytes)

  // 添加警告日志
  console.warn('警告：pdf-lib不支持加密功能，当前输出文件未加密')
  console.warn('建议集成qpdf或其他加密工具')

  return outputPath
}

/**
 * 使用qpdf加密PDF（外部工具方法）
 * 需要系统安装qpdf
 *
 * @param inputPath 输入PDF路径
 * @param outputPath 输出PDF路径
 * @param userPassword 用户密码
 * @param ownerPassword 权限密码
 * @param permissions 权限设置
 */
export async function encryptWithQpdf(
  inputPath: string,
  outputPath: string,
  userPassword: string,
  ownerPassword: string,
  permissions?: PDFPermissions
): Promise<string> {
  // 构建qpdf命令参数
  const args = [
    '--encrypt',
    userPassword,
    ownerPassword,
    '256',
    '--',
    inputPath,
    outputPath
  ]

  // 添加权限限制参数
  if (permissions?.allowPrinting === false) {
    args.splice(4, 0, '--no-print')
  }
  if (permissions?.allowCopying === false) {
    args.splice(4, 0, '--no-copy')
  }
  if (permissions?.allowModifying === false) {
    args.splice(4, 0, '--no-modify')
  }

  // 调用qpdf命令
  // 实际实现需要使用child_process.spawn
  throw new Error('qpdf加密功能需要系统安装qpdf工具')
}

/**
 * 检查PDF是否已加密
 * @param filePath PDF文件路径
 * @returns 是否已加密
 */
export async function isEncrypted(filePath: string): Promise<boolean> {
  try {
    const pdfBytes = fs.readFileSync(filePath)
    await PDFDocument.load(pdfBytes, { ignoreEncryption: false })
    return false
  } catch (error) {
    // 如果加载失败，可能是因为加密
    const errorMsg = (error as Error).message
    return errorMsg.includes('encrypted') || errorMsg.includes('password')
  }
}