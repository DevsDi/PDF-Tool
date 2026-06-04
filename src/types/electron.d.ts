/**
 * Electron API 类型定义
 */

interface ElectronAPI {
  /** 打开文件选择对话框 */
  openFile: (options?: OpenFileOptions) => Promise<DialogResult>
  /** 保存文件对话框 */
  saveFile: (options?: SaveFileOptions) => Promise<DialogResult>
  /** PDF合并 */
  mergePDF: (filePaths: string[], outputPath: string) => Promise<ProcessResult>
  /** PDF拆分 */
  splitPDF: (filePath: string, options: SplitOptions) => Promise<ProcessResult>
  /** PDF转Word */
  convertPDF: (filePath: string, outputPath: string) => Promise<ProcessResult>
  /** PDF压缩 */
  compressPDF: (filePath: string, outputPath: string, quality: number) => Promise<ProcessResult>
  /** PDF去水印 */
  removeWatermark: (filePath: string, outputPath: string, options: WatermarkOptions) => Promise<ProcessResult>
  /** PDF加密 */
  encryptPDF: (filePath: string, outputPath: string, password: string, permissions: Permissions) => Promise<ProcessResult>
  /** PDF解密 */
  decryptPDF: (filePath: string, outputPath: string, password: string) => Promise<ProcessResult>
  /** 获取文件信息 */
  getFileInfo: (filePath: string) => Promise<FileInfoResult>
  /** 监听进度更新 */
  onProgress: (callback: (progress: number) => void) => void
  /** 移除进度监听 */
  removeProgressListener: () => void
}

interface OpenFileOptions {
  /** 是否允许多选 */
  multiSelections?: boolean
  /** 文件类型过滤器 */
  filters?: FileFilter[]
}

interface SaveFileOptions {
  /** 默认文件名 */
  defaultPath?: string
  /** 文件类型过滤器 */
  filters?: FileFilter[]
}

interface FileFilter {
  /** 过滤器名称 */
  name: string
  /** 扩展名数组 */
  extensions: string[]
}

interface DialogResult {
  /** 是否取消 */
  canceled: boolean
  /** 选中的文件路径 */
  filePaths: string[]
  /** 选中的文件路径（带书签） */
  bookmarks?: string[]
}

interface ProcessResult {
  /** 是否成功 */
  success: boolean
  /** 返回数据 */
  data?: any
  /** 错误信息 */
  error?: string
}

interface FileInfoResult {
  /** 是否成功 */
  success: boolean
  /** 文件信息 */
  data?: FileInfo
  /** 错误信息 */
  error?: string
}

interface FileInfo {
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** 文件路径 */
  path: string
}

interface SplitOptions {
  /** 拆分方式 */
  mode: 'pageCount' | 'range' | 'extract'
  /** 每个文件的页数 */
  pageCount?: number
  /** 页面范围 */
  ranges?: string
  /** 提取的页码 */
  pages?: number[]
}

interface WatermarkOptions {
  /** 去水印方式 */
  mode: 'auto' | 'manual'
  /** 水印区域（手动模式） */
  regions?: WatermarkRegion[]
}

interface WatermarkRegion {
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
}

interface Permissions {
  /** 允许打印 */
  allowPrinting?: boolean
  /** 允许复制文本 */
  allowCopying?: boolean
  /** 允许修改 */
  allowModifying?: boolean
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}